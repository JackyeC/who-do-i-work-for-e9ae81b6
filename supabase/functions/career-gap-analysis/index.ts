import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { target_role } = await req.json();
    if (!target_role?.trim()) throw new Error("target_role is required");

    // Fetch user career profile
    const { data: profile } = await supabase
      .from("user_career_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const currentSkills = profile?.skills || [];
    const currentTitles = (profile as any)?.preferred_titles || profile?.job_titles || [];
    const currentIndustries = profile?.industries || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a career development expert. Analyze a person's current skills and experience against a target role. Be specific and actionable. Consider real-world job requirements for the target role.`,
          },
          {
            role: "user",
            content: `Current skills: ${currentSkills.join(", ") || "None listed"}
Current/recent titles: ${currentTitles.join(", ") || "Not specified"}
Industries: ${currentIndustries.join(", ") || "Not specified"}

Target role: ${target_role}

Analyze the gap between this person's current profile and the target role.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_gap_analysis",
              description: "Return a structured career gap analysis",
              parameters: {
                type: "object",
                properties: {
                  skills_match_pct: {
                    type: "number",
                    description: "Percentage of required skills the person already has (0-100)",
                  },
                  missing_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific skills the person is missing for this role (max 8)",
                  },
                  matching_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills from the person's profile that transfer to this role",
                  },
                  suggested_next: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 specific, actionable next steps (certifications, courses, projects, mentorship)",
                  },
                  estimated_months: {
                    type: "number",
                    description: "Estimated months to be competitive for this role",
                  },
                  move_type: {
                    type: "string",
                    enum: ["upward", "lateral", "diagonal"],
                    description: "Type of career move this represents",
                  },
                  difficulty: {
                    type: "number",
                    description: "Difficulty score 1-10",
                  },
                },
                required: ["skills_match_pct", "missing_skills", "matching_skills", "suggested_next", "estimated_months", "move_type", "difficulty"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_gap_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Insert into employee_growth_tracker
    const { data: track, error: insertError } = await supabase
      .from("employee_growth_tracker")
      .insert({
        user_id: user.id,
        target_role: target_role.trim(),
        completed_skills: analysis.matching_skills || [],
        missing_skills: analysis.missing_skills || [],
        skills_match_pct: Math.min(Math.max(Math.round(analysis.skills_match_pct), 0), 100),
        values_alignment_score: 0,
        gap_analysis: {
          current_skills: currentSkills,
          suggested_next: analysis.suggested_next,
          estimated_months: analysis.estimated_months,
          move_type: analysis.move_type,
          difficulty: analysis.difficulty,
        },
        status: "exploring",
      } as any)
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, track }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-gap-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
