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
    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing code or redirect_uri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      console.error("Token exchange failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();

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
      console.error("Failed to store tokens:", await supabaseResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to store tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Google Drive folder structure
    await initializeDriveFolders(tokenData.access_token);

    return new Response(
      JSON.stringify({ success: true, message: "Google Drive connected successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "OAuth failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function initializeDriveFolders(accessToken: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) return;

  // Create folder structure
  const createFolder = async (name: string, parentId?: string): Promise<string | null> => {
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
      return data.id;
    }
    return null;
  };

  // Check if folder exists
  const findFolder = async (name: string, parentId?: string): Promise<string | null> => {
    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { "Authorization": `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.files?.[0]?.id || null;
    }
    return null;
  };

  // Create or find folders
  let rootId = await findFolder("Learning Vault Backups");
  if (!rootId) {
    rootId = await createFolder("Learning Vault Backups");
  }

  if (rootId) {
    const folders = ["Daily", "Weekly", "Monthly"];
    const folderTypes = ["daily", "weekly", "monthly"];

    for (let i = 0; i < folders.length; i++) {
      const folderName = folders[i];
      const folderType = folderTypes[i];

      let folderId = await findFolder(folderName, rootId);
      if (!folderId) {
        folderId = await createFolder(folderName, rootId!);
      }

      if (folderId) {
        // Store folder info in database
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
      }
    }

    // Store root folder
    await fetch(`${supabaseUrl}/rest/v1/google_drive_folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        folder_type: "root",
        folder_id: rootId,
        folder_name: "Learning Vault Backups",
        parent_folder_id: null,
      }),
    });
  }
}
