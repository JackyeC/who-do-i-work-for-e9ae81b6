/**
 * Signal Confidence Legend — reusable methodology explainer
 * Used on representative profiles, company pages, and the WDIVF page.
 */

import { cn } from "@/lib/utils";

const LEGEND_ITEMS = [
  {
    label: "Direct Source",
    description: "Verified from official records",
    dotClass: "bg-[hsl(var(--civic-green))]",
  },
  {
    label: "Multi-Source Signal",
    description: "Cross-referenced from multiple data sources",
    dotClass: "bg-[hsl(var(--civic-blue))]",
  },
  {
    label: "Inferred Pattern",
    description: "Behavioral trend detected over time",
    dotClass: "bg-primary",
  },
  {
    label: "No Public Evidence",
    description: "Data not available in public records",
    dotClass: "bg-muted-foreground",
  },
];

interface SignalConfidenceLegendProps {
  className?: string;
}

export function SignalConfidenceLegend({ className }: SignalConfidenceLegendProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg"
        >
          <span className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", item.dotClass)} />
          <div>
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
