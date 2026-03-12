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
    const { company_id, company_name, national = false } = await req.json();
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

    console.log(`[warn-scan] Scanning: ${company_name} (national: ${national})`);

    const allResults: any[] = [];
    const currentYear = new Date().getFullYear();

    // Search strategy — prioritize official .gov WARN sources
    const searches = national
      ? [
          `"${company_name}" WARN Act layoff notice ${currentYear} site:gov`,
          `"${company_name}" WARN notice ${currentYear} site:edd.ca.gov`,
          `"${company_name}" WARN notice ${currentYear} site:twc.texas.gov`,
          `"${company_name}" WARN notice ${currentYear} site:dol.ny.gov`,
          `"${company_name}" WARN Act layoff notice ${currentYear}`,
          `"${company_name}" layoffs ${currentYear}`,
          `"${company_name}" site:warntracker.com`,
          `"${company_name}" layoffs cuts jobs ${currentYear} site:reuters.com OR site:cnbc.com`,
          `"${company_name}" reduction in force RIF ${currentYear}`,
          `"${company_name}" 8-K "Item 2.05" workforce reduction`,
        ]
      : [
          `"${company_name}" WARN Act layoff notice ${currentYear} site:gov`,
          `"${company_name}" layoffs ${currentYear}`,
          `"${company_name}" WARN Act layoff notice ${currentYear}`,
          `"${company_name}" site:warntracker.com`,
          `"${company_name}" layoffs cuts ${currentYear} site:reuters.com OR site:cnbc.com`,
        ];

    await Promise.allSettled(
      searches.map((query) =>
        fetchFirecrawl(firecrawlKey, { query, limit: 10, scrapeOptions: { formats: ["markdown"] } })
          .then((data) => { if (data?.data) allResults.push(...data.data); })
          .catch((e) => console.error(`Search failed: ${query}`, e))
      )
    );

    if (allResults.length === 0) {
      console.log("[warn-scan] No results found");
      await supabase.from("warn_sync_log").insert({
        source_name: `Firecrawl WARN search for ${company_name}`,
        source_type: "firecrawl_search",
        records_fetched: 0,
        records_inserted: 0,
        status: "success",
      });
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

    const nationalPrompt = national
      ? `This is a NATIONAL scan. Extract WARN notices from ALL US states. Include every distinct location/state filing separately. Also look for SEC 8-K Item 2.05 filings.`
      : ``;

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
            content: "You extract WARN Act layoff notices from search results. Return structured data via the tool.",
          },
          {
            role: "user",
            content: `Extract layoff and WARN Act notices for "${company_name}" from the following search results. ${nationalPrompt}

CRITICAL DATE RULES:
- Separate notice_date (when WARN was filed) from effective_date (when layoffs take effect)
- If a public_announcement_date differs from notice_date, include it
- Prioritize ${currentYear} data. Flag anything older clearly.
- Do NOT present old data as current.

REASON RULES:
- If the official WARN notice states a reason, use reason_type "official_warn_reason"
- If the reason comes from news coverage, use reason_type "reported_reason"
- If no reason is stated, use reason_type "not_stated"
- NEVER invent or guess reasons

SOURCE RULES:
- If from a .gov website, source_type = "official_state_warn"
- If from warntracker.com, source_type = "structured_open_data"
- If from news (reuters, cnbc, etc), source_type = "news_report"
- If from SEC 8-K filing, source_type = "sec_8k"

CALIFORNIA SUPPORT SERVICES:
- If a California WARN notice mentions support services or workforce board coordination, capture it

Search results:
${combinedText}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_warn_notices",
            description: "Extract structured WARN notice data from search results",
            parameters: {
              type: "object",
              properties: {
                notices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      notice_date: { type: "string", description: "YYYY-MM-DD when WARN was filed" },
                      effective_date: { type: "string", description: "YYYY-MM-DD when layoffs take effect, or null" },
                      public_announcement_date: { type: "string", description: "YYYY-MM-DD if announced publicly on different date, or null" },
                      employees_affected: { type: "number" },
                      layoff_type: { type: "string", enum: ["layoff", "closure", "relocation", "mass_layoff", "temporary", "rif"] },
                      location_city: { type: "string" },
                      location_state: { type: "string", description: "US state abbreviation" },
                      reason: { type: "string", description: "Brief reason if available" },
                      reason_type: { type: "string", enum: ["official_warn_reason", "reported_reason", "not_stated"] },
                      source_url: { type: "string" },
                      source_type: { type: "string", enum: ["official_state_warn", "structured_open_data", "news_report", "sec_8k"] },
                      employer_name_raw: { type: "string", description: "Exact employer name as stated in filing" },
                      support_services_mentioned: { type: "boolean" },
                      support_services_coordinator: { type: "string", description: "Who coordinates worker support services" },
                      workforce_board_referenced: { type: "boolean" },
                    },
                    required: ["notice_date", "employees_affected", "layoff_type", "reason_type", "source_type"],
                  },
                },
              },
              required: ["notices"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_warn_notices" } },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[warn-scan] AI error:", geminiRes.status, errText);
      if (geminiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const toolCall = geminiData.choices?.[0]?.message?.tool_calls?.[0];

    let notices: any[];
    try {
      notices = JSON.parse(toolCall?.function?.arguments || "{}").notices || [];
    } catch {
      console.error("[warn-scan] Parse failed");
      notices = [];
    }

    console.log(`[warn-scan] AI extracted ${notices.length} notices`);

    // Insert notices, avoiding duplicates
    let inserted = 0;
    const stateBreakdown: Record<string, number> = {};

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

      const state = notice.location_state || "Unknown";

      const { error } = await supabase.from("company_warn_notices").insert({
        company_id,
        notice_date: notice.notice_date,
        effective_date: notice.effective_date || null,
        public_announcement_date: notice.public_announcement_date || null,
        employees_affected: parseInt(notice.employees_affected) || 0,
        layoff_type: notice.layoff_type || "layoff",
        location_city: notice.location_city || null,
        location_state: notice.location_state || null,
        reason: notice.reason || null,
        reason_type: notice.reason_type || "not_stated",
        source_url: notice.source_url || null,
        source_state: notice.location_state || null,
        source_type: notice.source_type || "firecrawl_search",
        confidence: notice.source_type === "official_state_warn" ? "direct" : "inferred",
        employer_name_raw: notice.employer_name_raw || null,
        support_services_mentioned: notice.support_services_mentioned || false,
        support_services_coordinator: notice.support_services_coordinator || null,
        workforce_board_referenced: notice.workforce_board_referenced || false,
        last_synced_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[warn-scan] Insert error:", error);
      } else {
        inserted++;
        stateBreakdown[state] = (stateBreakdown[state] || 0) + (parseInt(notice.employees_affected) || 0);
      }
    }

    // Log to signal scans
    if (inserted > 0) {
      const stateCount = Object.keys(stateBreakdown).length;
      const totalAffected = notices.reduce((s: number, n: any) => s + (parseInt(n.employees_affected) || 0), 0);

      await supabase.from("company_signal_scans").insert({
        company_id,
        signal_category: "warn_layoffs",
        signal_type: `${inserted} WARN/RIF notice(s) detected across ${stateCount} state(s)`,
        signal_value: `${totalAffected.toLocaleString()} employees affected | States: ${Object.keys(stateBreakdown).join(", ")}`,
        confidence_level: "direct",
        source_url: notices[0]?.source_url || "https://www.warntracker.com",
      });
    }

    // Log sync
    await supabase.from("warn_sync_log").insert({
      source_name: `Firecrawl WARN search for ${company_name}`,
      source_type: "firecrawl_search",
      records_fetched: notices.length,
      records_inserted: inserted,
      status: "success",
    });

    console.log(`[warn-scan] Done: ${inserted} inserted for ${company_name}`);

    return new Response(
      JSON.stringify({ success: true, notices: inserted, stateBreakdown }),
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
