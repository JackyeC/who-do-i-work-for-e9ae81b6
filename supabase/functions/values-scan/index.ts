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
    searchTerms: ["internal promotion rate", "promote from within", "internal mobility program", "career ladder", "succession planning", "internal hire percentage", "employee development program", "tuition reimbursement"],
    sourceHints: ["careers page", "annual report", "Glassdoor reviews", "press release"],
  },
  {
    key: "women_leadership",
    label: "Women in Leadership & Promotions",
    searchTerms: ["women in leadership", "female executives", "women promoted", "women on board", "gender parity", "women ERG", "women's leadership program", "SHE Summit", "Catalyst award"],
    sourceHints: ["diversity report", "proxy statement", "ESG filing", "press release"],
  },
  {
    key: "minority_advancement",
    label: "Minority Advancement & Representation",
    searchTerms: ["minority leadership", "Black executives", "Hispanic leadership", "people of color promoted", "racial equity audit", "minority representation", "diverse leadership pipeline", "BIPOC advancement"],
    sourceHints: ["EEO-1 data", "diversity report", "press release", "ESG filing"],
  },
  {
    key: "deaf_accessibility",
    label: "Deaf & Hard-of-Hearing Inclusion",
    searchTerms: ["deaf employees", "ASL interpreter", "hearing accessibility", "deaf-friendly workplace", "captioning provided", "deaf hiring program", "National Association of the Deaf", "Communication Access Realtime Translation"],
    sourceHints: ["careers page", "accessibility page", "press release", "disability inclusion report"],
  },
  {
    key: "learning_disability",
    label: "Learning Disability & Neurodivergent Support",
    searchTerms: ["neurodiversity program", "dyslexia accommodations", "learning disability support", "autism hiring", "neurodivergent inclusion", "ADHD accommodations", "disability ERG", "accommodations policy"],
    sourceHints: ["careers page", "disability inclusion report", "press release", "ERG page"],
  },
  {
    key: "hbcu_pipeline",
    label: "HBCU Pipeline & Partnerships",
    searchTerms: ["HBCU partnership", "HBCU recruitment", "HBCU scholarship", "historically Black college", "HBCU career fair", "HBCU internship", "Thurgood Marshall College Fund", "UNCF partnership"],
    sourceHints: ["careers page", "press release", "university partnerships page", "diversity report"],
  },
  {
    key: "no_degree",
    label: "No-Degree & Skills-First Pathways",
    searchTerms: ["no degree required", "skills-based hiring", "remove degree requirement", "alternative credentials", "apprenticeship program", "Tear the Paper Ceiling", "STARs hiring", "skills-first employer", "certificate pathway"],
    sourceHints: ["job listings", "careers page", "press release", "Opportunity@Work", "Markle Foundation"],
  },
];
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

    // Gather existing signals for context
    const [{ data: existingFlags }, { data: existingIdeology }, { data: existingPAC }] = await Promise.all([
      adminClient.from("company_ideology_flags").select("org_name, category, relationship_type").eq("company_id", companyId).limit(20),
      adminClient.from("company_flagged_orgs").select("org_name, relationship, description").eq("company_id", companyId).limit(20),
      adminClient.from("company_candidates").select("name, party, amount").eq("company_id", companyId).limit(30),
    ]);

    // Try to scrape company about/values pages
    let scrapedContent = "";
    if (firecrawlKey && company.website_url) {
      try {
        const urls = [
          company.website_url,
          `${company.website_url}/about`,
          `${company.website_url}/values`,
          `${company.website_url}/responsibility`,
          `${company.website_url}/diversity`,
        ].filter(Boolean);

        for (const url of urls.slice(0, 3)) {
          try {
            const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
            });
            if (scrapeRes.ok) {
              const scrapeData = await scrapeRes.json();
              if (scrapeData?.data?.markdown) {
                scrapedContent += `\n\n--- Page: ${url} ---\n${scrapeData.data.markdown.slice(0, 3000)}`;
              }
            }
          } catch { /* skip failed scrapes */ }
        }
      } catch { /* skip all scraping errors */ }
    }

    // AI analysis
    const systemPrompt = `You are a corporate values intelligence analyst. Given company data, existing political signals, and scraped web content, detect "Value-Identity" signals across these categories:

${VALUE_CATEGORIES.map(c => `- ${c.key}: ${c.label} — Look for: ${c.searchTerms.join(", ")}`).join("\n")}

For each signal found, provide the category, specific signal type, a factual summary, and evidence. Only report signals with actual evidence. Be factual and neutral—document what is found without moral judgment. If a company is rolling back DEI, report that factually alongside companies maintaining programs.`;

    const userPrompt = `Company: ${company.name}
Industry: ${company.industry}
Description: ${company.description || "N/A"}

Existing Political Signals:
${JSON.stringify({ flags: existingFlags?.slice(0, 10), ideology: existingIdeology?.slice(0, 10), pac_recipients: existingPAC?.slice(0, 15) }, null, 2)}

Scraped Web Content:
${scrapedContent.slice(0, 8000) || "No content scraped"}

Analyze and extract all value-identity signals.`;

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
      // Clear old signals for this company
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
