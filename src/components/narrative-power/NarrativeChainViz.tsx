/**
 * Visual representation of a narrative chain.
 * Shows the flow: Company → Intermediary → Channel → Outcome
 */

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NarrativeChainVizProps {
  chain: string;
  className?: string;
}

export function NarrativeChainViz({ chain, className }: NarrativeChainVizProps) {
  const nodes = chain.split("→").map(s => s.trim()).filter(Boolean);

  if (nodes.length < 2) return null;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {nodes.map((node, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <span className={cn(
            "px-2.5 py-1 text-[10px] font-mono tracking-wider rounded-sm border whitespace-nowrap",
            idx === 0
              ? "bg-primary/8 border-primary/20 text-primary font-medium"
              : idx === nodes.length - 1
                ? "bg-muted border-border text-foreground font-medium"
                : "bg-card border-border text-muted-foreground"
          )}>
            {node}
          </span>
          {idx < nodes.length - 1 && (
            <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
