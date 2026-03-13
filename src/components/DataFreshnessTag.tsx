import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFreshnessTagProps {
  label: string;
  date?: string | Date;
  source?: string;
  isHistorical?: boolean;
  className?: string;
}

function formatFreshnessDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isStale(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  return d < ninetyDaysAgo;
}

export function DataFreshnessTag({
  label,
  date,
  source,
  isHistorical = false,
  className,
}: DataFreshnessTagProps) {
  const stale = date ? isStale(date) : true;
  const showHistorical = isHistorical || !date;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-mono",
        stale ? "text-muted-foreground/60" : "text-muted-foreground",
        className,
      )}
    >
      {showHistorical ? (
        <>
          <Clock className="w-3 h-3 shrink-0" />
          <span>Historical Signal Snapshot</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3 shrink-0 text-[hsl(var(--civic-green))]" />
          <span>
            {label} verified {formatFreshnessDate(date!)}
          </span>
        </>
      )}
      {source && (
        <span className="text-muted-foreground/40">
          · Source: {source}
        </span>
      )}
    </div>
  );
}

/** Convenience presets */

export function LeadershipFreshnessTag({ date, className }: { date?: string | Date; className?: string }) {
  return (
    <DataFreshnessTag
      label="Leadership data"
      date={date}
      source="SEC Proxy Filing"
      className={className}
    />
  );
}

export function LayoffFreshnessTag({ date, className }: { date?: string | Date; className?: string }) {
  return (
    <DataFreshnessTag
      label="Layoff signals last updated"
      date={date}
      source="WARN databases"
      className={className}
    />
  );
}

export function LobbyingFreshnessTag({ date, className }: { date?: string | Date; className?: string }) {
  return (
    <DataFreshnessTag
      label="Lobbying data"
      date={date}
      source="Senate LDA"
      className={className}
    />
  );
}

export function CompensationFreshnessTag({ date, className }: { date?: string | Date; className?: string }) {
  return (
    <DataFreshnessTag
      label="Compensation data"
      date={date}
      source="BLS"
      className={className}
    />
  );
}
