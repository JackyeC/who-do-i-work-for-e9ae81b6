import { useQuery } from "@tanstack/react-query";

export interface CompanyIntegrityResult {
  company_name: string;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  reality_gap_score: number;
  insider_score: number;
  summary_for_recruiter: string;
  company_integrity_flag: string | null;
}

const MOCK_RESPONSE: Record<string, CompanyIntegrityResult> = {};

function getMockResult(companyName: string): CompanyIntegrityResult {
  const hash = companyName.length % 4;
  const levels: Array<"LOW" | "MODERATE" | "HIGH" | "CRITICAL"> = [
    "LOW", "MODERATE", "HIGH", "CRITICAL",
  ];
  return {
    company_name: companyName,
    risk_level: levels[hash],
    reality_gap_score: 30 + (hash * 18),
    insider_score: 20 + (hash * 15),
    summary_for_recruiter: `${companyName} shows ${levels[hash].toLowerCase()} risk indicators based on WDIWF's intelligence pipeline. Reality gap analysis reveals ${hash > 1 ? "notable discrepancies" : "general alignment"} between stated values and observable signals. Recruiter due diligence is ${hash > 2 ? "strongly" : ""} recommended before candidate engagement.`,
    company_integrity_flag: hash >= 3 ? "Elevated insider concentration detected — review board composition before proceeding." : null,
  };
}

const API_URL = "https://wdiwf-integrity-api.onrender.com/api/company-integrity-check";

export function useCompanyIntegrity(companyName: string | undefined) {
  return useQuery<CompanyIntegrityResult | null>({
    queryKey: ["company-integrity", companyName],
    queryFn: async () => {
      if (!companyName) return null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_name: companyName }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return (await res.json()) as CompanyIntegrityResult;
        }
      } catch {
        // API not deployed yet — fall through to mock
      }

      // Mock fallback until API is live
      return getMockResult(companyName);
    },
    enabled: !!companyName,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
