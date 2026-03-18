import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

export type LeverageLevel = "low" | "medium" | "high";

export interface LeverageData {
  level: LeverageLevel;
  factors: string[];
}

export function computeLeverage(job: {
  created_at: string;
  posted_at?: string | null;
  salary_range?: string | null;
}, civicScore: number, isRepost: boolean): LeverageData {
  let score = 0;
  const factors: string[] = [];

  // Job age — older = more urgency to fill
  const days = differenceInDays(new Date(), new Date(job.posted_at || job.created_at));
  if (days > 30) {
    score += 2;
    factors.push("Role open 30+ days — hiring urgency likely");
  } else if (days > 14) {
    score += 1;
    factors.push("Role open 2+ weeks");
  }

  // Repost = high urgency
  if (isRepost) {
    score += 2;
    factors.push("Reposted role — previous search may have failed");
  }

  // No salary = more negotiation room
  if (!job.salary_range) {
    score += 1;
    factors.push("No salary disclosed — room to anchor high");
  }

  // Low civic transparency = less structured comp process
  if (civicScore < 40) {
    score += 1;
    factors.push("Limited company transparency — less rigid comp bands likely");
  }

  const level: LeverageLevel = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  return { level, factors };
}

const META: Record<LeverageLevel, { label: string; icon: any; className: string }> = {
  high: { label: "High Leverage", icon: TrendingUp, className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
  medium: { label: "Moderate Leverage", icon: Minus, className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" },
  low: { label: "Low Leverage", icon: TrendingDown, className: "bg-muted/50 text-muted-foreground border-border/30" },
};

interface LeverageScoreProps {
  leverage: LeverageData;
  compact?: boolean;
}

export function LeverageScore({ leverage, compact }: LeverageScoreProps) {
  const meta = META[leverage.level];
  const Icon = meta.icon;

  if (compact) {
    return (
      <Badge variant="outline" className={cn("text-[9px] gap-0.5", meta.className)}>
        <Icon className="w-2.5 h-2.5" /> {meta.label.split(" ")[0]}
      </Badge>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={cn("gap-1", meta.className)}>
          <Icon className="w-3 h-3" /> {meta.label}
        </Badge>
        <p className="text-[10px] font-medium text-foreground uppercase tracking-wider">Negotiation Leverage</p>
      </div>
      {leverage.factors.length > 0 && (
        <ul className="space-y-1">
          {leverage.factors.map((f, i) => (
            <li key={i} className="text-xs text-muted-foreground">• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
