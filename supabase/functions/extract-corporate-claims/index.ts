import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { company_id, company_name } = await req.json();
    if (!company_id || !company_name) throw new Error("company_id and company_name required");

    const categories = [
      "Climate", "Labor Rights", "Civil Rights", "Immigration",
      "Healthcare", "Consumer Protection", "AI Ethics",
      "Data Privacy", "Gun Policy", "Political Neutrality",
    ];

    const prompt = `Research the company "${company_name}" and find their public claims, commitments, and stated values from official sources such as:
- Sustainability/ESG reports
- Annual reports and investor presentations
- Press releases and CEO statements
- Corporate values/mission pages

For each claim found, categorize it into one of these categories: ${categories.join(", ")}.

Return a JSON array of objects with these fields:
- claim_text: the verbatim or closely paraphrased claim
- claim_source: the type of document (e.g., "ESG Report 2024", "Corporate Values Page", "CEO Statement")
- claim_source_url: URL if available, or null
- category: one of the categories listed above

Only include claims where the company makes a specific commitment or value statement. Do not include generic marketing language.
Return ONLY the JSON array, no other text.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a corporate research analyst. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Perplexity API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle markdown code blocks)
    let claims: any[];
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      claims = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse claims:", content);
      claims = [];
    }

    // Insert claims (unapproved — subject to Jackye-in-the-Loop)
    const rows = claims.map((c: any) => ({
      company_id,
      claim_text: c.claim_text || "",
      claim_source: c.claim_source || "unknown",
      claim_source_url: c.claim_source_url || null,
      category: categories.includes(c.category) ? c.category : "general",
      extraction_method: "ai_perplexity",
      is_approved: false,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("company_corporate_claims").insert(rows);
      if (error) throw new Error(`Insert error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, claims_extracted: rows.length, citations: data.citations || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-corporate-claims error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
