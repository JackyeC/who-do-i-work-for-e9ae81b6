/**
 * useCompanyCoverage — Hook to fetch coverage summary for a company.
 * Powers nuanced empty states and transparency index.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CoverageEntry {
  source_family: string;
  signal_count: number;
  last_signal_date: string | null;
  last_checked_at: string | null;
  coverage_status: "rich" | "limited" | "no_trail" | "never_checked";
  summary_text: string | null;
}

export interface CompanyCoverage {
  entries: CoverageEntry[];
  transparencyIndex: number; // 0-100
  totalSignals: number;
  coveredSources: number;
  totalSources: number;
}

const ALL_SOURCE_FAMILIES = ["sec", "fec", "osha", "warn", "news", "careers", "nlrb", "bls"];

export function useCompanyCoverage(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-coverage", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<CompanyCoverage> => {
      const { data, error } = await supabase
        .from("company_coverage_summary")
        .select("*")
        .eq("company_id", companyId!);

      if (error) throw error;

      const entries: CoverageEntry[] = ALL_SOURCE_FAMILIES.map((sf) => {
        const found = data?.find((d: any) => d.source_family === sf);
        if (found) {
          return {
            source_family: found.source_family,
            signal_count: found.signal_count,
            last_signal_date: found.last_signal_date,
            last_checked_at: found.last_checked_at,
            coverage_status: found.coverage_status as CoverageEntry["coverage_status"],
            summary_text: found.summary_text,
          };
        }
        return {
          source_family: sf,
          signal_count: 0,
          last_signal_date: null,
          last_checked_at: null,
          coverage_status: "never_checked" as const,
          summary_text: null,
        };
      });

      const coveredSources = entries.filter(
        (e) => e.coverage_status === "rich" || e.coverage_status === "limited"
      ).length;
      const totalSignals = entries.reduce((sum, e) => sum + e.signal_count, 0);
      const transparencyIndex = Math.round((coveredSources / ALL_SOURCE_FAMILIES.length) * 100);

      return {
        entries,
        transparencyIndex,
        totalSignals,
        coveredSources,
        totalSources: ALL_SOURCE_FAMILIES.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Get a human-readable label for a source family */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    sec: "SEC Filings",
    fec: "Political Contributions",
    osha: "Workplace Safety",
    warn: "Layoff Notices",
    news: "News Coverage",
    careers: "Careers Page",
    nlrb: "Labor Relations",
    bls: "Wage Benchmarks",
  };
  return labels[source] || source;
}

/** Get a human-readable empty state message */
export function getCoverageMessage(entry: CoverageEntry): string {
  if (entry.summary_text) return entry.summary_text;

  switch (entry.coverage_status) {
    case "rich":
      return `${entry.signal_count} records found across multiple sources`;
    case "limited":
      return `${entry.signal_count} record${entry.signal_count > 1 ? "s" : ""} — limited public trail`;
    case "no_trail":
      return getNoTrailMessage(entry.source_family);
    case "never_checked":
      return "Not yet scanned — request a scan to check";
    default:
      return "Status unknown";
  }
}

function getNoTrailMessage(source: string): string {
  const messages: Record<string, string> = {
    sec: "No SEC filings on record — likely a private company",
    fec: "No FEC contributions detected — clean record or insufficient matching data",
    osha: "No OSHA inspections reported in 5+ years — limited public oversight record",
    warn: "No WARN Act layoff notices — a positive signal, though WARN only covers layoffs of 50+",
    news: "No recent regulatory or labor news coverage detected",
    careers: "Careers page not indexed — corporate footprint unavailable",
    nlrb: "No NLRB filings — no union activity or unfair labor practice complaints on record",
    bls: "No BLS benchmarks matched to this occupation/industry",
  };
  return messages[source] || "No public records found for this source";
}
