import { getSituationsFromStorage, SITUATION_LABELS, SITUATION_ICONS, type Situation } from "@/lib/policyScoreEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

const SITUATION_CALLOUTS: Record<Situation, string> = {
  compensation: "Watch for pay transparency signals and below-market compensation patterns.",
  stability: "Pay attention to layoff history, WARN notices, and leadership turnover.",
  caregiver: "Look for flexibility signals, leave policies, and caregiving support indicators.",
  "early-career": "Focus on growth potential, mentorship culture, and learning investment signals.",
  "career-switcher": "Evaluate onboarding support, role clarity, and transferable skill recognition.",
  "values-first": "Check for contradictions between public commitments and lobbying behavior.",
  "risk-aware": "Review legal patterns, governance gaps, and contract clause risks.",
  leadership: "Assess board oversight quality, executive stability, and advancement signals.",
  "culture-safety": "Look for discrimination history, harassment patterns, and trust indicators.",
};

interface Props {
  companyName?: string;
}

export function SituationContextBanner({ companyName }: Props) {
  const situations = getSituationsFromStorage();
  if (situations.length === 0) return null;

  return (
    <Card className="rounded-xl border-primary/20 bg-primary/[0.02]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Your Priorities</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {situations.map((s) => (
            <Badge key={s} variant="outline" className="text-xs text-primary border-primary/30 gap-1">
              <span>{SITUATION_ICONS[s]}</span>
              {SITUATION_LABELS[s]}
            </Badge>
          ))}
        </div>
        <div className="space-y-1.5">
          {situations.map((s) => (
            <p key={s} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full bg-primary shrink-0" />
              {companyName ? SITUATION_CALLOUTS[s].replace("Watch for", `At ${companyName}, watch for`).replace("Look for", `At ${companyName}, look for`).replace("Check for", `At ${companyName}, check for`).replace("Review", `At ${companyName}, review`).replace("Assess", `At ${companyName}, assess`).replace("Focus on", `At ${companyName}, focus on`).replace("Evaluate", `At ${companyName}, evaluate`).replace("Pay attention", `At ${companyName}, pay attention`) : SITUATION_CALLOUTS[s]}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
