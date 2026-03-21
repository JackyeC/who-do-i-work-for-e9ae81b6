import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Defense", "HR Tech",
  "Energy", "Retail", "Media", "Education", "Government",
  "Manufacturing", "Legal", "Consulting", "Non-Profit", "Real Estate",
];

const VALUES = [
  "Diversity & Inclusion", "Pay Equity", "Environmental Sustainability",
  "Worker Rights", "Ethical AI", "Transparency", "Community Impact",
  "Mental Health Support", "Remote Work", "Anti-Discrimination",
  "Whistleblower Protection", "Fair Lobbying", "Data Privacy",
  "Veteran Support", "Disability Inclusion",
];

const INTERESTS = [
  "Layoffs & Restructuring", "Corporate Lobbying", "PAC Spending",
  "Government Contracts", "SEC Filings", "Labor Relations",
  "Workplace Safety", "Executive Compensation", "Union Activity",
  "DEI Programs", "Remote Work Policies", "AI in Hiring",
  "Salary Transparency", "Employee Reviews", "Company Culture",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, resume_text } = await req.json();

    if (!resume_text || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id and resume_text required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = resume_text.toLowerCase();

    // Extract keywords (simple but effective)
    const keywords: string[] = [];
    const skillPatterns = [
      "python", "javascript", "typescript", "react", "node", "sql", "aws", "azure",
      "machine learning", "data science", "product management", "project management",
      "leadership", "strategy", "marketing", "sales", "finance", "accounting",
      "human resources", "recruiting", "compliance", "legal", "healthcare",
      "supply chain", "operations", "engineering", "design", "ux", "ui",
      "analytics", "consulting", "agile", "scrum", "devops", "cloud",
    ];

    for (const skill of skillPatterns) {
      if (text.includes(skill)) keywords.push(skill);
    }

    // Match industries
    const suggestedIndustries = INDUSTRIES.filter(ind =>
      text.includes(ind.toLowerCase())
    );

    // Match values (heuristic)
    const suggestedValues: string[] = [];
    if (text.includes("diversity") || text.includes("inclusion") || text.includes("dei")) suggestedValues.push("Diversity & Inclusion");
    if (text.includes("pay") || text.includes("compensation") || text.includes("equity")) suggestedValues.push("Pay Equity");
    if (text.includes("environment") || text.includes("sustainability") || text.includes("climate")) suggestedValues.push("Environmental Sustainability");
    if (text.includes("union") || text.includes("labor") || text.includes("worker")) suggestedValues.push("Worker Rights");
    if (text.includes("ai") || text.includes("artificial intelligence") || text.includes("machine learning")) suggestedValues.push("Ethical AI");
    if (text.includes("remote") || text.includes("hybrid") || text.includes("flexible")) suggestedValues.push("Remote Work");
    if (text.includes("privacy") || text.includes("gdpr") || text.includes("data protection")) suggestedValues.push("Data Privacy");
    if (text.includes("mental health") || text.includes("wellness") || text.includes("wellbeing")) suggestedValues.push("Mental Health Support");
    if (text.includes("veteran") || text.includes("military")) suggestedValues.push("Veteran Support");
    if (text.includes("disability") || text.includes("accessible") || text.includes("ada")) suggestedValues.push("Disability Inclusion");

    // Match interests
    const suggestedInterests: string[] = [];
    if (text.includes("layoff") || text.includes("restructur")) suggestedInterests.push("Layoffs & Restructuring");
    if (text.includes("lobby")) suggestedInterests.push("Corporate Lobbying");
    if (text.includes("government") || text.includes("federal")) suggestedInterests.push("Government Contracts");
    if (text.includes("sec") || text.includes("filing")) suggestedInterests.push("SEC Filings");
    if (text.includes("safety") || text.includes("osha")) suggestedInterests.push("Workplace Safety");
    if (text.includes("executive") || text.includes("c-suite")) suggestedInterests.push("Executive Compensation");
    if (text.includes("dei") || text.includes("diversity program")) suggestedInterests.push("DEI Programs");
    if (text.includes("remote") || text.includes("wfh")) suggestedInterests.push("Remote Work Policies");
    if (text.includes("ai") || text.includes("hiring tech")) suggestedInterests.push("AI in Hiring");
    if (text.includes("salary") || text.includes("transparent")) suggestedInterests.push("Salary Transparency");
    if (text.includes("culture") || text.includes("glassdoor")) suggestedInterests.push("Company Culture");

    // Save keywords to profile
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase
      .from("profiles")
      .update({ resume_keywords: keywords })
      .eq("id", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        extracted: {
          keywords,
          industries: suggestedIndustries,
          suggestedValues,
          suggestedInterests,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Resume parse error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
