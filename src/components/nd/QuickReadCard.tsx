import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export type QuickReadRating = "Low" | "Medium" | "High";

interface QuickReadCardProps {
  label: string;
  rating: QuickReadRating;
  explanation: string;
  tooltip?: string;
}

const ratingStyles: Record<QuickReadRating, { dot: string; text: string }> = {
  Low: { dot: "bg-civic-green", text: "text-civic-green" },
  Medium: { dot: "bg-civic-yellow", text: "text-civic-yellow" },
  High: { dot: "bg-destructive", text: "text-destructive" },
};

export function QuickReadCard({ label, rating, explanation, tooltip }: QuickReadCardProps) {
  const style = ratingStyles[rating];

  return (
    <div className="flex items-start gap-3 p-4 border border-border/40 bg-card">
      <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", style.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className={cn("text-xs font-medium", style.text)}>{rating}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}
