import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getOutletProfile,
  LEAN_LABELS,
  LEAN_COLORS,
  RELIABILITY_COLORS,
  type PoliticalLean,
  type ReliabilityRating,
} from "@/lib/mediaBiasDatabase";

interface MediaBiasIndicatorProps {
  sourceUrl?: string | null;
  sourceName?: string | null;
  className?: string;
}

/** Lean indicator dot */
function LeanDot({ lean }: { lean: PoliticalLean }) {
  const dotColors: Record<PoliticalLean, string> = {
    left: "bg-blue-500",
    lean_left: "bg-blue-400",
    center: "bg-[hsl(var(--civic-green))]",
    lean_right: "bg-red-400",
    right: "bg-red-500",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", dotColors[lean])} />;
}

export function MediaBiasIndicator({ sourceUrl, sourceName, className }: MediaBiasIndicatorProps) {
  const profile = sourceUrl ? getOutletProfile(sourceUrl) : null;

  if (!profile) {
    // Not in our database — could be primary record or unknown
    return null;
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px]", className)}>
      <LeanDot lean={profile.lean} />
      <span className={cn("font-medium px-1 py-0 rounded", LEAN_COLORS[profile.lean])}>
        {LEAN_LABELS[profile.lean]}
      </span>
      <Badge variant="outline" className={cn("text-[9px] px-1 py-0", RELIABILITY_COLORS[profile.reliability])}>
        {profile.reliability === "high" ? "High Reliability" : profile.reliability === "mixed" ? "Mixed Reliability" : "Low Reliability"}
      </Badge>
    </span>
  );
}

/** Label for primary records — no bias applied */
export function PrimaryRecordLabel({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] text-muted-foreground/70", className)}>
      <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--civic-green))]" />
      <span className="font-mono uppercase tracking-wider">Primary Record — No perspective applied</span>
    </span>
  );
}
