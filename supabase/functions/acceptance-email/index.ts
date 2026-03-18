import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      companyName, roleTitle, baseSalary, bonus, equity, signOnBonus,
      startDate, recruiterName, userName, departmentName,
      negotiatedTerms, topSignals,
    } = await req.json();

    const systemPrompt = `You are a professional career communications specialist. Generate a polished offer acceptance email that:
- Documents the agreed-upon terms (salary, equity, bonus) naturally
- References specific company strengths or signals the candidate observed during the process (do NOT name "WDIWF" or any intelligence tool)
- Maintains a tone that is warm, confident, and professionally enthusiastic
- Subtly demonstrates the candidate did their homework without being aggressive
- Keeps it concise (under 250 words for the body)

The email should read like it was written by someone who is genuinely excited AND well-informed.`;

    const userPrompt = `Generate an offer acceptance email with these details:
- Candidate name: ${userName || "[Your Name]"}
- Recruiter/Hiring Manager: ${recruiterName || "[Hiring Manager]"}
- Company: ${companyName}
- Role: ${roleTitle}
- Department: ${departmentName || "the team"}
- Start date: ${startDate || "[Start Date]"}
- Base salary: $${baseSalary}
- Bonus: ${bonus || "N/A"}
- Equity: ${equity || "N/A"}
- Sign-on bonus: ${signOnBonus || "N/A"}
- Terms that were clarified/negotiated: ${(negotiatedTerms || []).join(", ") || "standard terms"}
- Company signals observed: ${(topSignals || []).map((s: any) => s.summary || s.signal_category).join("; ") || "positive market position"}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_acceptance_email",
              description: "Return a professional offer acceptance email with subject line and body.",
              parameters: {
                type: "object",
                properties: {
                  subject: {
                    type: "string",
                    description: "Email subject line, e.g. 'Offer Acceptance — Jane Doe — Senior Engineer'",
                  },
                  body: {
                    type: "string",
                    description: "Full email body text, including greeting and sign-off. Use line breaks for paragraphs.",
                  },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_acceptance_email" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("acceptance-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
