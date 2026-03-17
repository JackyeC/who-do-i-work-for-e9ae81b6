import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecruitmentAdvantageScoreProps {
  lastAuditedAt?: string | null;
  isCertified: boolean;
  hasCompensationData: boolean;
  hasDEIReports: boolean;
  hasEmployerRebuttal: boolean;
  transparencyScore: number;
  signalGroupCount: number;
}

function computeScore(props: RecruitmentAdvantageScoreProps): number {
  let score = 20; // base

  // Data freshness (0-25)
  if (props.lastAuditedAt) {
    const daysSince = (Date.now() - new Date(props.lastAuditedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) score += 25;
    else if (daysSince <= 90) score += 18;
    else if (daysSince <= 180) score += 10;
    else score += 5;
  }

  // Certification (0-20)
  if (props.isCertified) score += 20;

  // Data completeness (0-20)
  if (props.hasCompensationData) score += 7;
  if (props.hasDEIReports) score += 7;
  if (props.hasEmployerRebuttal) score += 6;

  // Transparency signals (0-15)
  score += Math.min(15, Math.round(props.transparencyScore * 0.15));

  return Math.min(100, Math.max(0, score));
}

export function RecruitmentAdvantageScore(props: RecruitmentAdvantageScoreProps) {
  const score = useMemo(() => computeScore(props), [props]);

  const tier = score >= 70 ? "visible" : score >= 40 ? "emerging" : "invisible";
  const config = {
    visible: {
      label: "Highly Visible",
      color: "text-[hsl(var(--civic-green))]",
      border: "border-[hsl(var(--civic-green))]/20",
      bg: "bg-[hsl(var(--civic-green))]/[0.06]",
      icon: Eye,
      desc: "Strong profile visibility to values-aligned talent.",
    },
    emerging: {
      label: "Emerging",
      color: "text-[hsl(var(--civic-yellow))]",
      border: "border-[hsl(var(--civic-yellow))]/20",
      bg: "bg-[hsl(var(--civic-yellow))]/[0.06]",
      icon: TrendingUp,
      desc: "Profile has gaps — some talent may pass on incomplete data.",
    },
    invisible: {
      label: "Low Visibility",
      color: "text-muted-foreground",
      border: "border-border/40",
      bg: "bg-muted/30",
      icon: EyeOff,
      desc: "Invisible to values-aligned talent. Claim your profile to improve.",
    },
  }[tier];

  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border", config.border, config.bg)}>
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-sm font-bold font-mono", config.color)}>{score}</span>
              <span className="text-[10px] text-muted-foreground">Recruitment Advantage</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-xs leading-relaxed">
          <p className="font-semibold mb-1">Recruitment Advantage Score ({score}/100)</p>
          <p className="text-muted-foreground mb-1">{config.desc}</p>
          <Badge variant="outline" className={cn("text-[9px]", config.color)}>{config.label}</Badge>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
