import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  WDIWF_CLARITY_DOSSIER_TEMPLATE,
  WDIWF_VOICE_BASE,
} from "../_shared/wdiwf-voice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `${WDIWF_VOICE_BASE}

You are the Lead Analyst for WDIWF (Who Do I Work For?), founded by Jackye Clayton. Your job is decision intelligence for candidates: forensic, receipt-backed, zero corporate spin.

Analyze the provided company data and produce the dossier below. Facts over feelings — but always translate signals into what they mean for the candidate's risk, pay, and leverage.

${WDIWF_CLARITY_DOSSIER_TEMPLATE}

Additional tone: No em-dashes. Direct and slightly wry is fine; robotic analyst tone is not. If the data shows a red flag, name it. If data is sparse, say so plainly.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId && !companyName) {
      return new Response(JSON.stringify({ error: "companyId or companyName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company data
    let company: any = null;
    if (companyId) {
      const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
      company = data;
    } else if (companyName) {
      const { data } = await supabase.from("companies").select("*").ilike("name", companyName).maybeSingle();
      company = data;
    }

    // Fetch related signals
    const cId = company?.id;
    let executives: any[] = [];
    let contracts: any[] = [];
    let issueSignals: any[] = [];
    let publicStances: any[] = [];
    let warnNotices: any[] = [];
    let jobs: any[] = [];

    if (cId) {
      const [execRes, contractRes, issueRes, stanceRes, warnRes, jobRes] = await Promise.all([
        supabase.from("company_executives").select("name, title, total_donations, previous_company").eq("company_id", cId).limit(10),
        supabase.from("company_agency_contracts").select("agency_name, contract_value, contract_description, controversy_flag").eq("company_id", cId).limit(10),
        supabase.from("issue_signals").select("issue_category, signal_type, description, amount, confidence_score").eq("entity_id", cId).limit(20),
        supabase.from("company_public_stances").select("issue_category, public_position, evidence_type, reality_check, gap_severity").eq("company_id", cId).limit(10),
        supabase.from("company_warn_notices").select("notice_date, affected_employees, layoff_or_closure, plant_name").eq("company_id", cId).limit(5),
        supabase.from("company_jobs").select("title, department, work_mode, salary_range, seniority_level").eq("company_id", cId).eq("is_active", true).limit(20),
      ]);
      executives = execRes.data || [];
      contracts = contractRes.data || [];
      issueSignals = issueRes.data || [];
      publicStances = stanceRes.data || [];
      warnNotices = warnRes.data || [];
      jobs = jobRes.data || [];
    }

    // Build the data prompt
    const companyData = company ? {
      name: company.name,
      industry: company.industry,
      state: company.state,
      employees: company.employee_count,
      publiclyTraded: company.is_publicly_traded,
      civicFootprintScore: company.civic_footprint_score,
      clarityScore: company.employer_clarity_score,
      careerIntelligenceScore: company.career_intelligence_score,
      lobbyingSpend: company.lobbying_spend,
      pacSpending: company.total_pac_spending,
      governmentContracts: company.government_contracts,
      subsidiesReceived: company.subsidies_received,
      effectiveTaxRate: company.effective_tax_rate,
      jackyeInsight: company.jackye_insight,
      description: company.description,
    } : { name: companyName, note: "Limited data available. Analysis is based on general industry knowledge." };

    const dataPayload = JSON.stringify({
      company: companyData,
      executives: executives.slice(0, 5),
      governmentContracts: contracts.slice(0, 5),
      issueSignals: issueSignals.slice(0, 10),
      publicStances: publicStances.slice(0, 5),
      warnNotices: warnNotices.slice(0, 3),
      activeJobs: jobs.slice(0, 10).map((j: any) => `${j.title} (${j.department || "N/A"}, ${j.work_mode || "N/A"})`),
    }, null, 2);

    const userPrompt = `Analyze this company and generate the WDIWF Clarity Dossier:\n\n${dataPayload}`;

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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("clarity-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
