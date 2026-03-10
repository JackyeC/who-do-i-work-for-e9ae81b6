import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS: Record<string, { name: string; description: string; parameters: any }> = {
  career_discovery: {
    name: "career_discovery",
    description: "Return career path suggestions in three categories: likely, adjacent, and unexpected.",
    parameters: {
      type: "object",
      properties: {
        likely: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              confidence: { type: "number" },
              skills: { type: "array", items: { type: "string" } },
            },
            required: ["from", "to", "confidence", "skills"],
          },
        },
        adjacent: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              industry: { type: "string" },
              match: { type: "number" },
              reason: { type: "string" },
            },
            required: ["role", "industry", "match", "reason"],
          },
        },
        unexpected: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              match: { type: "number" },
              reason: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
            },
            required: ["role", "match", "reason", "skills"],
          },
        },
      },
      required: ["likely", "adjacent", "unexpected"],
      additionalProperties: false,
    },
  },
  company_discovery: {
    name: "company_discovery",
    description: "Return company suggestions that align with the user profile.",
    parameters: {
      type: "object",
      properties: {
        companies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              industry: { type: "string" },
              overview: { type: "string" },
              valuesMatch: { type: "number" },
              hiringSignal: { type: "string" },
              valuesSignals: { type: "array", items: { type: "string" } },
              talentSignals: { type: "array", items: { type: "string" } },
            },
            required: ["name", "industry", "overview", "valuesMatch", "hiringSignal", "valuesSignals", "talentSignals"],
          },
        },
      },
      required: ["companies"],
      additionalProperties: false,
    },
  },
  skill_gap: {
    name: "skill_gap",
    description: "Return skill gap analysis categorized by strength level.",
    parameters: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              level: { type: "number", description: "0-100" },
              category: { type: "string", enum: ["strong", "transferable", "bridge", "develop"] },
            },
            required: ["name", "level", "category"],
          },
        },
      },
      required: ["skills"],
      additionalProperties: false,
    },
  },
  multiple_futures: {
    name: "multiple_futures",
    description: "Return three possible future career paths: expected, pivot, and wildcard.",
    parameters: {
      type: "object",
      properties: {
        futures: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["expected", "pivot", "wildcard"] },
              label: { type: "string" },
              description: { type: "string" },
              roles: { type: "string", description: "Role progression as a single string with arrows" },
              skills: { type: "array", items: { type: "string" } },
              companies: { type: "array", items: { type: "string" } },
              timeline: { type: "string" },
            },
            required: ["type", "label", "description", "roles", "skills", "companies", "timeline"],
          },
        },
      },
      required: ["futures"],
      additionalProperties: false,
    },
  },
  action_plan: {
    name: "action_plan",
    description: "Return a career development action plan broken into milestones.",
    parameters: {
      type: "object",
      properties: {
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              period: { type: "string" },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["course", "skill", "project", "connect", "company"] },
                    text: { type: "string" },
                  },
                  required: ["type", "text"],
                },
              },
            },
            required: ["period", "actions"],
          },
        },
      },
      required: ["milestones"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPTS: Record<string, string> = {
  career_discovery: `You are a career intelligence analyst. Given a user's profile, generate realistic career path suggestions in three categories:
1. Likely: Natural progressions (3 items). Include confidence % (60-95).
2. Adjacent: Same skills, different industries (3 items). Include match % (65-90).
3. Unexpected: Surprising but viable paths they haven't considered (3 items). Include match % (55-80).
Be specific with role titles. Make unexpected paths genuinely creative but realistic.`,
  
  company_discovery: `You are a talent market intelligence analyst. Given a user's profile, suggest 5 REAL companies that would be a strong fit. Consider their skills, values, industry background, and career anchors. Include:
- Real company names that actually exist
- Accurate industry classifications
- Realistic hiring signals
- Values signals based on public knowledge
- Match percentage (70-95)
Make suggestions diverse across company sizes and industries.`,
  
  skill_gap: `You are a skills assessment expert. Given a user's profile and target role, analyze their skills and categorize each as:
- strong (level 75-100): Core competencies they already have
- transferable (level 50-74): Skills that partially apply
- bridge (level 25-49): Skills that need significant development
- develop (level 0-24): New skills they need to acquire
Generate 12-16 skills total across all categories. Be specific and relevant to their career transition.`,
  
  multiple_futures: `You are a career strategist. Generate exactly 3 possible future paths:
1. Expected: Most logical career progression
2. Pivot: Different but realistic direction using transferable skills
3. Wildcard: Unconventional but viable move they haven't considered
Each path should include realistic role progressions, required skills, real companies to watch, and realistic timelines.`,
  
  action_plan: `You are a career coach. Generate a concrete action plan with 4 milestones:
1. Next 30 Days (4-5 actions)
2. Next 90 Days (4-5 actions)
3. Next 6 Months (3-4 actions)
4. Next 12 Months (3-4 actions)
Each action should be specific and actionable. Include courses, skills, projects, networking activities, and companies to research. Use real course names and platforms when possible.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, profile } = await req.json();
    
    if (!type || !TOOLS[type]) {
      return new Response(JSON.stringify({ error: "Invalid discovery type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileSummary = `
Job Title: ${profile.jobTitle || "Not specified"}
Years of Experience: ${profile.yearsExperience || "Not specified"}
Industries: ${(profile.industries || []).join(", ") || "Not specified"}
Responsibilities: ${profile.responsibilities || "Not specified"}
Technical Skills: ${(profile.technicalSkills || []).join(", ") || "Not specified"}
Soft Skills: ${(profile.softSkills || []).join(", ") || "Not specified"}
Work Style: ${(profile.workStyles || []).join(", ") || "Not specified"}
Lifestyle: ${(profile.lifestylePrefs || []).join(", ") || "Not specified"}
Values: ${(profile.values || []).join(", ") || "Not specified"}
Career Anchors: ${(profile.anchors || []).join(", ") || "Not specified"}
Target Role: ${profile.targetRole || "AI should suggest roles"}
    `.trim();

    const tool = TOOLS[type];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[type] },
          { role: "user", content: `Here is my career profile:\n\n${profileSummary}\n\nGenerate ${type.replace("_", " ")} results.` },
        ],
        tools: [{
          type: "function",
          function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        }],
        tool_choice: { type: "function", function: { name: tool.name } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-discovery error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
