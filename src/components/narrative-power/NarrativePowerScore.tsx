/**
 * Narrative Power Score — measures how actively an organization
 * participates in shaping public narratives.
 * 
 * Scoring inputs:
 * - Number of narrative campaigns
 * - Strength of evidence
 * - Use of intermediaries (PR firms, nonprofits)
 * - Network complexity
 * - Repetition of messaging networks
 */

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Radio } from "lucide-react";

type ScoreLevel = "low" | "moderate" | "high";

interface NarrativePowerScoreProps {
  signalCount: number;
  verifiedCount: number;
  intermediaryCount: number;
  uniqueActorTypes: number;
}

function calculateScore(props: NarrativePowerScoreProps): { level: ScoreLevel; score: number } {
  const { signalCount, verifiedCount, intermediaryCount, uniqueActorTypes } = props;

  let score = 0;
  // Campaign volume (0-30)
  score += Math.min(signalCount * 6, 30);
  // Evidence strength (0-25)
  score += Math.min(verifiedCount * 8, 25);
  // Intermediary use (0-25)
  score += Math.min(intermediaryCount * 5, 25);
  // Network complexity (0-20)
  score += Math.min(uniqueActorTypes * 5, 20);

  const level: ScoreLevel = score >= 60 ? "high" : score >= 30 ? "moderate" : "low";
  return { level, score: Math.min(score, 100) };
}

const LEVEL_CONFIG: Record<ScoreLevel, { label: string; className: string; barClass: string; description: string }> = {
  low: {
    label: "Low",
    className: "text-muted-foreground",
    barClass: "bg-muted-foreground/40",
    description: "Limited documented evidence of coordinated narrative campaigns. The organization may have standard corporate communications but no significant patterns of narrative influence detected.",
  },
  moderate: {
    label: "Moderate",
    className: "text-[hsl(var(--civic-yellow))]",
    barClass: "bg-[hsl(var(--civic-yellow))]",
    description: "Evidence indicates the organization participates in coordinated messaging campaigns through PR firms, influencers, media outlets, or advocacy groups.",
  },
  high: {
    label: "High",
    className: "text-primary",
    barClass: "bg-primary",
    description: "Significant documented evidence of multi-channel narrative campaigns involving intermediaries, coordinated messaging networks, and sustained influence operations.",
  },
};

export function NarrativePowerScore(props: NarrativePowerScoreProps) {
  const { level, score } = calculateScore(props);
  const config = LEVEL_CONFIG[level];

  return (
    <TooltipProvider>
      <div className="p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center border border-primary/10">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Narrative Power Score</p>
              <p className={cn("text-lg font-bold", config.className)}>{config.label}</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("font-mono text-2xl font-bold cursor-help", config.className)}>
                {score}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px] text-xs">
              <p className="font-semibold mb-1">Score: {score}/100</p>
              <p>Based on campaign volume, evidence strength, intermediary use, and network complexity.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Score bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn("h-full rounded-full transition-all duration-700", config.barClass)}
            style={{ width: `${score}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="font-mono text-lg font-bold text-foreground">{props.signalCount}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Signals</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-foreground">{props.verifiedCount}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Verified</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-foreground">{props.intermediaryCount}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Intermediaries</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-foreground">{props.uniqueActorTypes}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Actor Types</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
