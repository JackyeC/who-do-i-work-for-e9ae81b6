import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type PVSResult } from "@/lib/promotionVelocityScore";
import { cn } from "@/lib/utils";

interface Props {
  result: PVSResult;
  companyName: string;
}

const bandColors: Record<string, string> = {
  strong_growth: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30",
  healthy_mobility: "text-[hsl(var(--civic-blue))] bg-[hsl(var(--civic-blue))]/10 border-[hsl(var(--civic-blue))]/30",
  mixed_mobility: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30",
  slow_advancement: "text-[hsl(var(--civic-red))] bg-[hsl(var(--civic-red))]/10 border-[hsl(var(--civic-red))]/30",
  stagnation_risk: "text-destructive bg-destructive/10 border-destructive/30",
};

const barColor: Record<string, string> = {
  strong_growth: "bg-[hsl(var(--civic-green))]",
  healthy_mobility: "bg-[hsl(var(--civic-blue))]",
  mixed_mobility: "bg-[hsl(var(--civic-yellow))]",
  slow_advancement: "bg-[hsl(var(--civic-red))]",
  stagnation_risk: "bg-destructive",
};

export function PromotionVelocityCard({ result, companyName }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Promotion Velocity Score™
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Measures internal career growth speed using 6 weighted components from public filings, career pages, and workforce signals.
            </TooltipContent>
          </Tooltip>
          <Badge variant="outline" className="text-[10px] ml-auto">{result.confidence} Confidence</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big score */}
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-foreground">{result.score}</div>
          <div>
            <Badge className={cn("text-xs", bandColors[result.band])}>{result.label}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{companyName}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2.5">
          {result.breakdown.map((b) => (
            <div key={b.component}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{b.component}</span>
                <span className="text-xs font-medium text-foreground">{b.raw}/100 <span className="text-muted-foreground">({(b.weight * 100).toFixed(0)}%)</span></span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barColor[result.band])} style={{ width: `${b.raw}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Promotion Velocity Score™ — 7-Layer Evidence Model
        </p>
      </CardContent>
    </Card>
  );
}
