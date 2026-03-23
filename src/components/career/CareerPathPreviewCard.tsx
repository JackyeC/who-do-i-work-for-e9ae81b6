import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerPathPreviewCardProps {
  label: string;
  matchPct: number;
  currentRole: string;
  targetRole: string;
  summary: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function CareerPathPreviewCard({
  label, matchPct, currentRole, targetRole, summary, isActive, onClick,
}: CareerPathPreviewCardProps) {
  const matchColor = matchPct >= 80
    ? "text-[hsl(var(--civic-green))]"
    : matchPct >= 60
    ? "text-[hsl(var(--civic-gold))]"
    : "text-primary";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2 group",
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/50 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-foreground font-display leading-tight">{label}</h3>
          <span className={cn("text-lg font-bold font-mono tabular-nums", matchColor)}>
            {matchPct}%
          </span>
        </div>

        {/* Role transition */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="truncate">{currentRole}</span>
          <ArrowRight className="w-3 h-3 shrink-0 text-primary/40" />
          <span className="truncate font-medium text-foreground">{targetRole}</span>
        </div>

        {/* Summary tags */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}
