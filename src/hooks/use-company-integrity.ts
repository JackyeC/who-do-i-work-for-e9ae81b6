import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyIntegrityResult {
  company_name: string;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  reality_gap_score: number;
  insider_score: number;
  summary_for_recruiter: string;
  company_integrity_flag: string | null;
}

/** Derive recruiter intelligence from actual DB data instead of mocks */
async function buildIntegrityFromDB(companyName: string, companyId?: string): Promise<CompanyIntegrityResult | null> {
  // Find the company
  let query = supabase.from("companies").select("id, name, civic_footprint_score, insider_score, jackye_insight, total_pac_spending, lobbying_spend, corporate_pac_exists");
  if (companyId) {
    query = query.eq("slug", companyId);
  } else {
    query = query.ilike("name", companyName);
  }
  const { data: companies } = await query.limit(1);
  const company = companies?.[0];
  if (!company) return null;

  const cid = company.id;

  // Fetch integrity gap data
  const { data: stances } = await supabase
    .from("company_public_stances")
    .select("gap")
    .eq("company_id", cid);

  const gaps = (stances || []).map((s: any) => s.gap?.toLowerCase() || "");
  const largeGaps = gaps.filter((g: string) => g === "large").length;
  const mediumGaps = gaps.filter((g: string) => g === "medium").length;
  const totalStances = gaps.length;

  // Integrity Gap: 0-100 based on proportion of large/medium gaps
  const integrityGapScore = totalStances > 0
    ? Math.min(100, Math.round(((largeGaps * 2 + mediumGaps) / totalStances) * 50))
    : 0;

  // Connected Dots: use stored value or derive from board/exec concentration
  let insiderScore = company.insider_score ?? 0;
  if (!insiderScore) {
    const { count: boardCount } = await supabase
      .from("board_interlocks")
      .select("id", { count: "exact", head: true })
      .eq("company_a_id", cid);
    insiderScore = Math.min(100, (boardCount || 0) * 12);
  }

  // Flagged candidates
  const { data: flaggedCandidates } = await supabase
    .from("company_candidates")
    .select("name, flag_reason")
    .eq("company_id", cid)
    .eq("flagged", true)
    .limit(5);

  const flaggedCount = flaggedCandidates?.length || 0;
  const topReasons = (flaggedCandidates || [])
    .map((c: any) => c.flag_reason)
    .filter(Boolean)
    .slice(0, 3);

  // Risk level from civic footprint (lower = higher risk) + signal density
  const cfs = company.civic_footprint_score ?? 50;
  const riskInput = Math.round((100 - cfs + integrityGapScore + insiderScore) / 3);
  const risk_level: CompanyIntegrityResult["risk_level"] =
    riskInput >= 70 ? "CRITICAL" :
    riskInput >= 50 ? "HIGH" :
    riskInput >= 30 ? "MODERATE" : "LOW";

  // Build summary from real data
  const summaryParts: string[] = [];
  if (company.jackye_insight) {
    summaryParts.push(company.jackye_insight);
  } else {
    summaryParts.push(`${company.name} has a civic footprint score of ${cfs}/100.`);
  }

  if (totalStances > 0) {
    summaryParts.push(`Integrity gap analysis across ${totalStances} public stances found ${largeGaps} large and ${mediumGaps} medium discrepancies between stated values and observed actions.`);
  }

  if (flaggedCount > 0) {
    summaryParts.push(`${flaggedCount} PAC recipient(s) flagged: ${topReasons.join("; ")}.`);
  }

  if (company.lobbying_spend && Number(company.lobbying_spend) > 0) {
    summaryParts.push(`Reported lobbying spend: $${Number(company.lobbying_spend).toLocaleString()}.`);
  }

  // Integrity flag
  let integrityFlag: string | null = null;
  if (insiderScore >= 60) {
    integrityFlag = "Elevated insider concentration detected — review board composition before proceeding.";
  } else if (flaggedCount >= 3) {
    integrityFlag = `${flaggedCount} PAC recipients flagged for policy concerns — review before candidate engagement.`;
  }

  return {
    company_name: company.name,
    risk_level,
    reality_gap_score: integrityGapScore,
    insider_score: insiderScore,
    summary_for_recruiter: summaryParts.join(" "),
    company_integrity_flag: integrityFlag,
  };
}

const API_URL = "https://wdiwf-integrity-api.onrender.com/api/company-integrity-check";

export function useCompanyIntegrity(companyName: string | undefined, companyId?: string) {
  return useQuery<CompanyIntegrityResult | null>({
    queryKey: ["company-integrity", companyName, companyId],
    queryFn: async () => {
      if (!companyName) return null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_name: companyName, company_id: companyId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return (await res.json()) as CompanyIntegrityResult;
        }
      } catch {
        // API not available — fall through to DB-derived data
      }

      // Real DB fallback
      return buildIntegrityFromDB(companyName, companyId);
    },
    enabled: !!companyName,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
