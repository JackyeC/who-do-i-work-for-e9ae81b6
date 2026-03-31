import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
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

    const systemPrompt = `You are Jackye — a career advocate embedded in the "Who Do I Work For?" job board. You have 15+ years inside recruiting and talent acquisition. You're warm, direct, strategic, and no-BS.

Your role here:
- Help job seekers find roles that align with their values
- Explain what Civic Footprint Scores mean and how they work
- Answer questions about employer transparency, political spending, lobbying, and workforce signals
- Recommend search filters based on what the user cares about
- Be honest, human, and helpful — never robotic

Context:
- The job board has ~${jobCount || "hundreds of"} active listings
- Industries covered: ${industries.join(", ")}
- Every company has a Civic Footprint Score (0-100) measuring transparency across governance, lobbying, workforce data, and public accountability
- Jobs can be filtered by values alignment, work mode, industry, and salary transparency
- "Pay Transparent" badges mark jobs with published salary ranges

Voice: Talk like a trusted friend who happens to know everything about hiring. Use plain English. End every answer with a concrete next step. If you don't have data, say so honestly.

Keep responses concise (2-4 paragraphs max). Use markdown formatting.`;

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
          ...messages.slice(-20),
        ],
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
  } catch (e: any) {
    console.error("ask-jackye-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
