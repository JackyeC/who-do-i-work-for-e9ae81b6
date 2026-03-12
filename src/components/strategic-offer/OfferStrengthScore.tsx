import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DollarSign, FileText, Shield, Heart, Scale, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle
} from "lucide-react";
import type { LegalFlag } from "./CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

interface Props {
  report: OfferClarityReport | null;
  legalFlags: LegalFlag[];
  offerSalary: number;
  annualBaseline: number;
  hasEquity: boolean;
  hasBonus: boolean;
}

interface ScoreCategory {
  key: string;
  label: string;
  icon: typeof DollarSign;
  weight: number;
  score: number;
  findings: string[];
}

const SCORE_LABELS: { min: number; label: string; color: string; icon: typeof CheckCircle2 }[] = [
  { min: 85, label: "Strong Offer", color: "text-[hsl(var(--civic-green))]", icon: CheckCircle2 },
  { min: 70, label: "Good Offer", color: "text-primary", icon: CheckCircle2 },
  { min: 55, label: "Mixed Offer", color: "text-[hsl(var(--civic-yellow))]", icon: AlertTriangle },
  { min: 40, label: "Risky Offer", color: "text-destructive", icon: AlertTriangle },
  { min: 0, label: "High-Risk Offer", color: "text-destructive", icon: XCircle },
];

function getScoreLabel(score: number) {
  return SCORE_LABELS.find(l => score >= l.min) || SCORE_LABELS[SCORE_LABELS.length - 1];
}

function computeCategories(
  report: OfferClarityReport | null,
  flags: LegalFlag[],
  salary: number,
  baseline: number,
  hasEquity: boolean,
  hasBonus: boolean,
): ScoreCategory[] {
  const redFlags = flags.filter(f => f.severity === "red").length;
  const yellowFlags = flags.filter(f => f.severity === "yellow").length;

  // 1. Compensation Competitiveness (25%)
  const compScore = report?.compensation.score ?? (salary > baseline * 1.2 ? 80 : salary > baseline ? 60 : 35);
  const compFindings: string[] = [];
  if (report) {
    compFindings.push(`Market percentile: ${report.compensation.percentile}th`);
    compFindings.push(report.compensation.interpretation.replace(/_/g, " "));
  } else {
    compFindings.push(salary > baseline ? `Salary ${((salary / baseline - 1) * 100).toFixed(0)}% above your safety line` : "Salary at or below your safety line");
  }
  if (hasBonus) compFindings.push("Variable compensation component included");
  else compFindings.push("No bonus or commission structure disclosed");

  // 2. Contract Clarity (15%)
  const clarityScore = report?.transparency.score ?? 50;
  const clarityFindings = report?.transparency.findings.slice(0, 2) || [
    "Contract clarity could not be fully assessed from provided details",
  ];

  // 3. Restrictive Terms Risk (20%)
  const restrictiveScore = Math.max(0, 100 - redFlags * 30 - yellowFlags * 15);
  const restrictiveFindings: string[] = [];
  if (redFlags > 0) restrictiveFindings.push(`${redFlags} high-risk restrictive clause${redFlags > 1 ? "s" : ""} detected`);
  if (yellowFlags > 0) restrictiveFindings.push(`${yellowFlags} cautionary clause${yellowFlags > 1 ? "s" : ""} detected`);
  if (redFlags === 0 && yellowFlags === 0) restrictiveFindings.push("No significant restrictive clauses detected");

  // 4. Benefits Quality (10%)
  const benefitsScore = report?.employeeExperience.score ?? 50;
  const benefitsFindings = report?.employeeExperience.findings.slice(0, 2) || ["Benefits data not fully evaluated"];

  // 5. Offer Mechanics & Fairness (10%)
  const mechanicsScore = salary >= baseline ? 70 : 30;
  const mechanicsFindings: string[] = [];
  mechanicsFindings.push(salary >= baseline ? "Base salary covers your living expenses" : "Base salary falls below your calculated safety line");

  // 6. Career Growth Signals (10%)
  const growthScore = report?.leadershipRepresentation.score ?? 50;
  const growthFindings = report?.leadershipRepresentation.findings.slice(0, 2) || ["Career growth indicators not fully assessed"];

  // 7. Legal / Financial Risk (10%)
  const legalScore = report?.legalRisk.score ?? Math.max(0, 100 - redFlags * 25 - yellowFlags * 10);
  const legalFindings = report?.legalRisk.findings.slice(0, 2) || [];
  if (legalFindings.length === 0) {
    legalFindings.push(redFlags > 0 ? "Legal risk elevated due to restrictive clauses" : "No major legal risk indicators from available data");
  }

  return [
    { key: "compensation", label: "Compensation Competitiveness", icon: DollarSign, weight: 25, score: compScore, findings: compFindings },
    { key: "clarity", label: "Contract Clarity", icon: FileText, weight: 15, score: clarityScore, findings: clarityFindings },
    { key: "restrictive", label: "Restrictive Terms Risk", icon: Shield, weight: 20, score: restrictiveScore, findings: restrictiveFindings },
    { key: "benefits", label: "Benefits Quality", icon: Heart, weight: 10, score: benefitsScore, findings: benefitsFindings },
    { key: "mechanics", label: "Offer Mechanics & Fairness", icon: Scale, weight: 10, score: mechanicsScore, findings: mechanicsFindings },
    { key: "growth", label: "Career Growth Signals", icon: TrendingUp, weight: 10, score: growthScore, findings: growthFindings },
    { key: "legal", label: "Legal / Financial Risk", icon: AlertTriangle, weight: 10, score: legalScore, findings: legalFindings },
  ];
}

export function OfferStrengthScore({ report, legalFlags, offerSalary, annualBaseline, hasEquity, hasBonus }: Props) {
  const categories = computeCategories(report, legalFlags, offerSalary, annualBaseline, hasEquity, hasBonus);
  const totalScore = Math.round(categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0));
  const label = getScoreLabel(totalScore);
  const LabelIcon = label.icon;

  const ringSize = 140;
  const radius = (ringSize - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (totalScore / 100) * circumference;
  const ringColor = totalScore >= 85 ? "hsl(var(--civic-green))" : totalScore >= 70 ? "hsl(var(--primary))" : totalScore >= 55 ? "hsl(var(--civic-yellow))" : "hsl(var(--destructive))";

  return (
    <div className="space-y-5" id="offer-strength-score">
      <Card className="border-2 border-primary/20 rounded-2xl overflow-hidden">
        <CardContent className="p-7">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
                  stroke={ringColor} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold text-foreground">{totalScore}</span>
                <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
              </div>
            </div>

            {/* Label + summary */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">
                Offer Strength Score™
              </h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
                <LabelIcon className={cn("w-4 h-4", label.color)} />
                <span className={cn("text-sm font-semibold", label.color)}>{label.label}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {totalScore >= 85
                  ? "This offer is competitive, clearly structured, and low-risk. You're in a strong negotiating position."
                  : totalScore >= 70
                  ? "This is a solid offer with room for strategic negotiation on specific terms."
                  : totalScore >= 55
                  ? "This offer has strengths but also notable gaps. Review the breakdown before signing."
                  : totalScore >= 40
                  ? "Multiple risk signals detected. Negotiate aggressively or consider walking."
                  : "This offer raises serious concerns. Do not sign without addressing the issues below."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => {
          const Icon = cat.icon;
          const catColor = cat.score >= 70 ? "text-[hsl(var(--civic-green))]" : cat.score >= 50 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive";
          return (
            <Card key={cat.key} className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-xs font-bold", catColor)}>
                    {cat.score}
                  </Badge>
                </div>
                <Progress
                  value={cat.score}
                  className="h-1.5"
                />
                <ul className="space-y-1">
                  {cat.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="text-[10px] text-muted-foreground">{cat.weight}% weight</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
