// ============================================================
// WDIWF Edge Function: parse-resume
// Extracts keywords, industries, and skills from resume text
// to auto-populate profile preferences for news personalization.
// Deploy: supabase functions deploy parse-resume
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// If you have an OpenAI key for smarter extraction, set it
// Otherwise, the function falls back to keyword matching
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { user_id, resume_text } = await req.json();

    if (!user_id || !resume_text) {
      return new Response(
        JSON.stringify({ error: "user_id and resume_text required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    let extracted;

    if (OPENAI_API_KEY) {
      extracted = await extractWithAI(resume_text);
    } else {
      extracted = extractWithKeywords(resume_text);
    }

    // Update the user's profile with extracted data
    const { error } = await supabase
      .from("profiles")
      .update({
        resume_keywords: extracted.keywords,
        industries: mergeArrays(extracted.industries, []),
        // Don't overwrite values — those are user-chosen, not resume-derived
      })
      .or(`id.eq.${user_id},user_id.eq.${user_id}`);

    if (error) {
      console.error("Profile update error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted: {
          keywords: extracted.keywords,
          industries: extracted.industries,
          suggested_values: extracted.suggestedValues,
          suggested_interests: extracted.suggestedInterests,
        },
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Resume parse error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// AI-POWERED EXTRACTION (uses OpenAI if key is set)
// ============================================================
async function extractWithAI(resumeText: string) {
  const prompt = `Analyze this resume and extract the following as JSON:
{
  "keywords": ["list of 10-15 key professional skills, technologies, and role-related terms"],
  "industries": ["list of industries this person has worked in, from: Technology, Finance, Healthcare, Defense, HR Tech, Energy, Retail, Media, Education, Government, Manufacturing, Legal, Consulting, Non-Profit, Real Estate"],
  "suggestedValues": ["based on their career focus, suggest 3-5 workplace values they likely care about, from: Diversity & Inclusion, Pay Equity, Environmental Sustainability, Worker Rights, Ethical AI, Transparency, Community Impact, Mental Health Support, Remote Work, Anti-Discrimination, Whistleblower Protection, Fair Lobbying, Data Privacy, Veteran Support, Disability Inclusion"],
  "suggestedInterests": ["based on their career, suggest 3-5 news topics, from: Layoffs & Restructuring, Corporate Lobbying, PAC Spending, Government Contracts, SEC Filings, Labor Relations, Workplace Safety, Executive Compensation, Union Activity, DEI Programs, Remote Work Policies, AI in Hiring, Salary Transparency, Employee Reviews, Company Culture"]
}

Resume:
${resumeText.slice(0, 3000)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch {
    console.error("Failed to parse AI response:", content);
    return extractWithKeywords(resumeText);
  }
}

// ============================================================
// KEYWORD-BASED EXTRACTION (fallback, no API key needed)
// ============================================================
function extractWithKeywords(resumeText: string) {
  const text = resumeText.toLowerCase();

  // Extract industry signals
  const industryKeywords: Record<string, string[]> = {
    "Technology": ["software", "saas", "cloud", "api", "developer", "engineering", "tech", "ai", "machine learning", "data science"],
    "Finance": ["banking", "finance", "investment", "trading", "fintech", "accounting", "audit"],
    "Healthcare": ["healthcare", "medical", "clinical", "pharma", "biotech", "hospital", "patient"],
    "Defense": ["defense", "military", "dod", "cleared", "security clearance", "aerospace"],
    "HR Tech": ["hris", "ats", "recruiting", "talent acquisition", "human resources", "hr tech", "workday", "greenhouse"],
    "Energy": ["energy", "oil", "gas", "renewable", "solar", "wind", "utilities"],
    "Retail": ["retail", "e-commerce", "ecommerce", "store", "merchandising", "supply chain"],
    "Media": ["media", "content", "journalism", "broadcasting", "publishing", "entertainment"],
    "Education": ["education", "university", "school", "teaching", "academic", "curriculum"],
    "Government": ["government", "federal", "state agency", "public sector", "civic", "policy"],
    "Manufacturing": ["manufacturing", "production", "factory", "operations", "logistics"],
    "Legal": ["legal", "attorney", "law firm", "compliance", "regulatory", "litigation"],
    "Consulting": ["consulting", "advisory", "strategy", "deloitte", "mckinsey", "bain", "accenture"],
    "Non-Profit": ["nonprofit", "non-profit", "ngo", "foundation", "charity", "philanthropy"],
    "Real Estate": ["real estate", "property", "housing", "construction", "development"],
  };

  const industries: string[] = [];
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      industries.push(industry);
    }
  }

  // Extract role/skill keywords
  const skillKeywords = [
    "leadership", "management", "strategy", "analytics", "project management",
    "product management", "sales", "marketing", "operations", "engineering",
    "design", "research", "compliance", "recruiting", "talent acquisition",
    "dei", "diversity", "inclusion", "people operations", "hr",
    "data analysis", "business development", "customer success",
    "content strategy", "brand", "communications", "public relations",
    "program management", "change management", "organizational development",
    "learning and development", "compensation", "benefits",
    "employee relations", "workforce planning",
  ];

  const keywords = skillKeywords.filter(k => text.includes(k));

  // Suggest values based on career signals
  const suggestedValues: string[] = [];
  if (text.includes("dei") || text.includes("diversity") || text.includes("inclusion")) {
    suggestedValues.push("Diversity & Inclusion");
  }
  if (text.includes("compensation") || text.includes("pay") || text.includes("equity")) {
    suggestedValues.push("Pay Equity");
  }
  if (text.includes("remote") || text.includes("distributed") || text.includes("hybrid")) {
    suggestedValues.push("Remote Work");
  }
  if (text.includes("compliance") || text.includes("ethics") || text.includes("integrity")) {
    suggestedValues.push("Transparency");
  }
  if (text.includes("sustainability") || text.includes("environment") || text.includes("esg")) {
    suggestedValues.push("Environmental Sustainability");
  }
  if (text.includes("union") || text.includes("labor") || text.includes("worker")) {
    suggestedValues.push("Worker Rights");
  }
  if (text.includes("ai") || text.includes("automation") || text.includes("algorithm")) {
    suggestedValues.push("Ethical AI");
  }
  if (text.includes("community") || text.includes("volunteer") || text.includes("nonprofit")) {
    suggestedValues.push("Community Impact");
  }

  // Suggest interests
  const suggestedInterests: string[] = [];
  if (text.includes("recruiting") || text.includes("hiring") || text.includes("talent")) {
    suggestedInterests.push("AI in Hiring", "Company Culture");
  }
  if (text.includes("compliance") || text.includes("legal") || text.includes("policy")) {
    suggestedInterests.push("SEC Filings", "Government Contracts");
  }
  if (text.includes("dei") || text.includes("diversity")) {
    suggestedInterests.push("DEI Programs");
  }
  if (text.includes("compensation") || text.includes("pay")) {
    suggestedInterests.push("Salary Transparency", "Executive Compensation");
  }
  if (text.includes("remote") || text.includes("flexible")) {
    suggestedInterests.push("Remote Work Policies");
  }

  return {
    keywords: keywords.slice(0, 15),
    industries: industries.slice(0, 5),
    suggestedValues: suggestedValues.slice(0, 5),
    suggestedInterests: [...new Set(suggestedInterests)].slice(0, 5),
  };
}

function mergeArrays(arr1: string[], arr2: string[]): string[] {
  return [...new Set([...arr1, ...arr2])];
}
