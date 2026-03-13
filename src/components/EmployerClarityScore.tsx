import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, Briefcase, DollarSign, BarChart3, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClarityInputs {
  // Workforce Stability signals
  hasWarnNotices: boolean;
  hasLayoffSignals: boolean;
  hasSentimentData: boolean;
  employeeCount: string | null;

  // Hiring Transparency signals
  hasAiHrSignals: boolean;
  hasBenefitsData: boolean;
  hasJobPostings: boolean;

  // Influence Exposure signals
  totalPacSpending: number;
  lobbyingSpend: number;
  hasTradeAssociations: boolean;
  hasGovernmentContracts: boolean;
  hasDarkMoney: boolean;

  // Compensation Alignment signals
  hasPayEquitySignals: boolean;
  hasCompensationData: boolean;

  // Signal Confidence
  scanCompletion: Record<string, boolean> | null;
  recordStatus: string;
  hasPublicStances: boolean;
  hasIssueSignals: boolean;
}

interface ComponentScore {
  label: string;
  score: number;
  weight: number;
  icon: typeof Shield;
  signals: string[];
}

function calculateClarityScore(inputs: ClarityInputs) {
  // 1. Workforce Stability (25%) — higher = more clarity
  const workforceSignals: string[] = [];
  let workforceScore = 30; // base: some info exists
  if (inputs.employeeCount) { workforceScore += 20; workforceSignals.push("Employee count reported"); }
  if (inputs.hasSentimentData) { workforceScore += 20; workforceSignals.push("Worker sentiment data available"); }
  if (inputs.hasWarnNotices) { workforceScore += 15; workforceSignals.push("WARN notice data tracked"); }
  if (inputs.hasLayoffSignals) { workforceScore += 15; workforceSignals.push("Layoff signals monitored"); }
  if (workforceSignals.length === 0) { workforceScore = 10; workforceSignals.push("Limited workforce data"); }

  // 2. Hiring Transparency (20%)
  const hiringSignals: string[] = [];
  let hiringScore = 20;
  if (inputs.hasAiHrSignals) { hiringScore += 30; hiringSignals.push("Hiring technology signals detected"); }
  if (inputs.hasBenefitsData) { hiringScore += 25; hiringSignals.push("Benefits data available"); }
  if (inputs.hasJobPostings) { hiringScore += 25; hiringSignals.push("Job posting transparency tracked"); }
  if (hiringSignals.length === 0) { hiringScore = 10; hiringSignals.push("Limited hiring transparency data"); }

  // 3. Influence Exposure (20%) — measures disclosure transparency
  const influenceSignals: string[] = [];
  let influenceScore = 15;
  if (inputs.totalPacSpending > 0) { influenceScore += 20; influenceSignals.push("PAC spending disclosed"); }
  if (inputs.lobbyingSpend > 0) { influenceScore += 20; influenceSignals.push("Lobbying expenditures tracked"); }
  if (inputs.hasTradeAssociations) { influenceScore += 15; influenceSignals.push("Trade associations identified"); }
  if (inputs.hasGovernmentContracts) { influenceScore += 15; influenceSignals.push("Government contracts reported"); }
  if (inputs.hasDarkMoney) { influenceScore += 15; influenceSignals.push("Dark money connections surfaced"); }
  if (influenceSignals.length === 0) { influenceScore = 10; influenceSignals.push("Limited influence data"); }

  // 4. Compensation Alignment (20%)
  const compSignals: string[] = [];
  let compScore = 15;
  if (inputs.hasPayEquitySignals) { compScore += 40; compSignals.push("Pay equity signals available"); }
  if (inputs.hasCompensationData) { compScore += 30; compSignals.push("Compensation benchmarks tracked"); }
  if (inputs.hasBenefitsData) { compScore += 15; compSignals.push("Benefits coverage analyzed"); }
  if (compSignals.length === 0) { compScore = 10; compSignals.push("Limited compensation data"); }

  // 5. Signal Confidence (15%)
  const confSignals: string[] = [];
  let confScore = 20;
  const scanKeys = inputs.scanCompletion ? Object.values(inputs.scanCompletion) : [];
  const completedScans = scanKeys.filter(Boolean).length;
  const totalScans = scanKeys.length || 1;
  const coveragePercent = (completedScans / totalScans) * 100;
  confScore += Math.round(coveragePercent * 0.4);
  if (completedScans > 0) confSignals.push(`${completedScans}/${totalScans} scan modules complete`);
  if (inputs.recordStatus === "verified") { confScore += 15; confSignals.push("Record verified"); }
  if (inputs.hasPublicStances) { confScore += 10; confSignals.push("Public stances documented"); }
  if (inputs.hasIssueSignals) { confScore += 10; confSignals.push("Issue signals mapped"); }
  if (confSignals.length === 0) { confScore = 10; confSignals.push("Low data coverage"); }

  // Cap all at 100
  const cap = (n: number) => Math.min(100, Math.max(0, n));
  const components: ComponentScore[] = [
    { label: "Workforce Stability", score: cap(workforceScore), weight: 0.25, icon: Users, signals: workforceSignals },
    { label: "Hiring Transparency", score: cap(hiringScore), weight: 0.20, icon: Briefcase, signals: hiringSignals },
    { label: "Influence Exposure", score: cap(influenceScore), weight: 0.20, icon: BarChart3, signals: influenceSignals },
    { label: "Compensation Alignment", score: cap(compScore), weight: 0.20, icon: DollarSign, signals: compSignals },
    { label: "Signal Confidence", score: cap(confScore), weight: 0.15, icon: CheckCircle2, signals: confSignals },
  ];

  const totalScore = Math.round(
    components.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  return { totalScore, components };
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-[hsl(var(--civic-green))]";
  if (score >= 45) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

function getScoreBarColor(score: number): string {
  if (score >= 70) return "bg-[hsl(var(--civic-green))]";
  if (score >= 45) return "bg-[hsl(var(--civic-yellow))]";
  return "bg-destructive";
}

interface JackyeTake {
  opener: string;
  receipt: string;
  humanFact: string;
  closing: string;
}

function getJackyesTake(score: number, components: ComponentScore[]): JackyeTake {
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];
  const strongest = [...components].sort((a, b) => b.score - a.score)[0];
  const gaps = components.filter(c => c.score < 40);
  const gapNames = gaps.map(g => g.label.toLowerCase()).join(" and ");

  if (score >= 75) {
    return {
      opener: `This employer shows their receipts. That's rare — and it matters.`,
      receipt: `${strongest.label} is their strongest signal at ${strongest.score}/100. When a company lets you see this much, it usually means they're not hiding the rest.`,
      humanFact: weakest.score < 60
        ? `That said, ${weakest.label.toLowerCase()} scored ${weakest.score}/100. High clarity everywhere else but a gap here? That's worth one direct question in your interview.`
        : `Across the board, the data is consistent. No major gaps between what they say and what the filings show.`,
      closing: `You have enough signal to make a real decision here. Use it.`,
    };
  }
  if (score >= 50) {
    return {
      opener: `There's enough signal here to work with — but not enough to stop asking questions.`,
      receipt: `${strongest.label} gives you the clearest picture at ${strongest.score}/100. But ${weakest.label.toLowerCase()}? ${weakest.score}/100. That gap isn't an accident — it's either a blind spot or a choice.`,
      humanFact: `Companies with moderate clarity often look fine on the careers page. The question is whether the reality matches the marketing. Right now, the data says "maybe."`,
      closing: `Before you sign anything: ask them directly about ${weakest.label.toLowerCase()}. If they dodge it, that's your answer.`,
    };
  }
  if (score >= 25) {
    return {
      opener: `I can't give you a clear read on this employer — and that itself is a signal.`,
      receipt: `The strongest area is ${strongest.label} at ${strongest.score}/100, but ${gapNames || weakest.label.toLowerCase()} ${gaps.length > 1 ? "are" : "is"} sitting well below where I'd want to see ${gaps.length > 1 ? "them" : "it"}. When most of the picture is missing, you're not making a decision — you're making a guess.`,
      humanFact: `This doesn't mean they're a bad employer. It means they haven't made their story easy to verify. Some companies just don't have a big public footprint. Others are intentionally opaque. Your job is to figure out which one this is.`,
      closing: `Do your own diligence. Ask about ${weakest.label.toLowerCase()} and compensation directly. If they can't answer clearly, walk.`,
    };
  }
  return {
    opener: `Almost nothing to work with here. I'm not going to pretend otherwise.`,
    receipt: `Across all five signal categories, data coverage is thin. That's common for smaller or private companies — but it doesn't let you off the hook for doing your homework.`,
    humanFact: `No public data doesn't mean no red flags. It means the red flags — and the green ones — are hiding behind closed doors. You'll only find them by asking the right questions in person.`,
    closing: `Treat this like a first date with no mutual friends. Be curious, be direct, and don't commit until you've seen the receipts yourself.`,
  };
}

interface EmployerClarityScoreProps {
  // Workforce
  hasWarnNotices?: boolean;
  hasLayoffSignals?: boolean;
  hasSentimentData?: boolean;
  employeeCount?: string | null;
  // Hiring
  hasAiHrSignals?: boolean;
  hasBenefitsData?: boolean;
  hasJobPostings?: boolean;
  // Influence
  totalPacSpending?: number;
  lobbyingSpend?: number;
  hasTradeAssociations?: boolean;
  hasGovernmentContracts?: boolean;
  hasDarkMoney?: boolean;
  // Compensation
  hasPayEquitySignals?: boolean;
  hasCompensationData?: boolean;
  // Confidence
  scanCompletion?: Record<string, boolean> | null;
  recordStatus?: string;
  hasPublicStances?: boolean;
  hasIssueSignals?: boolean;
}

export function EmployerClarityScore(props: EmployerClarityScoreProps) {
  const inputs: ClarityInputs = {
    hasWarnNotices: props.hasWarnNotices ?? false,
    hasLayoffSignals: props.hasLayoffSignals ?? false,
    hasSentimentData: props.hasSentimentData ?? false,
    employeeCount: props.employeeCount ?? null,
    hasAiHrSignals: props.hasAiHrSignals ?? false,
    hasBenefitsData: props.hasBenefitsData ?? false,
    hasJobPostings: props.hasJobPostings ?? false,
    totalPacSpending: props.totalPacSpending ?? 0,
    lobbyingSpend: props.lobbyingSpend ?? 0,
    hasTradeAssociations: props.hasTradeAssociations ?? false,
    hasGovernmentContracts: props.hasGovernmentContracts ?? false,
    hasDarkMoney: props.hasDarkMoney ?? false,
    hasPayEquitySignals: props.hasPayEquitySignals ?? false,
    hasCompensationData: props.hasCompensationData ?? false,
    scanCompletion: props.scanCompletion ?? null,
    recordStatus: props.recordStatus ?? "unknown",
    hasPublicStances: props.hasPublicStances ?? false,
    hasIssueSignals: props.hasIssueSignals ?? false,
  };

  const { totalScore, components } = useMemo(() => calculateClarityScore(inputs), [
    inputs.hasWarnNotices, inputs.hasLayoffSignals, inputs.hasSentimentData, inputs.employeeCount,
    inputs.hasAiHrSignals, inputs.hasBenefitsData, inputs.hasJobPostings,
    inputs.totalPacSpending, inputs.lobbyingSpend, inputs.hasTradeAssociations, inputs.hasGovernmentContracts, inputs.hasDarkMoney,
    inputs.hasPayEquitySignals, inputs.hasCompensationData,
    inputs.scanCompletion, inputs.recordStatus, inputs.hasPublicStances, inputs.hasIssueSignals,
  ]);

  const jackyesTake = useMemo(() => getJackyesTake(totalScore, components), [totalScore, components]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Employer Clarity Score
          </div>
          <div className={cn("text-3xl font-black tabular-nums", getScoreColor(totalScore))}>
            {totalScore}
            <span className="text-sm font-medium text-muted-foreground">/100</span>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Measures how clearly you can understand this employer's signals — not a moral judgment.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Breakdown */}
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{c.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {Math.round(c.weight * 100)}%
                  </Badge>
                </div>
                <span className={cn("font-semibold tabular-nums text-xs", getScoreColor(c.score))}>
                  {c.score}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(c.score))}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {c.signals.map((s, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground">
                    {i > 0 && "·"} {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Jackye's Take */}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-5 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--civic-gold-muted))] to-primary flex items-center justify-center font-serif text-sm text-primary-foreground font-bold shrink-0">
              JC
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block leading-tight">Jackye's Take</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Accountability Intelligence</span>
            </div>
          </div>
          <div className="space-y-2.5 text-sm leading-relaxed">
            <p className="text-foreground font-semibold">{jackyesTake.opener}</p>
            <p className="text-foreground/75">{jackyesTake.receipt}</p>
            <p className="text-foreground/65 text-[13px]">{jackyesTake.humanFact}</p>
            <p className="text-primary font-semibold text-[13px] pt-1 border-t border-primary/10">
              → {jackyesTake.closing}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
