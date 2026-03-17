import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resilientSearch } from "../_shared/resilient-search.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Search CourtListener for EEOC dismissal motions
    const courtListenerResults = await searchCourtListener();

    // Step 2: Search news via resilient search for recent EEOC dropped cases
    let newsResults: any[] = [];
    const newsQueries = [
      '"EEOC moved to dismiss" 2025',
      '"EEOC withdrew" discrimination lawsuit 2025',
      '"EEOC dropped" employment case 2025',
    ];
    const { results: searchResults } = await resilientSearch(newsQueries, firecrawlKey, lovableKey);
    newsResults = searchResults.map(r => ({
      source: "resilient_search",
      title: r.title || "",
      url: r.url || "",
      markdown: (r.markdown || "").slice(0, 2000),
    }));

    // Step 3: Use AI to extract structured case data from search results
    const allResults = [...courtListenerResults, ...newsResults];
    let extractedCases: any[] = [];

    if (lovableKey && allResults.length > 0) {
      extractedCases = await extractCasesWithAI(lovableKey, allResults);
    }

    // Step 4: Deduplicate and insert new cases
    let inserted = 0;
    for (const c of extractedCases) {
      // Check for duplicates by case_name
      const { data: existing } = await supabase
        .from("eeoc_dropped_cases")
        .select("id")
        .ilike("case_name", `%${c.case_name}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Try to match company_id
      let company_id = null;
      if (c.company_name) {
        const cleanName = c.company_name.replace(/,?\s*(LP|LLC|Inc\.?|Corp\.?|Co\.?)$/i, "").trim();
        const { data: match } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", `%${cleanName}%`)
          .limit(1);
        if (match && match.length > 0) company_id = match[0].id;
      }

      const { error } = await supabase.from("eeoc_dropped_cases").insert({
        company_name: c.company_name || "Unknown",
        company_id,
        case_name: c.case_name || "Unknown EEOC Case",
        case_number: c.case_number || null,
        court_name: c.court_name || null,
        discrimination_type: c.discrimination_type || "Employment discrimination",
        discrimination_category: c.discrimination_category || "other",
        action_type: c.action_type || "moved_to_dismiss",
        status: "dropped",
        state: c.state || null,
        summary: c.summary || null,
        source_url: c.source_url || null,
        court_filing_url: c.court_filing_url || null,
        confidence: c.confidence || "medium",
        detection_method: "auto_scan",
      });

      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        courtlistener_results: courtListenerResults.length,
        news_results: newsResults.length,
        extracted: extractedCases.length,
        inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("EEOC scan error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function searchCourtListener(): Promise<any[]> {
  try {
    const query = encodeURIComponent(
      '"Equal Employment Opportunity Commission" AND ("motion to dismiss" OR "withdrew" OR "voluntary dismissal")'
    );
    const url = `https://www.courtlistener.com/api/rest/v4/search/?q=${query}&type=o&order_by=dateFiled+desc&page_size=20`;

    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.error("CourtListener API error:", resp.status);
      return [];
    }

    const data = await resp.json();
    return (data.results || []).map((r: any) => ({
      source: "courtlistener",
      title: r.caseName || r.case_name || "",
      court: r.court || "",
      date: r.dateFiled || r.date_filed || "",
      snippet: r.snippet || "",
      url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : null,
      docket_id: r.docket_id || null,
    }));
  } catch (err) {
    console.error("CourtListener search failed:", err);
    return [];
  }
}

async function extractCasesWithAI(lovableKey: string, results: any[]): Promise<any[]> {
  try {
    const context = results
      .map(
        (r, i) =>
          `[Source ${i + 1} - ${r.source}]\nTitle: ${r.title}\nURL: ${r.url || "N/A"}\nContent: ${r.snippet || r.markdown || "N/A"}\n`
      )
      .join("\n---\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You extract EEOC dropped/withdrawn/dismissed employment discrimination cases from search results.
Return a JSON array of cases. Each case must have:
- company_name: string (the defendant company)
- case_name: string (e.g. "EEOC v. Company Name")
- case_number: string or null
- court_name: string or null
- discrimination_type: string
- discrimination_category: one of: gender_identity, race, sex, disability, age, retaliation, disparate_impact, other
- action_type: one of: moved_to_dismiss, withdrew, dismissed, settled
- state: string or null (US state)
- summary: one sentence description
- source_url: string or null
- court_filing_url: string or null
- confidence: high, medium, or low

Only include cases where the EEOC specifically moved to dismiss, withdrew, or dropped a case.
Do NOT include cases the EEOC won or that are still active.
Return ONLY the JSON array, no markdown.`,
          },
          {
            role: "user",
            content: `Extract EEOC dropped/withdrawn cases from these search results:\n\n${context}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      console.error("AI extraction failed:", resp.status);
      return [];
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (err) {
    console.error("AI case extraction failed:", err);
    return [];
  }
}
