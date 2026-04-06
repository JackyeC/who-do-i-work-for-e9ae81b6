import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JACKYE_VOICE_INSTRUCTION } from "../_shared/jrc-edit-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `${JACKYE_VOICE_INSTRUCTION}

You are the WDIWF Interview Intelligence Engine. You help job seekers prepare for interviews using real public intelligence — not generic advice.

You will receive real company data: receipts, fines, EEOC cases, lobbying records, WARN notices, executive info, public stances, and issue signals. Use ONLY this data. Do not invent facts. If data is sparse, say so honestly.

Your intel_summary should be 2-3 sentences, sharp and specific. WDIWF voice — what do the receipts say about this employer right now. No fluff. No corporate polish.

Your checklist items should be hyper-specific to THIS company based on the data provided. Never give generic advice like "research the company." Every item should reference a specific receipt, signal, or pattern from the data.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName, role } = await req.json();
    if (!companyId && !companyName) {
      return new Response(JSON.stringify({ error: "companyId or companyName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let company: any = null;
    if (companyId) {
      const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
      company = data;
    } else if (companyName) {
      const { data } = await supabase.from("companies").select("*").ilike("name", companyName).maybeSingle();
      company = data;
    }

    const cId = company?.id;
    let executives: any[] = [];
    let issueSignals: any[] = [];
    let publicStances: any[] = [];
    let warnNotices: any[] = [];
    let eeocCases: any[] = [];
    let lobbyingIssues: any[] = [];

    if (cId) {
      const [execRes, issueRes, stanceRes, warnRes, eeocRes, lobbyRes] = await Promise.all([
        supabase.from("company_executives").select("name, title, total_donations, previous_company, departed_at").eq("company_id", cId).limit(8),
        supabase.from("issue_signals").select("issue_category, signal_type, description, amount, confidence_score").eq("entity_id", cId).limit(15),
        supabase.from("company_public_stances").select("issue_category, public_position, evidence_type, reality_check, gap_severity").eq("company_id", cId).limit(8),
        supabase.from("company_warn_notices").select("notice_date, affected_employees, layoff_or_closure, plant_name").eq("company_id", cId).limit(10),
        supabase.from("eeoc_cases").select("case_name, filing_date, basis, issue, resolution_type, monetary_relief").eq("company_id", cId).limit(10),
        supabase.from("company_lobbying_issues").select("*").eq("company_id", cId).limit(8),
      ]);
      executives = execRes.data || [];
      issueSignals = issueRes.data || [];
      publicStances = stanceRes.data || [];
      warnNotices = warnRes.data || [];
      eeocCases = eeocRes.data || [];
      lobbyingIssues = lobbyRes.data || [];
    }

    const companyData = company ? {
      name: company.name,
      industry: company.industry,
      state: company.state,
      employees: company.employee_count,
      civicFootprintScore: company.civic_footprint_score,
      clarityScore: company.employer_clarity_score,
      lobbyingSpend: company.lobbying_spend,
      pacSpending: company.total_pac_spending,
      jackyeInsight: company.jackye_insight,
      description: company.description,
    } : { name: companyName, note: "Limited data available." };

    const dataPayload = JSON.stringify({
      company: companyData,
      executives,
      issueSignals,
      publicStances,
      warnNotices,
      eeocCases,
      lobbyingIssues,
    }, null, 2);

    const roleContext = role ? `The candidate is interviewing for a ${role} role. Tailor everything for that function.` : "";
    const userPrompt = `Company: ${companyName || company?.name || "Unknown"}. Role: ${role || "not specified"}.\n\nHere is the company intelligence data:\n${dataPayload}\n\n${roleContext}\n\nGenerate a hyper-personalized interview prep brief using the extract_prep_brief tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_prep_brief",
            description: "Return a structured interview prep brief with intel summary and checklist.",
            parameters: {
              type: "object",
              properties: {
                company: { type: "string", description: "Company name" },
                role: { type: "string", description: "Role being interviewed for, or null" },
                intel_summary: { type: "string", description: "2-3 sentence sharp summary in WDIWF voice. What do the receipts say about this employer right now." },
                checklist: {
                  type: "object",
                  properties: {
                    research: { type: "array", items: { type: "string" }, description: "3 specific research items based on company data" },
                    questions_to_ask: { type: "array", items: { type: "string" }, description: "3 specific questions to ask, derived from receipts" },
                    watch_for: { type: "array", items: { type: "string" }, description: "2 red flags or culture signals specific to this company" },
                    power_move: { type: "string", description: "The single sharpest thing they can do to stand out at THIS company" },
                  },
                  required: ["research", "questions_to_ask", "watch_for", "power_move"],
                },
              },
              required: ["company", "intel_summary", "checklist"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_prep_brief" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Failed to generate structured brief." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brief = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(brief), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-prep-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
