import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ReportTeaserGate } from "@/components/ReportTeaserGate";

interface RealityGapBlockProps {
  companyId: string;
  companyName: string;
  updatedAt?: string;
}

function getRecency(updatedAt?: string): string {
  if (!updatedAt) return "Unknown";
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 60 days";
  return "6+ months";
}

export function RealityGapBlock({ companyId, companyName, updatedAt }: RealityGapBlockProps) {
  const { data: stances } = useQuery({
    queryKey: ["reality-gap", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("*")
        .eq("company_id", companyId)
        .in("gap", ["medium", "large"]);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (!stances || stances.length === 0) return null;

  const recency = getRecency(updatedAt);
  const freeStances = stances.slice(0, 3);
  const gatedStances = stances.slice(3);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What they say vs. what signals show</p>
        <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
          Data: {recency}
        </Badge>
      </div>

      <div className="divide-y divide-border/30">
        {freeStances.map((stance) => (
          <div key={stance.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">{stance.topic}</span>
              <Badge
                variant={stance.gap === "large" ? "destructive" : "warning"}
                className="text-[10px] shrink-0"
              >
                {stance.gap === "large" ? "Large gap" : "Medium gap"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Says</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{stance.public_position}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Records show</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{stance.spending_reality}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">Confidence: Medium</p>
          </div>
        ))}
      </div>

      {gatedStances.length > 0 && (
        <ReportTeaserGate
          companyName={companyName}
          teaser={
            <p className="text-xs text-muted-foreground px-5 pb-3">
              +{gatedStances.length} more gap{gatedStances.length > 1 ? "s" : ""} identified
            </p>
          }
          hiddenSignalCount={gatedStances.length}
        >
          <div className="divide-y divide-border/30">
            {gatedStances.map((stance) => (
              <div key={stance.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">{stance.topic}</span>
                  <Badge variant={stance.gap === "large" ? "destructive" : "warning"} className="text-[10px] shrink-0">
                    {stance.gap === "large" ? "Large gap" : "Medium gap"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Says</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{stance.public_position}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Records show</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{stance.spending_reality}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportTeaserGate>
      )}
    </div>
  );
}
