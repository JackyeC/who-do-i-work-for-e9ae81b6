import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertTriangle, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { type JobQualityTier, type JobQualitySignal } from "@/lib/jobQuality";

const TIER_CONFIG: Record<JobQualityTier, { icon: any; colorClass: string; borderClass: string }> = {
  fresh: {
    icon: CheckCircle2,
    colorClass: "text-[hsl(var(--civic-green))]",
    borderClass: "border-[hsl(var(--civic-green)/0.2)]",
  },
  recent: {
    icon: Clock,
    colorClass: "text-muted-foreground",
    borderClass: "border-border",
  },
  aging: {
    icon: Clock,
    colorClass: "text-[hsl(var(--civic-yellow))]",
    borderClass: "border-[hsl(var(--civic-yellow)/0.2)]",
  },
  stale: {
    icon: AlertTriangle,
    colorClass: "text-[hsl(var(--civic-red))]",
    borderClass: "border-[hsl(var(--civic-red)/0.2)]",
  },
  ghost: {
    icon: Ghost,
    colorClass: "text-[hsl(var(--civic-red))]",
    borderClass: "border-[hsl(var(--civic-red)/0.2)]",
  },
};

interface JobQualityBadgeProps {
  signal: JobQualitySignal;
  isRepost?: boolean;
  isEvergreen?: boolean;
  className?: string;
}

export function JobQualityBadge({ signal, isRepost, isEvergreen, className }: JobQualityBadgeProps) {
  const config = TIER_CONFIG[signal.tier];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("text-[10px] gap-0.5 py-0", config.colorClass, config.borderClass)}>
            <Icon className="w-2.5 h-2.5" /> {signal.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          {signal.description}
        </TooltipContent>
      </Tooltip>

      {isRepost && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] gap-0.5 py-0 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow)/0.2)]">
              ↻ Reposted
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            This job appears to have been reposted recently — same title at the same company.
          </TooltipContent>
        </Tooltip>
      )}

      {isEvergreen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] gap-0.5 py-0 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow)/0.2)] border-dashed">
              🌿 Evergreen
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            This listing contains language suggesting it may be a general talent pipeline rather than a specific open role.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
