/**
 * SignalTimeline — Visual timeline showing signal counts, dates, and trends
 * per source family. Replaces flat "No Data" states with rich context.
 */
import { useCompanyCoverage, getSourceLabel, type CoverageEntry } from "@/hooks/useCompanyCoverage";
import { formatDistanceToNow, format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface Props {
  companyId: string;
}

export function SignalTimeline({ companyId }: Props) {
  const { data: coverage, isLoading } = useCompanyCoverage(companyId);

  if (isLoading || !coverage) return null;

  // Only show sources that have been checked
  const checkedEntries = coverage.entries.filter(
    (e) => e.coverage_status !== "never_checked"
  );

  if (checkedEntries.length === 0) return null;

  return (
    <div className="space-y-1">
      {checkedEntries.map((entry) => (
        <TimelineRow key={entry.source_family} entry={entry} />
      ))}
    </div>
  );
}

function TimelineRow({ entry }: { entry: CoverageEntry }) {
  const barWidth = Math.min(entry.signal_count * 10, 100);
  const barColor = entry.coverage_status === "rich"
    ? "bg-emerald-500"
    : entry.coverage_status === "limited"
    ? "bg-amber-500"
    : "bg-muted-foreground/30";

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      {/* Source label */}
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
        {getSourceLabel(entry.source_family)}
      </span>

      {/* Signal bar */}
      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Count */}
      <span className="text-xs font-mono text-foreground w-8 text-right">
        {entry.signal_count}
      </span>

      {/* Last date */}
      <span className="text-[10px] text-muted-foreground w-20 text-right hidden sm:block">
        {entry.last_checked_at
          ? formatDistanceToNow(new Date(entry.last_checked_at), { addSuffix: true })
          : "—"}
      </span>
    </div>
  );
}
