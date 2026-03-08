import { cn } from "@/lib/utils";

interface JobMatchBadgeProps {
  score: number;
  size?: "sm" | "md";
}

function getMatchConfig(score: number) {
  if (score >= 85) return { label: "Great Fit", className: "bg-civic-green/15 text-civic-green border-civic-green/30" };
  if (score >= 65) return { label: "Good Fit", className: "bg-civic-blue/15 text-civic-blue border-civic-blue/30" };
  if (score >= 45) return { label: "Moderate", className: "bg-civic-yellow/15 text-civic-yellow border-civic-yellow/30" };
  return { label: "Low Fit", className: "bg-muted text-muted-foreground border-border" };
}

export function JobMatchBadge({ score, size = "sm" }: JobMatchBadgeProps) {
  const config = getMatchConfig(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        config.className
      )}
    >
      {score}% · {config.label}
    </span>
  );
}
