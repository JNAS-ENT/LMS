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
    const body = await req.json();
    const { checksum, entity_counts } = body;

    if (!checksum) {
      return new Response(JSON.stringify({ error: "Missing checksum" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current entity counts from database
    const tables = [
      'subjects', 'modules', 'topics', 'subtopics',
      'topic_notes', 'topic_questions', 'topic_resources', 'topic_revisions',
      'topic_code', 'topic_highlights', 'notes', 'tags', 'topic_relationships',
      'storage_providers', 'journal_entries', 'code_snippets', 'research_papers',
      'projects', 'roadmap_items', 'bookmarks', 'quick_notes', 'streak_days',
      'activity_log',
    ];

    const currentCounts: Record<string, number> = {};
    const mismatches: string[] = [];

    for (const table of tables) {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "count=exact",
        },
      });
      const count = res.headers.get("content-range")?.split("/")[1];
      currentCounts[table] = parseInt(count || "0", 10);

      if (entity_counts && entity_counts[table] !== currentCounts[table]) {
        mismatches.push(`${table}: expected ${entity_counts[table]}, found ${currentCounts[table]}`);
      }
    }

    const isHealthy = mismatches.length === 0;

    return new Response(JSON.stringify({
      success: true,
      healthy: isHealthy,
      current_counts: currentCounts,
      mismatches,
      verified_at: new Date().toISOString(),
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
