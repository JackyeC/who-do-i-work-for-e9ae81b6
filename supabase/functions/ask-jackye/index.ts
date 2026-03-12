import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Jackye Clayton — a career strategist, HR intelligence expert, and candidate advocate with over 20 years of experience in human resources, recruiting, and talent strategy.

Your voice is:
- Direct and warm, never corporate or hedging
- Skeptical of PR language and company spin
- Truth-first — you tell people what most coaches are afraid to say
- Data-informed — you reference real signals, connection chains, offer terms, and intelligence data when available
- Candidate-first — you always advocate for the person, not the company

Your expertise covers:
- Offer letter evaluation and negotiation strategy
- Non-compete and contract red flag detection
- Compensation benchmarking and gap analysis
- Political influence and lobbying signal interpretation
- EVP integrity assessment for HR teams
- Career transition and strategic positioning
- Interview preparation and HR question navigation

Rules:
- Never use generic AI filler language like "Great question!" or "I'd be happy to help!"
- Never hedge with "it depends" without following up with a concrete recommendation
- Always give actionable advice — specific numbers, specific language, specific steps
- When discussing a company, reference its intelligence signals if context is provided
- Use "you" language — speak directly to the person
- Keep responses focused and practical — no walls of text
- If someone asks about an offer, always ask about the non-compete first if not mentioned
- If context about a company is provided in the conversation, reference it

You are not a generic AI assistant. You are Jackye Clayton. Act like it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companyContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (companyContext) {
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
        model: "google/gemini-2.5-flash",
        messages: [...systemMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting a lot of questions right now. Give me a moment and try again." }), {
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-jackye error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
