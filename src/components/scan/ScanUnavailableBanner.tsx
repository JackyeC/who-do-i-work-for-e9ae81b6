import { AlertTriangle, Clock, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCooldownMinutes } from "@/lib/firecrawl-circuit-breaker";

interface ScanUnavailableBannerProps {
  /** Whether cached/saved data is being shown */
  hasCachedData: boolean;
  /** When the cached data was last updated */
  lastUpdated?: string | null;
  /** Compact inline badge mode vs full banner */
  variant?: "banner" | "badge";
}

export function ScanUnavailableBanner({ hasCachedData, lastUpdated, variant = "banner" }: ScanUnavailableBannerProps) {
  const cooldown = getCooldownMinutes();

  const daysAgo = lastUpdated
    ? Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000))
    : null;

  if (variant === "badge") {
    return (
      <Badge variant="outline" className="text-xs font-mono tracking-wider gap-1 border-civic-yellow/30 text-civic-yellow">
        <Database className="w-2.5 h-2.5" />
        {hasCachedData
          ? `Using saved intelligence${daysAgo !== null ? ` · ${daysAgo === 0 ? 'today' : `${daysAgo}d ago`}` : ''}`
          : 'Live refresh unavailable'}
      </Badge>
    );
  }

  return (
    <div className="rounded-lg border border-civic-yellow/20 bg-civic-yellow/5 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-civic-yellow shrink-0" />
        <span className="font-mono text-xs font-medium text-civic-yellow dark:text-civic-yellow tracking-wide">
          Live scan temporarily unavailable
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
        {hasCachedData
          ? `This report depends on a web extraction service that has hit its current usage limit. Showing the most recent saved intelligence${daysAgo !== null ? ` from ${daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}` : ''}.`
          : 'This module depends on a web extraction service that is temporarily unavailable. No cached data is available for this section.'}
      </p>
      {cooldown > 0 && (
        <div className="flex items-center gap-1 pl-6">
          <Clock className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">
            Refresh available in ~{cooldown} min
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Inline status badge for card headers
 */
export function SavedIntelligenceBadge({ lastUpdated }: { lastUpdated?: string | null }) {
  return <ScanUnavailableBanner hasCachedData={true} lastUpdated={lastUpdated} variant="badge" />;
}

/**
 * Empty state when no data at all
 */
export function ScanEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">No data available yet</p>
        <p className="text-xs text-muted-foreground/70 max-w-[280px]">
          Live scanning is temporarily paused. Data will populate automatically when the service resumes.
        </p>
      </div>
    </div>
  );
}
