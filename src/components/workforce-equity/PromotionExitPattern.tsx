import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, ArrowLeftRight, HelpCircle, Info,
} from "lucide-react";

type PatternType = "promote_and_retain" | "hire_and_burn" | "external_replacement" | "unknown";

const patternConfig: Record<PatternType, {
  icon: typeof TrendingUp;
  label: string;
  description: string;
  color: string;
  bg: string;
}> = {
  promote_and_retain: {
    icon: TrendingUp,
    label: "Internal Growth Pattern",
    description: "Employees appear to grow and advance within the company. Title progression and long tenure suggest a promote-and-retain culture.",
    color: "text-civic-green",
    bg: "bg-civic-green/10 border-civic-green/20",
  },
  hire_and_burn: {
    icon: TrendingDown,
    label: "Hire & Burn Pattern",
    description: "Signals suggest high turnover or repeated workforce reductions. Employees may leave or be displaced before meaningful advancement.",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  external_replacement: {
    icon: ArrowLeftRight,
    label: "External Replacement Pattern",
    description: "Leadership and senior roles appear to be filled primarily through external hiring rather than internal development.",
    color: "text-civic-yellow",
    bg: "bg-civic-yellow/10 border-civic-yellow/20",
  },
  unknown: {
    icon: HelpCircle,
    label: "Pattern Not Detected",
    description: "Insufficient public data to determine whether employees grow internally or leave to advance. This is a transparency gap.",
    color: "text-muted-foreground",
    bg: "bg-muted/30 border-border",
  },
};

export function PromotionExitPattern({
  signals,
  companyName,
}: {
  signals: any[];
  companyName: string;
}) {
  // Determine the dominant pattern from signals
  const promotionSignals = signals.filter(
    (s) =>
      s.value_category === "promotion_vs_exit" ||
      s.value_category === "career_path_progression" ||
      s.value_category === "retention_stability"
  );

  let pattern: PatternType = "unknown";

  if (promotionSignals.length > 0) {
    // Check for explicit pattern_type in signal metadata
    const patternTypes = promotionSignals
      .map((s) => {
        const summary = (s.signal_summary || "").toLowerCase();
        if (summary.includes("promote and retain") || summary.includes("internal growth") || summary.includes("internally")) return "promote_and_retain";
        if (summary.includes("hire and burn") || summary.includes("high turnover") || summary.includes("burn")) return "hire_and_burn";
        if (summary.includes("external") || summary.includes("outside hire") || summary.includes("replacement")) return "external_replacement";
        return null;
      })
      .filter(Boolean) as PatternType[];

    if (patternTypes.length > 0) {
      // Most frequent pattern wins
      const counts = patternTypes.reduce((acc, p) => {
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      pattern = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as PatternType;
    }
  }

  // Also factor in retention/layoff signals
  const layoffSignals = signals.filter(
    (s) =>
      s.signal_type?.toLowerCase().includes("layoff") ||
      s.signal_type?.toLowerCase().includes("warn") ||
      s.signal_type?.toLowerCase().includes("restructuring")
  );
  const retentionPositive = signals.filter(
    (s) =>
      s.signal_summary?.toLowerCase().includes("retention") ||
      s.signal_summary?.toLowerCase().includes("great place to work") ||
      s.signal_summary?.toLowerCase().includes("low turnover")
  );

  // Override pattern based on strong signals
  if (pattern === "unknown") {
    if (layoffSignals.length >= 2) pattern = "hire_and_burn";
    else if (retentionPositive.length >= 1) pattern = "promote_and_retain";
  }

  const config = patternConfig[pattern];
  const PatternIcon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-primary" />
          Promotion vs Exit Pattern
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Do employees grow internally — or leave the company to advance?
        </p>
      </CardHeader>
      <CardContent>
        <div className={cn("rounded-lg border p-4", config.bg)}>
          <div className="flex items-start gap-3">
            <PatternIcon className={cn("w-6 h-6 mt-0.5 shrink-0", config.color)} />
            <div>
              <h4 className={cn("text-sm font-bold", config.color)}>{config.label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Supporting evidence */}
        {promotionSignals.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Supporting Signals
            </p>
            {promotionSignals.slice(0, 4).map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded border border-border">
                <Badge
                  variant="outline"
                  className={cn("text-[9px] px-1.5 py-0 shrink-0 mt-0.5", {
                    "bg-civic-green/10 text-civic-green border-civic-green/20": s.confidence === "direct",
                    "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20": s.confidence === "inferred",
                    "bg-muted text-muted-foreground": s.confidence === "weak",
                  })}
                >
                  {s.confidence === "direct" ? "Strong" : s.confidence === "inferred" ? "Moderate" : "Weak"}
                </Badge>
                <span className="text-muted-foreground">{s.signal_summary}</span>
              </div>
            ))}
          </div>
        )}

        {/* Layoff / retention context */}
        {(layoffSignals.length > 0 || retentionPositive.length > 0) && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workforce Context
            </p>
            {layoffSignals.slice(0, 2).map((s: any, i: number) => (
              <div key={`l-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                <TrendingDown className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                {s.signal_summary || s.signal_type}
              </div>
            ))}
            {retentionPositive.slice(0, 2).map((s: any, i: number) => (
              <div key={`r-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 text-civic-green mt-0.5 shrink-0" />
                {s.signal_summary || s.signal_type}
              </div>
            ))}
          </div>
        )}

        {pattern === "unknown" && promotionSignals.length === 0 && (
          <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {companyName} has not published detectable career progression data.
              This does not necessarily indicate poor mobility — it may reflect limited public disclosure.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
