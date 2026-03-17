import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function HowToReadThis() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors">
          <div>
            <p className="text-sm font-semibold text-foreground">How to read this</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We combine verified data and public discussion patterns. Not all signals are complete or current.
            </p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-4", open && "rotate-180")} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 pt-1 space-y-4 text-sm text-foreground/85 leading-relaxed border-t border-border/30">
            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5">Verified vs. Inferred</p>
              <p>
                <span className="font-medium">Verified signals</span> come from government filings, SEC disclosures, and official databases (FEC, WARN, USASpending).
                <span className="font-medium"> Inferred signals</span> are patterns detected from public discussion, job postings, or news — they reflect recurring themes, not confirmed facts.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5">Confidence Levels</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium text-[hsl(var(--civic-green))]">High</span> — Multiple verified sources confirm this signal</li>
                <li><span className="font-medium text-[hsl(var(--civic-yellow))]">Medium</span> — One verified source or strong pattern from multiple unverified sources</li>
                <li><span className="font-medium text-destructive">Low</span> — Inferred from limited or unverified sources. Treat as directional, not definitive</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5">Data Recency</p>
              <ul className="space-y-1 text-sm">
                <li><span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--civic-green))] mr-1.5 align-middle" />Last 30 days — Fresh data</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--civic-yellow))] mr-1.5 align-middle" />30–60 days — Recent but may not reflect latest changes</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-destructive/60 mr-1.5 align-middle" />6+ months — May be outdated. Interpret with caution</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground italic pt-1">
              This is context, not prediction. Signals help you ask better questions — they don't tell you what to decide.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
