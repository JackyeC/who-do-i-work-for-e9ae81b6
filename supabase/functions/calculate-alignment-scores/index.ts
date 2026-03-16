import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignalCount {
  category: string;
  conflicting: number;
  total: number;
}

function scoreToLevel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Mixed";
  return "Low";
}

// Map signal tables to alignment categories
const CATEGORY_SIGNAL_MAP: Record<string, string[]> = {
  Climate: ["climate_signals"],
  "Labor Rights": ["company_court_cases", "company_osha_violations"],
  "Civil Rights": ["civil_rights_signals", "company_diversity_disclosures"],
  "Consumer Protection": ["company_court_cases"],
  "AI Ethics": ["ai_hiring_signals", "ai_hr_signals"],
  "Data Privacy": ["company_court_cases"],
  "Political Neutrality": ["company_candidates", "company_dark_money", "entity_linkages"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { company_id } = await req.json();
    if (!company_id) throw new Error("company_id required");

    // 1. Get approved claims grouped by category
    const { data: claims } = await supabase
      .from("company_corporate_claims")
      .select("category, claim_text")
      .eq("company_id", company_id)
      .eq("is_approved", true);

    const claimsByCategory: Record<string, string[]> = {};
    (claims || []).forEach((c: any) => {
      if (!claimsByCategory[c.category]) claimsByCategory[c.category] = [];
      claimsByCategory[c.category].push(c.claim_text);
    });

    // 2. Count behavior signals per category
    const signalCounts: SignalCount[] = [];

    for (const [category, tables] of Object.entries(CATEGORY_SIGNAL_MAP)) {
      let totalSignals = 0;
      for (const table of tables) {
        const { count } = await supabase
          .from(table as any)
          .select("id", { count: "exact", head: true })
          .eq("company_id", company_id);
        totalSignals += count || 0;
      }

      const claimCount = claimsByCategory[category]?.length || 0;

      signalCounts.push({
        category,
        conflicting: totalSignals,
        total: claimCount + totalSignals,
      });
    }

    // 3. Calculate per-category scores
    // Score = 100 - (conflicting_signals / max(1, total)) * 100
    // High claims + low signals = high alignment; low claims + high signals = low alignment
    const categoryRows = signalCounts.map((sc) => {
      const claimCount = claimsByCategory[sc.category]?.length || 0;

      // If no claims and no signals, neutral score
      if (claimCount === 0 && sc.conflicting === 0) {
        return {
          company_id,
          category: sc.category,
          alignment_score: 50,
          alignment_level: "Mixed",
          claim_count: 0,
          signal_count: 0,
          last_calculated: new Date().toISOString(),
        };
      }

      // More signals relative to claims = lower alignment
      const ratio = claimCount > 0
        ? Math.min(sc.conflicting / claimCount, 2) / 2
        : sc.conflicting > 0 ? 0.7 : 0.5;

      const score = Math.round(100 * (1 - ratio));

      return {
        company_id,
        category: sc.category,
        alignment_score: score,
        alignment_level: scoreToLevel(score),
        claim_count: claimCount,
        signal_count: sc.conflicting,
        last_calculated: new Date().toISOString(),
      };
    });

    // 4. Upsert category scores
    for (const row of categoryRows) {
      await supabase
        .from("company_alignment_categories")
        .upsert(row, { onConflict: "company_id,category" });
    }

    // 5. Calculate overall score and update hypocrisy index
    const scoredCategories = categoryRows.filter((r) => r.claim_count > 0 || r.signal_count > 0);
    const overallScore = scoredCategories.length > 0
      ? Math.round(scoredCategories.reduce((sum, r) => sum + r.alignment_score, 0) / scoredCategories.length)
      : 50;

    const directConflicts = categoryRows.filter((r) => r.alignment_level === "Low").length;
    const indirectConflicts = categoryRows.filter((r) => r.alignment_level === "Mixed").length;
    const aligned = categoryRows.filter((r) => r.alignment_level === "Strong" || r.alignment_level === "Moderate").length;

    const chiScore = Math.round(100 - overallScore); // Invert: high alignment = low hypocrisy
    const chiGrade = chiScore <= 20 ? "A" : chiScore <= 40 ? "B" : chiScore <= 60 ? "C" : chiScore <= 80 ? "D" : "F";

    await supabase
      .from("company_hypocrisy_index")
      .upsert({
        company_id,
        chi_score: chiScore,
        chi_grade: chiGrade,
        direct_conflicts: directConflicts,
        indirect_conflicts: indirectConflicts,
        aligned_stances: aligned,
        total_stances: categoryRows.length,
        last_calculated: new Date().toISOString(),
      }, { onConflict: "company_id" });

    return new Response(
      JSON.stringify({
        success: true,
        overall_alignment_score: overallScore,
        categories: categoryRows.length,
        chi_score: chiScore,
        chi_grade: chiGrade,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("calculate-alignment-scores error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
