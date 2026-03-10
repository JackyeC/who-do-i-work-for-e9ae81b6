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

    const { track_id, target_role } = await req.json();
    if (!track_id || !target_role) throw new Error("track_id and target_role required");

    // Get user profile for context
    const { data: profile } = await supabase
      .from("user_career_profile")
      .select("skills, job_titles, industries")
      .eq("user_id", user.id)
      .single();

    // Get existing track data
    const { data: track } = await supabase
      .from("employee_growth_tracker")
      .select("missing_skills, completed_skills, gap_analysis")
      .eq("id", track_id)
      .single();

    // Get personality profile
    const { data: personality } = await (supabase as any)
      .from("user_personality_profile")
      .select("work_style, strengths, personality_traits, leadership_preference")
      .eq("user_id", user.id)
      .single();

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
            content: `You are a career coach. Generate 3-5 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) to help someone transition from their current role to a target role. Consider their personality, strengths, and skill gaps. Each goal should be actionable and have a clear outcome.`,
          },
          {
            role: "user",
            content: `Current skills: ${(profile?.skills || []).join(", ") || "Not specified"}
Current titles: ${(profile?.job_titles || []).join(", ") || "Not specified"}
Target role: ${target_role}
Missing skills: ${(track?.missing_skills || []).join(", ") || "None identified"}
Matching skills: ${(track?.completed_skills || []).join(", ") || "None"}
Work style: ${(personality?.work_style || []).join(", ") || "Not specified"}
Strengths: ${(personality?.strengths || []).join(", ") || "Not specified"}
Personality: ${(personality?.personality_traits || []).join(", ") || "Not specified"}
Leadership preference: ${personality?.leadership_preference || "Not specified"}

Generate SMART goals to help this person reach ${target_role}.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_smart_goals",
              description: "Return SMART goals for career development",
              parameters: {
                type: "object",
                properties: {
                  goals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short goal title (e.g., 'Complete PMP Certification')" },
                        description: { type: "string", description: "1-2 sentence description of the goal with SMART criteria" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["goals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_smart_goals" } },
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

    const { goals } = JSON.parse(toolCall.function.arguments);

    // Insert goals
    const inserts = (goals || []).map((g: any, i: number) => ({
      user_id: user.id,
      track_id,
      title: g.title,
      description: g.description,
      is_ai_generated: true,
      sort_order: i,
    }));

    if (inserts.length > 0) {
      const { error: insertError } = await (supabase as any)
        .from("career_smart_goals")
        .insert(inserts);
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, count: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-smart-goals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
