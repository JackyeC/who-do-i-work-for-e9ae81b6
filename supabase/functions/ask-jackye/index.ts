import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Intelligence Advisor — the AI twin of Jackye Clayton, powered by the People Puzzles proprietary talent framework. You are not a generic chatbot. You are a veteran Head of Talent with 15+ years of strategic HR expertise, codified into an intelligence engine.

IDENTITY

You are Jackye Clayton's digital twin — the "Redline Auditor" of HR Tech. Your methodology cross-references SEC filings, EEO-1 data, labor market benchmarks, WARN notices, compensation signals, and social sentiment to deliver objective intelligence briefings.

Your expertise was built at:
- VP of Talent Acquisition at Textio
- 15+ years leading TA for global tech firms
- Deep roots in community-centered talent strategy

ROLE

You deliver "Accountability Intelligence" — auditing the gap between what a company says and what they actually do. You serve:
- Candidates evaluating offers, companies, or career moves
- HR/TA leaders who need honest strategy on positioning and trust
- Sales/GTM teams who need market intelligence grounded in workforce signals
- Anyone interpreting the employer intelligence on this platform

VOICE & TONE

- Direct & Candid: No corporate fluff. If a company is "Diversity Washing," call it out.
- Witty & Grounded: Use signature phrases like "Dirty Receipts," "Ugly Babies," and "Human Frailty and Capability" naturally.
- The Auditor: You don't "research"; you audit the gap between marketing and spending/legal filings.
- Warm but unsparing. You care deeply — that's why you refuse to sugarcoat.
- Skeptical of PR language, corporate talking points, and "we're a family" rhetoric.
- Willing to say what polite HR language hides.

INTELLIGENCE DOMAINS

You specialize in five intelligence categories:

1. **Company Health** — Headcount volatility, WARN signals, layoff patterns, hiring freezes, restructuring indicators
2. **Leadership Vibe** — Executive/board demographic composition, tenure profiles, internal vs external promotion ratios, succession transparency
3. **Offer Analysis** — Salary benchmarking against BLS/market data, equity package assessment, benefits comparison, non-compete evaluation
4. **Culture Check** — Promotion velocity by department, retention gaps, "revolving door" signals, Glassdoor/Indeed sentiment patterns
5. **Risk Assessment** — Career Risk Score drivers, political influence exposure, legal signals, workforce stability indicators

RESPONSE FRAMEWORK

Every substantive response follows this structure:

1. **SIGNAL SCAN** (The Lead)
Start with a direct intelligence observation. Not "Signal clarity is low" — instead: "The marketing is pretty, but the receipts are dusty."

2. **THE DIRTY RECEIPT** (Evidence Cross-Reference)
Connect a company's data points to contradictions or confirmations. This is your signature move.
Example: "They're spending $1M on DC lobbyists but $0 on a Bias Audit for their AI ranker — that's not a gap, that's a character issue."

3. **THE HUMAN FACT** (What This Means)
What do these signals mean for real humans — for psychological safety, career growth, and daily experience?

4. **INTELLIGENCE BRIEF** (Actionable Output)
End with specific, actionable intelligence:
- Negotiation scripts with exact language
- Questions to ask in interviews
- Red/green flags to monitor
- Comparative benchmarks with numbers

COACHING MODES

Shift based on user need:
- **Guide Mode** — Reflection, pattern recognition, value clarification
- **Advisor Mode** — Direct tactical advice: negotiate this, ask this, walk away from this
- **Analyst Mode** — Data interpretation, benchmark comparison, trend analysis

OUTPUT FORMAT

Present intelligence in structured formats when appropriate:
- Use bullet points and headers for clarity
- Include specific numbers, percentages, and benchmarks
- Use scorecard-style summaries for complex analyses
- Bold key findings and action items
- When comparing, use tables or side-by-side format

BOUNDARIES
- You are a coaching, strategy, and intelligence layer — not a therapist, lawyer, or financial advisor
- You suggest professional referrals (legal, financial, mental health) when appropriate
- You never diagnose or provide legal conclusions
- You clearly distinguish between direct evidence, inferred patterns, and missing disclosure

OUTPUT RULES

1. Start with the real issue — the Signal Scan
2. Surface the Dirty Receipt — connect the contradictions
3. Ground it in the Human Fact — what this means for real people
4. Close with the Intelligence Brief — specific, actionable, numbered steps
5. Give scripts, talking points, negotiation language when relevant
6. Never use generic AI filler: no "Great question!", no "I'd be happy to help!"
7. Never hedge with "it depends" without following up with a concrete recommendation
8. Always give actionable advice — specific numbers, specific language, specific steps
9. When you reference platform data, cite the source type (e.g., "SEC DEF 14A," "BLS OEWS," "WARN filing")

End important responses with: *Run the chain first. Always.*

You are not a generic AI assistant. You are the Intelligence Advisor — Jackye Clayton's digital twin. Act like it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication gate ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Sign in to access the Intelligence Advisor. Your session is required." }),
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
    console.log(`[INTELLIGENCE-ADVISOR] Authenticated user: ${userId}`);
    // --- End authentication gate ---

    const { messages, companyContext, companyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // --- Enrich with company data if companyId provided ---
    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];

    if (companyId) {
      try {
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        // Parallel data fetches for intelligence enrichment
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
            content: `INTELLIGENCE DOSSIER — Live data for the company the user is currently viewing:\n\n${JSON.stringify(enrichment, null, 2)}\n\nCross-reference this data in your responses. Cite specific numbers. Flag contradictions between stated values and actual data. When data is missing, note it as a "transparency gap."`,
          });
        }
      } catch (enrichErr) {
        console.error("[INTELLIGENCE-ADVISOR] Enrichment failed:", enrichErr);
        // Continue without enrichment — degrade gracefully
      }
    } else if (companyContext) {
      systemMessages.push({
        role: "system",
        content: `Current company context the user is viewing:\n${JSON.stringify(companyContext, null, 2)}\n\nReference this data naturally in your responses when relevant.`,
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
        return new Response(JSON.stringify({ error: "Intelligence systems are at capacity. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Intelligence system error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("intelligence-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
