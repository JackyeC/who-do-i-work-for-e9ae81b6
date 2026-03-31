import { cn } from "@/lib/utils";

interface PerceptionGapScoreProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
}

function getScoreConfig(score: number) {
  if (score <= 30) {
    return {
      label: "Low",
      color: "text-[hsl(var(--civic-green))]",
      bg: "bg-[hsl(var(--civic-green))]/10",
      ring: "ring-[hsl(var(--civic-green))]/30",
      description: "Signals generally align with claims",
    };
  }
  if (score <= 60) {
    return {
      label: "Medium",
      color: "text-[hsl(var(--civic-yellow))]",
      bg: "bg-[hsl(var(--civic-yellow))]/10",
      ring: "ring-[hsl(var(--civic-yellow))]/30",
      description: "Some contradictions worth exploring",
    };
  }
  return {
    label: "High",
    color: "text-destructive",
    bg: "bg-destructive/10",
    ring: "ring-destructive/30",
    description: "Strong disconnect between brand and reality",
  };
}

const SIZES = {
  sm: { container: "w-12 h-12", text: "text-sm", label: "text-micro" },
  md: { container: "w-16 h-16", text: "text-lg", label: "text-xs" },
  lg: { container: "w-20 h-20", text: "text-2xl", label: "text-xs" },
};

export function PerceptionGapScore({ score, size = "md" }: PerceptionGapScoreProps) {
  const config = getScoreConfig(score);
  const sizeConfig = SIZES[size];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "rounded-2xl flex flex-col items-center justify-center ring-2",
          sizeConfig.container,
          config.bg,
          config.ring,
        )}
      >
        <span className={cn("font-display font-bold leading-none", sizeConfig.text, config.color)}>
          {score}
        </span>
      </div>
      <span className={cn("font-mono uppercase tracking-wider font-semibold", sizeConfig.label, config.color)}>
        {config.label}
      </span>
    </div>
  );
}

export { getScoreConfig };
