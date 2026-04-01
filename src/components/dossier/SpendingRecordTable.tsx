import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpendingDrawer } from "./SpendingDrawer";
import type { SpendingMetric } from "@/types/ReportSchema";

interface SpendingRecordTableProps {
  metrics: SpendingMetric[];
  effectiveTaxRate?: string | null;
  companyName?: string;
  className?: string;
}

const METRIC_WHY_IT_MATTERS: Record<string, string> = {
  Lobbying:
    "Lobbying spend reveals which policies a company is trying to influence — and whether those align with what they tell employees and the public.",
  "PAC Spending":
    "PAC contributions show where a company directs political power. Follow the money to see whose agenda they're funding.",
  "Gov Contracts":
    "Federal contracts mean taxpayer dollars. Understanding the scale and agencies involved shows how embedded a company is in government.",
  Subsidies:
    "Public subsidies are tax incentives funded by communities. Consider whether the company's workforce investments match the public investment they've received.",
  "Eff. Tax Rate":
    "A company's effective tax rate shows what they actually pay vs. what the law intends. Low rates may signal aggressive tax strategies.",
};

function hasDetailData(metric: SpendingMetric): boolean {
  const amt = metric.amount.replace(/[^0-9.]/g, "");
  return parseFloat(amt) > 0;
}

export function SpendingRecordTable({
  metrics,
  effectiveTaxRate,
  companyName,
  className,
}: SpendingRecordTableProps) {
  const [selectedMetric, setSelectedMetric] = useState<SpendingMetric | null>(null);

  return (
    <>
      <SpendingDrawer
        metric={selectedMetric}
        open={!!selectedMetric}
        onOpenChange={(o) => !o && setSelectedMetric(null)}
        companyName={companyName}
      />

      <div className={cn("overflow-x-auto", className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-2 pr-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Metric</th>
              <th className="text-left py-2 pr-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left py-2 pr-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Trend</th>
              <th className="text-left py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {metrics.map((m) => {
              const clickable = hasDetailData(m);
              const TrendIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
              const trendColor = m.trend === "up" ? "text-destructive" : m.trend === "down" ? "text-civic-green" : "text-muted-foreground";

              return (
                <tr
                  key={m.label}
                  className={cn(
                    "transition-colors",
                    clickable
                      ? "cursor-pointer hover:bg-primary/5 group"
                      : "opacity-70"
                  )}
                  onClick={() => clickable && setSelectedMetric(m)}
                >
                  <td className="py-3 pr-4">
                    <span className={cn("font-medium", clickable ? "text-foreground" : "text-muted-foreground")}>
                      {m.label}
                    </span>
                    {!clickable && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Search className="w-2.5 h-2.5" /> Summary only
                      </span>
                    )}
                  </td>
                  <td className={cn("py-3 pr-4 font-mono font-bold", clickable ? "text-foreground" : "text-muted-foreground")}>
                    {m.amount}
                  </td>
                  <td className="py-3 pr-4">
                    <TrendIcon className={cn("w-4 h-4", trendColor)} />
                  </td>
                  <td className="py-3">
                    {clickable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setSelectedMetric(m); }}
                      >
                        View record <ArrowRight className="w-3 h-3" />
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40 font-mono">NO DETAIL</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Effective Tax Rate — always summary-only */}
            {effectiveTaxRate && (
              <tr className="opacity-70">
                <td className="py-3 pr-4">
                  <span className="font-medium text-muted-foreground">Eff. Tax Rate</span>
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Search className="w-2.5 h-2.5" /> Summary only
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono font-bold text-muted-foreground">{effectiveTaxRate}</td>
                <td className="py-3 pr-4"><Minus className="w-4 h-4 text-muted-foreground" /></td>
                <td className="py-3">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">NO DETAIL</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Personalization footer */}
        {metrics.some(hasDetailData) && (
          <div className="mt-4 p-3 rounded-none border border-primary/10 bg-primary/[0.02]">
            <p className="text-[10px] font-mono text-primary tracking-[0.2em] uppercase flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3" /> Why This Matters
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {METRIC_WHY_IT_MATTERS[metrics.find(hasDetailData)?.label ?? ""] ??
                "Spending data reveals where corporate resources go — and whether that aligns with what they say publicly."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
