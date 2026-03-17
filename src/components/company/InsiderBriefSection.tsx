import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsiderBriefProps {
  companyName: string;
  industry: string;
  isPubliclyTraded: boolean;
  totalPacSpending: number;
  lobbyingSpend: number;
  governmentContracts: number;
  darkMoneyCount: number;
  revolvingDoorCount: number;
  hasLayoffSignals: boolean;
  hasSentimentData: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasAiHrSignals: boolean;
  employeeCount: string | null;
  // Clarity score inputs
  hasWarnNotices: boolean;
  hasJobPostings: boolean;
  hasTradeAssociations: boolean;
  hasGovernmentContracts: boolean;
  hasDarkMoney: boolean;
  hasCompensationData: boolean;
  scanCompletion: Record<string, boolean> | null;
  recordStatus: string;
  hasPublicStances: boolean;
  hasIssueSignals: boolean;
  lastReviewed?: string;
  updatedAt?: string;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return "$0";
}

function calculateClarityScore(p: InsiderBriefProps) {
  let score = 15;
  if (p.employeeCount) score += 8;
  if (p.hasSentimentData) score += 10;
  if (p.hasWarnNotices) score += 7;
  if (p.hasLayoffSignals) score += 7;
  if (p.hasAiHrSignals) score += 8;
  if (p.hasBenefitsData) score += 8;
  if (p.hasJobPostings) score += 6;
  if (p.totalPacSpending > 0) score += 6;
  if (p.lobbyingSpend > 0) score += 6;
  if (p.hasTradeAssociations) score += 4;
  if (p.hasGovernmentContracts) score += 4;
  if (p.hasDarkMoney) score += 4;
  if (p.hasPayEquity) score += 10;
  if (p.hasCompensationData) score += 6;
  if (p.hasPublicStances) score += 4;
  if (p.hasIssueSignals) score += 4;

  const scanKeys = p.scanCompletion ? Object.values(p.scanCompletion) : [];
  const completedScans = scanKeys.filter(Boolean).length;
  const totalScans = scanKeys.length || 1;
  score += Math.round((completedScans / totalScans) * 10);

  if (p.recordStatus === "verified") score += 8;

  return Math.min(100, Math.max(0, score));
}

function getScoreColor(s: number) {
  if (s >= 70) return "text-[hsl(var(--civic-green))]";
  if (s >= 45) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

function getScoreBarColor(s: number) {
  if (s >= 70) return "bg-[hsl(var(--civic-green))]";
  if (s >= 45) return "bg-[hsl(var(--civic-yellow))]";
  return "bg-destructive";
}

function getConfidenceLevel(p: InsiderBriefProps): "Low" | "Medium" | "High" {
  const signalCount = [
    p.hasSentimentData, p.hasPayEquity, p.hasBenefitsData,
    p.hasAiHrSignals, p.totalPacSpending > 0, p.lobbyingSpend > 0,
    p.hasPublicStances, p.hasIssueSignals, p.hasWarnNotices,
    !!p.employeeCount,
  ].filter(Boolean).length;
  if (signalCount >= 6) return "High";
  if (signalCount >= 3) return "Medium";
  return "Low";
}

function getDataRecency(lastReviewed?: string, updatedAt?: string): string {
  const ref = lastReviewed || updatedAt;
  if (!ref) return "Unknown";
  const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 30–60 days";
  if (days <= 180) return "Last 6 months";
  return "6+ months ago";
}

export function InsiderBriefSection(props: InsiderBriefProps) {
  const score = useMemo(() => calculateClarityScore(props), [props]);
  const confidence = getConfidenceLevel(props);
  const recency = getDataRecency(props.lastReviewed, props.updatedAt);

  const changingSignals = useMemo(() => {
    const items: string[] = [];
    if (props.totalPacSpending > 0)
      items.push(`${formatMoney(props.totalPacSpending)} in PAC spending documented in public filings`);
    if (props.lobbyingSpend > 0)
      items.push(`${formatMoney(props.lobbyingSpend)} in lobbying expenditures on record`);
    if (props.darkMoneyCount > 0)
      items.push(`${props.darkMoneyCount} dark money connection(s) identified`);
    if (props.revolvingDoorCount > 0)
      items.push(`${props.revolvingDoorCount} revolving door link(s) flagged`);
    if (props.hasAiHrSignals)
      items.push("AI hiring tools detected — audit status pending");
    if (props.hasLayoffSignals)
      items.push("Active layoff or workforce reduction signals detected");
    if (!props.hasPayEquity)
      items.push("Pay equity data not disclosed");
    if (!props.hasBenefitsData)
      items.push("Benefits data not publicly indexed");
    return items.slice(0, 3);
  }, [props]);

  const interpretation = useMemo(() => {
    const parts: string[] = [];
    if (props.totalPacSpending > 50_000 || props.lobbyingSpend > 50_000)
      parts.push("This company has a measurable political spending footprint. Consider how that aligns with your values.");
    if (props.darkMoneyCount > 0)
      parts.push("Dark money connections suggest influence channels that are harder to trace.");
    if (!props.hasPayEquity && !props.hasBenefitsData)
      parts.push("Limited compensation transparency may make it harder to evaluate total rewards.");
    if (props.hasAiHrSignals)
      parts.push("AI tools in hiring may affect how your application is processed.");
    if (parts.length === 0) {
      if (score >= 70) parts.push("This employer has above-average signal coverage. You can make a more informed decision with the data available.");
      else parts.push("Signal coverage is limited. Proceed with your own research and ask targeted questions during the interview process.");
    }
    return parts.slice(0, 2).join(" ");
  }, [props, score]);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Score bar */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Employer Clarity Score</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-black tabular-nums", getScoreColor(score))}>{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div className="h-1.5 w-32 bg-muted rounded-full mt-2 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(score))} style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            Confidence: {confidence}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            Data: {recency}
          </Badge>
        </div>
      </div>

      {/* What's changing */}
      {changingSignals.length > 0 && (
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">What's changing</p>
          <ul className="space-y-1.5">
            {changingSignals.map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/40">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What this means for you */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">What this means for you</p>
        <p className="text-sm text-foreground/85 leading-relaxed">{interpretation}</p>
      </div>
    </div>
  );
}
