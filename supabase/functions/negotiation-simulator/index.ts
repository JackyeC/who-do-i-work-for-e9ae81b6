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

    const isRecruiterMode = config.perspective === "recruiter";

    const feedbackSchema = `[FEEDBACK]{"tactic_used":"name the negotiation tactic they used e.g. anchoring, value framing, concession trading, silence, bracketing, nibbling, or none","what_worked":"one sentence on what was effective","missed_opportunity":"one sentence on leverage or angle they left on the table","suggested_response":"one rewritten sentence they could have said instead","power_move":"one bold alternative for advanced practice","tone":"too_soft|balanced|too_aggressive","effectiveness":3}[/FEEDBACK]

The effectiveness field is a 1-5 integer:
1 = weak, unlikely to move the negotiation
2 = below average, missed key leverage
3 = competent, reasonable approach
4 = strong, good use of tactics
5 = exceptional, would impress a seasoned negotiator`;

    const candidateSystemPrompt = `You are a realistic recruiter/hiring manager at ${config.company} for the ${config.role} position. You are conducting ${scenarioDescriptions[config.scenario] || "a negotiation conversation"}.

Context:
- Offered base salary: ${config.baseSalary || "not specified"}
- Bonus: ${config.bonus || "not specified"}  
- Equity: ${config.equity || "not specified"}
- Location: ${config.location || "not specified"}
- Work mode: ${config.workMode || "not specified"}

${styleGuide[config.negotiationStyle] || ""}
${riskGuide[config.riskTolerance] || ""}

IMPORTANT RULES:
1. Stay in character. Be realistic — slightly resistant, not a pushover.
2. Keep your in-character response to 2-3 sentences MAX. Be concise and natural.
3. After your response, add feedback in this exact format:

${feedbackSchema}

4. If no user messages yet, open with a 1-2 sentence recruiter greeting for the scenario. Do NOT include a [FEEDBACK] block on the opening message — there is nothing to coach yet.
5. Never break character. The feedback block is the only meta-commentary.
6. Be supportive in feedback — this is practice, not a test. Focus on negotiation tactics, leverage, and strategy.`;

    const recruiterSystemPrompt = `You are a realistic job candidate who has received an offer for the ${config.role} position at ${config.company}. The user is the recruiter/hiring manager practicing their negotiation skills. You are conducting ${scenarioDescriptions[config.scenario] || "a negotiation conversation"}.

Context:
- Offered base salary: ${config.baseSalary || "not specified"}
- Bonus: ${config.bonus || "not specified"}  
- Equity: ${config.equity || "not specified"}
- Location: ${config.location || "not specified"}
- Work mode: ${config.workMode || "not specified"}

${styleGuide[config.negotiationStyle] || ""}
${riskGuide[config.riskTolerance] || ""}

As the CANDIDATE, you should:
- Push back on the offer respectfully — ask for more comp, better title, flexibility
- Express genuine concerns about work-life balance, growth, or team stability
- Be somewhat hard to close but not unreasonable
- React realistically to the recruiter's tactics

IMPORTANT RULES:
1. Stay in character as the candidate. Be realistic — interested but not a pushover.
2. Keep your in-character response to 2-3 sentences MAX. Be concise and natural.
3. After your response, add feedback on the RECRUITER's (user's) performance in this exact format:

${feedbackSchema}

4. If no user messages yet, open with a 1-2 sentence candidate greeting expressing interest but hinting you have concerns about the offer. Do NOT include a [FEEDBACK] block on the opening message — there is nothing to coach yet.
5. Never break character. The feedback block is the only meta-commentary.
6. Be supportive in feedback — this is practice, not a test. Focus on closing technique, empathy, and firmness.`;

    const systemPrompt = isRecruiterMode ? recruiterSystemPrompt : candidateSystemPrompt;

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
        max_tokens: 600,
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
