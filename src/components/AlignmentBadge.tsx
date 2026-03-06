import { getScoreLabel } from "@/data/sampleData";
import { cn } from "@/lib/utils";

interface AlignmentBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function AlignmentBadge({ score, size = "md" }: AlignmentBadgeProps) {
  const { label, color } = getScoreLabel(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        sizeClasses[size],
        color === "civic-red" && "bg-civic-red/10 text-civic-red border-civic-red/20",
        color === "civic-yellow" && "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20",
        color === "civic-green" && "bg-civic-green/10 text-civic-green border-civic-green/20"
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          color === "civic-red" && "bg-civic-red",
          color === "civic-yellow" && "bg-civic-yellow",
          color === "civic-green" && "bg-civic-green"
        )}
      />
      {label} ({score}/100)
    </span>
  );
}
