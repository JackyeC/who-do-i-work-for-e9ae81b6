import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Search, AlertTriangle } from "lucide-react";
import type { SpendingMetric } from "@/types/ReportSchema";

interface SpendingDrawerProps {
  metric: SpendingMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, label: "Increasing", className: "text-destructive" },
  down: { icon: TrendingDown, label: "Decreasing", className: "text-civic-green" },
  neutral: { icon: Minus, label: "Stable", className: "text-muted-foreground" },
};

const METRIC_CONTEXT: Record<string, { what: string; why: string; watch: string }> = {
  Lobbying: {
    what: "Lobbying spend covers payments to firms and individuals hired to influence federal legislation and rulemaking.",
    why: "High lobbying activity can mean a company is shaping policy that directly affects workers, taxes, or regulation in ways that may not align with their public messaging.",
    watch: "Compare lobbying targets (agencies, bills) with the company's stated values on labor, climate, or equity.",
  },
  "PAC Spending": {
    what: "Political Action Committee (PAC) contributions are pooled funds directed to candidates, parties, or ballot measures.",
    why: "PAC allocations reveal whose political agenda a company is financing — and whether their candidate support aligns with worker interests.",
    watch: "Look at party split and individual recipients. A company claiming neutrality but funding one side heavily may have a gap between words and spending.",
  },
  "Gov Contracts": {
    what: "Federal government contracts are awarded through competitive and non-competitive processes across agencies.",
    why: "Large contract portfolios mean a company depends on government relationships — layoffs, pivots, and hiring can follow policy changes.",
    watch: "Check which agencies are involved. Defense, ICE, or health contracts carry different ethical weight depending on your priorities.",
  },
  Subsidies: {
    what: "Public subsidies include tax breaks, grants, and incentive packages from state, local, or federal governments.",
    why: "Companies receiving public investment should be held to public accountability — especially around job creation, wages, and community impact.",
    watch: "Look for gaps between subsidies received and workforce outcomes: layoffs after incentive deals, or relocations after taking community funds.",
  },
};

export function SpendingDrawer({ metric, open, onOpenChange, companyName }: SpendingDrawerProps) {
  if (!metric) return null;

  const trend = trendConfig[metric.trend];
  const TrendIcon = trend.icon;
  const context = METRIC_CONTEXT[metric.label];
  const amt = metric.amount.replace(/[^0-9.]/g, "");
  const hasData = parseFloat(amt) > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-black tracking-tight text-foreground">
            {metric.label}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details about {metric.label} spending metric{companyName ? ` for ${companyName}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Amount */}
          <div className="p-4 border border-border/30 bg-muted/10">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Amount</p>
            <p className="text-3xl font-black text-foreground tracking-tight">{metric.amount}</p>
            {companyName && (
              <p className="text-xs text-muted-foreground mt-1">{companyName}</p>
            )}
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

          {/* What this is */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">What This Is</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {context?.what ?? metric.description}
            </p>
          </div>

          {/* Description / signal detail */}
          {hasData ? (
            <div className="p-3 border border-border/20 bg-muted/5">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-2">Signal Detail</p>
              <p className="text-sm text-foreground leading-relaxed">{metric.description}</p>
            </div>
          ) : (
            <div className="p-3 border border-border/20 bg-muted/5 flex items-start gap-2">
              <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No itemized data yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  We haven't indexed recipient-level details for this metric. The summary above reflects what's available in public filings.
                </p>
              </div>
            </div>
          )}

          {/* Why it matters (personalized context) */}
          {context && (
            <div className="space-y-3">
              <div className="p-3 rounded-none border border-primary/10 bg-primary/[0.02]">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3" /> Why It Matters
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{context.why}</p>
              </div>
              <div className="p-3 rounded-none border border-border/20">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3 h-3" /> What to Watch For
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{context.watch}</p>
              </div>
            </div>
          )}

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
