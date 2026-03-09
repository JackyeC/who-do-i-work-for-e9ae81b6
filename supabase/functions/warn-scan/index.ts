import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Known state WARN notice URLs - structured sources that publish WARN data
const STATE_WARN_SOURCES: { state: string; url: string; type: string }[] = [
  { state: "CA", url: "https://edd.ca.gov/en/jobs_and_training/Layoff_Services_WARN/", type: "state_agency" },
  { state: "NY", url: "https://dol.ny.gov/warn-notices", type: "state_agency" },
  { state: "TX", url: "https://www.twc.texas.gov/businesses/worker-adjustment-and-retraining-notification-warn-notices", type: "state_agency" },
  { state: "FL", url: "https://floridajobs.org/office-directory/division-of-workforce-services/workforce-programs/reemployment-and-emergency-assistance-coordination-team-react/warn-notices", type: "state_agency" },
  { state: "NJ", url: "https://www.nj.gov/labor/employer-services/warn/", type: "state_agency" },
  { state: "PA", url: "https://www.dli.pa.gov/Individuals/Workforce-Development/warn/Pages/default.aspx", type: "state_agency" },
  { state: "NC", url: "https://www.commerce.nc.gov/data-tools-reports/labor-market-data-tools/warn-notices", type: "state_agency" },
  { state: "GA", url: "https://www.dol.state.ga.us/public/es/warn/searchwarns/list", type: "state_agency" },
  { state: "VA", url: "https://www.vec.virginia.gov/warn-notices", type: "state_agency" },
  { state: "MD", url: "https://www.dllr.state.md.us/employment/warn.shtml", type: "state_agency" },
];

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

    console.log(`Scanning WARN notices for: ${company_name}`);

    // Phase 1: Search structured state WARN databases via Firecrawl
    const allResults: any[] = [];

    // Targeted state WARN database searches
    const stateSearches = STATE_WARN_SOURCES.map((src) =>
      fetchFirecrawl(firecrawlKey, {
        query: `site:${new URL(src.url).hostname} "${company_name}" WARN`,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }).then((data) => {
        if (data?.data) {
          data.data.forEach((r: any) => (r._source_state = src.state));
          allResults.push(...data.data);
        }
      }).catch((e) => console.error(`State search failed (${src.state}):`, e))
    );

    // Phase 2: General web searches including warntracker.com
    const generalSearches = [
      `"${company_name}" site:warntracker.com`,
      `"${company_name}" WARN Act layoff notice site:gov`,
      `"${company_name}" WARN Act layoff notice`,
      `"${company_name}" mass layoff plant closure WARN filing`,
    ].map((query) =>
      fetchFirecrawl(firecrawlKey, {
        query,
        limit: 10,
        scrapeOptions: { formats: ["markdown"] },
      }).then((data) => {
        if (data?.data) allResults.push(...data.data);
      }).catch((e) => console.error(`Search failed: ${query}`, e))
    );

    // Phase 3: Check known aggregator databases
    const aggregatorSearches = [
      `"${company_name}" site:layoffstracker.com`,
      `"${company_name}" site:warn-notice.ca.gov`,
      `"${company_name}" WARN notice layoff tracker database`,
    ].map((query) =>
      fetchFirecrawl(firecrawlKey, {
        query,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }).then((data) => {
        if (data?.data) allResults.push(...data.data);
      }).catch((e) => console.error(`Aggregator search failed:`, e))
    );

    // Phase 4: Try direct warntracker.com scrape for this company
    const warnTrackerScrape = fetchFirecrawlScrape(firecrawlKey, 
      `https://www.warntracker.com/?company=${encodeURIComponent(company_name)}`
    ).then((data) => {
      if (data?.data?.markdown) {
        allResults.push({ 
          url: `https://www.warntracker.com/?company=${encodeURIComponent(company_name)}`,
          title: `WARNTracker - ${company_name}`,
          markdown: data.data.markdown,
          _source_state: "aggregator"
        });
      }
    }).catch((e) => console.error(`WARNTracker scrape failed:`, e));

    // Run all searches in parallel
    await Promise.allSettled([...stateSearches, ...generalSearches, ...aggregatorSearches, warnTrackerScrape]);

    if (allResults.length === 0) {
      console.log("No WARN results found from any source");
      return new Response(JSON.stringify({ success: true, notices: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${allResults.length} raw results, analyzing with AI...`);

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter((r) => {
      if (!r.url || seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // Use Gemini to extract structured WARN notice data
    const combinedText = uniqueResults
      .map((r) => `URL: ${r.url}\nTitle: ${r.title || ""}\nState: ${r._source_state || "unknown"}\n${(r.markdown || r.description || "").slice(0, 2000)}`)
      .join("\n---\n")
      .slice(0, 15000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("LOVABLE_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract WARN Act layoff notices for "${company_name}" from the following search results. Include subsidiary and acquired company notices (e.g. for Bank of America, include Merrill Lynch, Countrywide, First Franklin, NationsBank notices).

Return ONLY a JSON array of notices. Each notice should have:
- notice_date (YYYY-MM-DD format)
- effective_date (YYYY-MM-DD or null)
- employees_affected (integer)
- layoff_type ("layoff", "closure", "relocation", "mass_layoff", "temporary")
- location_city (string or null)
- location_state (US state abbreviation or null)
- reason (brief description or null)
- source_url (the URL where this was found)
- source_state (state that filed the WARN notice)

Be strict about matching "${company_name}" or its known subsidiaries. If no valid WARN notices are found, return an empty array [].

Search results:
${combinedText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error("Gemini error:", await geminiRes.text());
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let notices: any[];
    try {
      notices = JSON.parse(responseText);
      if (!Array.isArray(notices)) notices = [];
    } catch {
      console.error("Failed to parse AI response:", responseText);
      notices = [];
    }

    console.log(`AI extracted ${notices.length} WARN notices`);

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
        source_state: notice.source_state || null,
        confidence: "direct",
      });

      if (error) {
        console.error("Insert error:", error);
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
        source_url: notices[0]?.source_url || null,
      });
    }

    return new Response(
      JSON.stringify({ success: true, notices: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WARN scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper: call Firecrawl search API
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
