import { Badge } from "@/components/ui/badge";
import { EmptyStateExplainer } from "@/components/company/EmptyStateExplainer";
import { OffTheRecordSignals } from "@/components/company/OffTheRecordSignals";
import { ExpandableSignalItem } from "@/components/company/ExpandableSignalItem";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUiStatement } from "@/lib/signalPersonalization";
import { AlertTriangle } from "lucide-react";
import { safeSignalSummary, mapToCategory, TAXONOMY_MAP } from "@/utils/signalTextSanitizer";

interface Signal {
  summary: string;
  confidence: "Low" | "Medium" | "High";
  recency: string;
  uiStatement?: string;
  direction?: string;
  detail?: string;
  deepLinks?: { label: string; to: string }[];
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
        {signals.map((s, i) => (
          <ExpandableSignalItem key={i} signal={s} />
        ))}
      </div>
    </div>
  );
}

interface StructuredSignalsProps {
  hasJobPostings: boolean;
  activeJobCount?: number;
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
  companySlug: string;
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

function getStaleWarning(canonicalSignals: any[] | null): { isStale: boolean; daysSince: number } | null {
  if (!canonicalSignals || canonicalSignals.length === 0) return null;
  const oldest = canonicalSignals.reduce((min, s) => {
    const ts = new Date(s.scan_timestamp).getTime();
    return ts < min ? ts : min;
  }, Date.now());
  const daysSince = Math.floor((Date.now() - oldest) / 86_400_000);
  return daysSince > 30 ? { isStale: true, daysSince } : null;
}

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

function buildSignalFromCanonical(canonical: any, deepLinks?: { label: string; to: string }[], detail?: string): Signal {
  return {
    summary: canonical.summary,
    confidence: mapConfidence(canonical.confidence_level),
    recency: mapRecency(canonical.scan_timestamp),
    uiStatement: getUiStatement(canonical.signal_category, canonical.value_normalized || "not_disclosed"),
    direction: canonical.direction || undefined,
    detail,
    deepLinks,
  };
}

export function StructuredSignalsSection(props: StructuredSignalsProps) {
  const recency = getRecency(props.lastReviewed, props.updatedAt);
  const { data: canonicalSignals } = useCanonicalSignals(props.companyId);
  const slug = props.companySlug;

  const signalMap = new Map(
    (canonicalSignals || []).map(s => [s.signal_category, s])
  );

  const staleWarning = getStaleWarning(canonicalSignals || null);

  // ── Hiring Reality ──
  const hiringSignals: Signal[] = [];
  const hiringCanonical = signalMap.get('hiring_activity');
  if (hiringCanonical?.summary) {
    hiringSignals.push(buildSignalFromCanonical(
      hiringCanonical,
      [{ label: "Workforce Brief", to: `/workforce-brief?company=${slug}` }],
      "Hiring activity is derived from active job postings, ATS detection, and career page analysis. Patterns like sudden surges or drops can indicate restructuring, growth, or ghost-job behavior."
    ));
  } else {
    if (props.hasJobPostings)
      hiringSignals.push({
        summary: `Active job postings detected. ${props.activeJobCount ? props.activeJobCount + " live role" + (props.activeJobCount !== 1 ? "s" : "") + " indexed." : "No unusual hiring patterns flagged."}`,
        confidence: "Medium", recency,
        uiStatement: props.activeJobCount ? `${props.activeJobCount} Active Job${props.activeJobCount !== 1 ? "s" : ""} Found` : "Active Hiring Detected",
        detail: "We scan career pages and aggregator sites to identify active roles. Volume changes over time can signal organizational health or strategic shifts.",
        deepLinks: [{ label: "Workforce Brief", to: `/workforce-brief?company=${slug}` }],
      });
    if (props.hasAiHrSignals)
      hiringSignals.push({
        summary: "AI-powered hiring tools detected in application pipeline. Bias audit status is pending.",
        confidence: "Medium", recency,
        detail: "AI hiring tools can affect candidate evaluation. We check for public bias audit disclosures and vendor transparency to assess risk to applicants.",
      });
    if (props.hasGhostJobs)
      hiringSignals.push({
        summary: "Potential ghost job postings identified — roles listed but not actively being filled.",
        confidence: "Low", recency,
        detail: "Ghost jobs are listings that remain open for extended periods without active hiring. They can inflate company presence on job boards without real intent to fill positions.",
      });
  }

  // ── Workforce Stability ──
  const stabilitySignals: Signal[] = [];
  const stabilityCanonical = signalMap.get('workforce_stability');
  if (stabilityCanonical?.summary) {
    stabilitySignals.push(buildSignalFromCanonical(
      stabilityCanonical,
      [{ label: "Workforce Brief", to: `/workforce-brief?company=${slug}` }],
      "Workforce stability is assessed through WARN Act filings, news reports of layoffs, and organizational restructuring signals detected in public filings."
    ));
  } else {
    if (props.hasWarnNotices)
      stabilitySignals.push({
        summary: "WARN Act notices filed within the past 12 months — potential layoffs or plant closings.",
        confidence: "High", recency,
        detail: "The WARN Act requires employers with 100+ employees to provide 60-day notice before mass layoffs or plant closings. Filed notices are a strong indicator of workforce reduction.",
        deepLinks: [{ label: "Workforce Brief", to: `/workforce-brief?company=${slug}` }],
      });
    if (props.hasLayoffSignals)
      stabilitySignals.push({
        summary: "Workforce reduction signals detected from news or regulatory filings.",
        confidence: "Medium", recency,
        detail: "Layoff signals are gathered from news reports, SEC filings, and social media. They may indicate restructuring, cost-cutting, or strategic pivots.",
        deepLinks: [{ label: "Workforce Brief", to: `/workforce-brief?company=${slug}` }],
      });
    if (!props.hasWarnNotices && !props.hasLayoffSignals)
      stabilitySignals.push({
        summary: "No recent WARN notices or layoff signals detected in public records.",
        confidence: "Medium", recency,
        detail: "The absence of layoff signals in public records is generally positive, but does not guarantee stability. Private companies may restructure without triggering public disclosure requirements.",
      });
  }

  // ── Compensation & Market Position ──
  const compSignals: Signal[] = [];
  const compCanonical = signalMap.get('compensation_transparency');
  if (compCanonical?.summary) {
    compSignals.push(buildSignalFromCanonical(
      compCanonical,
      undefined,
      "Compensation transparency reflects whether the company publishes salary ranges, benefits details, and pay equity data. Higher transparency correlates with stronger employer branding."
    ));
  } else {
    if (props.hasPayEquity)
      compSignals.push({
        summary: "Pay equity data available — signals suggest some level of compensation reporting.",
        confidence: "Medium", recency,
        detail: "Pay equity disclosures indicate the company tracks and reports on compensation fairness across demographics. This is increasingly expected by candidates and regulators.",
      });
    if (props.hasBenefitsData)
      compSignals.push({
        summary: "Benefits information has been indexed from public or disclosed sources.",
        confidence: "Medium", recency,
        detail: "Benefits data is gathered from career pages, Glassdoor, and public filings. Coverage, quality, and accessibility of benefits vary widely even within the same industry.",
      });
    if (!props.hasPayEquity && !props.hasBenefitsData && !props.hasCompensationData)
      compSignals.push({
        summary: "No compensation or benefits data has been publicly disclosed or indexed.",
        confidence: "Low", recency,
        detail: "The absence of public compensation data may reflect a company's privacy preferences or a lack of regulatory pressure. It limits ability to benchmark offers.",
      });
  }

  // ── Leadership & Influence ──
  const leadershipSignals: Signal[] = [];
  const behaviorCanonical = signalMap.get('company_behavior');
  if (behaviorCanonical?.summary) {
    leadershipSignals.push(buildSignalFromCanonical(
      behaviorCanonical,
      [
        { label: "Follow the Money", to: `/follow-the-money?company=${slug}` },
        { label: "Influence Graph", to: `/influence-graph?company=${slug}` },
      ],
      "Company behavior signals aggregate political spending, lobbying activity, revolving-door connections, and public policy positions into a holistic influence profile."
    ));
  } else {
    if (props.executiveCount > 0)
      leadershipSignals.push({
        summary: `${props.executiveCount} executive(s) identified with public donation records.`,
        confidence: "Medium", recency,
        detail: "Executive donation records are sourced from FEC filings. Personal political contributions by company leaders can signal organizational culture and policy priorities.",
        deepLinks: [
          { label: "Follow the Money", to: `/follow-the-money?company=${slug}` },
          { label: "Influence Graph", to: `/influence-graph?company=${slug}` },
        ],
      });
    if (props.totalPacSpending > 0 || props.lobbyingSpend > 0) {
      const parts: string[] = [];
      if (props.totalPacSpending > 0) parts.push(`${formatMoney(props.totalPacSpending)} PAC spending`);
      if (props.lobbyingSpend > 0) parts.push(`${formatMoney(props.lobbyingSpend)} lobbying`);
      leadershipSignals.push({
        summary: `Political influence footprint: ${parts.join(", ")}.`,
        confidence: "High", recency,
        detail: "PAC spending and lobbying data come from FEC and Senate LDA disclosures. These expenditures fund political campaigns and legislative influence efforts that may affect workers and communities.",
        deepLinks: [
          { label: "Follow the Money", to: `/follow-the-money?company=${slug}` },
          { label: "Policy Intelligence", to: `/policy-intelligence?company=${slug}` },
        ],
      });
    }
    if (props.revolvingDoorCount > 0)
      leadershipSignals.push({
        summary: `${props.revolvingDoorCount} revolving door connection(s) between government and corporate roles.`,
        confidence: "Medium", recency,
        detail: "Revolving-door connections occur when individuals move between government positions and corporate roles. These connections can create regulatory conflicts of interest.",
        deepLinks: [{ label: "Influence Graph", to: `/influence-graph?company=${slug}` }],
      });
  }

  // ── Innovation & Growth ──
  const innovationSignals: Signal[] = [];
  const innovCanonical = signalMap.get('innovation_activity');
  if (innovCanonical?.summary) {
    innovationSignals.push(buildSignalFromCanonical(
      innovCanonical,
      undefined,
      "Innovation signals are derived from patent filings, R&D investment disclosures, and technology adoption patterns. Active innovation often correlates with job growth and competitive positioning."
    ));
  }

  // ── Employee Experience ──
  const sentimentSignals: Signal[] = [];
  const sentCanonical = signalMap.get('public_sentiment');
  if (sentCanonical?.summary) {
    sentimentSignals.push(buildSignalFromCanonical(
      sentCanonical,
      undefined,
      "Employee sentiment is gathered from public review platforms, social media mentions, and workforce surveys. Trends in sentiment can predict retention challenges and cultural shifts."
    ));
  }

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40">
        <p className="text-sm font-bold text-foreground tracking-tight">What We're Seeing</p>
        <p className="text-xs text-muted-foreground mt-0.5">Structured signals from public records and open data. Not all signals are complete or current.</p>
      </div>

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
