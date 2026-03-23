import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { LegalFlag } from "./CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

interface Props {
  legalFlags: LegalFlag[];
  report: OfferClarityReport | null;
  offerSalary: number;
  annualBaseline: number;
  hasEquity: boolean;
  hasBonus: boolean;
  hasInterview: boolean;
}

interface GreenFlag {
  id: string;
  label: string;
  description: string;
}

function detectGreenFlags(props: Props): GreenFlag[] {
  const flags: GreenFlag[] = [];
  const { legalFlags, report, offerSalary, annualBaseline, hasEquity, hasBonus, hasInterview } = props;
  const redCount = legalFlags.filter(f => f.severity === "red").length;

  if (offerSalary > annualBaseline * 1.15)
    flags.push({ id: "salary", label: "Salary Clearly Above Safety Line", description: `Base salary is ${((offerSalary / annualBaseline - 1) * 100).toFixed(0)}% above your calculated minimum. Strong financial foundation.` });

  if (hasBonus)
    flags.push({ id: "bonus", label: "Bonus Structure Included", description: "The offer includes a variable compensation component, adding upside potential beyond base salary." });

  if (hasEquity)
    flags.push({ id: "equity", label: "Equity Component Offered", description: "Equity participation is included. Review vesting and grant details in the Equity section." });

  if (hasInterview)
    flags.push({ id: "interview", label: "Standard Interview Process", description: "You went through an interview process. This is a basic legitimacy signal." });

  if (redCount === 0)
    flags.push({ id: "clean-legal", label: "No High-Risk Clauses Detected", description: "No mandatory arbitration, aggressive non-competes, or stay-or-pay traps were flagged." });

  if (report) {
    if (report.compensation.percentile >= 70)
      flags.push({ id: "market-strong", label: "Above-Market Compensation", description: `Your offer sits at the ${report.compensation.percentile}th percentile relative to market data.` });

    if (report.transparency.score >= 70)
      flags.push({ id: "transparency", label: "Good Employer Transparency", description: "The company shows above-average transparency in public disclosures and governance." });

    if (report.legalRisk.score >= 80)
      flags.push({ id: "low-legal", label: "Low Legal Risk Environment", description: "Minimal legal controversies or enforcement actions on record." });

    if (report.leadershipRepresentation.score >= 70)
      flags.push({ id: "leadership", label: "Diverse Leadership Representation", description: "Leadership composition signals above-average representation." });

    if (report.employeeExperience.score >= 70)
      flags.push({ id: "experience", label: "Positive Employee Experience Signals", description: "Worker sentiment and experience indicators are above average for the industry." });
  }

  return flags;
}

export function GreenFlagsPanel(props: Props) {
  const flags = detectGreenFlags(props);

  if (flags.length === 0) return null;

  return (
    <div id="green-flags">
      <Card className="rounded-2xl border-[hsl(var(--civic-green))]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[hsl(var(--civic-green))]" />
            Green Flags
            <Badge variant="outline" className="text-xs ml-auto text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5">
              {flags.length} detected
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Positive signals detected in this offer.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {flags.map(flag => (
            <div
              key={flag.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/10"
            >
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{flag.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
