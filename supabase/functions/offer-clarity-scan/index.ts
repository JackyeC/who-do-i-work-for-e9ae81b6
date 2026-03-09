import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { offerData, companyName, companyId } = await req.json();

    if (!offerData || !companyName) {
      return new Response(JSON.stringify({ error: "Missing offerData or companyName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company signals if companyId provided
    let companySignals: any = {};
    if (companyId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [sentimentRes, payEquityRes, enforcementRes, ideologyRes, benefitsRes] = await Promise.all([
        supabase.from("company_worker_sentiment").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1),
        supabase.from("pay_equity_signals").select("*").eq("company_id", companyId),
        supabase.from("workplace_enforcement_signals").select("*").eq("company_id", companyId),
        supabase.from("company_ideology_flags").select("*").eq("company_id", companyId),
        supabase.from("worker_benefit_signals").select("*").eq("company_id", companyId),
      ]);

      companySignals = {
        sentiment: sentimentRes.data?.[0] || null,
        payEquity: payEquityRes.data || [],
        enforcement: enforcementRes.data || [],
        ideology: ideologyRes.data || [],
        benefits: benefitsRes.data || [],
      };
    }

    const prompt = `You are an expert compensation analyst and employment advisor. Analyze this job offer and produce a structured Offer Clarity Score.

## Offer Details
- Company: ${companyName}
- Role: ${offerData.roleTitle || "Not specified"}
- Location: ${offerData.location || "Not specified"}
- Years of Experience: ${offerData.yearsExperience || "Not specified"}
- Base Salary: ${offerData.baseSalary ? `$${offerData.baseSalary}` : "Not specified"}
- Bonus/Commission: ${offerData.bonus || "None"}
- Equity: ${offerData.equity || "None"}
- Additional Details: ${offerData.additionalDetails || "None"}

## Company Signals from Database
${JSON.stringify(companySignals, null, 2)}

Analyze across these 5 categories. For each, provide a score (0-100) and detailed findings.

Use the tool to return your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert compensation analyst. Always use the provided tool to return structured analysis." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "offer_clarity_report",
              description: "Return the structured Offer Clarity analysis with 5 category scores",
              parameters: {
                type: "object",
                properties: {
                  compensation: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 0-100" },
                      marketRangeLow: { type: "number", description: "Estimated market range low end in dollars" },
                      marketRangeHigh: { type: "number", description: "Estimated market range high end in dollars" },
                      percentile: { type: "number", description: "Where this offer falls as percentile (0-100)" },
                      interpretation: { type: "string", enum: ["under_market", "market_aligned", "strong_offer"] },
                      findings: { type: "array", items: { type: "string" }, description: "Key findings about compensation" },
                    },
                    required: ["score", "marketRangeLow", "marketRangeHigh", "percentile", "interpretation", "findings"],
                  },
                  transparency: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 0-100" },
                      level: { type: "string", enum: ["none", "limited", "moderate", "high"] },
                      findings: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "level", "findings"],
                  },
                  legalRisk: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 0-100 (higher = less risk)" },
                      riskLevel: { type: "string", enum: ["low", "moderate", "pattern_risk"] },
                      caseCount: { type: "number", description: "Number of relevant cases found" },
                      findings: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "riskLevel", "caseCount", "findings"],
                  },
                  leadershipRepresentation: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 0-100" },
                      level: { type: "string", enum: ["low", "moderate", "high"] },
                      findings: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "level", "findings"],
                  },
                  employeeExperience: {
                    type: "object",
                    properties: {
                      score: { type: "number", description: "Score 0-100" },
                      pattern: { type: "string", enum: ["negative", "mixed", "positive"] },
                      findings: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "pattern", "findings"],
                  },
                  overallScore: { type: "number", description: "Weighted average Offer Clarity Score 0-100" },
                  overallInterpretation: { type: "string", enum: ["high_risk", "proceed_carefully", "generally_solid", "strong_offer"] },
                  summary: { type: "string", description: "2-3 sentence executive summary" },
                },
                required: ["compensation", "transparency", "legalRisk", "leadershipRepresentation", "employeeExperience", "overallScore", "overallInterpretation", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "offer_clarity_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned from AI");

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("offer-clarity-scan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
