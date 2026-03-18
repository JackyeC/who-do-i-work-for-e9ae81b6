import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, config } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const scenarioDescriptions: Record<string, string> = {
      salary: "a salary negotiation conversation",
      remote: "a negotiation about remote work and flexibility",
      title: "a negotiation about job title and level",
      stability: "a conversation about team stability and role clarity",
      "best-and-final": "a 'best and final offer' conversation",
    };

    const styleGuide: Record<string, string> = {
      direct: "The candidate prefers a direct, straightforward approach. Match their pace.",
      collaborative: "The candidate prefers a collaborative, win-win approach. Be warm but firm.",
      reserved: "The candidate is reserved and may need encouragement. Be patient and gentle.",
    };

    const riskGuide: Record<string, string> = {
      low: "The candidate has low risk tolerance. Push back gently on aggressive requests, offer small concessions.",
      balanced: "The candidate has balanced risk tolerance. Negotiate fairly with moderate pushback.",
      high: "The candidate has high risk tolerance. Be more flexible and willing to make concessions on reasonable asks.",
    };

    const systemPrompt = `You are a realistic recruiter/hiring manager at ${config.company} for the ${config.role} position. You are conducting ${scenarioDescriptions[config.scenario] || "a negotiation conversation"}.

Context:
- Offered base salary: ${config.baseSalary || "not specified"}
- Bonus: ${config.bonus || "not specified"}  
- Equity: ${config.equity || "not specified"}
- Location: ${config.location || "not specified"}
- Work mode: ${config.workMode || "not specified"}

${styleGuide[config.negotiationStyle] || ""}
${riskGuide[config.riskTolerance] || ""}

IMPORTANT RULES:
1. Stay in character as the recruiter/hiring manager throughout the conversation.
2. Be realistic — don't give in too easily or be unreasonably stubborn.
3. After each of your responses, include a coaching feedback block in this exact format:

[FEEDBACK]{"what_worked":"brief note on what the candidate did well","improvement":"one specific thing that could be stronger","better_version":"a rephrased version of their last message that would be more effective","shorter_version":"a concise 1-2 sentence version","tone":"too_soft|balanced|too_aggressive"}[/FEEDBACK]

4. If this is the start of the conversation (no user messages yet), open with a realistic recruiter greeting that sets the stage for the negotiation scenario.
5. Keep responses concise (2-4 paragraphs max for your in-character response).
6. Never break character to explain the simulation. The feedback block is the only meta-commentary.
7. Be supportive in feedback — this is practice, not a test.`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
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
        return new Response(JSON.stringify({ error: "Usage credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("negotiation-simulator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
