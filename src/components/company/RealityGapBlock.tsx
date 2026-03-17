import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ReportTeaserGate } from "@/components/ReportTeaserGate";
import { Scale, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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

type GapLevel = "aligned" | "mixed" | "medium" | "large";

function gapConfig(gap: string) {
  switch (gap) {
    case "large":
      return { icon: XCircle, label: "Large gap", color: "text-destructive", bg: "bg-destructive/10 text-destructive border-destructive/30", border: "border-l-destructive/60" };
    case "medium":
      return { icon: AlertTriangle, label: "Medium gap", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30", border: "border-l-[hsl(var(--civic-yellow))]/60" };
    case "mixed":
      return { icon: AlertTriangle, label: "Mixed signals", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30", border: "border-l-[hsl(var(--civic-yellow))]/40" };
    default:
      return { icon: CheckCircle2, label: "Aligned", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", border: "border-l-[hsl(var(--civic-green))]/40" };
  }
}

function StanceRow({ stance }: { stance: { id: string; topic: string; public_position: string; spending_reality: string; gap: string } }) {
  const config = gapConfig(stance.gap);
  const Icon = config.icon;

  return (
    <div className={`px-5 py-4 border-l-2 ${config.border}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">{stance.topic}</span>
        </div>
        <Badge className={`text-[10px] shrink-0 ${config.bg}`}>
          {config.label}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">What they say</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{stance.public_position}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">What records show</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{stance.spending_reality}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-mono">Confidence: Medium — based on public spending patterns</p>
    </div>
  );
}

export function RealityGapBlock({ companyId, companyName, updatedAt }: RealityGapBlockProps) {
  const { data: stances } = useQuery({
    queryKey: ["reality-gap", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("*")
        .eq("company_id", companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (!stances || stances.length === 0) return null;

  const recency = getRecency(updatedAt);

  // Sort: large gaps first, then medium, mixed, aligned
  const gapOrder: Record<string, number> = { large: 0, medium: 1, mixed: 2, aligned: 3 };
  const sorted = [...stances].sort((a, b) => (gapOrder[a.gap] ?? 4) - (gapOrder[b.gap] ?? 4));

  const hasGaps = sorted.some((s) => s.gap !== "aligned");
  const gapCount = sorted.filter((s) => s.gap !== "aligned").length;
  const freeStances = sorted.slice(0, 3);
  const gatedStances = sorted.slice(3);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reality Gap Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {hasGaps && (
            <Badge variant="outline" className="text-[10px] font-mono tracking-wider text-[hsl(var(--civic-yellow))]">
              {gapCount} gap{gapCount !== 1 ? "s" : ""} detected
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            Data: {recency}
          </Badge>
        </div>
      </div>

      <p className="px-5 pt-3 pb-1 text-xs text-muted-foreground">
        Comparing {companyName}'s public positioning against documented spending and lobbying records.
      </p>

      <div className="divide-y divide-border/30 mt-2">
        {freeStances.map((stance) => (
          <StanceRow key={stance.id} stance={stance} />
        ))}
      </div>

      {gatedStances.length > 0 && (
        <ReportTeaserGate
          companyName={companyName}
          teaser={
            <p className="text-xs text-muted-foreground px-5 pb-3">
              +{gatedStances.length} more comparison{gatedStances.length > 1 ? "s" : ""} available
            </p>
          }
          hiddenSignalCount={gatedStances.length}
        >
          <div className="divide-y divide-border/30">
            {gatedStances.map((stance) => (
              <StanceRow key={stance.id} stance={stance} />
            ))}
          </div>
        </ReportTeaserGate>
      )}

      <div className="px-5 py-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground text-center italic">
          Signals do not imply wrongdoing. Data reflects public records and may be incomplete.
        </p>
      </div>
    </div>
  );
}
