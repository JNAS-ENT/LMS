import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BackupConfig {
  backup_type: 'manual' | 'daily' | 'weekly' | 'monthly';
  retention_days: number;
  include_activity_log: boolean;
  upload_to_google_drive?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: BackupConfig = await req.json().catch(() => ({
      backup_type: 'daily',
      retention_days: 90,
      include_activity_log: true,
    }));

    const backupType = body.backup_type || 'daily';
    const retentionDays = body.retention_days || 90;

    // Create backup record
    const createBackupRes = await fetch(`${supabaseUrl}/rest/v1/backup_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        backup_type: backupType,
        format: 'json',
        status: 'pending',
        entity_counts: {},
      }),
    });

    const backupRecord = await createBackupRes.json();
    const backupId = Array.isArray(backupRecord) ? backupRecord[0].id : backupRecord.id;

    // Fetch all entities
    const tables = [
      'subjects', 'modules', 'topics', 'subtopics',
      'topic_notes', 'topic_questions', 'topic_resources', 'topic_revisions',
      'topic_code', 'topic_highlights', 'notes', 'tags', 'topic_relationships',
      'storage_providers', 'journal_entries', 'code_snippets', 'research_papers',
      'projects', 'roadmap_items', 'bookmarks', 'quick_notes', 'streak_days',
    ];

    if (body.include_activity_log) {
      tables.push('activity_log');
    }

    const entityCounts: Record<string, number> = {};
    const entities: Record<string, unknown[]> = {};

    for (const table of tables) {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });
      const data = await res.json();
      entities[table] = Array.isArray(data) ? data : [];
      entityCounts[table] = entities[table].length;
    }

    // Build vault package
    const vaultPackage = {
      version: '2.0',
      schema_version: '1.3',
      exported_at: new Date().toISOString(),
      exported_by: 'scheduled-backup',
      app_name: 'Learning Vault',
      checksum: '',
      encryption: 'none' as const,
      compression: 'zip' as const,
      entities: entities,
      metadata: {
        total_entities: Object.values(entityCounts).reduce((a, b) => a + b, 0),
        entity_counts: entityCounts,
        vault_version: '2.0',
        export_duration_ms: 0,
        warnings: [],
        backup_type: backupType,
      },
    };

    const json = JSON.stringify(vaultPackage);
    const fileSize = new Blob([json]).size;

    // Compute checksum using Web Crypto API
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    vaultPackage.checksum = checksum;

    // Update backup record as completed
    await fetch(`${supabaseUrl}/rest/v1/backup_history?id=eq.${backupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_size_bytes: fileSize,
        entity_counts: entityCounts,
        checksum_sha256: checksum,
      }),
    });

    // Clean up old backups based on retention
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await fetch(`${supabaseUrl}/rest/v1/backup_history?started_at=lt.${cutoffDate.toISOString()}&backup_type=eq.${backupType}`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    // Upload to Google Drive if tokens exist and upload requested
    let googleDriveFileId: string | null = null;
    let pdfFileId: string | null = null;

    if (body.upload_to_google_drive !== false) {
      const tokensRes = await fetch(`${supabaseUrl}/rest/v1/google_drive_tokens?user_identifier=eq.default&select=*`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });

      const tokens = await tokensRes.json();
      if (Array.isArray(tokens) && tokens.length > 0) {
        const token = tokens[0];

        // Refresh token if expired
        let accessToken = token.access_token;
        const tokenExpiry = new Date(token.token_expiry);

        if (tokenExpiry <= new Date()) {
          const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
          const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

          if (clientId && clientSecret && token.refresh_token) {
            const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: token.refresh_token,
                grant_type: "refresh_token",
              }),
            });

            if (refreshRes.ok) {
              const newTokens = await refreshRes.json();
              accessToken = newTokens.access_token;

              // Update stored token
              await fetch(`${supabaseUrl}/rest/v1/google_drive_tokens?user_identifier=eq.default`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": supabaseKey,
                  "Authorization": `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  access_token: accessToken,
                  token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              });
            }
          }
        }

        // Get folder ID
        const foldersRes = await fetch(`${supabaseUrl}/rest/v1/google_drive_folders?folder_type=eq.${backupType === 'daily' ? 'daily' : backupType === 'weekly' ? 'weekly' : 'monthly'}&select=folder_id`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
        });

        const folders = await foldersRes.json();
        if (Array.isArray(folders) && folders.length > 0) {
          const folderId = folders[0].folder_id;

          // Upload JSON
          const jsonFileName = backupType === 'daily'
            ? 'learning-vault-latest.json'
            : backupType === 'weekly'
              ? `weekly-${new Date().toISOString().split('T')[0]}-W${getWeekNumber(new Date())}.json`
              : `monthly-${new Date().toISOString().substring(0, 7)}.json`;

          googleDriveFileId = await uploadToGoogleDrive(accessToken, jsonFileName, json, 'application/json', folderId);

          // Upload PDF (text version)
          const pdfContent = formatPDFReport(vaultPackage, backupType);
          const pdfFileName = jsonFileName.replace('.json', '.txt');
          pdfFileId = await uploadToGoogleDrive(accessToken, pdfFileName, pdfContent, 'text/plain', folderId);
        }
      }
    }

    // Update backup record with Google Drive info
    await fetch(`${supabaseUrl}/rest/v1/backup_history?id=eq.${backupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        google_drive_file_id: googleDriveFileId,
        pdf_file_id: pdfFileId,
        json_uploaded: googleDriveFileId !== null,
        pdf_uploaded: pdfFileId !== null,
        backup_version: '1.0',
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      backup_id: backupId,
      file_size_bytes: fileSize,
      entity_counts: entityCounts,
      checksum,
      google_drive_uploaded: googleDriveFileId !== null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper Functions

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string,
  folderId: string
): Promise<string | null> {
  try {
    const boundary = 'learning_vault_boundary_' + Math.random().toString(36).substring(2);

    const metadata = {
      name: fileName,
      mimeType,
      parents: [folderId],
    };

    let requestBody = '';
    requestBody += `--${boundary}\r\n`;
    requestBody += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
    requestBody += JSON.stringify(metadata) + '\r\n';
    requestBody += `--${boundary}\r\n`;
    requestBody += `Content-Type: ${mimeType}\r\n\r\n`;
    requestBody += content;
    requestBody += `\r\n--${boundary}--`;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: requestBody,
    });

    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
    return null;
  } catch {
    return null;
  }
}

function formatPDFReport(vaultPackage: Record<string, unknown>, backupType: string): string {
  const entities = vaultPackage.entities as Record<string, unknown[]>;
  const metadata = vaultPackage.metadata as Record<string, unknown>;
  const entityCounts = metadata.entity_counts as Record<string, number>;

  const lines: string[] = [];
  lines.push('╔══════════════════════════════════════════════════════════════╗');
  lines.push('║              LEARNING VAULT BACKUP REPORT                    ║');
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`Backup Date: ${new Date().toLocaleString()}`);
  lines.push(`Backup Type: ${backupType.toUpperCase()}`);
  lines.push(`Vault Version: ${vaultPackage.version}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('                        VAULT STATISTICS                       ');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  Subjects:         ${(entityCounts.subjects || 0).toString().padStart(6)}`);
  lines.push(`  Modules:          ${(entityCounts.modules || 0).toString().padStart(6)}`);
  lines.push(`  Topics:           ${(entityCounts.topics || 0).toString().padStart(6)}`);
  lines.push(`  Notes:            ${(entityCounts.topic_notes || 0).toString().padStart(6)}`);
  lines.push(`  Questions:        ${(entityCounts.topic_questions || 0).toString().padStart(6)}`);
  lines.push(`  Resources:        ${(entityCounts.topic_resources || 0).toString().padStart(6)}`);
  lines.push(`  Highlights:       ${(entityCounts.topic_highlights || 0).toString().padStart(6)}`);
  lines.push(`  Revisions:        ${(entityCounts.topic_revisions || 0).toString().padStart(6)}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('This backup was generated by Learning Vault.');
  lines.push('Restore: Settings > Backup > Restore from Backup');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}
