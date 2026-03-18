import { ThumbsUp, ShieldAlert } from "lucide-react";
import type { CompanyResult } from "./EmployerDossierSearch";

function deriveFit(company: CompanyResult): { strengths: string[]; risks: string[] } {
  // Use curated dossier data if available
  if (company.dossier?.fit_signals?.length || company.dossier?.risk_signals?.length) {
    return {
      strengths: (company.dossier.fit_signals || []).slice(0, 3),
      risks: (company.dossier.risk_signals || []).slice(0, 3),
    };
  }

  const score = company.career_intelligence_score ?? company.civic_footprint_score / 10;
  const strengths: string[] = [];
  const risks: string[] = [];

  if (score >= 7) strengths.push("You value transparent, well-governed employers");
  if (company.civic_footprint_score >= 60) strengths.push("You thrive where public accountability is strong");
  if (company.employee_count) strengths.push("You value brand exposure and visible workforce data");
  if (strengths.length === 0) strengths.push("You thrive in ambiguous environments and can navigate uncertainty");

  if (company.total_pac_spending > 50000) risks.push("Political spending may not align with your values");
  if (score < 5) risks.push("You need clear promotion paths and transparent comp structures");
  if (company.record_status !== "verified") risks.push("You prefer predictable org structures with verified data");
  if (risks.length === 0) risks.push("No significant risk factors identified for most candidates");

  return { strengths: strengths.slice(0, 3), risks: risks.slice(0, 3) };
}

interface WhatThisMeansForYouProps {
  company: CompanyResult;
}

export function WhatThisMeansForYou({ company }: WhatThisMeansForYouProps) {
  const { strengths, risks } = deriveFit(company);

  return (
    <div className="max-w-2xl mx-auto mt-5 grid sm:grid-cols-2 gap-4">
      <div className="bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/20 rounded-lg p-4">
        <h4 className="font-display font-bold text-sm text-[hsl(var(--civic-green))] flex items-center gap-1.5 mb-2">
          <ThumbsUp className="w-3.5 h-3.5" /> Strong fit if you:
        </h4>
        <ul className="space-y-1.5">
          {strengths.map((s, i) => (
            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[hsl(var(--civic-green))] shrink-0" />{s}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
        <h4 className="font-display font-bold text-sm text-destructive flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Risk if you:
        </h4>
        <ul className="space-y-1.5">
          {risks.map((r, i) => (
            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />{r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
