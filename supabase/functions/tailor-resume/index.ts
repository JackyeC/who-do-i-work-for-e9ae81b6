import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { resumeDocId, jobDescDocId, pastedJobDescription } = await req.json();
    if (!resumeDocId) throw new Error("resumeDocId is required");
    if (!jobDescDocId && !pastedJobDescription) throw new Error("Either jobDescDocId or pastedJobDescription is required");

    // Validate pasted JD length
    if (pastedJobDescription && pastedJobDescription.length > 15000) {
      throw new Error("Job description text is too long (max 15,000 characters)");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch resume
    const resumeRes = await adminClient.from("user_documents").select("*").eq("id", resumeDocId).eq("user_id", user.id).single();
    if (resumeRes.error || !resumeRes.data) throw new Error("Resume not found");

    const resumeSignals = resumeRes.data.parsed_signals || {};

    // Get JD signals: either from a parsed document or from pasted text
    let jdSignals: any;

    if (jobDescDocId) {
      const jdRes = await adminClient.from("user_documents").select("*").eq("id", jobDescDocId).eq("user_id", user.id).single();
      if (jdRes.error || !jdRes.data) throw new Error("Job description not found");
      jdSignals = jdRes.data.parsed_signals || {};
    } else {
      // Use pasted text directly as the JD content
      jdSignals = { raw_text: pastedJobDescription.substring(0, 15000) };
    }

    const systemPrompt = `You are a career intelligence advisor. Given a parsed resume profile and a job description, produce:
1. A GAP ANALYSIS showing which required skills the candidate has vs. is missing
2. TAILORING SUGGESTIONS: specific, actionable ways to adjust resume language to better match the JD
3. A MATCH SCORE (0-100) based on skills overlap, seniority fit, and role alignment
4. TALKING POINTS: 3-5 interview talking points that bridge the candidate's experience to the role

Be specific and actionable. Reference actual skills and requirements from both documents.
This is career signal analysis, NOT legal or employment advice.`;

    const userPrompt = `Resume Profile:
${JSON.stringify(resumeSignals, null, 2)}

Job Description:
${jobDescDocId ? JSON.stringify(jdSignals, null, 2) : jdSignals.raw_text}

Analyze the fit and provide tailoring recommendations.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "tailor_resume",
            description: "Produce a gap analysis and tailoring recommendations for a resume against a job description.",
            parameters: {
              type: "object",
              properties: {
                match_score: { type: "number", description: "0-100 overall match score" },
                matched_skills: { type: "array", items: { type: "string" }, description: "Skills the candidate has that match the JD" },
                missing_skills: { type: "array", items: { type: "string" }, description: "Required skills the candidate appears to lack" },
                seniority_fit: { type: "string", enum: ["strong", "moderate", "weak"], description: "How well seniority aligns" },
                tailoring_suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      current_language: { type: "string" },
                      suggested_language: { type: "string" },
                      reasoning: { type: "string" },
                    },
                    required: ["area", "suggested_language", "reasoning"],
                    additionalProperties: false,
                  },
                },
                talking_points: { type: "array", items: { type: "string" } },
                summary: { type: "string", description: "2-3 sentence overall assessment" },
              },
              required: ["match_score", "matched_skills", "missing_skills", "seniority_fit", "tailoring_suggestions", "talking_points", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "tailor_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI error:", status, await aiResponse.text());
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured output");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, analysis: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("tailor-resume error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
