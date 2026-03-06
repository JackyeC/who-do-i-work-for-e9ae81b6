import { getFootprintLabel } from "@/data/sampleData";
import { cn } from "@/lib/utils";

interface CivicFootprintBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function CivicFootprintBadge({ score, size = "md", showDescription = false }: CivicFootprintBadgeProps) {
  const { label, description, color } = getFootprintLabel(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5 font-semibold",
  };

  return (
    <div className="inline-flex flex-col gap-1">
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
        {label}
      </span>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </div>
  );
}
