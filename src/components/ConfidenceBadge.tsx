import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConfidenceLevel = "high" | "medium" | "low";

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  label?: string;
  className?: string;
}

const STYLES: Record<ConfidenceLevel, string> = {
  high: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  medium: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  low: "bg-destructive/10 text-destructive border-destructive/30",
};

const LABELS: Record<ConfidenceLevel, string> = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
};

/** Reusable confidence indicator badge for intelligence signals */
export function ConfidenceBadge({ level, label, className }: ConfidenceBadgeProps) {
  return (
    <Badge variant="outline" className={cn("text-[9px]", STYLES[level], className)}>
      {label || LABELS[level]}
    </Badge>
  );
}

/** Derive confidence level from a numeric score (0-1) */
export function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}
