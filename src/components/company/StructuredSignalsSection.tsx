import { Badge } from "@/components/ui/badge";
import { EmptyStateExplainer } from "@/components/company/EmptyStateExplainer";
import { OffTheRecordSignals } from "@/components/company/OffTheRecordSignals";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUiStatement } from "@/lib/signalPersonalization";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { safeSignalSummary, mapToCategory, TAXONOMY_MAP } from "@/utils/signalTextSanitizer";

interface Signal {
  summary: string;
  confidence: "Low" | "Medium" | "High";
  recency: string;
  uiStatement?: string;
  direction?: string;
}

interface SignalCategoryProps {
  title: string;
  signals: Signal[];
  emptyType?: "jobs" | "sentiment" | "compensation" | "benefits" | "off_the_record";
  companyName?: string;
  scanContext?: {
    atsDetected?: string;
    pageClassification?: string;
    lastScanned?: string;
    whatTheySay?: string;
    whatWeSee?: string;
  };
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

const DIRECTION_ICON: Record<string, typeof TrendingUp> = {
  increase: TrendingUp,
  decrease: TrendingDown,
  stable: Minus,
};

const DIRECTION_COLOR: Record<string, string> = {
  increase: "text-[hsl(var(--civic-green))]",
  decrease: "text-destructive",
  stable: "text-muted-foreground",
};

function SignalCategory({ title, signals, emptyType, companyName, scanContext }: SignalCategoryProps) {
  if (signals.length === 0 && emptyType) {
    return (
      <div className="py-4 border-b border-border/30 last:border-b-0">
        <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
        <EmptyStateExplainer type={emptyType} companyName={companyName} scanContext={scanContext} />
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div className="py-4 border-b border-border/30 last:border-b-0">
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      <div className="space-y-2.5">
        {signals.map((s, i) => {
          const DirIcon = s.direction ? DIRECTION_ICON[s.direction] : null;
          const dirColor = s.direction ? DIRECTION_COLOR[s.direction] : "";
          return (
            <div key={i} className="space-y-1">
              {/* UI Statement headline */}
              {s.uiStatement && (
                <div className="flex items-center gap-2">
                  {DirIcon && <DirIcon className={cn("w-3.5 h-3.5", dirColor)} />}
                  <span className="text-sm font-medium text-foreground">{safeSignalSummary(s.uiStatement, "Signal observed")}</span>
                </div>
              )}
              {/* Detail summary */}
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-1 text-foreground/85 leading-relaxed">{safeSignalSummary(s.summary)}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", RECENCY_DOT[s.recency] || RECENCY_DOT["Unknown"])} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{s.recency}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-xs px-1.5 py-0", CONFIDENCE_COLOR[s.confidence])}>
                    {s.confidence}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StructuredSignalsProps {
  hasJobPostings: boolean;
  hasAiHrSignals: boolean;
  hasGhostJobs: boolean;
  hasWarnNotices: boolean;
  hasLayoffSignals: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasCompensationData: boolean;
  executiveCount: number;
  totalPacSpending: number;
  lobbyingSpend: number;
  revolvingDoorCount: number;
  darkMoneyCount: number;
  companyId: string;
  companyName: string;
  lastReviewed?: string;
  updatedAt?: string;
  scanContext?: {
    atsDetected?: string;
    pageClassification?: string;
    lastScanned?: string;
    whatTheySay?: string;
    whatWeSee?: string;
  };
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

function mapConfidence(level: string): "Low" | "Medium" | "High" {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
}

function mapRecency(timestamp: string): string {
  const days = Math.floor((Date.now() - new Date(timestamp).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 30–60 days";
  if (days <= 180) return "Last 6 months";
  return "6+ months ago";
}

/** Check if data is stale (>30 days) */
function getStaleWarning(canonicalSignals: any[] | null): { isStale: boolean; daysSince: number } | null {
  if (!canonicalSignals || canonicalSignals.length === 0) return null;
  const oldest = canonicalSignals.reduce((min, s) => {
    const ts = new Date(s.scan_timestamp).getTime();
    return ts < min ? ts : min;
  }, Date.now());
  const daysSince = Math.floor((Date.now() - oldest) / 86_400_000);
  return daysSince > 30 ? { isStale: true, daysSince } : null;
}

/** Hook to fetch pre-computed canonical signals */
function useCanonicalSignals(companyId: string) {
  return useQuery({
    queryKey: ['canonical-signals', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const canonicalCategories = [
        'compensation_transparency', 'hiring_activity', 'workforce_stability',
        'company_behavior', 'innovation_activity', 'public_sentiment',
      ];
      const { data } = await supabase
        .from('company_signal_scans')
        .select('signal_category, signal_type, signal_value, confidence_level, scan_timestamp, summary, direction, value_normalized')
        .eq('company_id', companyId)
        .in('signal_category', canonicalCategories);
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

function buildSignalFromCanonical(canonical: any): Signal {
  return {
    summary: canonical.summary,
    confidence: mapConfidence(canonical.confidence_level),
    recency: mapRecency(canonical.scan_timestamp),
    uiStatement: getUiStatement(canonical.signal_category, canonical.value_normalized || "not_disclosed"),
    direction: canonical.direction || undefined,
  };
}

export function StructuredSignalsSection(props: StructuredSignalsProps) {
  const recency = getRecency(props.lastReviewed, props.updatedAt);
  const { data: canonicalSignals } = useCanonicalSignals(props.companyId);

  const signalMap = new Map(
    (canonicalSignals || []).map(s => [s.signal_category, s])
  );

  const staleWarning = getStaleWarning(canonicalSignals || null);

  // ── Hiring Reality ──
  const hiringSignals: Signal[] = [];
  const hiringCanonical = signalMap.get('hiring_activity');
  if (hiringCanonical?.summary) {
    hiringSignals.push(buildSignalFromCanonical(hiringCanonical));
  } else {
    if (props.hasAiHrSignals)
      hiringSignals.push({ summary: "AI-powered hiring tools detected in application pipeline. Bias audit status is pending.", confidence: "Medium", recency });
    if (props.hasGhostJobs)
      hiringSignals.push({ summary: "Potential ghost job postings identified — roles listed but not actively being filled.", confidence: "Low", recency });
    if (props.hasJobPostings && !props.hasAiHrSignals && !props.hasGhostJobs)
      hiringSignals.push({ summary: "Active job postings detected. No unusual hiring patterns flagged.", confidence: "Medium", recency });
  }

  // ── Workforce Stability ──
  const stabilitySignals: Signal[] = [];
  const stabilityCanonical = signalMap.get('workforce_stability');
  if (stabilityCanonical?.summary) {
    stabilitySignals.push(buildSignalFromCanonical(stabilityCanonical));
  } else {
    if (props.hasWarnNotices)
      stabilitySignals.push({ summary: "WARN Act notices filed within the past 12 months — potential layoffs or plant closings.", confidence: "High", recency });
    if (props.hasLayoffSignals)
      stabilitySignals.push({ summary: "Workforce reduction signals detected from news or regulatory filings.", confidence: "Medium", recency });
    if (!props.hasWarnNotices && !props.hasLayoffSignals)
      stabilitySignals.push({ summary: "No recent WARN notices or layoff signals detected in public records.", confidence: "Medium", recency });
  }

  // ── Compensation & Market Position ──
  const compSignals: Signal[] = [];
  const compCanonical = signalMap.get('compensation_transparency');
  if (compCanonical?.summary) {
    compSignals.push(buildSignalFromCanonical(compCanonical));
  } else {
    if (props.hasPayEquity)
      compSignals.push({ summary: "Pay equity data available — signals suggest some level of compensation reporting.", confidence: "Medium", recency });
    if (props.hasBenefitsData)
      compSignals.push({ summary: "Benefits information has been indexed from public or disclosed sources.", confidence: "Medium", recency });
    if (!props.hasPayEquity && !props.hasBenefitsData && !props.hasCompensationData)
      compSignals.push({ summary: "No compensation or benefits data has been publicly disclosed or indexed.", confidence: "Low", recency });
  }

  // ── Leadership & Influence ──
  const leadershipSignals: Signal[] = [];
  const behaviorCanonical = signalMap.get('company_behavior');
  if (behaviorCanonical?.summary) {
    leadershipSignals.push(buildSignalFromCanonical(behaviorCanonical));
  } else {
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
  }

  // ── Innovation & Growth (NEW — Logic Bible V8.0) ──
  const innovationSignals: Signal[] = [];
  const innovCanonical = signalMap.get('innovation_activity');
  if (innovCanonical?.summary) {
    innovationSignals.push(buildSignalFromCanonical(innovCanonical));
  }

  // ── Employee Experience (NEW — Logic Bible V8.0) ──
  const sentimentSignals: Signal[] = [];
  const sentCanonical = signalMap.get('public_sentiment');
  if (sentCanonical?.summary) {
    sentimentSignals.push(buildSignalFromCanonical(sentCanonical));
  }

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40">
        <p className="text-sm font-bold text-foreground tracking-tight">What We're Seeing</p>
        <p className="text-xs text-muted-foreground mt-0.5">Structured signals from public records and open data. Not all signals are complete or current.</p>
      </div>

      {/* Stale data warning (Logic Bible V8.0) */}
      {staleWarning && (
        <div className="mx-5 mt-3 p-3 rounded-lg border border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            This intelligence was last updated {staleWarning.daysSince} days ago. Some signals may have changed.
          </p>
        </div>
      )}

      <div className="px-5">
        <SignalCategory
          title="Hiring Reality"
          signals={hiringSignals}
          emptyType="jobs"
          companyName={props.companyName}
          scanContext={props.scanContext}
        />
        <SignalCategory title="Workforce Stability" signals={stabilitySignals} />
        <SignalCategory title="Compensation & Market Position" signals={compSignals} emptyType="compensation" companyName={props.companyName} />

        <div className="py-4 border-b border-border/30">
          <OffTheRecordSignals companyId={props.companyId} companyName={props.companyName} />
        </div>

        <SignalCategory title="Leadership & Influence" signals={leadershipSignals} />
        <SignalCategory title="Innovation & Growth" signals={innovationSignals} />
        <SignalCategory title="Employee Experience" signals={sentimentSignals} emptyType="sentiment" companyName={props.companyName} />
      </div>
    </div>
  );
}
