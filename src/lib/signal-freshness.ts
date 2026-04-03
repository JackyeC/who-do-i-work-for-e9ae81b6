import { differenceInDays, format, isValid, parseISO } from "date-fns";

export type FreshnessLevel = "recent" | "ongoing" | "older";

export interface FreshnessInfo {
  level: FreshnessLevel;
  label: string;
  timeLabel: string;
  className: string;
  dotClassName: string;
}

/**
 * Classify a date into a freshness level for display.
 * If no date is provided, returns "Update timing unavailable".
 */
export function getSignalFreshness(dateStr: string | null | undefined): FreshnessInfo {
  if (!dateStr) {
    return {
      level: "older",
      label: "Older Signal",
      timeLabel: "Update timing unavailable",
      className: "text-muted-foreground/60",
      dotClassName: "bg-muted-foreground/40",
    };
  }

  const date = parseISO(dateStr);
  if (!isValid(date)) {
    return {
      level: "older",
      label: "Older Signal",
      timeLabel: "Update timing unavailable",
      className: "text-muted-foreground/60",
      dotClassName: "bg-muted-foreground/40",
    };
  }

  const days = differenceInDays(new Date(), date);

  if (days <= 30) {
    return {
      level: "recent",
      label: "Recent",
      timeLabel: days <= 1 ? "Updated today" : days <= 7 ? "Detected this week" : "Detected this month",
      className: "text-green-600 dark:text-green-400",
      dotClassName: "bg-green-500",
    };
  }

  if (days <= 90) {
    return {
      level: "ongoing",
      label: "Ongoing",
      timeLabel: "Updated recently",
      className: "text-amber-600 dark:text-amber-400",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    level: "older",
    label: "Older Signal",
    timeLabel: "No recent changes",
    className: "text-muted-foreground/60",
    dotClassName: "bg-muted-foreground/40",
  };
}

/**
 * Format a "last updated" line from the most recent date in a set.
 */
export function getLastUpdatedLabel(dates: (string | null | undefined)[]): string {
  const valid = dates
    .filter(Boolean)
    .map((d) => parseISO(d!))
    .filter(isValid)
    .sort((a, b) => b.getTime() - a.getTime());

  if (valid.length === 0) return "Last updated: Unknown";
  return `Signals last updated: ${format(valid[0], "MMMM yyyy")}`;
}
