import { Shield, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type SignalCategory =
  | "patents"
  | "workforce"
  | "compensation"
  | "political"
  | "legal"
  | "sentiment"
  | "jobs"
  | "lobbying"
  | "evidence"
  | "mismatch"
  | "layoffs"
  | "off_the_record"
  | "benefits"
  | "media";

interface IntelligenceMessages {
  beforeScan: string;
  noData: string;
  checkedSources: string[];
}

const SIGNAL_MESSAGES: Record<SignalCategory, IntelligenceMessages> = {
  patents: {
    beforeScan: "Patent activity can reveal what a company is actually building. We'll check USPTO filings as part of your scan.",
    noData: "No recent patent activity detected in public USPTO records. This may indicate a service-focused model, internal development, or limited IP disclosure.",
    checkedSources: ["USPTO PatentsView", "Google Patents"],
  },
  workforce: {
    beforeScan: "Workforce composition can reveal who the company is actually built for.",
    noData: "Limited public workforce data available. This often signals low disclosure or private reporting structures.",
    checkedSources: ["SEC filings", "ESG reports", "Diversity disclosures"],
  },
  compensation: {
    beforeScan: "Compensation signals show how value is distributed inside the company.",
    noData: "Compensation data is not publicly disclosed. This can make it harder to benchmark offers or understand internal equity.",
    checkedSources: ["SEC proxy filings", "State pay transparency filings", "Job postings"],
  },
  political: {
    beforeScan: "Companies shape policy through funding, lobbying, and influence networks.",
    noData: "No significant political contribution activity detected in public records. This may indicate limited direct engagement or indirect influence strategies.",
    checkedSources: ["OpenFEC", "OpenSecrets", "Senate LDA filings"],
  },
  legal: {
    beforeScan: "Legal activity can reveal internal pressure points or operational risk.",
    noData: "No major recent legal signals detected in public records. This does not eliminate risk, but suggests lower visible exposure.",
    checkedSources: ["CourtListener", "PACER", "State court records"],
  },
  sentiment: {
    beforeScan: "Employee sentiment shows how the experience matches the employer brand.",
    noData: "Limited public employee sentiment available. This may indicate low visibility, a newer company, or controlled narratives.",
    checkedSources: ["Glassdoor", "Indeed", "Reddit", "Blind"],
  },
  jobs: {
    beforeScan: "Job patterns reveal hiring reality vs hiring marketing.",
    noData: "No active job listings detected across tracked sources. This may indicate a hiring pause, internal hiring, or limited public recruiting.",
    checkedSources: ["Careers page", "ATS endpoint", "LinkedIn"],
  },
  lobbying: {
    beforeScan: "Lobbying expenditures reveal which policies a company is trying to shape.",
    noData: "No detailed lobbying breakdown available in indexed records. This may indicate limited federal-level lobbying or state-level activity not yet captured.",
    checkedSources: ["Senate LDA filings", "OpenSecrets", "State records"],
  },
  evidence: {
    beforeScan: "Evidence records connect corporate actions to documented public filings.",
    noData: "No primary evidence documents have been indexed for this company yet. This is common for privately held or smaller employers.",
    checkedSources: ["SEC EDGAR", "FEC", "USASpending.gov"],
  },
  mismatch: {
    beforeScan: "Say vs. Do analysis compares public claims against observable spending and actions.",
    noData: "No public stance or spending contradictions detected. This may reflect genuine alignment or insufficient disclosure to compare.",
    checkedSources: ["Corporate reports", "FEC records", "Public stances"],
  },
  layoffs: {
    beforeScan: "WARN notices and layoff signals reveal workforce stability risk.",
    noData: "No layoff notices detected in public WARN databases. This is a positive stability signal, though some states have limited reporting requirements.",
    checkedSources: ["State WARN databases", "News sources", "SEC filings"],
  },
  off_the_record: {
    beforeScan: "Forum signals surface early cultural patterns from employee discussions.",
    noData: "No recurring discussion themes found on public forums. This company may have low online visibility among workers, or employees may be under NDA.",
    checkedSources: ["Reddit", "Blind", "HackerNews"],
  },
  benefits: {
    beforeScan: "Benefits data reveals the true total compensation beyond salary.",
    noData: "Worker benefits information has not been publicly disclosed or indexed. Benefits data is often only available through offer letters or employee handbooks.",
    checkedSources: ["Public benefits pages", "BLS benchmarks", "Glassdoor"],
  },
  media: {
    beforeScan: "Media narrative tracking shows how a company is perceived in public discourse.",
    noData: "Limited media coverage indexed for this company. This may indicate low public profile or industry-specific coverage not yet captured.",
    checkedSources: ["News APIs", "Press releases", "Industry publications"],
  },
};

interface IntelligenceEmptyStateProps {
  category: SignalCategory;
  /** "before" = pre-scan, "after" = scanned but no data */
  state: "before" | "after";
  className?: string;
  children?: React.ReactNode;
}

export function IntelligenceEmptyState({ category, state, className, children }: IntelligenceEmptyStateProps) {
  const messages = SIGNAL_MESSAGES[category];
  if (!messages) return null;

  const text = state === "before" ? messages.beforeScan : messages.noData;

  return (
    <div className={cn("rounded-xl border border-border/40 bg-muted/10 overflow-hidden", className)}>
      <div className="flex items-start gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{text}</p>
          {state === "after" && (
            <p className="text-xs text-muted-foreground/70 mt-2 italic">
              Absence of data is still a signal.
            </p>
          )}
        </div>
      </div>

      {children && <div className="px-4 pb-3">{children}</div>}

      <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex items-center gap-1.5">
        <Search className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">
          Checked: {messages.checkedSources.join(" · ")}
        </span>
      </div>
    </div>
  );
}
