import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalFreshnessProps {
  lastUpdated?: string | Date | null;
  /** e.g. "PAC data updates monthly" */
  refreshCadence?: string;
  className?: string;
  compact?: boolean;
}

function getDaysAgo(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

type FreshnessLevel = "fresh" | "aging" | "stale";

function getFreshnessLevel(days: number): FreshnessLevel {
  if (days < 30) return "fresh";
  if (days < 90) return "aging";
  return "stale";
}

const LEVEL_STYLES: Record<FreshnessLevel, string> = {
  fresh: "text-[hsl(var(--civic-green))]",
  aging: "text-[hsl(var(--civic-yellow))]",
  stale: "text-[hsl(var(--civic-red))]",
};

const LEVEL_DOT: Record<FreshnessLevel, string> = {
  fresh: "bg-[hsl(var(--civic-green))]",
  aging: "bg-[hsl(var(--civic-yellow))]",
  stale: "bg-[hsl(var(--civic-red))]",
};

export function SignalFreshness({
  lastUpdated,
  refreshCadence,
  className,
  compact = false,
}: SignalFreshnessProps) {
  if (!lastUpdated) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/50", className)}>
        <Clock className="w-3 h-3" />
        No data
      </span>
    );
  }

  const days = getDaysAgo(lastUpdated);
  const level = getFreshnessLevel(days);

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-mono", LEVEL_STYLES[level], className)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", LEVEL_DOT[level])} />
        {days}d
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono", LEVEL_STYLES[level], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", LEVEL_DOT[level])} />
      <span>Signal freshness: {days} day{days !== 1 ? "s" : ""}</span>
      {refreshCadence && (
        <span className="text-muted-foreground/40">· {refreshCadence}</span>
      )}
    </span>
  );
}

/** Preset freshness badges for common data types */
export const REFRESH_CADENCES: Record<string, string> = {
  pac: "Updates monthly",
  lobbying: "Updates quarterly",
  contracts: "Updates quarterly",
  civil_rights: "Updates quarterly",
  climate: "Updates annually",
  esg: "Updates annually",
  news: "Updates daily",
  sentiment: "Updates weekly",
  court_records: "Updates monthly",
  labor: "Updates quarterly",
};
