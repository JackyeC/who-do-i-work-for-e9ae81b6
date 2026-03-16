import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeCoverageBalance, LEAN_LABELS, type PoliticalLean } from "@/lib/mediaBiasDatabase";

interface CoverageBalanceChartProps {
  sourceUrls: string[];
  className?: string;
}

const BAR_COLORS: Record<PoliticalLean, string> = {
  left: "bg-blue-500",
  lean_left: "bg-blue-400",
  center: "bg-[hsl(var(--civic-green))]",
  lean_right: "bg-red-400",
  right: "bg-red-500",
};

export function CoverageBalanceChart({ sourceUrls, className }: CoverageBalanceChartProps) {
  const balance = useMemo(() => computeCoverageBalance(sourceUrls), [sourceUrls]);

  if (balance.total === 0) return null;

  const leans: PoliticalLean[] = ["left", "lean_left", "center", "lean_right", "right"];
  const knownTotal = balance.total - balance.unknown;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          Coverage Perspective Distribution
          {balance.narrativeRisk && (
            <Badge variant="destructive" className="text-[9px] gap-1">
              <AlertTriangle className="w-3 h-3" />
              Narrative Risk
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Stacked bar */}
        <div className="flex rounded-full overflow-hidden h-3">
          {leans.map((lean) => {
            const count = balance[lean];
            if (count === 0) return null;
            const pct = (count / knownTotal) * 100;
            return (
              <div
                key={lean}
                className={cn("transition-all", BAR_COLORS[lean])}
                style={{ width: `${pct}%` }}
                title={`${LEAN_LABELS[lean]}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
          {leans.map((lean) => {
            const count = balance[lean];
            if (count === 0) return null;
            const pct = knownTotal > 0 ? Math.round((count / knownTotal) * 100) : 0;
            return (
              <span key={lean} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", BAR_COLORS[lean])} />
                <span className="text-muted-foreground">{LEAN_LABELS[lean]}: {pct}%</span>
              </span>
            );
          })}
          {balance.unknown > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Unknown: {balance.unknown}</span>
            </span>
          )}
        </div>

        {balance.narrativeRisk && (
          <p className="text-[10px] text-destructive">
            ⚠ Over 80% of coverage originates from one political perspective. Independent reporting may be limited.
          </p>
        )}

        <p className="text-[10px] text-muted-foreground">
          {balance.total} articles analyzed · Perspective ratings from AllSides, Ad Fontes Media, and Media Bias Fact Check
        </p>
      </CardContent>
    </Card>
  );
}
