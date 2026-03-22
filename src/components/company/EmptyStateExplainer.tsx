import { ExternalLink, Search, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IntelligenceSignalData {
  title: string;
  explanation: string;
  whatTheySay?: string;
  whatWeSee?: string;
  intelligence?: string;
  suggestedAction?: string;
  suggestedActionUrl?: string;
  checkedSources?: string[];
  lastChecked?: string;
}

const INTERPRETATIONS: Record<string, IntelligenceSignalData> = {
  eeo1: {
    title: "No EEO-1 Data Available",
    explanation: "This company has not published EEO-1 workforce composition data.",
    intelligence: "Absence of voluntary EEO-1 disclosure is a low-transparency signal. Most Fortune 500 companies publish this data.",
    checkedSources: ["SEC filings", "Corporate DEI reports", "Public EEO-1 disclosures"],
  },
  discussion: {
    title: "Low Public Visibility",
    explanation: "No structured public discussion signals found.",
    intelligence: "This may indicate a quiet corporate culture, high employee NDA enforcement, or simply low online footprint among workers.",
    suggestedAction: "Search Glassdoor",
    suggestedActionUrl: "https://www.glassdoor.com/Reviews/index.htm",
    checkedSources: ["Reddit", "Blind", "Public forums"],
  },
  jobs: {
    title: "No Active Job Postings Indexed",
    explanation: "We haven't indexed active job postings for this company yet.",
    whatTheySay: "\"Join our growing team\" — career branding is active.",
    whatWeSee: "0 active postings found in our database.",
    intelligence: "Roles may be filled internally, on seasonal freeze, or not yet indexed. Check the company's careers page directly.",
    suggestedAction: "Visit careers page",
    checkedSources: ["Careers landing page", "ATS detection"],
  },
  court_records: {
    title: "No Public Court Filings Found",
    explanation: "No public court filings were located.",
    intelligence: "This is a positive signal, though absence does not guarantee no legal exposure. Some filings may be sealed or in state courts not yet indexed.",
    checkedSources: ["CourtListener", "PACER", "State court records"],
  },
  sentiment: {
    title: "Low External Discussion Volume",
    explanation: "No structured employee sentiment data is available for this employer.",
    intelligence: "No recurring discussion themes found on public forums. This company may have low online visibility among workers, or employees may be under NDA.",
    suggestedAction: "Search Glassdoor",
    suggestedActionUrl: "https://www.glassdoor.com/Reviews/index.htm",
    checkedSources: ["Reddit", "Blind", "Glassdoor (public)", "Public forums"],
  },
  compensation: {
    title: "Compensation Data Not Publicly Disclosed",
    explanation: "Compensation data has not been disclosed or indexed for this employer.",
    intelligence: "This is a low-transparency signal. Companies in states with pay transparency laws (CO, NY, CA, WA) are increasingly required to disclose salary ranges.",
    suggestedAction: "Check levels.fyi",
    suggestedActionUrl: "https://www.levels.fyi/",
    checkedSources: ["SEC proxy filings", "State pay transparency filings", "Job postings"],
  },
  benefits: {
    title: "No Benefits Data Indexed",
    explanation: "Worker benefits information has not been disclosed or indexed.",
    intelligence: "This limits insight into total compensation. Benefits data is often only available through offer letters or employee handbooks.",
    checkedSources: ["Public benefits pages", "BLS benchmarks", "Glassdoor"],
  },
  off_the_record: {
    title: "No Forum Signals Detected",
    explanation: "No recurring discussion themes were found on public forums.",
    intelligence: "This company may have low online visibility among workers, or forum discussions are too fragmented to aggregate.",
    suggestedAction: "Search Reddit",
    suggestedActionUrl: "https://www.reddit.com/search/",
    checkedSources: ["Reddit", "Blind", "HackerNews"],
  },
};

interface EmptyStateExplainerProps {
  type: keyof typeof INTERPRETATIONS;
  className?: string;
  companyName?: string;
  careersUrl?: string;
  scanContext?: {
    atsDetected?: string;
    pageClassification?: string;
    lastScanned?: string;
    whatTheySay?: string;
    whatWeSee?: string;
  };
}

export function EmptyStateExplainer({ type, className, companyName, careersUrl, scanContext }: EmptyStateExplainerProps) {
  const info = INTERPRETATIONS[type];
  if (!info) return null;

  const whatTheySay = scanContext?.whatTheySay || info.whatTheySay;
  const whatWeSee = scanContext?.whatWeSee || info.whatWeSee;
  const lastChecked = scanContext?.lastScanned || info.lastChecked;
  const hasComparison = whatTheySay && whatWeSee;

  // For jobs type with careers URL available, show prominent CTA button
  const showCareersButton = type === "jobs" && careersUrl;

  return (
    <div className={cn("rounded-xl border border-border/60 bg-muted/20 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{info.title}</p>
          {info.intelligence && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{info.intelligence}</p>
          )}
        </div>
      </div>

      {/* What They Say vs What We See */}
      {hasComparison && (
        <div className="mx-4 mb-3 rounded-lg border border-border/40 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border/40">
            <div className="p-3 bg-muted/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What They Say</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed italic">{whatTheySay}</p>
            </div>
            <div className="p-3 bg-primary/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <EyeOff className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">What We See</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{whatWeSee}</p>
            </div>
          </div>
        </div>
      )}

      {/* ATS Detection Badge */}
      {scanContext?.atsDetected && (
        <div className="mx-4 mb-3">
          <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
            ATS Detected: {scanContext.atsDetected}
          </Badge>
          {scanContext.pageClassification && (
            <Badge variant="outline" className="text-xs ml-1.5 bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/20 text-[hsl(var(--civic-yellow))]">
              {scanContext.pageClassification}
            </Badge>
          )}
        </div>
      )}

      {/* Prominent careers button when ATS detected and 0 jobs */}
      {showCareersButton && (
        <div className="mx-4 mb-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            asChild
          >
            <a href={careersUrl} target="_blank" rel="noopener noreferrer">
              Browse Open Roles on {companyName || "Company"} Careers
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      )}

      {/* Footer: Checked Sources + Suggested Action */}
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            Checked: {(info.checkedSources || []).join(" · ")}
            {lastChecked && ` · as of ${new Date(lastChecked).toLocaleDateString()}`}
          </span>
        </div>
        {!showCareersButton && info.suggestedAction && info.suggestedActionUrl ? (
          <a
            href={info.suggestedActionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-medium whitespace-nowrap flex items-center gap-1 shrink-0 hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {info.suggestedAction.length > 50 ? info.suggestedAction.slice(0, 47) + "…" : info.suggestedAction}
          </a>
        ) : !showCareersButton && info.suggestedAction ? (
          <span className="text-xs text-primary font-medium whitespace-nowrap flex items-center gap-1 shrink-0">
            <ExternalLink className="w-3 h-3" />
            {info.suggestedAction.length > 50 ? info.suggestedAction.slice(0, 47) + "…" : info.suggestedAction}
          </span>
        ) : null}
      </div>
    </div>
  );
}
