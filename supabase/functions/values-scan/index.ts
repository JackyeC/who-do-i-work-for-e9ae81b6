import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALUE_CATEGORIES = [
  {
    key: "faith_friendly",
    label: "Christian / Faith Values",
    searchTerms: ["chaplaincy program", "faith-based workplace", "Sunday closure", "Christian values", "religious accommodations", "faith-friendly employer"],
    sourceHints: ["about page", "careers page", "press release", "Christian Blue Pages"],
  },
  {
    key: "supports_israel",
    label: "Supports Israel",
    searchTerms: ["AIPAC donation", "Israel bond purchase", "United Democracy Project", "pro-Israel advocacy", "Israel solidarity"],
    sourceHints: ["FEC filing", "PAC donation records", "corporate press release"],
  },
  {
    key: "animal_welfare",
    label: "Animal / Pet Welfare",
    searchTerms: ["animal shelter donation", "pet adoption program", "cruelty-free certified", "percentage to shelters", "ASPCA partner", "Humane Society partner"],
    sourceHints: ["ESG report", "corporate responsibility page", "press release"],
  },
  {
    key: "anti_discrimination",
    label: "Anti-Discrimination / DEI",
    searchTerms: ["CROWN Act support", "HRC Corporate Equality Index", "Title VII compliance", "DEI program", "pay equity audit", "anti-discrimination policy", "inclusive hiring"],
    sourceHints: ["EEOC filings", "HRC database", "corporate DEI page", "amicus brief"],
  },
  {
    key: "dei_rollback",
    label: "DEI Rollback Tracker",
    searchTerms: ["DEI program ended", "diversity office closed", "DEI budget cut", "rolled back diversity", "ended affirmative action", "dismantled DEI"],
    sourceHints: ["news article", "SEC filing", "press release", "earnings call transcript"],
  },
  {
    key: "environmental",
    label: "Environmental Commitment",
    searchTerms: ["carbon neutral", "net zero commitment", "renewable energy", "climate pledge", "sustainability report", "EPA compliance"],
    sourceHints: ["sustainability report", "CDP filing", "press release"],
  },
  {
    key: "veteran_support",
    label: "Veteran / Military Support",
    searchTerms: ["veteran hiring program", "military spouse employment", "Hiring Our Heroes", "veteran transition", "military-friendly employer"],
    sourceHints: ["careers page", "press release", "Military Times ranking"],
  },
  {
    key: "lgbtq_inclusive",
    label: "LGBTQ+ Inclusive",
    searchTerms: ["HRC 100 score", "domestic partner benefits", "gender-affirming care", "Pride sponsor", "LGBTQ+ ERG", "transgender-inclusive benefits"],
    sourceHints: ["HRC Corporate Equality Index", "benefits page", "press release"],
  },
  {
    key: "internal_promotion",
    label: "Internal Promotion / Promotes From Within",
    searchTerms: [
      "internal promotion rate", "promote from within", "internal mobility program",
      "career ladder", "succession planning", "internal hire percentage",
      "employee development program", "tuition reimbursement",
      "leadership development program", "talent marketplace", "career growth pathways",
      "upskilling initiative", "internal job marketplace", "mentorship program",
      "career pathing", "learning and development",
    ],
    sourceHints: ["careers page", "annual report", "ESG report", "impact report", "diversity report", "press release", "talent development page"],
  },
  {
    key: "women_leadership",
    label: "Women in Leadership & Promotions",
    searchTerms: [
      "women in leadership", "female executives", "women promoted", "women on board",
      "gender parity", "women ERG", "women's leadership program", "SHE Summit",
      "Catalyst award", "board gender statistics", "executive gender breakdown",
      "pay equity report", "gender pay gap", "leadership diversity commitment",
    ],
    sourceHints: ["diversity report", "proxy statement", "ESG filing", "press release", "SEC proxy", "impact report"],
  },
  {
    key: "minority_advancement",
    label: "Minority Advancement & Representation",
    searchTerms: [
      "minority leadership", "Black executives", "Hispanic leadership",
      "people of color promoted", "racial equity audit", "minority representation",
      "diverse leadership pipeline", "BIPOC advancement",
      "employee resource group", "supplier diversity", "workforce representation",
      "leadership diversity initiative", "ERG program",
    ],
    sourceHints: ["EEO-1 data", "diversity report", "press release", "ESG filing", "impact report", "workforce demographics report"],
  },
  {
    key: "deaf_accessibility",
    label: "Deaf & Hard-of-Hearing Inclusion",
    searchTerms: [
      "deaf employees", "ASL interpreter", "hearing accessibility",
      "deaf-friendly workplace", "captioning provided", "deaf hiring program",
      "National Association of the Deaf", "Communication Access Realtime Translation",
      "accessibility initiative", "disability ERG", "ADA accommodations",
      "inclusive design program", "accessibility statement",
    ],
    sourceHints: ["careers page", "accessibility page", "press release", "disability inclusion report", "diversity report"],
  },
  {
    key: "learning_disability",
    label: "Learning Disability & Neurodivergent Support",
    searchTerms: [
      "neurodiversity program", "dyslexia accommodations", "learning disability support",
      "autism hiring", "neurodivergent inclusion", "ADHD accommodations",
      "disability ERG", "accommodations policy",
      "autism at work", "neurodiversity hiring", "inclusive workplace disability",
    ],
    sourceHints: ["careers page", "disability inclusion report", "press release", "ERG page", "accessibility statement"],
  },
  {
    key: "hbcu_pipeline",
    label: "HBCU Pipeline & Partnerships",
    searchTerms: [
      "HBCU partnership", "HBCU recruitment", "HBCU scholarship",
      "historically Black college", "HBCU career fair", "HBCU internship",
      "Thurgood Marshall College Fund", "UNCF partnership",
      "HBCU fellowship", "campus partnership Howard University",
      "campus partnership Morehouse", "campus partnership Spelman",
    ],
    sourceHints: ["careers page", "press release", "university partnerships page", "diversity report", "scholarship page"],
  },
  {
    key: "no_degree",
    label: "No-Degree & Skills-First Pathways",
    searchTerms: [
      "no degree required", "skills-based hiring", "remove degree requirement",
      "alternative credentials", "apprenticeship program", "Tear the Paper Ceiling",
      "STARs hiring", "skills-first employer", "certificate pathway",
      "degree optional", "non-degree pathways", "competency-based hiring",
    ],
    sourceHints: ["job listings", "careers page", "press release", "Opportunity@Work", "Markle Foundation"],
  },
];

// ─── Expanded scrape targets for promotion equity evidence ───
function getScrapePaths(websiteUrl: string, careersUrl: string | null): string[] {
  const base = websiteUrl.replace(/\/$/, "");
  const paths = [
    base,
    `${base}/about`,
    `${base}/diversity`,
    `${base}/inclusion`,
    `${base}/responsibility`,
    `${base}/esg`,
    `${base}/impact`,
    `${base}/sustainability`,
    `${base}/careers`,
    `${base}/culture`,
  ];
  if (careersUrl && !paths.includes(careersUrl)) {
    paths.push(careersUrl);
  }
  // Return max 5 to conserve Firecrawl credits
  return paths.slice(0, 5);
}

// ─── Search queries to find reports not linked from main site ───
function getSearchQueries(companyName: string): string[] {
  return [
    `"${companyName}" ESG report OR impact report OR inclusion report OR diversity report`,
    `"${companyName}" internal promotion rate OR leadership development OR talent marketplace`,
    `"${companyName}" HBCU partnership OR skills-first hiring OR neurodiversity program OR disability inclusion`,
  ];
}

const CACHE_TTL_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId } = await req.json();
    if (!companyId) throw new Error("Missing companyId");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get company info
    const { data: company, error: compError } = await adminClient
      .from("companies")
      .select("id, name, website_url, careers_url, industry, description")
      .eq("id", companyId)
      .single();
    if (compError || !company) throw new Error("Company not found");

    // ─── Cache check: skip if scanned within TTL ───
    const { data: recentSignals } = await adminClient
      .from("company_values_signals")
      .select("created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentSignals && recentSignals.length > 0) {
      const lastScan = new Date(recentSignals[0].created_at);
      const daysSince = (Date.now() - lastScan.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < CACHE_TTL_DAYS) {
        console.log(`[values-scan] Cache hit for ${company.name} (${daysSince.toFixed(1)}d ago)`);
        const { data: cached } = await adminClient
          .from("company_values_signals")
          .select("*")
          .eq("company_id", companyId);
        return new Response(JSON.stringify({
          success: true,
          cached: true,
          signalsFound: cached?.length || 0,
          signals: cached || [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── Gather existing signals for context ───
    const [{ data: existingFlags }, { data: existingIdeology }, { data: existingPAC }] = await Promise.all([
      adminClient.from("company_ideology_flags").select("org_name, category, relationship_type").eq("company_id", companyId).limit(20),
      adminClient.from("company_flagged_orgs").select("org_name, relationship, description").eq("company_id", companyId).limit(20),
      adminClient.from("company_candidates").select("name, party, amount").eq("company_id", companyId).limit(30),
    ]);

    // ─── Phase 1: Scrape company pages (up to 5) ───
    let scrapedContent = "";
    if (firecrawlKey && company.website_url) {
      const urls = getScrapePaths(company.website_url, company.careers_url);
      console.log(`[values-scan] Scraping ${urls.length} pages for ${company.name}`);

      // Scrape in parallel batches of 3
      for (let i = 0; i < urls.length; i += 3) {
        const batch = urls.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
            });
            if (scrapeRes.ok) {
              const scrapeData = await scrapeRes.json();
              if (scrapeData?.data?.markdown) {
                return `\n\n--- Page: ${url} ---\n${scrapeData.data.markdown.slice(0, 3000)}`;
              }
            }
            return "";
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled" && r.value) scrapedContent += r.value;
        }
      }
    }

    // ─── Phase 2: Search for reports/announcements not on the main site ───
    let searchContent = "";
    if (firecrawlKey) {
      const queries = getSearchQueries(company.name);
      console.log(`[values-scan] Running ${queries.length} search queries for ${company.name}`);

      const searchResults = await Promise.allSettled(
        queries.map(async (query) => {
          const res = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              limit: 3,
              lang: "en",
              country: "us",
              tbs: "qdr:y", // last year
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.data) {
              return data.data
                .map((r: any) => `--- Search result: ${r.title} (${r.url}) ---\n${r.description || ""}`)
                .join("\n\n");
            }
          }
          return "";
        })
      );
      for (const r of searchResults) {
        if (r.status === "fulfilled" && r.value) searchContent += "\n\n" + r.value;
      }
    }

    // ─── AI analysis with expanded prompt ───
    const systemPrompt = `You are a corporate values intelligence analyst specializing in detecting promotion equity, internal mobility, and workforce inclusion signals. 

Given company data, existing political signals, scraped web content, and search results, detect "Value-Identity" signals across these categories:

${VALUE_CATEGORIES.map(c => `- ${c.key}: ${c.label} — Look for: ${c.searchTerms.join(", ")}`).join("\n")}

IMPORTANT GUIDELINES:
1. Look for EVIDENCE PATTERNS, not just exact phrases. Companies rarely use textbook terminology.
2. Evidence hidden in ESG reports, impact reports, recruiting blogs, leadership announcements, and talent development pages counts.
3. Detect implicit signals: employee title progression patterns suggest internal promotion even without explicit statements.
4. For each signal, assign confidence:
   - "direct": Explicit data or program mentioned (e.g., "our internal promotion rate is 40%")
   - "inferred": Strong evidence pattern but not directly stated (e.g., ESG report mentions leadership development programs without specific rates)
   - "weak": Indirect or limited evidence (e.g., job posting mentions "growth opportunities" without specifics)
5. When NO signals are found for a category, that is itself a meaningful finding — note the transparency gap.
6. Be factual and neutral — document what is found without moral judgment.`;

    const userPrompt = `Company: ${company.name}
Industry: ${company.industry}
Description: ${company.description || "N/A"}
Website: ${company.website_url || "N/A"}

Existing Political Signals:
${JSON.stringify({ flags: existingFlags?.slice(0, 10), ideology: existingIdeology?.slice(0, 10), pac_recipients: existingPAC?.slice(0, 15) }, null, 2)}

Scraped Web Content (from company pages):
${scrapedContent.slice(0, 10000) || "No content scraped from company pages"}

Search Results (ESG reports, diversity reports, press releases):
${searchContent.slice(0, 6000) || "No additional reports found via search"}

Analyze all available evidence and extract value-identity signals. For promotion equity categories (internal_promotion, women_leadership, minority_advancement, deaf_accessibility, learning_disability, hbcu_pipeline, no_degree), be especially thorough — look for implicit evidence patterns, not just explicit statements.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_values_signals",
            description: "Report detected value-identity signals for a company.",
            parameters: {
              type: "object",
              properties: {
                signals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value_category: { type: "string", enum: VALUE_CATEGORIES.map(c => c.key) },
                      signal_type: { type: "string" },
                      signal_summary: { type: "string" },
                      evidence_text: { type: "string" },
                      evidence_url: { type: "string" },
                      confidence: { type: "string", enum: ["direct", "inferred", "weak"] },
                    },
                    required: ["value_category", "signal_type", "signal_summary", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["signals"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_values_signals" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI error:", status, await aiResponse.text());
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured output");

    const { signals } = JSON.parse(toolCall.function.arguments);

    // Upsert signals
    if (signals && signals.length > 0) {
      await adminClient.from("company_values_signals").delete().eq("company_id", companyId);

      const rows = signals.map((s: any) => ({
        company_id: companyId,
        value_category: s.value_category,
        signal_type: s.signal_type,
        signal_summary: s.signal_summary,
        evidence_text: s.evidence_text || null,
        evidence_url: s.evidence_url || null,
        confidence: s.confidence,
        detected_by: "values_scan",
      }));

      await adminClient.from("company_values_signals").insert(rows);
    }

    return new Response(JSON.stringify({ success: true, signalsFound: signals?.length || 0, signals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("values-scan error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
