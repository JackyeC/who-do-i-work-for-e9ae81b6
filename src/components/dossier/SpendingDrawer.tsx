import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SpendingMetric } from "@/types/ReportSchema";

interface SpendingDrawerProps {
  metric: SpendingMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const trendConfig = {
  up: { icon: TrendingUp, label: "Increasing", className: "text-destructive" },
  down: { icon: TrendingDown, label: "Decreasing", className: "text-civic-green" },
  neutral: { icon: Minus, label: "Stable", className: "text-muted-foreground" },
};

export function SpendingDrawer({ metric, open, onOpenChange }: SpendingDrawerProps) {
  if (!metric) return null;

  const trend = trendConfig[metric.trend];
  const TrendIcon = trend.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-black tracking-tight text-foreground">
            {metric.label}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details about {metric.label} spending metric
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Amount */}
          <div className="p-4 border border-border/30 bg-muted/10">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              Amount
            </p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {metric.amount}
            </p>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-3 p-3 border border-border/20">
            <TrendIcon className={`w-5 h-5 ${trend.className}`} />
            <div>
              <p className="text-sm font-semibold text-foreground">Trend: {trend.label}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${trend.className}`}>
                {metric.trend.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              What This Means
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {metric.description}
            </p>
          </div>

          {/* Drill-down CTA */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open(metric.drill_down_url, "_blank", "noopener")}
          >
            <ExternalLink className="w-4 h-4" />
            View Source Data
          </Button>

          <p className="text-[10px] text-muted-foreground/50 font-mono text-center uppercase tracking-wider">
            Public records · Verify at source
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
