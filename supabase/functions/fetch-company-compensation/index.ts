import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FRESHNESS_DAYS = 30;

/* ── Provider result type ── */
interface CompData {
  median_total_compensation_usd: number;
  salary_by_grade: { grade_code: string; title: string; median_total_comp_usd: number }[];
  top_roles: { role: string; median_total_comp_usd: number }[];
  source_summary: { source_name: string; source_type: string; confidence: number; notes: string }[];
}

/* ── Provider: Levels.fyi (requires LEVELSFYI_API_KEY) ── */
async function tryLevelsFyi(company: string): Promise<CompData | null> {
  const key = Deno.env.get("LEVELSFYI_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch(`https://api.levels.fyi/v2/compensation?company=${encodeURIComponent(company)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d?.median_total_compensation) return null;
    return {
      median_total_compensation_usd: Math.round(d.median_total_compensation),
      salary_by_grade: (d.levels || []).map((l: any) => ({
        grade_code: l.level_code || l.level,
        title: l.title || l.level,
        median_total_comp_usd: Math.round(l.median_total_comp),
      })),
      top_roles: (d.top_roles || []).slice(0, 5).map((r: any) => ({
        role: r.title,
        median_total_comp_usd: Math.round(r.median_total_comp),
      })),
      source_summary: [
        { source_name: "Levels.fyi", source_type: "official_comp_api", confidence: 0.9, notes: "Primary source for total compensation and levels" },
      ],
    };
  } catch (e) {
    console.error("Levels.fyi provider error:", e);
    return null;
  }
}

/* ── Provider: Apify / Glassdoor scraper (requires APIFY_API_KEY) ── */
async function tryApify(company: string): Promise<CompData | null> {
  const key = Deno.env.get("APIFY_API_KEY");
  if (!key) return null;
  try {
    const runRes = await fetch("https://api.apify.com/v2/acts/epctex~glassdoor-salaries-scraper/run-sync-get-dataset-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: key, startUrls: [{ url: `https://www.glassdoor.com/Salary/${encodeURIComponent(company)}-Salaries-E0.htm` }], maxItems: 20 }),
    });
    if (!runRes.ok) return null;
    const items = await runRes.json();
    if (!Array.isArray(items) || items.length === 0) return null;
    const salaries = items.map((i: any) => ({
      role: i.jobTitle || "Unknown",
      median_total_comp_usd: Math.round(i.medianPay || i.basePay || 0),
    })).filter((r: any) => r.median_total_comp_usd > 0);
    if (salaries.length === 0) return null;
    const median = salaries.reduce((s: number, r: any) => s + r.median_total_comp_usd, 0) / salaries.length;
    return {
      median_total_compensation_usd: Math.round(median),
      salary_by_grade: [],
      top_roles: salaries.slice(0, 5),
      source_summary: [
        { source_name: "Glassdoor (via Apify)", source_type: "scraped_market_signal", confidence: 0.6, notes: "Secondary source for directional market comparison" },
      ],
    };
  } catch (e) {
    console.error("Apify provider error:", e);
    return null;
  }
}

/* ── Provider: H1B Public Data (no key needed) ── */
async function tryH1B(company: string): Promise<CompData | null> {
  try {
    const res = await fetch(`https://h1bdata.info/index.php?em=${encodeURIComponent(company)}&job=&city=&year=2024`, {
      headers: { Accept: "text/html" },
    });
    if (!res.ok) return null;
    // H1B data is HTML-based — extract what we can via text patterns
    const html = await res.text();
    const salaryMatches = [...html.matchAll(/\$[\d,]+/g)].map(m => parseInt(m[0].replace(/[$,]/g, "")));
    if (salaryMatches.length < 3) return null;
    const validSalaries = salaryMatches.filter(s => s > 30000 && s < 1000000);
    if (validSalaries.length === 0) return null;
    validSalaries.sort((a, b) => a - b);
    const median = validSalaries[Math.floor(validSalaries.length / 2)];
    return {
      median_total_compensation_usd: median,
      salary_by_grade: [],
      top_roles: [],
      source_summary: [
        { source_name: "H1B Disclosure Data", source_type: "base_salary_only", confidence: 0.7, notes: "Base salary only from DoL H1B filings" },
      ],
    };
  } catch (e) {
    console.error("H1B provider error:", e);
    return null;
  }
}

/* ── Provider: AI Estimation (always available) ── */
async function tryAIEstimation(company: string): Promise<CompData | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const aiPrompt = `You are a compensation data analyst. For the company "${company}", estimate realistic compensation data based on your knowledge of H1B salary disclosures, industry benchmarks, Glassdoor ranges, and public financial filings.

Return ONLY structured data. Rules:
- Include 3-6 grade levels appropriate for this company
- Include 3-5 top-paying roles
- All dollar values must be integers
- Base estimates on H1B disclosure data patterns and industry norms
- Be realistic — don't inflate numbers`;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: aiPrompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "return_compensation_data",
              description: "Return structured compensation data for a company",
              parameters: {
                type: "object",
                properties: {
                  median_total_compensation_usd: { type: "integer" },
                  salary_by_grade: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        grade_code: { type: "string" },
                        title: { type: "string" },
                        median_total_comp_usd: { type: "integer" },
                      },
                      required: ["grade_code", "title", "median_total_comp_usd"],
                    },
                  },
                  top_roles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string" },
                        median_total_comp_usd: { type: "integer" },
                      },
                      required: ["role", "median_total_comp_usd"],
                    },
                  },
                  source_summary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_name: { type: "string" },
                        source_type: { type: "string" },
                        confidence: { type: "number" },
                        notes: { type: "string" },
                      },
                      required: ["source_name", "source_type", "confidence", "notes"],
                    },
                  },
                },
                required: ["median_total_compensation_usd", "salary_by_grade", "top_roles", "source_summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_compensation_data" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
      return null;
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      if (parsed?.median_total_compensation_usd) return parsed;
    }
    // Fallback: parse content
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.median_total_compensation_usd) return parsed;
    }
    return null;
  } catch (e) {
    console.error("AI estimation error:", e);
    return null;
  }
}

/* ── Merge sources ── */
function mergeSources(primary: CompData, ...secondaries: (CompData | null)[]): CompData {
  const merged = { ...primary };
  for (const s of secondaries) {
    if (!s) continue;
    if (merged.salary_by_grade.length === 0 && s.salary_by_grade.length > 0) {
      merged.salary_by_grade = s.salary_by_grade;
    }
    if (merged.top_roles.length === 0 && s.top_roles.length > 0) {
      merged.top_roles = s.top_roles;
    }
    merged.source_summary = [...merged.source_summary, ...s.source_summary];
  }
  return merged;
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company } = await req.json();
    if (!company || typeof company !== "string") {
      return new Response(JSON.stringify({ error: "company is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Cache check
    const { data: cached } = await sb
      .from("compensation_data")
      .select("*")
      .ilike("company", company)
      .single();

    if (cached && cached.freshness_status === "fresh" && cached.last_updated) {
      const age = (Date.now() - new Date(cached.last_updated).getTime()) / (1000 * 60 * 60 * 24);
      if (age < FRESHNESS_DAYS) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Provider fallback chain
    console.log(`[comp] Fetching data for "${company}" — running provider chain`);
    const levelsFyi = await tryLevelsFyi(company);
    const apify = levelsFyi ? null : await tryApify(company);
    const h1b = await tryH1B(company);
    const ai = (!levelsFyi && !apify) ? await tryAIEstimation(company) : null;

    // Pick best primary and merge
    const primary = levelsFyi || apify || ai;
    let compData: CompData | null = null;
    let freshnessStatus = "fresh";

    if (primary) {
      compData = mergeSources(primary, h1b, levelsFyi ? apify : null, levelsFyi ? ai : null);
      // Determine freshness based on provider quality
      if (levelsFyi) freshnessStatus = "fresh";
      else if (apify) freshnessStatus = "fresh";
      else if (ai && h1b) freshnessStatus = "fresh";
      else if (ai) freshnessStatus = "fresh";
    } else if (h1b) {
      compData = h1b;
      freshnessStatus = "partial";
    }

    if (!compData || !compData.median_total_compensation_usd) {
      if (cached) {
        await sb.from("compensation_data").update({ freshness_status: "failed" }).ilike("company", company);
        return new Response(JSON.stringify({ ...cached, freshness_status: "failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Could not estimate compensation data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const row = {
      company: company.trim(),
      currency: "USD",
      median_total_compensation_usd: Math.round(compData.median_total_compensation_usd),
      salary_by_grade: compData.salary_by_grade,
      top_roles: compData.top_roles,
      source_summary: compData.source_summary,
      last_updated: today,
      freshness_status: freshnessStatus,
    };

    // Upsert
    const { data: upserted, error: upsertErr } = await sb
      .from("compensation_data")
      .upsert(row, { onConflict: "company", ignoreDuplicates: false })
      .select()
      .single();

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      if (cached) {
        const { data: updated } = await sb
          .from("compensation_data")
          .update(row)
          .eq("id", cached.id)
          .select()
          .single();
        return new Response(JSON.stringify(updated || { ...cached, ...row }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(upserted || row), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-company-compensation error:", e);
    return new Response(JSON.stringify({ error: "Internal error processing compensation request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
