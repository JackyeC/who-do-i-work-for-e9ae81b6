import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JACKYE_VOICE_INSTRUCTION } from "../_shared/jrc-edit-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      companyName,
      roleTitle,
      baseSalary,
      bonus,
      equity,
      signOnBonus,
      signals,
      legalFlags,
      compPercentile,
      annualBaseline,
      userPriorities,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `${JACKYE_VOICE_INSTRUCTION}

YOUR JOB: Generate 3 negotiation email drafts and leverage insights based on the company's health signals. You're helping someone figure out their leverage and use it.

RULES:
- Be professional, specific, and actionable
- Reference concrete data points (salary percentile, company signals, legal flags)
- Never be aggressive or threatening. Frame everything as collaborative.
- Each email should be 150-250 words, ready to send
- The "Collaborative" email is warm, relationship-first
- The "Data-Driven" email references market benchmarks and percentiles
- The "High-Value" email focuses on equity, long-term value, and career growth

COMPANY INTELLIGENCE:
Company: ${companyName}
Role: ${roleTitle}
Offered Base: $${Number(baseSalary).toLocaleString()}
Bonus: ${bonus || "Not specified"}
Equity: ${equity || "Not specified"}
Sign-On: ${signOnBonus || "Not specified"}
User's Walk-Away Baseline: $${Number(annualBaseline).toLocaleString()}
Comp Percentile: ${compPercentile || "Unknown"}

SIGNAL DATA:
${JSON.stringify(signals || [], null, 2)}

LEGAL FLAGS:
${JSON.stringify(legalFlags || [], null, 2)}

USER PRIORITIES:
${JSON.stringify(userPriorities || [], null, 2)}

Generate leverage insights based on this data. For example:
- If hiring_activity is high: "They need you. You have leverage."
- If compensation_transparency is low: "Hidden budget likely exists."
- If innovation_activity is high: "Prioritize equity. Company is scaling."
- If workforce_stability is low: "Ask for guaranteed severance."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate 3 negotiation emails and leverage insights for this offer at ${companyName} for ${roleTitle} at $${Number(baseSalary).toLocaleString()}.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_negotiation_package",
              description:
                "Return 3 negotiation email drafts and leverage insights.",
              parameters: {
                type: "object",
                properties: {
                  collaborative: {
                    type: "string",
                    description:
                      "The Collaborative email, warm, relationship-first approach",
                  },
                  dataDriven: {
                    type: "string",
                    description:
                      "The Data-Driven email, references market benchmarks",
                  },
                  highValue: {
                    type: "string",
                    description:
                      "The High-Value email, equity and long-term focus",
                  },
                  leverageInsights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insight: { type: "string" },
                        source: { type: "string" },
                        action: { type: "string" },
                      },
                      required: ["insight", "source", "action"],
                      additionalProperties: false,
                    },
                    description:
                      "Array of 3-5 tactical leverage insights based on company signals",
                  },
                  suggestedAsk: {
                    type: "string",
                    description:
                      "A one-line summary of the recommended counter-offer amount or range",
                  },
                },
                required: [
                  "collaborative",
                  "dataDriven",
                  "highValue",
                  "leverageInsights",
                  "suggestedAsk",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "generate_negotiation_package" },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("negotiation-coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
