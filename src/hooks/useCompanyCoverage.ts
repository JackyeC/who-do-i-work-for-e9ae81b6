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

export interface CoverageIntelligence {
  whatWeFound: string;
  whatWeMissed: string;
  whatItMeans: string;
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

/** Legacy single-line message — still used by tooltips */
export function getCoverageMessage(entry: CoverageEntry): string {
  const intel = getCoverageIntelligence(entry);
  return intel.whatWeFound;
}

/**
 * Get structured intelligence for a coverage entry.
 * Every card answers: What did we find? What's missing? What can you trust?
 */
export function getCoverageIntelligence(entry: CoverageEntry): CoverageIntelligence {
  if (entry.coverage_status === "never_checked") {
    return getNeverCheckedIntelligence(entry.source_family);
  }

  const source = entry.source_family;
  const count = entry.signal_count;

  if (entry.coverage_status === "rich") {
    return getRichIntelligence(source, count);
  }
  if (entry.coverage_status === "limited") {
    return getLimitedIntelligence(source, count);
  }
  // no_trail
  return getNoTrailIntelligence(source);
}

function getRichIntelligence(source: string, count: number): CoverageIntelligence {
  const map: Record<string, CoverageIntelligence> = {
    sec: {
      whatWeFound: `We found ${count} SEC filings — enough to establish financial disclosure patterns and insider activity.`,
      whatWeMissed: "Private subsidiary filings or foreign registrations may not appear in U.S. EDGAR records.",
      whatItMeans: "You can trust the financial transparency picture here. This company has a verifiable public record.",
    },
    fec: {
      whatWeFound: `We found ${count} political contribution records from FEC filings — a strong pattern of political spending is visible.`,
      whatWeMissed: "Dark money channels and 501(c)(4) contributions are not disclosed in FEC records.",
      whatItMeans: "You can see where this company's money flows politically. This is a reliable signal of their priorities.",
    },
    osha: {
      whatWeFound: `We found ${count} OSHA inspection or violation records — workplace safety patterns are well-documented.`,
      whatWeMissed: "State-plan OSHA programs may have additional records not reflected here.",
      whatItMeans: "The safety record is visible and verifiable. Pay attention to severity and recency of violations.",
    },
    warn: {
      whatWeFound: `We found ${count} WARN Act layoff notices — a clear history of workforce reductions is documented.`,
      whatWeMissed: "WARN only covers layoffs of 50+ employees. Smaller cuts won't appear here.",
      whatItMeans: "This is a significant signal. Multiple WARN filings suggest a pattern worth investigating before you commit.",
    },
    news: {
      whatWeFound: `We found ${count} relevant news articles — strong media coverage of this employer's activities.`,
      whatWeMissed: "Local or trade-specific outlets may not be fully indexed. Paywalled content may be missed.",
      whatItMeans: "There's enough coverage to cross-reference other signals. Media attention can confirm or challenge the company's narrative.",
    },
    careers: {
      whatWeFound: `We indexed ${count} signals from their careers page — hiring patterns, benefits language, and DEI posture are visible.`,
      whatWeMissed: "Internal-only postings and recruiter-gated roles won't appear in public scrapes.",
      whatItMeans: "You can see how they present themselves to candidates. Compare this against what other signals show.",
    },
    nlrb: {
      whatWeFound: `We found ${count} NLRB records — union activity or labor practice complaints are documented.`,
      whatWeMissed: "Informal disputes resolved before formal filing won't appear in NLRB records.",
      whatItMeans: "Labor relations activity is verifiable here. This matters if you value workplace voice and collective protections.",
    },
    bls: {
      whatWeFound: `We matched ${count} BLS wage and compensation benchmarks for this industry and occupation.`,
      whatWeMissed: "Company-specific pay data is not published by BLS — these are industry-level benchmarks.",
      whatItMeans: "Use these benchmarks to gut-check any offer. If their number falls below the median, ask why.",
    },
  };
  return map[source] || {
    whatWeFound: `We found ${count} records from this source.`,
    whatWeMissed: "Some records may not be publicly available.",
    whatItMeans: "There's enough data here to form a reliable picture.",
  };
}

function getLimitedIntelligence(source: string, count: number): CoverageIntelligence {
  const map: Record<string, CoverageIntelligence> = {
    sec: {
      whatWeFound: `We found ${count} SEC filing${count > 1 ? "s" : ""}, but not enough to establish a full financial pattern.`,
      whatWeMissed: "Older filings, amendments, or subsidiary records may not have been captured yet.",
      whatItMeans: "There's a partial picture. Enough to note, not enough to draw firm conclusions about financial transparency.",
    },
    fec: {
      whatWeFound: `We found ${count} political contribution${count > 1 ? "s" : ""}, but not enough recent data to establish a pattern.`,
      whatWeMissed: "Contributions under $200, dark money channels, and state-level PAC activity may not be captured.",
      whatItMeans: "Some political activity is visible, but the full picture may be incomplete. Treat this as a starting point.",
    },
    osha: {
      whatWeFound: `We found ${count} OSHA record${count > 1 ? "s" : ""} — some safety oversight is documented, but coverage is thin.`,
      whatWeMissed: "State-run OSHA programs and recent inspections still in processing may not appear.",
      whatItMeans: "There's a safety signal here, but it's not comprehensive. Ask about safety culture in interviews.",
    },
    warn: {
      whatWeFound: `We found ${count} WARN filing${count > 1 ? "s" : ""} — some layoff activity is on record.`,
      whatWeMissed: "Layoffs below 50 employees and voluntary separation programs are not WARN-reportable.",
      whatItMeans: "There's evidence of workforce changes. Worth asking about stability and recent restructuring.",
    },
    news: {
      whatWeFound: `We found ${count} news mention${count > 1 ? "s" : ""}, but coverage is sparse.`,
      whatWeMissed: "Major stories behind paywalls, regional outlets, and trade publications may have been missed.",
      whatItMeans: "Limited media attention — which could mean this company operates under the radar, for better or worse.",
    },
    careers: {
      whatWeFound: `We captured ${count} signal${count > 1 ? "s" : ""} from their careers page, but the data is limited.`,
      whatWeMissed: "Full benefits details, internal postings, and recruiter-gated roles are not visible.",
      whatItMeans: "You're seeing part of how they market to candidates. Look for specifics over buzzwords.",
    },
    nlrb: {
      whatWeFound: `We found ${count} NLRB record${count > 1 ? "s" : ""} — some labor relations activity is documented.`,
      whatWeMissed: "Complaints withdrawn before formal investigation won't appear in the database.",
      whatItMeans: "There's a labor signal here worth noting, especially if worker voice matters to you.",
    },
    bls: {
      whatWeFound: `We matched ${count} BLS benchmark${count > 1 ? "s" : ""}, but the match isn't precise for this role.`,
      whatWeMissed: "Exact occupation-level data may not be available for niche or emerging roles.",
      whatItMeans: "Use this as a rough range, not a guarantee. Cross-reference with job postings and Glassdoor.",
    },
  };
  return map[source] || {
    whatWeFound: `We found ${count} record${count > 1 ? "s" : ""} — limited public trail.`,
    whatWeMissed: "Additional records may exist but aren't publicly accessible.",
    whatItMeans: "There's something here, but not enough to be definitive. Treat this as a lead, not a verdict.",
  };
}

function getNoTrailIntelligence(source: string): CoverageIntelligence {
  const map: Record<string, CoverageIntelligence> = {
    sec: {
      whatWeFound: "We could not find any SEC filings for this company.",
      whatWeMissed: "This typically means the company is privately held and not required to file with the SEC.",
      whatItMeans: "Financial transparency is limited. You won't find public disclosures about executive pay, insider trading, or institutional ownership.",
    },
    fec: {
      whatWeFound: "We could not verify any political contributions through FEC records.",
      whatWeMissed: "The company may contribute through channels not captured in federal records, including dark money groups or state PACs.",
      whatItMeans: "A clean FEC record is generally positive — but it doesn't guarantee the absence of political influence.",
    },
    osha: {
      whatWeFound: "We found no OSHA inspections or violations on file.",
      whatWeMissed: "Some states run their own OSHA programs. No federal record doesn't mean no inspections occurred.",
      whatItMeans: "No news is cautiously good news. But if the company operates in high-risk industries, ask about safety protocols directly.",
    },
    warn: {
      whatWeFound: "No WARN Act layoff notices were found for this company.",
      whatWeMissed: "WARN only covers layoffs of 50+ employees. Smaller reductions and quiet layoffs won't appear here.",
      whatItMeans: "This is a positive signal for stability — but verify by asking about recent team changes during interviews.",
    },
    news: {
      whatWeFound: "We could not verify any recent news coverage for this company.",
      whatWeMissed: "Paywalled content, hyper-local outlets, and trade publications may contain relevant coverage not indexed here.",
      whatItMeans: "Low media visibility can mean stability — or opacity. If they're avoiding press, ask yourself why.",
    },
    careers: {
      whatWeFound: "We could not index a public careers page for this company.",
      whatWeMissed: "They may use third-party job boards exclusively or keep postings behind a login wall.",
      whatItMeans: "Without a public careers page, it's harder to evaluate how they position themselves to candidates. Rely on other signals.",
    },
    nlrb: {
      whatWeFound: "No NLRB filings were found — no union activity or unfair labor practice complaints on record.",
      whatWeMissed: "Informal disputes and pre-filing resolutions don't appear in NLRB records.",
      whatItMeans: "A clean NLRB record is a neutral signal. It doesn't tell you about workplace culture, just formal complaints.",
    },
    bls: {
      whatWeFound: "We could not match BLS wage benchmarks for this company's industry or role.",
      whatWeMissed: "Niche industries and emerging roles may not have standardized BLS occupation codes.",
      whatItMeans: "Without a benchmark, you'll need to rely on market research and competing offers to evaluate compensation.",
    },
  };
  return map[source] || {
    whatWeFound: "No public records found for this source.",
    whatWeMissed: "Records may exist in databases we haven't indexed.",
    whatItMeans: "We can't confirm or deny anything from this source. Proceed with your own research.",
  };
}

function getNeverCheckedIntelligence(source: string): CoverageIntelligence {
  const label = getSourceLabel(source);
  return {
    whatWeFound: `We haven't scanned ${label} for this company yet.`,
    whatWeMissed: "A full scan may surface records from this source.",
    whatItMeans: "Run a scan to find out what's on file. Until then, this source is a blind spot.",
  };
}
