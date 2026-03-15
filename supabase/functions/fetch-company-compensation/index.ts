import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FRESHNESS_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company } = await req.json();
    if (!company || typeof company !== "string") {
      return new Response(JSON.stringify({ error: "company is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Cache check
    const { data: cached } = await sb
      .from("compensation_data")
      .select("*")
      .ilike("company", company)
      .single();

    if (cached && cached.freshness_status === "fresh" && cached.last_updated) {
      const age = (Date.now() - new Date(cached.last_updated).getTime()) / (1000 * 60 * 60 * 24);
      if (age < FRESHNESS_DAYS) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Use Lovable AI to estimate compensation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiPrompt = `You are a compensation data analyst. For the company "${company}", estimate realistic compensation data based on your knowledge of H1B salary disclosures, industry benchmarks, Glassdoor ranges, and public financial filings.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "median_total_compensation_usd": <integer>,
  "salary_by_grade": [
    {"grade_code": "<code>", "title": "<level title>", "median_total_comp_usd": <integer>}
  ],
  "top_roles": [
    {"role": "<job title>", "median_total_comp_usd": <integer>}
  ],
  "source_summary": [
    {"source_name": "<name>", "source_type": "<type>", "confidence": <0-1>, "notes": "<brief note>"}
  ]
}

Rules:
- Include 3-6 grade levels appropriate for this company
- Include 3-5 top-paying roles
- All dollar values must be integers (no decimals, no $ signs, no commas)
- Base estimates on H1B disclosure data patterns and industry norms
- source_summary must include at least: "H1B Disclosure Data" (base_salary_only, confidence 0.7), "Industry Benchmarks" (estimated_market_signal, confidence 0.5), and "AI Estimation" (ai_synthesized, confidence 0.6)
- Be realistic — don't inflate numbers`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "return_compensation_data",
              description: "Return structured compensation data for a company",
              parameters: {
                type: "object",
                properties: {
                  median_total_compensation_usd: { type: "integer" },
                  salary_by_grade: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        grade_code: { type: "string" },
                        title: { type: "string" },
                        median_total_comp_usd: { type: "integer" },
                      },
                      required: ["grade_code", "title", "median_total_comp_usd"],
                    },
                  },
                  top_roles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string" },
                        median_total_comp_usd: { type: "integer" },
                      },
                      required: ["role", "median_total_comp_usd"],
                    },
                  },
                  source_summary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_name: { type: "string" },
                        source_type: { type: "string" },
                        confidence: { type: "number" },
                        notes: { type: "string" },
                      },
                      required: ["source_name", "source_type", "confidence", "notes"],
                    },
                  },
                },
                required: ["median_total_compensation_usd", "salary_by_grade", "top_roles", "source_summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_compensation_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status, await aiResponse.text());

      // Keep existing data, mark failed
      if (cached) {
        await sb
          .from("compensation_data")
          .update({ freshness_status: "failed" })
          .ilike("company", company);
        return new Response(JSON.stringify({ ...cached, freshness_status: "failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Compensation estimation temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let compData: any;

    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      compData = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        compData = JSON.parse(jsonMatch[0]);
      }
    }

    if (!compData || !compData.median_total_compensation_usd) {
      if (cached) {
        await sb.from("compensation_data").update({ freshness_status: "partial" }).ilike("company", company);
        return new Response(JSON.stringify({ ...cached, freshness_status: "partial" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Could not estimate compensation data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const row = {
      company: company.trim(),
      currency: "USD",
      median_total_compensation_usd: Math.round(compData.median_total_compensation_usd),
      salary_by_grade: compData.salary_by_grade,
      top_roles: compData.top_roles,
      source_summary: compData.source_summary,
      last_updated: today,
      freshness_status: "fresh",
    };

    // Upsert
    const { data: upserted, error: upsertErr } = await sb
      .from("compensation_data")
      .upsert(row, { onConflict: "company", ignoreDuplicates: false })
      .select()
      .single();

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      // If upsert fails due to unique constraint case mismatch, try update
      if (cached) {
        const { data: updated } = await sb
          .from("compensation_data")
          .update(row)
          .eq("id", cached.id)
          .select()
          .single();
        return new Response(JSON.stringify(updated || { ...cached, ...row }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(upserted || row), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-company-compensation error:", e);
    return new Response(JSON.stringify({ error: "Internal error processing compensation request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
