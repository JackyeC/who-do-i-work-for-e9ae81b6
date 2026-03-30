import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Lead Interview Prep Analyst for "Who Do I Work For?" (WDIWF), a career intelligence tool founded by Jackye Clayton. Your job is to prepare a candidate (or help a recruiter prep a candidate) for an interview or meeting with a specific company.

You will receive real company data: receipts, fines, EEOC cases, lobbying records, WARN notices, executive info, public stances, and issue signals. Use ONLY this data. Do not invent facts. If data is sparse, say so.

Generate a Candidate Prep Pack using this EXACT structure with these EXACT section headers (use ## for each):

## 30-Second Reality Check
One paragraph. If the candidate reads nothing else, this is it. Direct, honest, grounded in the data provided. No fluff.

## Top 5 Receipts You Should Know
Numbered list of the 5 most important things a candidate should know before walking in. Each item: what happened, when (if known), and why it matters for someone who might work there. Use real data only. If fewer than 5 exist, list what you have and note the gap.

## Say / Ask / Avoid
Three columns of talk tracks:
**SAY** — 2-3 phrases a candidate can use to show they did their homework without sounding accusatory.
**ASK** — 3-5 specific questions derived from the receipts. Each should force transparency. Include a brief note on why each matters.
**AVOID** — 2-3 things NOT to say (common mistakes candidates make when they know about controversies).

## Red / Yellow / Green Flags
Quick-glance summary organized by signal area:
- 🔴 **Red Flags** — clear concerns from the data (enforcement actions, large fines, EEOC cases, WARN notices)
- 🟡 **Yellow Flags** — things worth watching or asking about (lobbying activity, say-vs-do gaps, executive turnover)
- 🟢 **Green Flags** — positive signals if any exist (transparency, strong civic score, alignment commitments)

## Day 90 Reality
3-5 bullets describing what the first 90 days would likely feel like based on the company's patterns. Be specific: reference the data. If the company has layoff history, mention onboarding uncertainty. If they have high lobbying spend, mention the compliance culture. Ground everything.

ROLE-SPECIFIC FRAMING:
If a role is specified (Engineering, People/HR, Sales, Leadership), adjust the Ask questions and Day 90 bullets to reflect how the receipts show up for that function specifically.

TONE:
- No em-dashes.
- No fluff or corporate speak.
- Direct, slightly witty, grounded in TA expertise.
- If the data shows a red flag, call it a red flag.
- Write like someone with 20 years in HR/Recruiting who has zero patience for spin.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName, role } = await req.json();
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

    // Fetch company
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
    let contracts: any[] = [];
    let issueSignals: any[] = [];
    let publicStances: any[] = [];
    let warnNotices: any[] = [];
    let eeocCases: any[] = [];
    let jobs: any[] = [];
    let lobbyingIssues: any[] = [];
    let partyBreakdown: any[] = [];
    let revolvingDoor: any[] = [];

    if (cId) {
      const [execRes, contractRes, issueRes, stanceRes, warnRes, eeocRes, jobRes, lobbyRes, partyRes, revolveRes] = await Promise.all([
        supabase.from("company_executives").select("name, title, total_donations, previous_company, departed_at").eq("company_id", cId).limit(10),
        supabase.from("company_agency_contracts").select("agency_name, contract_value, contract_description, controversy_flag, controversy_description").eq("company_id", cId).limit(10),
        supabase.from("issue_signals").select("issue_category, signal_type, description, amount, confidence_score").eq("entity_id", cId).limit(20),
        supabase.from("company_public_stances").select("issue_category, public_position, evidence_type, reality_check, gap_severity").eq("company_id", cId).limit(10),
        supabase.from("company_warn_notices").select("notice_date, affected_employees, layoff_or_closure, plant_name").eq("company_id", cId).limit(10),
        supabase.from("eeoc_cases").select("case_name, filing_date, basis, issue, resolution_type, monetary_relief").eq("company_id", cId).limit(10),
        supabase.from("company_jobs").select("title, department, work_mode, seniority_level").eq("company_id", cId).eq("is_active", true).limit(15),
        supabase.from("company_lobbying_issues").select("*").eq("company_id", cId).limit(10),
        supabase.from("company_party_breakdown").select("*").eq("company_id", cId),
        supabase.from("company_revolving_door").select("person_name, government_role, company_role, direction").eq("company_id", cId).limit(5),
      ]);
      executives = execRes.data || [];
      contracts = contractRes.data || [];
      issueSignals = issueRes.data || [];
      publicStances = stanceRes.data || [];
      warnNotices = warnRes.data || [];
      eeocCases = eeocRes.data || [];
      jobs = jobRes.data || [];
      lobbyingIssues = lobbyRes.data || [];
      partyBreakdown = partyRes.data || [];
      revolvingDoor = revolveRes.data || [];
    }

    const companyData = company ? {
      name: company.name,
      industry: company.industry,
      state: company.state,
      employees: company.employee_count,
      publiclyTraded: company.is_publicly_traded,
      civicFootprintScore: company.civic_footprint_score,
      clarityScore: company.employer_clarity_score,
      lobbyingSpend: company.lobbying_spend,
      pacSpending: company.total_pac_spending,
      governmentContracts: company.government_contracts,
      subsidiesReceived: company.subsidies_received,
      effectiveTaxRate: company.effective_tax_rate,
      jackyeInsight: company.jackye_insight,
      description: company.description,
    } : { name: companyName, note: "Limited data available." };

    const dataPayload = JSON.stringify({
      company: companyData,
      executives: executives.slice(0, 8),
      governmentContracts: contracts.slice(0, 8),
      issueSignals: issueSignals.slice(0, 15),
      publicStances: publicStances.slice(0, 8),
      warnNotices,
      eeocCases,
      lobbyingIssues: lobbyingIssues.slice(0, 8),
      partyBreakdown,
      revolvingDoor,
      activeJobs: jobs.slice(0, 10).map((j: any) => `${j.title} (${j.department || "N/A"}, ${j.work_mode || "N/A"})`),
    }, null, 2);

    const roleContext = role && role !== "general" 
      ? `\n\nIMPORTANT: The candidate is interviewing for a ${role.toUpperCase()} role. Tailor the Ask questions and Day 90 bullets specifically for someone in ${role}.`
      : "";

    const userPrompt = `Generate a Candidate Prep Pack for this company:\n\n${dataPayload}${roleContext}`;

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("candidate-prep-pack error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
