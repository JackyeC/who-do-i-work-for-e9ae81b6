import { Badge } from "@/components/ui/badge";
import { EmptyStateExplainer } from "@/components/company/EmptyStateExplainer";
import { OffTheRecordSignals } from "@/components/company/OffTheRecordSignals";
import { cn } from "@/lib/utils";

interface Signal {
  summary: string;
  confidence: "Low" | "Medium" | "High";
  recency: string;
}

interface SignalCategoryProps {
  title: string;
  signals: Signal[];
  emptyType?: "jobs" | "sentiment" | "compensation" | "benefits" | "off_the_record";
}

const CONFIDENCE_COLOR: Record<string, string> = {
  Low: "border-destructive/30 text-destructive",
  Medium: "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]",
  High: "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]",
};

const RECENCY_DOT: Record<string, string> = {
  "Last 30 days": "bg-[hsl(var(--civic-green))]",
  "Last 30–60 days": "bg-[hsl(var(--civic-yellow))]",
  "Last 6 months": "bg-destructive/60",
  "6+ months ago": "bg-muted-foreground/40",
  "Unknown": "bg-muted-foreground/20",
};

function SignalCategory({ title, signals, emptyType }: SignalCategoryProps) {
  if (signals.length === 0 && emptyType) {
    return (
      <div className="py-4 border-b border-border/30 last:border-b-0">
        <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
        <EmptyStateExplainer type={emptyType} />
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div className="py-4 border-b border-border/30 last:border-b-0">
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      <div className="space-y-2.5">
        {signals.map((s, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <div className="flex-1 text-foreground/85 leading-relaxed">{s.summary}</div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", RECENCY_DOT[s.recency] || RECENCY_DOT["Unknown"])} />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{s.recency}</span>
              </div>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CONFIDENCE_COLOR[s.confidence])}>
                {s.confidence}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StructuredSignalsProps {
  // Hiring Reality
  hasJobPostings: boolean;
  hasAiHrSignals: boolean;
  hasGhostJobs: boolean;
  // Workforce Stability
  hasWarnNotices: boolean;
  hasLayoffSignals: boolean;
  // Compensation
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasCompensationData: boolean;
  // Leadership
  executiveCount: number;
  totalPacSpending: number;
  lobbyingSpend: number;
  revolvingDoorCount: number;
  darkMoneyCount: number;
  // Off the Record
  companyId: string;
  companyName: string;
  // Recency
  lastReviewed?: string;
  updatedAt?: string;
}

function getRecency(lastReviewed?: string, updatedAt?: string): string {
  const ref = lastReviewed || updatedAt;
  if (!ref) return "Unknown";
  const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 30–60 days";
  if (days <= 180) return "Last 6 months";
  return "6+ months ago";
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return "$0";
}

export function StructuredSignalsSection(props: StructuredSignalsProps) {
  const recency = getRecency(props.lastReviewed, props.updatedAt);

  // Build hiring signals
  const hiringSignals: Signal[] = [];
  if (props.hasAiHrSignals)
    hiringSignals.push({ summary: "AI-powered hiring tools detected in application pipeline. Bias audit status is pending.", confidence: "Medium", recency });
  if (props.hasGhostJobs)
    hiringSignals.push({ summary: "Potential ghost job postings identified — roles listed but not actively being filled.", confidence: "Low", recency });
  if (props.hasJobPostings && !props.hasAiHrSignals && !props.hasGhostJobs)
    hiringSignals.push({ summary: "Active job postings detected. No unusual hiring patterns flagged.", confidence: "Medium", recency });

  // Workforce stability signals
  const stabilitySignals: Signal[] = [];
  if (props.hasWarnNotices)
    stabilitySignals.push({ summary: "WARN Act notices filed within the past 12 months — potential layoffs or plant closings.", confidence: "High", recency });
  if (props.hasLayoffSignals)
    stabilitySignals.push({ summary: "Workforce reduction signals detected from news or regulatory filings.", confidence: "Medium", recency });
  if (!props.hasWarnNotices && !props.hasLayoffSignals)
    stabilitySignals.push({ summary: "No recent WARN notices or layoff signals detected in public records.", confidence: "Medium", recency });

  // Compensation signals
  const compSignals: Signal[] = [];
  if (props.hasPayEquity)
    compSignals.push({ summary: "Pay equity data available — signals suggest some level of compensation reporting.", confidence: "Medium", recency });
  if (props.hasBenefitsData)
    compSignals.push({ summary: "Benefits information has been indexed from public or disclosed sources.", confidence: "Medium", recency });
  if (!props.hasPayEquity && !props.hasBenefitsData && !props.hasCompensationData)
    compSignals.push({ summary: "No compensation or benefits data has been publicly disclosed or indexed.", confidence: "Low", recency });

  // Leadership signals
  const leadershipSignals: Signal[] = [];
  if (props.executiveCount > 0)
    leadershipSignals.push({ summary: `${props.executiveCount} executive(s) identified with public donation records.`, confidence: "Medium", recency });
  if (props.totalPacSpending > 0 || props.lobbyingSpend > 0) {
    const parts: string[] = [];
    if (props.totalPacSpending > 0) parts.push(`${formatMoney(props.totalPacSpending)} PAC spending`);
    if (props.lobbyingSpend > 0) parts.push(`${formatMoney(props.lobbyingSpend)} lobbying`);
    leadershipSignals.push({ summary: `Political influence footprint: ${parts.join(", ")}.`, confidence: "High", recency });
  }
  if (props.revolvingDoorCount > 0)
    leadershipSignals.push({ summary: `${props.revolvingDoorCount} revolving door connection(s) between government and corporate roles.`, confidence: "Medium", recency });

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40">
        <p className="text-sm font-bold text-foreground tracking-tight">What We're Seeing</p>
        <p className="text-xs text-muted-foreground mt-0.5">Structured signals from public records and open data. Not all signals are complete or current.</p>
      </div>

      <div className="px-5">
        <SignalCategory title="Hiring Reality" signals={hiringSignals} emptyType="jobs" />
        <SignalCategory title="Workforce Stability" signals={stabilitySignals} />
        <SignalCategory title="Compensation & Market Position" signals={compSignals} emptyType="compensation" />

        {/* Off-the-Record inline */}
        <div className="py-4 border-b border-border/30">
          <OffTheRecordSignals companyId={props.companyId} companyName={props.companyName} />
        </div>

        <SignalCategory title="Leadership & Influence" signals={leadershipSignals} />
      </div>
    </div>
  );
}
