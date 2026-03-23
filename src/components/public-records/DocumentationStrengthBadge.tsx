/**
 * SENSITIVE MODULE: Public Records & Network Exposure
 * 
 * Association data must be phrased conservatively, sourced clearly,
 * and displayed with contextual disclaimers. The system optimizes
 * for trust, defensibility, and user understanding.
 */

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type StrengthLevel = "high" | "medium" | "low";

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; className: string; tooltip: string }> = {
  high: {
    label: "High",
    className: "bg-primary/10 text-primary border-primary/25",
    tooltip: "Based on official government disclosures, regulator actions, court-approved settlements, or court filings.",
  },
  medium: {
    label: "Medium",
    className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/25",
    tooltip: "Based on company statements, congressional testimony, or strong document-based investigative reporting.",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
    tooltip: "Based on weak or indirect mentions, incomplete sourcing, or information that requires further verification.",
  },
};

export function DocumentationStrengthBadge({ level }: { level: StrengthLevel }) {
  const config = STRENGTH_CONFIG[level];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase tracking-wider border rounded-sm cursor-help whitespace-nowrap",
              config.className
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              level === "high" && "bg-primary",
              level === "medium" && "bg-[hsl(var(--civic-yellow))]",
              level === "low" && "bg-muted-foreground"
            )} />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          <p className="font-semibold mb-1">Documentation Strength: {config.label}</p>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
