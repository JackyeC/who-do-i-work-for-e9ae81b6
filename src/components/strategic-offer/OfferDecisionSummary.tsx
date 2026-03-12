import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardCheck, CheckCircle2, AlertTriangle, XCircle,
  ShieldCheck, Scale, MessageSquare, FileSearch, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalFlag } from "./CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

interface Props {
  companyName: string;
  roleTitle: string;
  offerStrengthScore: number;
  report: OfferClarityReport | null;
  legalFlags: LegalFlag[];
  offerSalary: number;
  annualBaseline: number;
  hasEquity: boolean;
  hasBonus: boolean;
}

type Verdict = "Ready to Sign" | "Worth Negotiating" | "Proceed Carefully" | "Get More Information" | "High-Risk Offer";

const VERDICT_CONFIG: Record<Verdict, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  "Ready to Sign": { color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/30", icon: CheckCircle2 },
  "Worth Negotiating": { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", icon: Scale },
  "Proceed Carefully": { color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30", icon: AlertTriangle },
  "Get More Information": { color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30", icon: FileSearch },
  "High-Risk Offer": { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: XCircle },
};

function deriveVerdict(score: number, redFlags: number, salary: number, baseline: number): Verdict {
  if (score >= 85 && redFlags === 0) return "Ready to Sign";
  if (score >= 70 && redFlags <= 1) return "Worth Negotiating";
  if (score >= 55) return "Proceed Carefully";
  if (score >= 40 || salary < baseline) return "Get More Information";
  return "High-Risk Offer";
}

function deriveConfidence(report: OfferClarityReport | null, hasCompanyMatch: boolean): string {
  if (report && hasCompanyMatch) return "High";
  if (report || hasCompanyMatch) return "Medium";
  return "Low";
}

export function OfferDecisionSummary(props: Props) {
  const { companyName, roleTitle, offerStrengthScore, report, legalFlags, offerSalary, annualBaseline, hasEquity, hasBonus } = props;
  const redFlags = legalFlags.filter(f => f.severity === "red");
  const yellowFlags = legalFlags.filter(f => f.severity === "yellow");
  const verdict = deriveVerdict(offerStrengthScore, redFlags.length, offerSalary, annualBaseline);
  const verdictStyle = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictStyle.icon;
  const confidence = deriveConfidence(report, !!report);

  // Build top strengths
  const strengths: string[] = [];
  if (offerSalary >= annualBaseline * 1.15) strengths.push(`Salary ${((offerSalary / annualBaseline - 1) * 100).toFixed(0)}% above your safety line`);
  if (hasEquity) strengths.push("Equity component included");
  if (hasBonus) strengths.push("Variable compensation structure");
  if (redFlags.length === 0) strengths.push("No high-risk legal clauses");
  if (report?.compensation.percentile && report.compensation.percentile >= 70) strengths.push(`${report.compensation.percentile}th percentile compensation`);
  if (report?.employeeExperience.score && report.employeeExperience.score >= 70) strengths.push("Positive employee experience signals");

  // Build top risks
  const risks: string[] = [];
  if (offerSalary < annualBaseline) risks.push("Salary below your calculated safety line");
  redFlags.forEach(f => risks.push(f.title));
  yellowFlags.slice(0, 2).forEach(f => risks.push(f.title));
  if (report?.legalRisk.score && report.legalRisk.score < 50) risks.push("Elevated legal risk environment");

  // Build next moves
  const moves: string[] = [];
  if (redFlags.length > 0) moves.push("Negotiate the restrictive clauses flagged in the Legal Audit");
  if (offerSalary < annualBaseline * 1.1) moves.push("Negotiate base salary or supplemental compensation");
  if (hasEquity) moves.push("Clarify equity grant type, vesting, and valuation");
  moves.push("Ask the tailored questions listed above before making a decision");
  if (redFlags.length >= 2) moves.push("Consider having an employment attorney review the offer");

  return (
    <div id="decision-summary">
      <Card className="rounded-2xl border-2 border-primary/20 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-display font-bold tracking-tight flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Should You Sign?
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {roleTitle} at {companyName}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs font-bold px-3 py-1 gap-1.5", verdictStyle.color, verdictStyle.border, verdictStyle.bg)}
            >
              <VerdictIcon className="w-3.5 h-3.5" />
              {verdict}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Score + Confidence */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-2xl font-display font-bold text-foreground">{offerStrengthScore}</p>
              <p className="text-[10px] text-muted-foreground">Offer Strength™</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-2xl font-display font-bold text-foreground">{report?.overallScore || "—"}</p>
              <p className="text-[10px] text-muted-foreground">Career Alignment</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className={cn("text-2xl font-display font-bold",
                confidence === "High" ? "text-[hsl(var(--civic-green))]" :
                confidence === "Medium" ? "text-[hsl(var(--civic-yellow))]" : "text-muted-foreground"
              )}>{confidence}</p>
              <p className="text-[10px] text-muted-foreground">Confidence</p>
            </div>
          </div>

          <Separator />

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[hsl(var(--civic-green))]" />
                Biggest Strengths
              </h4>
              {strengths.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-green))] shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                Biggest Risks
              </h4>
              {risks.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Next Moves */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-primary" />
              Best Next Moves
            </h4>
            {moves.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {m}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-[11px] text-muted-foreground">
              This summary provides educational insights based on publicly available data and the terms you provided. It does not constitute legal, financial, or employment advice. For complex or high-risk clauses, consult an employment attorney.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
