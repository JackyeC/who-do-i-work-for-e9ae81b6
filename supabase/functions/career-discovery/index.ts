import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS: Record<string, { name: string; description: string; parameters: any }> = {
  suggest_roles: {
    name: "suggest_roles",
    description: "Suggest 5 future career roles tailored to the user's profile.",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", description: "Specific job title" },
              reason: { type: "string", description: "Why this role fits their background (1-2 sentences)" },
              growth: { type: "string", description: "Growth outlook, e.g. 'High demand', 'Emerging field', 'Steady growth'" },
            },
            required: ["role", "reason", "growth"],
          },
        },
      },
      required: ["suggestions"],
      additionalProperties: false,
    },
  },
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
  intro_email: {
    name: "intro_email",
    description: "Generate a professional introduction/outreach email.",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string", description: "The full email message text" },
      },
      required: ["email"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPTS: Record<string, string> = {
  suggest_roles: `You are a career strategist. Given a user's current role, skills, industries, and values, suggest exactly 5 specific future roles they could pursue. Mix realistic next-steps with stretch goals. Each role should have a clear reason why it fits and a growth outlook. Be specific with titles (e.g. "Director of Product Analytics" not just "Director"). Avoid generic titles.`,
  career_discovery: `You are a career intelligence analyst. Given a user's profile, generate realistic career path suggestions in three categories:
1. Likely: Natural progressions (3 items). Include confidence % (60-95).
2. Adjacent: Same skills, different industries (3 items). Include match % (65-90).
3. Unexpected: Surprising but viable paths they haven't considered (3 items). Include match % (55-80).
Be specific with role titles. Make unexpected paths genuinely creative but realistic.`,
  
  company_discovery: `You are a talent market intelligence analyst. Given a user's profile, suggest 5 REAL companies that would be a strong fit. Consider their skills, values, industry background, and career anchors.

CRITICAL 2026 ECONOMIC CONTEXT — use this to prioritize recommendations:
- BEA GDP leaders: Health Care & Social Assistance (+4.4%), Information & Technology (+3.8%), Professional Services (+3.2%)
- FRED PMI signals: Manufacturing (48.2, contracting), Healthcare (57.8, expanding), Tech (54.1, expanding), Retail (46.5, contracting)
- BLS high-velocity roles: Solar Electric (+180%), Wind Energy (+81%), AI/ML (+34%), Cybersecurity (+33%), Mental Health (+26%)
- IP Investment up 7.4% — R&D and Legal roles growing
- If user is early-career (≤3 years), note that AI has slowed entry-level hiring; prioritize companies investing in AI upskilling

Prioritize companies in expanding GDP sectors when they match the user's values and skills. Flag any company in a contracting sector (PMI < 50) with a note about sector volatility.

Include:
- Real company names that actually exist
- Accurate industry classifications
- Realistic hiring signals informed by 2026 economic data
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
  
  action_plan: `You are a career coach with access to 2026 economic intelligence. Generate a concrete action plan with 4 milestones:
1. Next 30 Days (4-5 actions)
2. Next 90 Days (4-5 actions)
3. Next 6 Months (3-4 actions)
4. Next 12 Months (3-4 actions)

CRITICAL 2026 CONTEXT:
- If the user is in a declining BLS occupation (Computer Programmer -6%, Customer Service -5%, Data Entry -32%), include pivot actions toward adjacent high-growth fields
- If early-career (≤3 years experience), prioritize "Agentic Workflow" skills: prompt engineering, AI tool orchestration, and human-AI collaboration (per Anthropic/BLS March 2026 working paper)
- Reference expanding GDP sectors (Healthcare +4.4%, Info Tech +3.8%) for company research targets
- Include at least one action related to economic positioning (market research, relocation analysis for remote roles, sector diversification)

Each action should be specific and actionable. Include courses, skills, projects, networking activities, and companies to research. Use real course names and platforms when possible.`,

  intro_email: `You are a professional networking coach. Write a warm, authentic introduction email. The tone should be professional but human — not corporate or stiff. The email should:
1. Reference how you know them (connection via LinkedIn)
2. Mention their current role/company naturally
3. Briefly explain what you're working on (the action context)
4. Make a specific, low-pressure ask (quick chat, advice, perspective)
5. Keep it under 120 words
Never be presumptuous. Don't assume they can get you a job. Be genuinely curious about their experience.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth gate: verify the caller is a real logged-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage quota check
    const serviceClient = (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("user_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("function_name", "career-discovery")
      .gte("used_at", since);
    const DAILY_LIMIT = 20;
    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: "Daily usage limit reached. You can run up to " + DAILY_LIMIT + " career discovery analyses per day." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, profile } = await req.json();
    
    if (!type || !TOOLS[type]) {
      return new Response(JSON.stringify({ error: "Invalid discovery type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userPrompt: string;

    if (type === "intro_email") {
      userPrompt = `Write an introduction email to:
Name: ${profile.connectionName || "Contact"}
Title: ${profile.connectionTitle || ""}
Company: ${profile.connectionCompany || "their company"}

Context: I'm working on this career action item: "${profile.actionContext || "exploring new opportunities"}"

We're connected on LinkedIn. Write a warm, professional outreach email.`;
    } else {
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
      userPrompt = `Here is my career profile:\n\n${profileSummary}\n\nGenerate ${type.replace("_", " ")} results.`;
    }

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
          { role: "user", content: userPrompt },
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

    // Log usage
    await serviceClient.from("user_usage").insert({ user_id: user.id, function_name: "career-discovery" });

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
