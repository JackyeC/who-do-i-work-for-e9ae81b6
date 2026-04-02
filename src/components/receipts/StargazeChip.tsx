import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * Stargaze Score — public-facing 1–5 star rating for newsletter stories.
 * Set A: Gossip Column Energy
 */
const STARGAZE_LABELS: Record<number, { label: string; tooltip: string }> = {
  1: { label: "Worth a glance", tooltip: "On the radar, not the front page." },
  2: { label: "Mild drama", tooltip: "Something shifted. Worth a closer look." },
  3: { label: "Screenshot this", tooltip: "You'll want receipts on this one." },
  4: { label: "Group chat material", tooltip: "Forward this to someone who needs to see it." },
  5: { label: "Career-defining receipt", tooltip: "The kind of story that changes how you see an employer." },
};

interface StargazeChipProps {
  score: number;
  className?: string;
  big?: boolean;
}

export function StargazeChip({ score, className, big = false }: StargazeChipProps) {
  const clamped = Math.max(1, Math.min(5, score || 1));
  const config = STARGAZE_LABELS[clamped];
  const [showTooltip, setShowTooltip] = useState(false);

  // Star color by tier
  const starColor =
    clamped >= 5 ? "hsl(var(--primary))" :
    clamped >= 4 ? "#F59E0B" :
    clamped >= 3 ? "#3B82F6" :
    "hsl(var(--muted-foreground))";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full transition-colors relative cursor-default",
        big ? "text-sm px-3.5 py-1.5" : "text-xs px-3 py-1",
        "border bg-card/80",
        className
      )}
      style={{ borderColor: `${starColor}40` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="flex items-center gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: big ? 14 : 12,
              opacity: i < clamped ? 1 : 0.2,
              filter: i < clamped ? "none" : "grayscale(1)",
            }}
          >
            ⭐
          </span>
        ))}
      </span>
      <span
        className="font-mono font-bold uppercase tracking-wider"
        style={{ fontSize: big ? 11 : 10, color: starColor }}
      >
        {config.label}
      </span>

      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap z-50 pointer-events-none animate-fade-in"
          style={{
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
            fontStyle: "italic",
          }}
        >
          {config.tooltip}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid hsl(var(--foreground))",
            }}
          />
        </span>
      )}
    </span>
  );
}
