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
    layer: 3,
  },
  {
    key: "supports_israel",
    label: "Supports Israel",
    searchTerms: ["AIPAC donation", "Israel bond purchase", "United Democracy Project", "pro-Israel advocacy", "Israel solidarity"],
    sourceHints: ["FEC filing", "PAC donation records", "corporate press release"],
    layer: 4,
  },
  {
    key: "animal_welfare",
    label: "Animal / Pet Welfare",
    searchTerms: ["animal shelter donation", "pet adoption program", "cruelty-free certified", "percentage to shelters", "ASPCA partner", "Humane Society partner"],
    sourceHints: ["ESG report", "corporate responsibility page", "press release"],
    layer: 1,
  },
  {
    key: "anti_discrimination",
    label: "Anti-Discrimination / DEI",
    searchTerms: ["CROWN Act support", "HRC Corporate Equality Index", "Title VII compliance", "DEI program", "pay equity audit", "anti-discrimination policy", "inclusive hiring"],
    sourceHints: ["EEOC filings", "HRC database", "corporate DEI page", "amicus brief"],
    layer: 1,
  },
  {
    key: "dei_rollback",
    label: "DEI Rollback Tracker",
    searchTerms: ["DEI program ended", "diversity office closed", "DEI budget cut", "rolled back diversity", "ended affirmative action", "dismantled DEI"],
    sourceHints: ["news article", "SEC filing", "press release", "earnings call transcript"],
    layer: 2,
  },
  {
    key: "environmental",
    label: "Environmental Commitment",
    searchTerms: ["carbon neutral", "net zero commitment", "renewable energy", "climate pledge", "sustainability report", "EPA compliance"],
    sourceHints: ["sustainability report", "CDP filing", "press release"],
    layer: 1,
  },
  {
    key: "veteran_support",
    label: "Veteran / Military Support",
    searchTerms: ["veteran hiring program", "military spouse employment", "Hiring Our Heroes", "veteran transition", "military-friendly employer"],
    sourceHints: ["careers page", "press release", "Military Times ranking"],
    layer: 4,
  },
  {
    key: "lgbtq_inclusive",
    label: "LGBTQ+ Inclusive",
    searchTerms: ["HRC 100 score", "domestic partner benefits", "gender-affirming care", "Pride sponsor", "LGBTQ+ ERG", "transgender-inclusive benefits"],
    sourceHints: ["HRC Corporate Equality Index", "benefits page", "press release"],
    layer: 1,
  },
  // ─── Promotion Equity & Workforce Categories ───
  {
    key: "internal_promotion",
    label: "Internal Promotion / Promotes From Within",
    searchTerms: [
      "internal promotion rate", "promote from within", "internal mobility program",
      "career ladder", "succession planning", "internal hire percentage",
      "employee development program", "tuition reimbursement",
      "leadership development program", "talent marketplace", "career growth pathways",
      "upskilling initiative", "internal job marketplace", "mentorship program",
      "career pathing", "learning and development", "rotational program",
      "career mobility", "leadership training", "leadership pipeline",
      "talent development", "career progression", "promote and retain",
    ],
    sourceHints: ["careers page", "annual report", "ESG report", "impact report", "diversity report", "press release", "talent development page", "SEC 10-K"],
    layer: 1,
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
    layer: 1,
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
    layer: 1,
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
    layer: 5,
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
    layer: 5,
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
      "minority-serving institution", "Hispanic-serving institution",
      "community college pathway", "apprenticeship", "workforce development partnership",
    ],
    sourceHints: ["careers page", "press release", "university partnerships page", "diversity report", "scholarship page"],
    layer: 4,
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
    layer: 4,
  },
  // ─── New categories for enhanced workforce equity ───
  {
    key: "career_path_progression",
    label: "Career Path Progression Data",
    searchTerms: [
      "promotion rate", "time to promotion", "title progression", "career advancement rate",
      "internal leaders", "promoted internally percentage", "executive long tenure",
      "median promotion time", "advancement metrics", "advancement outcomes",
      "career progression data", "advancement statistics",
    ],
    sourceHints: ["ESG report", "diversity report", "impact report", "annual report", "workforce data"],
    layer: 7,
  },
  {
    key: "retention_stability",
    label: "Retention & Workforce Stability",
    searchTerms: [
      "employee retention", "turnover rate", "attrition rate", "low turnover",
      "employee satisfaction", "great place to work", "retention program",
      "employee tenure", "workforce stability", "hiring freeze", "restructuring",
    ],
    sourceHints: ["press release", "annual report", "Glassdoor", "ESG report", "WARN database"],
    layer: 6,
  },
  {
    key: "promotion_vs_exit",
    label: "Promotion vs Exit Pattern",
    searchTerms: [
      "internal promotion vs external hire", "employees leave to advance",
      "career plateau", "internal mobility rate", "external replacement",
      "hire and burn", "high turnover", "promote and retain",
      "boomerang employees", "talent pipeline leakage",
    ],
    sourceHints: ["workforce analytics", "career page signals", "SEC filing", "news reports"],
    layer: 7,
  },
  {
    key: "learning_infrastructure",
    label: "Learning & Development Infrastructure",
    searchTerms: [
      "learning and development", "training investment", "tuition reimbursement",
      "leadership academy", "upskilling program", "reskilling initiative",
      "professional development budget", "certification support",
      "internal university", "corporate university", "learning platform",
    ],
    sourceHints: ["careers page", "ESG report", "annual report", "press release"],
    layer: 3,
  },
  {
    key: "representation",
    label: "Workforce Representation Data",
    searchTerms: [
      "workforce composition", "workforce demographics", "EEO-1",
      "representation data", "gender breakdown", "racial breakdown",
      "board diversity percentage", "leadership composition",
      "technical team diversity", "workforce statistics",
    ],
    sourceHints: ["diversity report", "ESG report", "SEC proxy statement", "EEO-1 filing"],
    layer: 1,
  },
  {
    key: "pay_equity",
    label: "Pay Equity & Transparency",
    searchTerms: [
      "pay equity", "pay gap analysis", "compensation equity", "equal pay",
      "pay transparency", "salary transparency", "compensation audit",
      "gender pay gap report", "racial pay gap", "pay equity methodology",
    ],
    sourceHints: ["diversity report", "ESG report", "press release", "proxy statement"],
    layer: 1,
  },
];

// ─── 7-Layer Source Map for scraping ───
function getScrapePaths(websiteUrl: string, careersUrl: string | null): string[] {
  const base = websiteUrl.replace(/\/$/, "");
  const paths = [
    // Layer 1 — Company Reports
    `${base}/diversity`,
    `${base}/inclusion`,
    `${base}/esg`,
    `${base}/impact`,
    `${base}/sustainability`,
    `${base}/responsibility`,
    `${base}/corporate-responsibility`,
    // Layer 3 — Career & Talent Pages
    `${base}/careers`,
    `${base}/culture`,
    `${base}/about`,
    `${base}/life`,
    `${base}/growth`,
    `${base}/learning-development`,
    // Layer 5 — Accessibility
    `${base}/accessibility`,
  ];
  if (careersUrl && !paths.includes(careersUrl)) {
    paths.push(careersUrl);
  }
  // Scrape up to 7 to balance coverage with credit cost
  return paths.slice(0, 7);
}

// ─── 7-Layer search queries ───
function getSearchQueries(companyName: string): string[] {
  return [
    // Layer 1 — Company Reports
    `"${companyName}" diversity report OR inclusion report OR ESG report OR impact report OR corporate responsibility report`,
    // Layer 2 — SEC Filings
    `"${companyName}" SEC 10-K OR proxy statement human capital management OR workforce development OR leadership succession`,
    // Layer 3 — Career Pages & Learning
    `"${companyName}" internal job marketplace OR leadership academy OR mentorship program OR rotational program`,
    // Layer 4 — University & Pipeline Partnerships
    `"${companyName}" HBCU partnership OR minority-serving institution OR apprenticeship OR skills-first hiring OR workforce development partnership`,
    // Layer 5 — Accessibility & Disability
    `"${companyName}" neurodiversity hiring OR disability inclusion OR deaf employment OR accessibility initiative`,
    // Layer 6 — Workforce Stability
    `"${companyName}" layoffs OR restructuring OR workforce reduction OR WARN notice`,
    // Layer 7 — Career Path Progression
    `"${companyName}" promotion rate OR internal mobility rate OR advancement statistics OR career progression data`,
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

    // Cache check
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

    // Gather existing signals for context
    const [{ data: existingFlags }, { data: existingIdeology }, { data: existingPAC }] = await Promise.all([
      adminClient.from("company_ideology_flags").select("org_name, category, relationship_type").eq("company_id", companyId).limit(20),
      adminClient.from("company_flagged_orgs").select("org_name, relationship, description").eq("company_id", companyId).limit(20),
      adminClient.from("company_candidates").select("name, party, amount").eq("company_id", companyId).limit(30),
    ]);

    // ─── Phase 1: Scrape company pages (Layer 1, 3, 5) ───
    let scrapedContent = "";
    if (firecrawlKey && company.website_url) {
      const urls = getScrapePaths(company.website_url, company.careers_url);
      console.log(`[values-scan] Scraping ${urls.length} pages for ${company.name}`);

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

    // ─── Phase 2: Search for reports across all 7 layers ───
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
              tbs: "qdr:y",
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

    // ─── AI analysis with 7-layer evidence model ───
    const systemPrompt = `You are a corporate workforce intelligence analyst specializing in detecting promotion equity, internal mobility, career progression, and workforce inclusion signals using a structured 7-Layer Evidence Model.

EVIDENCE LAYERS (search in this order):
Layer 1 — Company Reports (Most Reliable): Diversity, Inclusion, ESG, Impact, Sustainability, Corporate Responsibility, Talent reports
Layer 2 — SEC Filings: 10-K, proxy statements (DEF 14A) — human capital strategy, leadership succession
Layer 3 — Career & Talent Pages: Internal job marketplaces, leadership academies, mentorship, rotational programs, L&D
Layer 4 — University & Pipeline Partnerships: HBCU, HSI, community college, apprenticeship, workforce development partnerships
Layer 5 — Accessibility & Disability Signals: Disability inclusion, neurodiversity hiring, deaf employment, ADA accommodations
Layer 6 — Workforce Stability: WARN data, layoffs, restructuring, hiring freezes, retention patterns
Layer 7 — Career Path Progression: Title progression patterns, promotion rates, internal vs external hiring ratios

EVIDENCE STRENGTH CLASSIFICATION (apply to every signal):
- "direct": Explicit data, statistics, or named programs. Examples: "45% of leadership roles filled internally", "We operate an internal talent marketplace"
- "inferred": Clear references or programs without specific data. Examples: "Employees are encouraged to pursue internal roles", "Participates in HBCU career fairs"  
- "weak": Generic language, vague commitments. Examples: "We support employee growth", "Opportunities to grow", "We invest in people"

PROMOTION VS EXIT PATTERN ANALYSIS:
When detecting career_path_progression and promotion_vs_exit signals, assess whether the company appears to:
- "promote_and_retain": Employees grow internally (frequent title progression, high internal promotion rate)
- "hire_and_burn": High turnover pattern, frequent layoffs followed by rehiring
- "external_replacement": Leadership filled primarily from outside rather than developed internally

Given company data, existing political signals, scraped web content, and search results, detect signals across these categories:

${VALUE_CATEGORIES.map(c => `- ${c.key}: ${c.label} (Layer ${c.layer}) — Look for: ${c.searchTerms.slice(0, 8).join(", ")}`).join("\n")}

IMPORTANT:
1. Look for EVIDENCE PATTERNS, not just exact phrases.
2. For promotion equity categories, be especially thorough — check ESG reports, career pages, SEC filings, and press releases.
3. For the promotion_vs_exit category: explicitly assess whether employees grow internally or leave to advance.
4. When NO signals are found for a category, that is a transparency gap — note it as a finding.
5. Include the source_layer (1-7) for each signal based on where the evidence was found.
6. Be factual and neutral — document what is found without moral judgment.
7. Do NOT infer protected traits from photos or names — only use self-disclosed or company-disclosed information.`;

    const userPrompt = `Company: ${company.name}
Industry: ${company.industry}
Description: ${company.description || "N/A"}
Website: ${company.website_url || "N/A"}

Existing Political Signals:
${JSON.stringify({ flags: existingFlags?.slice(0, 10), ideology: existingIdeology?.slice(0, 10), pac_recipients: existingPAC?.slice(0, 15) }, null, 2)}

Scraped Web Content (from company pages — Layers 1, 3, 5):
${scrapedContent.slice(0, 12000) || "No content scraped from company pages"}

Search Results (Layers 1-7: ESG reports, SEC filings, career pages, partnerships, accessibility, stability, career progression):
${searchContent.slice(0, 8000) || "No additional reports found via search"}

Analyze all available evidence using the 7-Layer Evidence Model. Extract signals with proper evidence strength classification. For workforce equity categories, assess both what IS disclosed and what is NOT disclosed (transparency gaps).`;

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
            description: "Report detected value-identity signals for a company using the 7-Layer Evidence Model.",
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
                      source_layer: { type: "number", enum: [1, 2, 3, 4, 5, 6, 7] },
                      evidence_strength: { type: "string", enum: ["strong", "moderate", "weak", "no_public_signals"] },
                      pattern_type: { type: "string", enum: ["promote_and_retain", "hire_and_burn", "external_replacement", "unknown"] },
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
        detected_by: "values_scan_v2",
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
