import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyResult } from "./EmployerDossierSearch";

/** Fetch pre-computed signal summaries from the signal engine */
function useSignalSummaries(companyId: string) {
  return useQuery({
    queryKey: ['signal-summaries', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('company_signal_scans')
        .select('signal_category, summary, value_normalized, direction, confidence_level')
        .eq('company_id', companyId)
        .in('signal_category', [
          'compensation_transparency', 'hiring_activity', 'workforce_stability',
          'company_behavior', 'innovation_activity', 'public_sentiment',
        ])
        .not('summary', 'is', null);
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

function deriveSignals(company: CompanyResult, preComputed?: any[] | null): string[] {
  // Use pre-computed signal summaries if available
  if (preComputed?.length) {
    // Prioritize actionable signals (low/not_disclosed values, negative direction)
    const actionable = preComputed.filter(
      s => s.value_normalized === 'low' || s.value_normalized === 'not_disclosed' || s.direction === 'decrease'
    );
    const neutral = preComputed.filter(
      s => !actionable.includes(s)
    );
    const ordered = [...actionable, ...neutral];
    return ordered.map(s => s.summary).filter(Boolean).slice(0, 5);
  }

  // Use curated dossier insights if available
  if (company.dossier?.insights?.length) {
    return company.dossier.insights.slice(0, 5);
  }

  const signals: string[] = [];
  if (company.total_pac_spending > 100000) signals.push("Significant political spending detected (transparency risk)");
  if ((company.lobbying_spend ?? 0) > 50000) signals.push("Active lobbying presence — check policy alignment");
  if (!company.employee_count) signals.push("Employee headcount not publicly disclosed");
  if (company.civic_footprint_score < 40) signals.push("Limited public transparency across governance metrics");
  if (company.record_status !== "verified") signals.push("Company record has not been fully verified yet");
  if ((company.career_intelligence_score ?? 5) < 5) signals.push("Below-average career intelligence indicators");
  if (signals.length === 0) {
    signals.push("No major red flags detected in available data");
    signals.push("Continue due diligence with role-specific research");
  }
  return signals.slice(0, 5);
}

interface BeforeYouAcceptBlockProps {
  company: CompanyResult;
}

export function BeforeYouAcceptBlock({ company }: BeforeYouAcceptBlockProps) {
  const { data: preComputedSignals } = useSignalSummaries(company.id);
  const signals = deriveSignals(company, preComputedSignals);

  return (
    <div className="max-w-2xl mx-auto mt-5">
      <h3 className="font-display font-bold text-foreground text-base sm:text-lg flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
        Before you accept:
      </h3>
      <ul className="space-y-2">
        {signals.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-yellow))] shrink-0" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
