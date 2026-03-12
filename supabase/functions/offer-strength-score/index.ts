import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("user_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("function_name", "offer-strength-score")
      .gte("used_at", since);
    if ((count ?? 0) >= 15) {
      return new Response(JSON.stringify({ error: "Daily limit reached (15 scores/day)." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { offerData, companyName, companyId, annualBaseline, clarityReport } = body;

    if (!offerData || !companyName) {
      return new Response(JSON.stringify({ error: "Missing offerData or companyName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user preferences
    const { data: prefs } = await userClient
      .from("user_offer_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch company signals if available
    let companySignals: any = {};
    if (companyId) {
      const [sentimentRes, payEquityRes, enforcementRes, benefitsRes, ideologyRes] = await Promise.all([
        serviceClient.from("company_worker_sentiment").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1),
        serviceClient.from("pay_equity_signals").select("*").eq("company_id", companyId),
        serviceClient.from("workplace_enforcement_signals").select("*").eq("company_id", companyId),
        serviceClient.from("worker_benefit_signals").select("*").eq("company_id", companyId),
        serviceClient.from("company_ideology_flags").select("*").eq("company_id", companyId),
      ]);
      companySignals = {
        sentiment: sentimentRes.data?.[0] || null,
        payEquity: payEquityRes.data || [],
        enforcement: enforcementRes.data || [],
        benefits: benefitsRes.data || [],
        ideology: ideologyRes.data || [],
      };
    }

    // Fetch BLS benchmarks if role data available
    let blsBenchmarks: any = null;
    if (offerData.roleTitle) {
      const { data: blsData } = await serviceClient
        .from("bls_wage_benchmarks")
        .select("*")
        .ilike("occupation_title", `%${offerData.roleTitle.substring(0, 30)}%`)
        .order("data_year", { ascending: false })
        .limit(3);
      if (blsData && blsData.length > 0) blsBenchmarks = blsData;
    }

    const sanitize = (s: string | undefined, max = 500): string =>
      (s || "").replace(/[<>"'`]/g, "").substring(0, max).trim();

    const prompt = `You are a senior compensation analyst and employment advisor at a career intelligence platform called "Who Do I Work For?" by Jackye Clayton.

Analyze this job offer and produce a comprehensive Offer Strength Score™ with 7 weighted categories.

## Offer Details
- Company: ${sanitize(companyName, 200)}
- Role: ${sanitize(offerData.roleTitle, 200) || "Not specified"}
- Location: ${sanitize(offerData.location, 200) || "Not specified"}
- Years of Experience: ${sanitize(offerData.yearsExperience, 10) || "Not specified"}
- Base Salary: ${offerData.baseSalary ? `$${sanitize(offerData.baseSalary, 20)}` : "Not specified"}
- Bonus/Commission: ${sanitize(offerData.bonus, 300) || "None"}
- Sign-On Bonus: ${sanitize(offerData.signOnBonus, 200) || "None"}
- Equity: ${sanitize(offerData.equity, 300) || "None"}
- Non-Compete: ${sanitize(offerData.nonCompete, 500) || "None mentioned"}
- Repayment Clause: ${offerData.repaymentClause ? `${sanitize(offerData.repaymentClause, 10)} months` : "None"}
- Benefit Waiting Period: ${offerData.benefitWaitingPeriod ? `${sanitize(offerData.benefitWaitingPeriod, 10)} days` : "Not specified"}
- Mandatory Arbitration: ${offerData.arbitrationClause ? "Yes" : "No"}
- Broad IP Assignment: ${offerData.ipClause ? "Yes" : "No"}
- Had Interview: ${offerData.hasInterview ? "Yes" : "No"}
- Additional Details: ${sanitize(offerData.additionalDetails, 3000) || "None"}

## User's Financial Safety Line
${annualBaseline ? `$${annualBaseline}/year (minimum needed to cover expenses)` : "Not provided"}

## Existing AI Clarity Report (if available)
${clarityReport ? JSON.stringify(clarityReport) : "Not available"}

## Company Signals from Database
${Object.keys(companySignals).length > 0 ? JSON.stringify(companySignals, null, 2) : "No company signals available"}

## BLS Wage Benchmarks
${blsBenchmarks ? JSON.stringify(blsBenchmarks, null, 2) : "No BLS benchmarks matched"}

## User Personalization Preferences
${prefs ? JSON.stringify({
  compensation_priority: prefs.compensation_priority,
  flexibility_priority: prefs.flexibility_priority,
  healthcare_priority: prefs.healthcare_priority,
  growth_priority: prefs.growth_priority,
  legal_risk_sensitivity: prefs.legal_risk_sensitivity,
  stability_priority: prefs.stability_priority,
}, null, 2) : "No preferences set — use default weights"}

## Scoring Instructions

Score each of these 7 categories from 0-100. Default weights shown. If user preferences exist, adjust weights slightly (preferences scored 1-5 map to weight multipliers: 1=0.7x, 2=0.85x, 3=1.0x, 4=1.15x, 5=1.3x).

1. **Compensation Competitiveness (25%)**: Base salary strength vs market, variable comp transparency, equity transparency, comp mix health, missing comp data penalty.
2. **Contract Clarity (15%)**: Role definition, employment terms, plain-language expectations, documents provided, contingency specificity.
3. **Restrictive Terms Risk (20%)**: Score INVERSELY — more restrictive = lower score. Non-compete scope, non-solicit breadth, NDA scope, IP assignment breadth, arbitration/class waiver, repayment/clawback, indemnification.
4. **Benefits Quality (10%)**: Health insurance timing, retirement match, leave policies, professional development, wellness support.
5. **Offer Mechanics & Fairness (10%)**: Review window, contingency clarity, at-will consistency, employer discretion balance, hidden documents.
6. **Career Growth Signals (10%)**: Onboarding clarity, performance review cadence, growth language, development budget, role scope realism.
7. **Legal / Financial Risk (10%)**: Repayment exposure, personal liability, speculative comp risk, severance clarity, financial lock-in.

For each category provide:
- Score (0-100)
- 2-3 findings (specific to this offer)
- A confidence level (high/medium/low)

Also identify:
- Top 3-5 red flags with severity (high/medium/low) and why it matters
- Top 3-5 green flags with why it's positive
- Top 3-5 negotiation targets with suggested framing
- A "Why This Score" summary (2-3 sentences)
- A final recommendation label

Use the provided tool to return structured results.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a senior compensation analyst. Always use the provided tool. Be specific to the actual offer details — never generic." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "offer_strength_score",
            description: "Return the full Offer Strength Score analysis with 7 categories",
            parameters: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string", enum: ["compensation", "clarity", "restrictive", "benefits", "mechanics", "growth", "legal"] },
                      label: { type: "string" },
                      score: { type: "number", description: "0-100" },
                      weight: { type: "number", description: "Percentage weight used (may differ from default if personalized)" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                      findings: { type: "array", items: { type: "string" }, description: "2-3 specific findings" },
                      positiveSignals: { type: "array", items: { type: "string" } },
                      negativeSignals: { type: "array", items: { type: "string" } },
                    },
                    required: ["key", "label", "score", "weight", "confidence", "findings"],
                  },
                },
                totalScore: { type: "number", description: "Weighted total 0-100" },
                finalLabel: { type: "string", enum: ["Strong Offer", "Good Offer", "Mixed Offer", "Risky Offer", "High-Risk Offer"] },
                finalRecommendation: { type: "string", enum: ["Ready to Sign", "Worth Negotiating", "Proceed Carefully", "Get More Information", "High-Risk Offer"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                personalizationApplied: { type: "boolean" },
                whyThisScore: { type: "string", description: "2-3 sentence explanation of the biggest factors" },
                redFlags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      severity: { type: "string", enum: ["high", "medium", "low"] },
                      description: { type: "string" },
                      suggestedResponse: { type: "string" },
                      isNegotiable: { type: "boolean" },
                    },
                    required: ["title", "severity", "description"],
                  },
                },
                greenFlags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "description"],
                  },
                },
                negotiationTargets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      whyItMatters: { type: "string" },
                      negotiability: { type: "string", enum: ["high", "medium", "low"] },
                      suggestedFraming: { type: "string" },
                    },
                    required: ["item", "whyItMatters", "negotiability", "suggestedFraming"],
                  },
                },
                marketBenchmark: {
                  type: "object",
                  properties: {
                    available: { type: "boolean" },
                    rangeLow: { type: "number" },
                    rangeHigh: { type: "number" },
                    percentile: { type: "number" },
                    note: { type: "string" },
                  },
                  required: ["available"],
                },
                missingDataWarnings: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["categories", "totalScore", "finalLabel", "finalRecommendation", "confidence", "whyThisScore", "redFlags", "greenFlags", "negotiationTargets", "missingDataWarnings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "offer_strength_score" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned from AI");

    const scoreResult = JSON.parse(toolCall.function.arguments);

    // Persist offer record and score
    const { data: offerRecord, error: insertErr } = await userClient
      .from("offer_records")
      .insert({
        user_id: user.id,
        company_id: companyId || null,
        company_name: companyName,
        role_title: offerData.roleTitle || null,
        location: offerData.location || null,
        years_experience: offerData.yearsExperience || null,
        parsed_fields: offerData,
        red_flags: scoreResult.redFlags,
        green_flags: scoreResult.greenFlags,
        extracted_clauses: {
          nonCompete: offerData.nonCompete || null,
          arbitration: offerData.arbitrationClause || false,
          ipClause: offerData.ipClause || false,
          repaymentClause: offerData.repaymentClause || null,
        },
        missing_fields: scoreResult.missingDataWarnings || [],
      })
      .select("id")
      .single();

    if (offerRecord) {
      await userClient.from("offer_scores").insert({
        offer_id: offerRecord.id,
        user_id: user.id,
        total_score: Math.round(scoreResult.totalScore),
        final_label: scoreResult.finalLabel,
        final_recommendation: scoreResult.finalRecommendation,
        confidence: scoreResult.confidence,
        category_scores: Object.fromEntries(
          scoreResult.categories.map((c: any) => [c.key, { score: c.score, weight: c.weight, confidence: c.confidence }])
        ),
        category_explanations: Object.fromEntries(
          scoreResult.categories.map((c: any) => [c.key, { findings: c.findings, positiveSignals: c.positiveSignals, negativeSignals: c.negativeSignals }])
        ),
        negotiation_targets: scoreResult.negotiationTargets,
        top_red_flags: scoreResult.redFlags,
        top_green_flags: scoreResult.greenFlags,
        why_this_score: scoreResult.whyThisScore,
        personalization_applied: scoreResult.personalizationApplied || false,
      });
    }

    // Log usage
    await serviceClient.from("user_usage").insert({ user_id: user.id, function_name: "offer-strength-score" });

    return new Response(JSON.stringify({ success: true, score: scoreResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("offer-strength-score error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
