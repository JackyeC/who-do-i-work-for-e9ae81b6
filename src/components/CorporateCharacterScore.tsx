import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Users, Landmark, Scale, Crown,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { WorkforceIntelligenceBrief } from "@/components/WorkforceIntelligenceBrief";

/* ─── Types ─── */

export interface CharacterInputs {
  // Transparency
  hasDeiReports: boolean;
  hasPayTransparency: boolean;
  hasPromotionData: boolean;
  hasWorkforceDemographics: boolean;
  hasPublicReporting: boolean;
  hasPublicStances: boolean;
  // Worker Treatment
  hasSentimentData: boolean;
  hasLayoffSignals: boolean;
  hasWarnNotices: boolean;
  hasLaborViolations: boolean;
  hasWorkerLawsuits: boolean;
  hasBenefitsData: boolean;
  employeeCount: string | null;
  // Political Influence
  totalPacSpending: number;
  lobbyingSpend: number;
  hasTradeAssociations: boolean;
  hasGovernmentContracts: boolean;
  hasDarkMoney: boolean;
  hasIssueSignals: boolean;
  // Ethical Conduct
  hasSecInvestigations: boolean;
  hasDojEnforcement: boolean;
  hasFtcActions: boolean;
  hasClassActionLawsuits: boolean;
  hasPayEquitySignals: boolean;
  // Leadership Accountability
  hasCompensationData: boolean;
  hasGovernanceDisclosures: boolean;
  hasBoardDiversity: boolean;
  hasAiHrSignals: boolean;
  hasJobPostings: boolean;
  // Meta
  scanCompletion: Record<string, boolean> | null;
  recordStatus: string;
}

interface CategoryScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  icon: typeof Shield;
  signals: string[];
  evidence: { label: string; type: "strong" | "some" | "weak" }[];
}

/* ─── Scoring Engine ─── */

export function calculateCharacterScore(inputs: CharacterInputs) {
  const cap = (n: number) => Math.min(100, Math.max(0, n));

  // 1. Transparency (25%)
  const tSignals: string[] = [];
  const tEvidence: CategoryScore["evidence"] = [];
  let tScore = 15;
  if (inputs.hasPayTransparency) { tScore += 20; tSignals.push("Pay transparency signals found"); tEvidence.push({ label: "Pay equity data", type: "strong" }); }
  if (inputs.hasPublicStances) { tScore += 15; tSignals.push("Public stances documented"); tEvidence.push({ label: "Public stance filings", type: "some" }); }
  if (inputs.hasWorkforceDemographics) { tScore += 15; tSignals.push("Workforce demographics disclosed"); tEvidence.push({ label: "Demographics report", type: "strong" }); }
  if (inputs.hasPromotionData) { tScore += 15; tSignals.push("Promotion data available"); tEvidence.push({ label: "Promotion records", type: "some" }); }
  if (inputs.hasDeiReports) { tScore += 15; tSignals.push("DEI reporting detected"); tEvidence.push({ label: "DEI report", type: "strong" }); }
  if (inputs.hasPublicReporting) { tScore += 10; tSignals.push("Public reporting available"); tEvidence.push({ label: "SEC/public filings", type: "strong" }); }
  if (tSignals.length === 0) { tScore = 8; tSignals.push("Limited transparency data"); }

  // 2. Worker Treatment (25%)
  const wSignals: string[] = [];
  const wEvidence: CategoryScore["evidence"] = [];
  let wScore = 20;
  if (inputs.hasSentimentData) { wScore += 20; wSignals.push("Worker sentiment data available"); wEvidence.push({ label: "Employee review analysis", type: "some" }); }
  if (inputs.hasBenefitsData) { wScore += 15; wSignals.push("Benefits data analyzed"); wEvidence.push({ label: "Benefits coverage data", type: "strong" }); }
  if (inputs.employeeCount) { wScore += 10; wSignals.push("Employee count reported"); }
  if (inputs.hasWarnNotices) { wScore += 10; wSignals.push("WARN notice history tracked"); wEvidence.push({ label: "WARN Act notices", type: "strong" }); }
  // Penalties
  if (inputs.hasLaborViolations) { wScore -= 15; wSignals.push("⚠ Labor violations detected"); wEvidence.push({ label: "DOL enforcement records", type: "strong" }); }
  if (inputs.hasWorkerLawsuits) { wScore -= 10; wSignals.push("⚠ Worker lawsuits on record"); wEvidence.push({ label: "Court records", type: "some" }); }
  if (inputs.hasLayoffSignals) { wScore -= 5; wSignals.push("Layoff signals detected"); wEvidence.push({ label: "Layoff tracking data", type: "some" }); }
  if (wSignals.length === 0) { wScore = 10; wSignals.push("Limited worker data"); }

  // 3. Political Influence (20%) — INVERSE: more influence = lower score
  const pSignals: string[] = [];
  const pEvidence: CategoryScore["evidence"] = [];
  let pScore = 80; // Start high, deduct for influence activity
  if (inputs.totalPacSpending > 1_000_000) { pScore -= 25; pSignals.push("Heavy PAC spending (>$1M)"); pEvidence.push({ label: "FEC PAC filings", type: "strong" }); }
  else if (inputs.totalPacSpending > 0) { pScore -= 10; pSignals.push("PAC spending disclosed"); pEvidence.push({ label: "FEC PAC filings", type: "strong" }); }
  if (inputs.lobbyingSpend > 5_000_000) { pScore -= 25; pSignals.push("Major lobbying expenditures (>$5M)"); pEvidence.push({ label: "Senate LDA filings", type: "strong" }); }
  else if (inputs.lobbyingSpend > 0) { pScore -= 10; pSignals.push("Lobbying spend tracked"); pEvidence.push({ label: "Senate LDA filings", type: "strong" }); }
  if (inputs.hasDarkMoney) { pScore -= 15; pSignals.push("⚠ Dark money connections surfaced"); pEvidence.push({ label: "Dark money tracking", type: "some" }); }
  if (inputs.hasTradeAssociations) { pScore -= 5; pSignals.push("Trade association memberships"); pEvidence.push({ label: "Trade association records", type: "some" }); }
  if (inputs.hasGovernmentContracts) { pScore -= 5; pSignals.push("Government contracts active"); pEvidence.push({ label: "USASpending.gov", type: "strong" }); }
  if (inputs.hasIssueSignals) { pSignals.push("Issue-level influence mapped"); pEvidence.push({ label: "Issue signal analysis", type: "some" }); }
  if (pSignals.length === 0) { pScore = 85; pSignals.push("No significant political activity detected"); }

  // 4. Ethical Conduct (15%)
  const eSignals: string[] = [];
  const eEvidence: CategoryScore["evidence"] = [];
  let eScore = 75;
  if (inputs.hasPayEquitySignals) { eScore += 10; eSignals.push("Pay equity signals available"); eEvidence.push({ label: "Pay equity analysis", type: "some" }); }
  // Penalties for legal issues
  if (inputs.hasSecInvestigations) { eScore -= 20; eSignals.push("⚠ SEC investigation on record"); eEvidence.push({ label: "SEC enforcement database", type: "strong" }); }
  if (inputs.hasDojEnforcement) { eScore -= 20; eSignals.push("⚠ DOJ enforcement action"); eEvidence.push({ label: "DOJ enforcement records", type: "strong" }); }
  if (inputs.hasFtcActions) { eScore -= 15; eSignals.push("⚠ FTC action detected"); eEvidence.push({ label: "FTC action records", type: "strong" }); }
  if (inputs.hasClassActionLawsuits) { eScore -= 10; eSignals.push("⚠ Class action lawsuits"); eEvidence.push({ label: "Court records", type: "some" }); }
  if (eSignals.length === 0) { eScore = 70; eSignals.push("No legal actions detected"); }

  // 5. Leadership Accountability (15%)
  const lSignals: string[] = [];
  const lEvidence: CategoryScore["evidence"] = [];
  let lScore = 25;
  if (inputs.hasCompensationData) { lScore += 20; lSignals.push("Executive compensation tracked"); lEvidence.push({ label: "SEC proxy filings", type: "strong" }); }
  if (inputs.hasGovernanceDisclosures) { lScore += 20; lSignals.push("Governance disclosures available"); lEvidence.push({ label: "Corporate governance filings", type: "strong" }); }
  if (inputs.hasBoardDiversity) { lScore += 20; lSignals.push("Board diversity disclosed"); lEvidence.push({ label: "Board composition data", type: "some" }); }
  if (inputs.hasAiHrSignals) { lScore += 10; lSignals.push("Hiring technology transparency"); lEvidence.push({ label: "AI hiring audit data", type: "some" }); }
  if (inputs.hasJobPostings) { lScore += 10; lSignals.push("Job posting transparency"); }
  if (lSignals.length === 0) { lScore = 10; lSignals.push("Limited leadership data"); }

  const categories: CategoryScore[] = [
    { key: "transparency", label: "Transparency", score: cap(tScore), weight: 0.25, icon: Shield, signals: tSignals, evidence: tEvidence },
    { key: "worker_treatment", label: "Worker Treatment", score: cap(wScore), weight: 0.25, icon: Users, signals: wSignals, evidence: wEvidence },
    { key: "political_influence", label: "Political Influence", score: cap(pScore), weight: 0.20, icon: Landmark, signals: pSignals, evidence: pEvidence },
    { key: "ethical_conduct", label: "Ethical Conduct", score: cap(eScore), weight: 0.15, icon: Scale, signals: eSignals, evidence: eEvidence },
    { key: "leadership", label: "Leadership Accountability", score: cap(lScore), weight: 0.15, icon: Crown, signals: lSignals, evidence: lEvidence },
  ];

  const totalScore = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0));
  return { totalScore, categories };
}

/* ─── Helpers ─── */

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

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Character";
  if (score >= 65) return "Above Average";
  if (score >= 50) return "Mixed Signals";
  if (score >= 35) return "Below Average";
  return "Significant Concerns";
}

function getEvidenceBadgeStyle(type: "strong" | "some" | "weak"): string {
  if (type === "strong") return "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]";
  if (type === "some") return "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]";
  return "border-destructive/30 text-destructive";
}

/* ─── Props ─── */

export interface CorporateCharacterScoreProps {
  // Transparency
  hasDeiReports?: boolean;
  hasPayTransparency?: boolean;
  hasPromotionData?: boolean;
  hasWorkforceDemographics?: boolean;
  hasPublicReporting?: boolean;
  hasPublicStances?: boolean;
  // Worker Treatment
  hasSentimentData?: boolean;
  hasLayoffSignals?: boolean;
  hasWarnNotices?: boolean;
  hasLaborViolations?: boolean;
  hasWorkerLawsuits?: boolean;
  hasBenefitsData?: boolean;
  employeeCount?: string | null;
  // Political Influence
  totalPacSpending?: number;
  lobbyingSpend?: number;
  hasTradeAssociations?: boolean;
  hasGovernmentContracts?: boolean;
  hasDarkMoney?: boolean;
  hasIssueSignals?: boolean;
  // Ethical Conduct
  hasSecInvestigations?: boolean;
  hasDojEnforcement?: boolean;
  hasFtcActions?: boolean;
  hasClassActionLawsuits?: boolean;
  hasPayEquitySignals?: boolean;
  // Leadership
  hasCompensationData?: boolean;
  hasGovernanceDisclosures?: boolean;
  hasBoardDiversity?: boolean;
  hasAiHrSignals?: boolean;
  hasJobPostings?: boolean;
  // Meta
  scanCompletion?: Record<string, boolean> | null;
  recordStatus?: string;
}

/* ─── Category Row ─── */

function CategoryRow({ category }: { category: CategoryScore }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = category.icon;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm group hover:bg-muted/30 rounded-lg p-1.5 -m-1.5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{category.label}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {Math.round(category.weight * 100)}%
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-bold tabular-nums text-xs", getScoreColor(category.score))}>
            {category.score}
          </span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Score bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getScoreBarColor(category.score))}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Signals */}
      <div className="flex flex-wrap gap-1 mt-0.5">
        {category.signals.map((s, i) => (
          <span key={i} className={cn("text-[10px]", s.startsWith("⚠") ? "text-destructive" : "text-muted-foreground")}>
            {i > 0 && "·"} {s}
          </span>
        ))}
      </div>

      {/* Expanded evidence */}
      {expanded && category.evidence.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-2 pb-1 space-y-1.5"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Evidence Sources</p>
          <div className="flex flex-wrap gap-1.5">
            {category.evidence.map((e, i) => (
              <Badge
                key={i}
                variant="outline"
                className={cn("text-[10px] gap-1", getEvidenceBadgeStyle(e.type))}
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {e.label}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function CorporateCharacterScore(props: CorporateCharacterScoreProps) {
  const inputs: CharacterInputs = {
    hasDeiReports: props.hasDeiReports ?? false,
    hasPayTransparency: props.hasPayTransparency ?? false,
    hasPromotionData: props.hasPromotionData ?? false,
    hasWorkforceDemographics: props.hasWorkforceDemographics ?? false,
    hasPublicReporting: props.hasPublicReporting ?? false,
    hasPublicStances: props.hasPublicStances ?? false,
    hasSentimentData: props.hasSentimentData ?? false,
    hasLayoffSignals: props.hasLayoffSignals ?? false,
    hasWarnNotices: props.hasWarnNotices ?? false,
    hasLaborViolations: props.hasLaborViolations ?? false,
    hasWorkerLawsuits: props.hasWorkerLawsuits ?? false,
    hasBenefitsData: props.hasBenefitsData ?? false,
    employeeCount: props.employeeCount ?? null,
    totalPacSpending: props.totalPacSpending ?? 0,
    lobbyingSpend: props.lobbyingSpend ?? 0,
    hasTradeAssociations: props.hasTradeAssociations ?? false,
    hasGovernmentContracts: props.hasGovernmentContracts ?? false,
    hasDarkMoney: props.hasDarkMoney ?? false,
    hasIssueSignals: props.hasIssueSignals ?? false,
    hasSecInvestigations: props.hasSecInvestigations ?? false,
    hasDojEnforcement: props.hasDojEnforcement ?? false,
    hasFtcActions: props.hasFtcActions ?? false,
    hasClassActionLawsuits: props.hasClassActionLawsuits ?? false,
    hasPayEquitySignals: props.hasPayEquitySignals ?? false,
    hasCompensationData: props.hasCompensationData ?? false,
    hasGovernanceDisclosures: props.hasGovernanceDisclosures ?? false,
    hasBoardDiversity: props.hasBoardDiversity ?? false,
    hasAiHrSignals: props.hasAiHrSignals ?? false,
    hasJobPostings: props.hasJobPostings ?? false,
    scanCompletion: props.scanCompletion ?? null,
    recordStatus: props.recordStatus ?? "unknown",
  };

  const { totalScore, categories } = useMemo(() => calculateCharacterScore(inputs), [
    inputs.hasDeiReports, inputs.hasPayTransparency, inputs.hasPromotionData,
    inputs.hasWorkforceDemographics, inputs.hasPublicReporting, inputs.hasPublicStances,
    inputs.hasSentimentData, inputs.hasLayoffSignals, inputs.hasWarnNotices,
    inputs.hasLaborViolations, inputs.hasWorkerLawsuits, inputs.hasBenefitsData,
    inputs.employeeCount, inputs.totalPacSpending, inputs.lobbyingSpend,
    inputs.hasTradeAssociations, inputs.hasGovernmentContracts, inputs.hasDarkMoney,
    inputs.hasIssueSignals, inputs.hasSecInvestigations, inputs.hasDojEnforcement,
    inputs.hasFtcActions, inputs.hasClassActionLawsuits, inputs.hasPayEquitySignals,
    inputs.hasCompensationData, inputs.hasGovernanceDisclosures, inputs.hasBoardDiversity,
    inputs.hasAiHrSignals, inputs.hasJobPostings,
    inputs.scanCompletion, inputs.recordStatus,
  ]);

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <Card className={cn("border-primary/20", totalScore < 40 && "animate-caution")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-display">
            <Shield className="w-5 h-5 text-primary" />
            Corporate Character Score™
          </div>
          {totalScore < 40 && (
            <Badge variant="destructive" className="animate-pulse font-mono text-[10px] tracking-wider">
              CAUTION
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono">
          Evidence-based assessment of organizational character across transparency, conduct, and influence.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score ring + label */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" className="text-border/30" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="5" strokeLinecap="round"
                className={getScoreColor(totalScore)}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-black tabular-nums font-display", getScoreColor(totalScore))}>
                {totalScore}
              </span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold", getScoreColor(totalScore))}>{getScoreLabel(totalScore)}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This score measures what public evidence reveals about this company's character — not a moral judgment, but a transparency audit.
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {categories.map((c) => (
            <CategoryRow key={c.key} category={c} />
          ))}
        </div>

        {/* Workforce Intelligence Brief */}
        <WorkforceIntelligenceBrief
          totalScore={totalScore}
          components={categories.map(c => ({
            label: c.label,
            score: c.score,
            weight: c.weight,
            signals: c.signals,
          }))}
          scanCompletion={props.scanCompletion}
          recordStatus={props.recordStatus}
        />
      </CardContent>
    </Card>
  );
}
