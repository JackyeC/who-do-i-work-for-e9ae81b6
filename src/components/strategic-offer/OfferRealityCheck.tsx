import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Search, ShieldAlert, Info, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalFlag } from "./CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";
import type { RiskLevel } from "./OfferRiskSignals";
import type { Situation } from "@/lib/policyScoreEngine";
import { SITUATION_LABELS } from "@/lib/policyScoreEngine";

type OfferPosition = "Strong Offer" | "Fair Offer" | "Needs Review" | "Proceed Carefully";

interface Props {
  offerStrengthScore: number;
  offerSalary: number;
  annualBaseline: number;
  legalFlags: LegalFlag[];
  report: OfferClarityReport | null;
  hasEquity: boolean;
  hasBonus: boolean;
  companyName: string;
  roleTitle: string;
  riskLevel: RiskLevel | null;
  salaryTransparency: "transparent" | "delayed" | "unclear";
  internalConsistency: "aligned" | "lower" | "unclear";
  situations?: Situation[];
}

const POSITION_CONFIG: Record<OfferPosition, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  "Strong Offer": { color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/40", icon: CheckCircle2 },
  "Fair Offer": { color: "text-primary", bg: "bg-primary/10", border: "border-primary/40", icon: TrendingUp },
  "Needs Review": { color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/40", icon: Search },
  "Proceed Carefully": { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40", icon: ShieldAlert },
};

function derivePosition(score: number, redFlags: number, salary: number, baseline: number, riskLevel: RiskLevel | null): OfferPosition {
  if (score >= 80 && redFlags === 0 && riskLevel !== "elevated") return "Strong Offer";
  if (score >= 65 && redFlags <= 1) return "Fair Offer";
  if (score >= 45 || salary < baseline) return "Needs Review";
  return "Proceed Carefully";
}

function deriveConfidence(report: OfferClarityReport | null, hasSignals: boolean, salaryProvided: boolean): "High" | "Medium" | "Low" {
  const factors = [!!report, hasSignals, salaryProvided].filter(Boolean).length;
  if (factors >= 3) return "High";
  if (factors >= 1) return "Medium";
  return "Low";
}

function buildSummary(position: OfferPosition, companyName: string, gaps: string[]): string {
  const base: Record<OfferPosition, string> = {
    "Strong Offer": `This offer from ${companyName} shows competitive compensation, clean legal terms, and positive employer signals.`,
    "Fair Offer": `This offer from ${companyName} is generally solid but has areas worth exploring before you sign.`,
    "Needs Review": `This offer from ${companyName} has gaps that are worth understanding before making a decision.`,
    "Proceed Carefully": `This offer from ${companyName} raises several questions you may want answered before moving forward.`,
  };
  const gapNote = gaps.length > 0 ? ` Key areas to explore: ${gaps.slice(0, 2).join("; ")}.` : "";
  return base[position] + gapNote;
}

export function OfferRealityCheck(props: Props) {
  const { offerStrengthScore, offerSalary, annualBaseline, legalFlags, report, hasEquity, hasBonus, companyName, roleTitle, riskLevel, salaryTransparency, internalConsistency, situations = [] } = props;

  const redFlags = legalFlags.filter(f => f.severity === "red").length;
  const position = derivePosition(offerStrengthScore, redFlags, offerSalary, annualBaseline, riskLevel);
  const confidence = deriveConfidence(report, riskLevel !== null, offerSalary > 0);
  const config = POSITION_CONFIG[position];
  const PositionIcon = config.icon;

  // Build gaps
  const gaps: string[] = [];
  if (offerSalary > 0 && offerSalary < annualBaseline) gaps.push("base salary below your safety line");
  if (!hasBonus && !hasEquity) gaps.push("no variable compensation disclosed");
  if (salaryTransparency === "delayed") gaps.push("salary was not shared upfront");
  if (internalConsistency === "lower") gaps.push("offer appears below internal benchmarks");
  if (riskLevel === "elevated") gaps.push("elevated employer risk signals");
  if (redFlags > 0) gaps.push(`${redFlags} high-risk legal clause${redFlags > 1 ? "s" : ""}`);

  // Situation-aware gap emphasis
  if (situations.includes("caregiver") && !hasBonus) gaps.push("no benefits or flexibility signals visible in this offer");
  if (situations.includes("compensation") && offerSalary > 0 && offerSalary < annualBaseline * 1.1) gaps.push("offer may not maximize your earning potential");
  if (situations.includes("stability") && riskLevel === "moderate") gaps.push("moderate employer stability concerns for stability seekers");
  if (situations.includes("early-career") && !hasEquity) gaps.push("no equity component — consider growth vs. pay tradeoff");
  // Build evaluation badges
  const marketPosition = offerSalary > 0
    ? report?.compensation.percentile
      ? (report.compensation.percentile >= 60 ? "Above Market" : report.compensation.percentile >= 40 ? "Within Market" : "Below Market")
      : (offerSalary >= annualBaseline * 1.15 ? "Above Market" : offerSalary >= annualBaseline ? "Within Market" : "Below Market")
    : null;

  const summary = buildSummary(position, companyName, gaps);

  return (
    <Card className={cn("rounded-2xl border-2 overflow-hidden", config.border)}>
      <CardContent className="p-6 space-y-5">
        {/* Hero header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Offer Reality Check™</p>
            <h2 className="text-2xl font-display font-bold text-foreground">{position}</h2>
            <p className="text-xs text-muted-foreground">{roleTitle} at {companyName}</p>
          </div>
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", config.bg)}>
            <PositionIcon className={cn("w-7 h-7", config.color)} />
          </div>
        </div>

        {/* Score + Confidence row */}
        <div className="flex gap-3">
          <div className="flex-1 text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-display font-bold text-foreground">{offerStrengthScore}</p>
            <p className="text-xs text-muted-foreground">Offer Strength</p>
          </div>
          <div className="flex-1 text-center p-3 bg-muted/50 rounded-xl">
            <p className={cn("text-2xl font-display font-bold",
              confidence === "High" ? "text-[hsl(var(--civic-green))]" :
              confidence === "Medium" ? "text-[hsl(var(--civic-yellow))]" : "text-muted-foreground"
            )}>{confidence}</p>
            <p className="text-xs text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>

        {/* Evaluation badges */}
        <div className="flex flex-wrap gap-2">
          {marketPosition && (
            <Badge variant="outline" className={cn("text-xs",
              marketPosition === "Above Market" ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" :
              marketPosition === "Below Market" ? "text-destructive border-destructive/30" : "text-muted-foreground"
            )}>
              Market: {marketPosition}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs",
            internalConsistency === "aligned" ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" :
            internalConsistency === "lower" ? "text-destructive border-destructive/30" : "text-muted-foreground"
          )}>
            Internal: {internalConsistency === "aligned" ? "Aligned" : internalConsistency === "lower" ? "Lower" : "Unclear"}
          </Badge>
          <Badge variant="outline" className={cn("text-xs",
            salaryTransparency === "transparent" ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" :
            salaryTransparency === "delayed" ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" : "text-muted-foreground"
          )}>
            Transparency: {salaryTransparency === "transparent" ? "Transparent" : salaryTransparency === "delayed" ? "Delayed" : "Unclear"}
          </Badge>
          {riskLevel && (
            <Badge variant="outline" className={cn("text-xs",
              riskLevel === "low" ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" :
              riskLevel === "elevated" ? "text-destructive border-destructive/30" : "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"
            )}>
              Risk: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </Badge>
          )}
        </div>

        {/* Key gaps */}
        {gaps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Worth Exploring
            </h4>
            {gaps.slice(0, 4).map((gap, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-yellow))] shrink-0" />
                {gap.charAt(0).toUpperCase() + gap.slice(1)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
