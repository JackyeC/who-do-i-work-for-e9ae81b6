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

    // Fetch personality profile
    const { data: personality } = await (supabase as any)
      .from("user_personality_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const currentSkills = profile?.skills || [];
    const currentTitles = (profile as any)?.preferred_titles || profile?.job_titles || [];
    const currentIndustries = profile?.industries || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            content: `You are a senior career strategist. Analyze a person's current skills, experience, and personality against a target role. Provide a comprehensive career roadmap including gap analysis, salary progression, and a concrete 30-60-90 day action plan. Be specific, realistic, and actionable. Use real-world salary ranges based on US market data.`,
          },
          {
            role: "user",
            content: `Current skills: ${currentSkills.join(", ") || "None listed"}
Current/recent titles: ${currentTitles.join(", ") || "Not specified"}
Industries: ${currentIndustries.join(", ") || "Not specified"}
Work style: ${(personality?.work_style || []).join(", ") || "Not specified"}
Strengths: ${(personality?.strengths || []).join(", ") || "Not specified"}
Personality traits: ${(personality?.personality_traits || []).join(", ") || "Not specified"}
Leadership preference: ${personality?.leadership_preference || "Not specified"}

Target role: ${target_role}

Provide a full career analysis with gap analysis, salary estimates, and 30-60-90 day plan.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_career_analysis",
              description: "Return a comprehensive career analysis with gap analysis, salary data, and action plan",
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
                    description: "3-5 specific, actionable next steps (certifications, courses, projects)",
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
                  salary_current_low: {
                    type: "number",
                    description: "Estimated current salary range low end (USD annual)",
                  },
                  salary_current_high: {
                    type: "number",
                    description: "Estimated current salary range high end (USD annual)",
                  },
                  salary_target_low: {
                    type: "number",
                    description: "Target role salary range low end (USD annual)",
                  },
                  salary_target_high: {
                    type: "number",
                    description: "Target role salary range high end (USD annual)",
                  },
                  salary_mid_role: {
                    type: "string",
                    description: "A mid-point stepping stone role title between current and target",
                  },
                  salary_mid_low: {
                    type: "number",
                    description: "Mid-point role salary range low (USD annual)",
                  },
                  salary_mid_high: {
                    type: "number",
                    description: "Mid-point role salary range high (USD annual)",
                  },
                  plan_30_days: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 concrete actions for the first 30 days",
                  },
                  plan_60_days: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 concrete actions for days 31-60",
                  },
                  plan_90_days: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 concrete actions for days 61-90",
                  },
                  recommended_certs: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 certifications with highest career impact for this transition",
                  },
                  networking_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 specific networking strategies for this career move",
                  },
                  career_path_label: {
                    type: "string",
                    description: "Short label for this career path (e.g., 'People Analytics', 'Digital Transformation')",
                  },
                  career_path_summary: {
                    type: "string",
                    description: "One-sentence summary of this career path",
                  },
                },
                required: [
                  "skills_match_pct", "missing_skills", "matching_skills", "suggested_next",
                  "estimated_months", "move_type", "difficulty",
                  "salary_current_low", "salary_current_high",
                  "salary_target_low", "salary_target_high",
                  "salary_mid_role", "salary_mid_low", "salary_mid_high",
                  "plan_30_days", "plan_60_days", "plan_90_days",
                  "recommended_certs", "networking_tips",
                  "career_path_label", "career_path_summary"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_career_analysis" } },
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

    // Insert into employee_growth_tracker with enriched gap_analysis
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
          salary: {
            current: { low: analysis.salary_current_low, high: analysis.salary_current_high },
            mid: { role: analysis.salary_mid_role, low: analysis.salary_mid_low, high: analysis.salary_mid_high },
            target: { low: analysis.salary_target_low, high: analysis.salary_target_high },
          },
          plan_30_60_90: {
            days_30: analysis.plan_30_days,
            days_60: analysis.plan_60_days,
            days_90: analysis.plan_90_days,
          },
          recommended_certs: analysis.recommended_certs,
          networking_tips: analysis.networking_tips,
          career_path_label: analysis.career_path_label,
          career_path_summary: analysis.career_path_summary,
        },
        status: "exploring",
      } as any)
      .select()
      .single();

    if (insertError) throw insertError;

    // Auto-generate SMART goals too
    try {
      const goalsResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-smart-goals`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ track_id: track.id, target_role: target_role.trim() }),
      });
      if (!goalsResponse.ok) {
        console.error("Auto SMART goals generation failed:", await goalsResponse.text());
      }
    } catch (e) {
      console.error("SMART goals auto-gen error:", e);
    }

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
