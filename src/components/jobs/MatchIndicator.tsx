import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchIndicatorProps {
  matchCount: number;
  matchedCategories?: string[];
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  progress_policy: "Reform-Aligned",
  traditional_policy: "Heritage-Aligned",
  labor_policy: "Worker Protections",
  climate_policy: "Climate Action",
  equity_policy: "Equity Focus",
};

export function MatchIndicator({ matchCount, matchedCategories, className }: MatchIndicatorProps) {
  if (matchCount === 0) return null;

  const labels = (matchedCategories || [])
    .map((c) => CATEGORY_LABELS[c] || c)
    .slice(0, 3);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] gap-1 py-0 cursor-default",
            matchCount >= 3
              ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400"
              : matchCount >= 2
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border",
            className
          )}
        >
          <Sparkles className="w-2.5 h-2.5" />
          {matchCount >= 3 ? "Strong Match" : matchCount >= 2 ? "Good Match" : "Partial Match"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        <p className="font-medium mb-1">Matches {matchCount} of your priorities:</p>
        {labels.length > 0 ? (
          <ul className="space-y-0.5">
            {labels.map((l) => (
              <li key={l} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {l}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Based on your saved work profile</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
