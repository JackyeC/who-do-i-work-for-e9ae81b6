import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CrowdSignal {
  signal_category: string;
  total_responses: number;
  flinch_count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  compensation_transparency: "Comp Evasion",
  workforce_stability: "Stability Dodge",
  company_behavior: "Leadership Deflect",
  hiring_activity: "Growth Vagueness",
  public_sentiment: "Culture Buzzwords",
};

interface CrowdSignalBadgeProps {
  companyId: string;
  compact?: boolean;
}

export function CrowdSignalBadge({ companyId, compact = false }: CrowdSignalBadgeProps) {
  const [signals, setSignals] = useState<CrowdSignal[]>([]);

  useEffect(() => {
    if (!companyId) return;

    supabase
      .rpc("get_crowd_flinch_signals", { _company_id: companyId } as any)
      .then(({ data }) => {
        if (data && Array.isArray(data)) {
          setSignals(data as unknown as CrowdSignal[]);
        }
      });
  }, [companyId]);

  if (signals.length === 0) return null;

  const totalFlinches = signals.reduce((sum, s) => sum + s.flinch_count, 0);
  const totalResponses = signals.reduce((sum, s) => sum + s.total_responses, 0);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning" className="gap-1 font-mono text-[10px] cursor-help">
              <Users className="w-3 h-3" />
              {totalFlinches}/{totalResponses} flagged
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-mono text-xs mb-1 font-semibold">Crowd Intelligence</p>
            {signals.map((s) => (
              <p key={s.signal_category} className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[s.signal_category] || s.signal_category}: {s.flinch_count} of {s.total_responses} flagged
              </p>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-civic-yellow" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Crowd Signals
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {signals.map((s) => {
          const pct = Math.round((s.flinch_count / s.total_responses) * 100);
          return (
            <Badge
              key={s.signal_category}
              variant={pct >= 60 ? "destructive" : "warning"}
              className="font-mono text-[10px] gap-1"
            >
              {CATEGORY_LABELS[s.signal_category] || s.signal_category}: {s.flinch_count}/{s.total_responses}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
