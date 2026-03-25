import { cn } from "@/lib/utils";
import type { PVSResult } from "@/lib/promotionVelocityScore";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

const bandStyles: Record<PVSResult["band"], { bg: string; text: string; ring: string }> = {
  strong_growth: { bg: "bg-civic-green/10", text: "text-civic-green", ring: "ring-civic-green/30" },
  healthy_mobility: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/30" },
  mixed_mobility: { bg: "bg-civic-yellow/10", text: "text-civic-yellow", ring: "ring-civic-yellow/30" },
  slow_advancement: { bg: "bg-civic-yellow/10", text: "text-civic-yellow", ring: "ring-orange-500/30" },
  stagnation_risk: { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/30" },
};

const confidenceConfig = {
  High: { icon: ShieldCheck, class: "text-civic-green" },
  Medium: { icon: Shield, class: "text-civic-yellow" },
  Low: { icon: ShieldAlert, class: "text-muted-foreground" },
};

export function PromotionVelocityGauge({ result }: { result: PVSResult }) {
  const style = bandStyles[result.band];
  const ConfIcon = confidenceConfig[result.confidence].icon;
  const TrendIcon = result.score >= 70 ? TrendingUp : result.score >= 40 ? Minus : TrendingDown;

  return (
    <div className={cn("rounded-lg border ring-1 p-6", style.bg, style.ring)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Promotion Velocity Score™
          </p>
          <div className="flex items-baseline gap-3">
            <span className={cn("text-5xl font-black tabular-nums tracking-tight", style.text)}>
              {result.score}
            </span>
            <span className="text-sm text-muted-foreground font-medium">/ 100</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn("gap-1.5 text-xs font-semibold", style.text)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {result.label}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs">
            <ConfIcon className={cn("w-3.5 h-3.5", confidenceConfig[result.confidence].class)} />
            <span className="text-muted-foreground">{result.confidence} Confidence</span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", {
            "bg-civic-green": result.band === "strong_growth",
            "bg-primary": result.band === "healthy_mobility",
            "bg-civic-yellow": result.band === "mixed_mobility" || result.band === "slow_advancement",
            "bg-destructive": result.band === "stagnation_risk",
          })}
          style={{ width: `${result.score}%` }}
        />
        {/* Band markers */}
        {[40, 55, 70, 85].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 h-full w-px bg-foreground/10"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-medium">
        <span>Stagnation</span>
        <span>Slow</span>
        <span>Mixed</span>
        <span>Healthy</span>
        <span>Strong</span>
      </div>
    </div>
  );
}
