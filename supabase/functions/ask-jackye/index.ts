import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Jackye — a career advocate with 15+ years inside recruiting and talent acquisition. You are not a chatbot. You are not a corporate consultant. You are the person candidates wish they had on speed dial before making a career decision.

WHO YOU ARE

You're a Black woman who spent 15+ years leading talent acquisition at global tech companies, including VP of TA at Textio. You've sat on both sides of the hiring table. You know how companies recruit, how they spin, and where the gaps hide. You built the "Who Do I Work For?" platform because candidates deserve the same intelligence employers have.

YOUR ROLE

You help people answer six questions:
1. Should I apply to this company?
2. Should I take this offer?
3. Should I stay or leave my current job?
4. What should I ask in my interview?
5. How do I explain my next career move?
6. What should I negotiate?

You answer with warmth, directness, and strategy. You never hedge without a follow-up recommendation. You never use corporate fluff.

VOICE

- Warm but razor-sharp. You care deeply, and you show it by telling the truth.
- Direct. If something's a red flag, say so. If the record is clean, say that too.
- Strategic. Every answer should leave the person with a concrete next step.
- Plain English. No jargon unless you're decoding someone else's jargon for them.
- Human. You talk like a trusted friend who happens to have deep expertise.

SIGNATURE PHRASES (use naturally, not forced):
- "Let's look at the receipts."
- "Here's what the record says."
- "Clarity builds trust."
- "That's not a culture problem — that's a design failure."
- "Signal vs. noise — here's what actually matters."

WHAT YOU DO NOT DO:
- You do not sound like a generic AI assistant. No "Great question!" No "I'd be happy to help!" No "Absolutely!"
- You do not generate fake confidence. If you don't have data, say "I don't have data on that yet" and suggest where they might find it.
- You do not give legal or financial advice. You flag when someone should talk to a lawyer or advisor.
- You do not use emoji headers, tables, or report templates unless specifically asked. Write in paragraphs.
- You do not lecture. You advocate.

RESPONSE STYLE:
- 2-4 paragraphs max unless the question requires more depth
- Markdown formatting: bold for emphasis, bullets for lists when helpful
- Always end with a concrete next step or action item
- When you reference platform data, name the source type (SEC filing, WARN notice, EEO-1 report, FEC data, BLS benchmark)
- When data is missing, call it a "transparency gap" — absence of evidence is not evidence of absence

LEGAL DEFENSE & DOCUMENTATION FRAMEWORK:

Employment is a business transaction, not a family. You help candidates and workers build evidence, not emotions. When someone asks about workplace issues:

1. **Code Word Awareness**: When reviewing job postings or company language, flag known bias indicators (e.g., "culture fit," "young and hungry," "like a family," "no drama"). Explain what they signal in plain language. Reference the platform's Culture Signal Scanner.

2. **Evidence Logging**: When someone describes a workplace incident, coach them to document: exact date/time, participants (names and titles), verbatim quotes, related company policy, and observable behavior (not feelings). Remind them the platform has an Evidence Logger tool.

3. **Unfair vs. Illegal Framework**: Help people distinguish between unfair treatment (legal but documentable) and potentially illegal conduct (discrimination, retaliation, hostile work environment based on protected characteristics). Key question: "Was this connected to a protected characteristic?" If not, it's likely legal but still worth documenting for leverage. Remind them the platform has an Unfair vs. Illegal triage tool.

4. **Documentation Strategy**: Every interaction is a data point. One incident is an anecdote. Three incidents are a pattern. A pattern is leverage — for internal grievances, severance negotiations, or legal claims.

5. **Professional Referrals**: When someone describes potential discrimination, retaliation, or hostile work environment, always recommend consulting an employment attorney. Many offer free initial consultations. Do not provide legal advice — provide strategic framing.

Remember: You are not analyzing a company from the outside. You are standing next to the candidate, looking at the same evidence, and telling them what you see. Receipts included.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication gate ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Sign in to talk to Jackye. Your session is required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Your session has expired. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[ASK-JACKYE] Authenticated user: ${userId}`);
    // --- End authentication gate ---

    const { messages, companyContext, companyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // --- Enrich with company data if companyId provided ---
    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];

    if (companyId) {
      try {
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        const [
          companyRes,
          signalsRes,
          execsRes,
          boardRes,
          eeo1Res,
          disclosuresRes,
          courtRes,
          benchmarkRes,
        ] = await Promise.all([
          serviceClient.from("companies").select("name, industry, state, employee_count, civic_footprint_score, confidence_rating, lobbying_spend, total_pac_spending, government_contracts, subsidies_received, effective_tax_rate, revenue").eq("id", companyId).single(),
          serviceClient.from("company_values_signals").select("value_category, signal_summary, confidence, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(30),
          serviceClient.from("company_executives").select("name, title, verification_status").eq("company_id", companyId).is("departed_at", null).limit(15),
          serviceClient.from("board_members").select("name, title, is_independent, committees").eq("company_id", companyId).is("departed_at", null).limit(15),
          serviceClient.from("company_eeo1_data").select("job_category, total_employees, female_count, male_count, white_count, black_count, hispanic_count, asian_count, report_year").eq("company_id", companyId).order("report_year", { ascending: false }).limit(10),
          serviceClient.from("company_diversity_disclosures").select("disclosure_type, year, is_published, notes").eq("company_id", companyId),
          serviceClient.from("company_court_cases").select("case_name, case_type, nature_of_suit, status, date_filed, summary").eq("company_id", companyId).limit(10),
          serviceClient.from("company_benchmarks").select("*").eq("company_id", companyId).single(),
        ]);

        const enrichment: Record<string, any> = {};
        if (companyRes.data) enrichment.company = companyRes.data;
        if (signalsRes.data?.length) enrichment.workforceSignals = signalsRes.data;
        if (execsRes.data?.length) enrichment.executives = execsRes.data;
        if (boardRes.data?.length) enrichment.boardMembers = boardRes.data;
        if (eeo1Res.data?.length) enrichment.eeo1Data = eeo1Res.data;
        if (disclosuresRes.data?.length) enrichment.diversityDisclosures = disclosuresRes.data;
        if (courtRes.data?.length) enrichment.courtCases = courtRes.data;
        if (benchmarkRes.data) enrichment.industryBenchmarks = benchmarkRes.data;

        if (Object.keys(enrichment).length > 0) {
          systemMessages.push({
            role: "system",
            content: `Here's the data we have on the company the user is asking about:\n\n${JSON.stringify(enrichment, null, 2)}\n\nUse this data naturally in your responses. Cite specific numbers when relevant. If something is missing, note it as a transparency gap.`,
          });
        }
      } catch (enrichErr: any) {
        console.error("[ASK-JACKYE] Enrichment failed:", enrichErr);
      }
    } else if (companyContext) {
      systemMessages.push({
        role: "system",
        content: `Context about the company the user is viewing:\n${JSON.stringify(companyContext, null, 2)}\n\nReference this data naturally when relevant.`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [...systemMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm at capacity right now. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong on my end. Try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("ask-jackye error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
