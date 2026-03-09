import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name } = await req.json();
    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ error: "company_id and company_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[warn-scan] Scanning: ${company_name}`);

    // Focused search strategy: 3 high-value searches only to stay within timeout
    const allResults: any[] = [];
    
    const searches = [
      `"${company_name}" site:warntracker.com`,
      `"${company_name}" WARN Act layoff notice`,
      `"${company_name}" WARN notice mass layoff site:gov`,
    ];

    const results = await Promise.allSettled(
      searches.map((query) =>
        fetchFirecrawl(firecrawlKey, { query, limit: 10, scrapeOptions: { formats: ["markdown"] } })
          .then((data) => { if (data?.data) allResults.push(...data.data); })
          .catch((e) => console.error(`Search failed: ${query}`, e))
      )
    );

    if (allResults.length === 0) {
      console.log("[warn-scan] No results found");
      return new Response(JSON.stringify({ success: true, notices: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[warn-scan] ${allResults.length} raw results, analyzing...`);

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter((r) => {
      if (!r.url || seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // Use Gemini to extract structured WARN notice data
    const combinedText = uniqueResults
      .map((r) => `URL: ${r.url}\nTitle: ${r.title || ""}\n${(r.markdown || r.description || "").slice(0, 2000)}`)
      .join("\n---\n")
      .slice(0, 15000);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You extract WARN Act layoff notices from search results. Return ONLY valid JSON arrays.",
          },
          {
            role: "user",
            content: `Extract WARN Act layoff notices for "${company_name}" from the following search results. Include subsidiary and acquired company notices.

Return ONLY a JSON array. Each notice:
- notice_date (YYYY-MM-DD)
- effective_date (YYYY-MM-DD or null)
- employees_affected (integer)
- layoff_type ("layoff", "closure", "relocation", "mass_layoff", "temporary")
- location_city (string or null)
- location_state (US state abbreviation or null)
- reason (brief description or null)
- source_url (URL where found)

Be strict about matching "${company_name}" or known subsidiaries. Return [] if none found.

Search results:
${combinedText}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!geminiRes.ok) {
      console.error("[warn-scan] AI error:", await geminiRes.text());
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData.choices?.[0]?.message?.content || "[]";

    let notices: any[];
    try {
      notices = JSON.parse(responseText);
      if (!Array.isArray(notices)) notices = [];
    } catch {
      console.error("[warn-scan] Parse failed:", responseText.slice(0, 200));
      notices = [];
    }

    console.log(`[warn-scan] AI extracted ${notices.length} notices`);

    // Insert notices, avoiding duplicates
    let inserted = 0;
    for (const notice of notices) {
      if (!notice.notice_date || !notice.employees_affected) continue;

      const { data: existing } = await supabase
        .from("company_warn_notices")
        .select("id")
        .eq("company_id", company_id)
        .eq("notice_date", notice.notice_date)
        .eq("employees_affected", notice.employees_affected)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error } = await supabase.from("company_warn_notices").insert({
        company_id,
        notice_date: notice.notice_date,
        effective_date: notice.effective_date || null,
        employees_affected: parseInt(notice.employees_affected) || 0,
        layoff_type: notice.layoff_type || "layoff",
        location_city: notice.location_city || null,
        location_state: notice.location_state || null,
        reason: notice.reason || null,
        source_url: notice.source_url || null,
        source_state: notice.location_state || null,
        confidence: "direct",
      });

      if (error) {
        console.error("[warn-scan] Insert error:", error);
      } else {
        inserted++;
      }
    }

    // Log to signal scans
    if (inserted > 0) {
      await supabase.from("company_signal_scans").insert({
        company_id,
        signal_category: "warn_layoffs",
        signal_type: `${inserted} WARN Act notice(s) detected`,
        signal_value: `${notices.reduce((s: number, n: any) => s + (parseInt(n.employees_affected) || 0), 0)} employees affected`,
        confidence_level: "direct",
        source_url: notices[0]?.source_url || "https://www.warntracker.com",
      });
    }

    console.log(`[warn-scan] Done: ${inserted} inserted for ${company_name}`);

    return new Response(
      JSON.stringify({ success: true, notices: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[warn-scan] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchFirecrawl(apiKey: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json();
}
