import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate_name, party, state, district } = await req.json();

    if (!candidate_name) {
      return new Response(JSON.stringify({ error: "candidate_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const districtContext = district ? `, District ${district}` : "";
    const prompt = `You are a civic data researcher. Provide a concise, neutral voting record summary for the politician "${candidate_name}" (${party}, ${state}${districtContext}).

Include:
1. **Key Votes** – 3-5 notable recent votes on major legislation (with bill names and how they voted)
2. **Committee Assignments** – Current committees they serve on
3. **Policy Focus Areas** – Their primary legislative priorities
4. **Relevant to Workers** – Any votes related to labor, wages, benefits, or workplace regulation

Keep it factual and under 300 words. If you don't have enough information about this specific politician, say so clearly and suggest checking Congress.gov or VoteSmart directly.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a nonpartisan civic researcher providing factual summaries of politician voting records. Be objective and cite specific votes when possible." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API failed [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "No voting data available.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Voting summary error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
