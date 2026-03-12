import { cn } from "@/lib/utils";
import type { FRSResult } from "@/lib/flightRiskScore";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ShieldAlert, Shield,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";

const bandStyles: Record<FRSResult["band"], { bg: string; text: string; ring: string; bar: string }> = {
  stable_builder: { bg: "bg-civic-green/10", text: "text-civic-green", ring: "ring-civic-green/30", bar: "bg-civic-green" },
  healthy_mobility: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/30", bar: "bg-primary" },
  moderate_churn: { bg: "bg-civic-yellow/10", text: "text-civic-yellow", ring: "ring-civic-yellow/30", bar: "bg-civic-yellow" },
  high_churn: { bg: "bg-orange-500/10", text: "text-orange-600", ring: "ring-orange-500/30", bar: "bg-orange-500" },
  burn_replace: { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/30", bar: "bg-destructive" },
};

const confIcon = {
  High: { Icon: ShieldCheck, cls: "text-civic-green" },
  Medium: { Icon: Shield, cls: "text-civic-yellow" },
  Low: { Icon: ShieldAlert, cls: "text-muted-foreground" },
};

export function FlightRiskGauge({ result }: { result: FRSResult }) {
  const style = bandStyles[result.band];
  const { Icon: ConfIcon, cls: confCls } = confIcon[result.confidence];
  const Trend = result.score >= 70 ? TrendingUp : result.score >= 40 ? Minus : TrendingDown;

  return (
    <div className={cn("rounded-lg border ring-1 p-6", style.bg, style.ring)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Flight Risk Score™
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
            <Trend className="w-3.5 h-3.5" />
            {result.label}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs">
            <ConfIcon className={cn("w-3.5 h-3.5", confCls)} />
            <span className="text-muted-foreground">{result.confidence} Confidence</span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", style.bar)}
          style={{ width: `${result.score}%` }}
        />
        {[40, 55, 70, 85].map((m) => (
          <div key={m} className="absolute top-0 h-full w-px bg-foreground/10" style={{ left: `${m}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground font-medium">
        <span>Burn & Replace</span>
        <span>High Churn</span>
        <span>Moderate</span>
        <span>Healthy</span>
        <span>Stable</span>
      </div>
    </div>
  );
}
