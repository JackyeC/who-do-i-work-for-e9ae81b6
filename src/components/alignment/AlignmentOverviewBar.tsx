import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CategoryScore {
  category: string;
  alignment_score: number;
  alignment_level: string;
}

function levelColor(level: string) {
  if (level === "Strong" || level === "Moderate") return "bg-civic-green";
  if (level === "Mixed") return "bg-civic-yellow";
  return "bg-destructive";
}

export function AlignmentOverviewBar({ categories }: { categories: CategoryScore[] }) {
  if (!categories.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-muted">
        {categories.map((c) => (
          <Tooltip key={c.category}>
            <TooltipTrigger asChild>
              <div
                className={cn("h-full transition-all", levelColor(c.alignment_level))}
                style={{ width: `${100 / categories.length}%` }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <span className="font-semibold">{c.category}</span>: {c.alignment_score}/100 ({c.alignment_level})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-civic-green" /> Strong/Moderate</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-civic-yellow" /> Mixed</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> Low</div>
      </div>
    </div>
  );
}
