import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle token refresh from frontend
    if (body.action === "refresh_token") {
      console.log("[OAUTH] Handling token refresh action");

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: "OAuth credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: body.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("[OAUTH] Token refresh failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Token refresh failed", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await refreshResponse.json();
      console.log("[OAUTH] Token refreshed successfully");

      // Update stored token
      await fetch(`${supabaseUrl}/rest/v1/google_drive_tokens?user_identifier=eq.default`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          token_expiry: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle OAuth code exchange (initial connection)
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing code or redirect_uri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "OAuth credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[OAUTH] Exchanging authorization code for tokens...");

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[OAUTH] Token exchange failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code", details: errorText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("[OAUTH] Token exchange successful. Initializing folders...");

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Store tokens in database
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/google_drive_tokens?user_identifier=eq.default`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_identifier: "default",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: expiresAt.toISOString(),
          scope: tokenData.scope,
          token_type: tokenData.token_type || "Bearer",
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!supabaseResponse.ok) {
      console.error("[OAUTH] Failed to store tokens:", await supabaseResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to store tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[OAUTH] Tokens stored. Creating Drive folder structure...");

    // Initialize Google Drive folder structure
    const folderResult = await initializeDriveFolders(tokenData.access_token, supabaseUrl, supabaseServiceKey);
    console.log("[OAUTH] Folder initialization result:", folderResult);

    return new Response(
      JSON.stringify({ success: true, message: "Google Drive connected successfully", folders_created: folderResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OAUTH] OAuth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "OAuth failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function initializeDriveFolders(accessToken: string, supabaseUrl: string, supabaseServiceKey: string): Promise<{ root: string | null; daily: string | null; weekly: string | null; monthly: string | null }> {
  console.log("[INIT FOLDERS] Starting folder initialization...");

  const result = { root: null as string | null, daily: null as string | null, weekly: null as string | null, monthly: null as string | null };

  // Create folder structure
  const createFolder = async (name: string, parentId?: string): Promise<string | null> => {
    console.log(`[INIT FOLDERS] Creating folder "${name}" with parent:`, parentId || 'root');
    const body: Record<string, unknown> = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) body.parents = [parentId];

    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[INIT FOLDERS] Created folder "${name}" with ID:`, data.id);
      return data.id;
    }
    console.error(`[INIT FOLDERS] Failed to create folder "${name}":`, await response.text());
    return null;
  };

  // Check if folder exists
  const findFolder = async (name: string, parentId?: string): Promise<string | null> => {
    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;

    console.log(`[INIT FOLDERS] Searching for folder "${name}"...`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { "Authorization": `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.files?.[0]?.id) {
        console.log(`[INIT FOLDERS] Found existing folder "${name}" with ID:`, data.files[0].id);
      } else {
        console.log(`[INIT FOLDERS] Folder "${name}" not found`);
      }
      return data.files?.[0]?.id || null;
    }
    console.error(`[INIT FOLDERS] Failed to search for folder "${name}":`, await response.text());
    return null;
  };

  // Store folder in database
  const storeFolder = async (folderType: string, folderId: string, folderName: string, rootId: string) => {
    console.log(`[INIT FOLDERS] Storing folder ${folderType} in database...`);
    await fetch(`${supabaseUrl}/rest/v1/google_drive_folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        folder_type: folderType,
        folder_id: folderId,
        folder_name: folderName,
        parent_folder_id: rootId,
      }),
    });
  };

  // Create or find folders
  let rootId = await findFolder("Learning Vault Backups");
  if (!rootId) {
    rootId = await createFolder("Learning Vault Backups");
  }

  if (rootId) {
    result.root = rootId;
    console.log("[INIT FOLDERS] Root folder ID:", rootId);

    // Store root folder
    await storeFolder("root", rootId, "Learning Vault Backups", rootId);

    const folders = ["Daily", "Weekly", "Monthly"];
    const folderTypes = ["daily", "weekly", "monthly"] as const;

    for (let i = 0; i < folders.length; i++) {
      const folderName = folders[i];
      const folderType = folderTypes[i];

      let folderId = await findFolder(folderName, rootId);
      if (!folderId) {
        folderId = await createFolder(folderName, rootId!);
      }

      if (folderId) {
        result[folderType] = folderId;
        await storeFolder(folderType, folderId, folderName, rootId!);
      }
    }

    console.log("[INIT FOLDERS] Folder initialization complete:", result);
  } else {
    console.error("[INIT FOLDERS] Failed to create root folder!");
  }

  return result;
}
