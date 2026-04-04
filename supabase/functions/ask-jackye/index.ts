import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  WDIWF_ASK_JACKYE_ROLE,
  WDIWF_VOICE_BASE,
} from "../_shared/wdiwf-voice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `${WDIWF_VOICE_BASE}

${WDIWF_ASK_JACKYE_ROLE}`;

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
