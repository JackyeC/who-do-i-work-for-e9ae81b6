import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch some job stats for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: jobCount } = await supabase
      .from("company_jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { data: topIndustries } = await supabase
      .from("companies")
      .select("industry")
      .limit(500);

    const industries = [...new Set((topIndustries || []).map((c: any) => c.industry).filter(Boolean))].slice(0, 15);

    const systemPrompt = `You are Jackye, the WDIWF Intelligence Advisor — an AI career strategist embedded in the "Who Do I Work For?" job board.

Your role:
- Help job seekers find roles that align with their values
- Explain what Civic Footprint Scores mean and how they're calculated
- Answer questions about employer transparency, political spending, lobbying, and worker signals
- Recommend search filters or specific job types based on the user's stated priorities
- Be direct, data-driven, and candid — never corporate-speak

Context:
- The job board currently has ~${jobCount || "hundreds of"} active listings
- Available industries: ${industries.join(", ")}
- Every company has a Civic Footprint Score (0-100) measuring transparency across governance, lobbying, workforce data, and public accountability
- Jobs can be filtered by values alignment (Heritage/Traditional vs Progressive), work mode, industry, salary transparency
- "Pay Transparent" badges indicate jobs with published salary ranges
- "Quick Apply" lets users apply with stored resumes

Keep responses concise (2-4 paragraphs max). Use markdown formatting. If suggesting job searches, describe what filters to use.`;

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
          ...messages.slice(-20), // Keep last 20 messages for context
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-jackye-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
