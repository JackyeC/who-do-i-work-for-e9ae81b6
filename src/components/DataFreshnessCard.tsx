import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, AlertTriangle, Info, Database, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionReport, RefreshStatus } from "@/hooks/use-company-intelligence";

interface DataFreshnessCardProps {
  lastReviewed?: string | null;
  updatedAt?: string | null;
  recordStatus?: string;
  scanCompletion?: Record<string, boolean> | null;
  /** Intelligence cache reports for real-time freshness */
  intelligenceReports?: Record<string, SectionReport>;
  /** Refresh statuses per section */
  refreshStatuses?: Record<string, RefreshStatus>;
  /** Whether any section is refreshing */
  isAnyRefreshing?: boolean;
  /** Callback to refresh all stale sections */
  onRefreshAll?: () => void;
}

function freshnessLabel(dateStr: string): { label: string; stale: boolean } {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1) return { label: "Updated just now", stale: false };
  if (hours < 24) return { label: `Updated ${hours}h ago`, stale: false };
  const days = Math.floor(hours / 24);
  if (days === 1) return { label: "Updated yesterday", stale: false };
  if (days <= 7) return { label: `Updated ${days} days ago`, stale: false };
  if (days <= 30) return { label: `Updated ${days} days ago`, stale: false };
  return { label: `Last updated ${days} days ago`, stale: true };
}

const CONFIDENCE_TIERS = [
  {
    level: "High",
    icon: ShieldCheck,
    className: "text-[hsl(var(--civic-green))]",
    sources: "WARN filings · SEC filings · FEC data · Federal contracts · Government labor databases",
    note: "Directly influences Employer Clarity Score",
  },
  {
    level: "Moderate",
    icon: Info,
    className: "text-[hsl(var(--civic-yellow))]",
    sources: "Company disclosures · Earnings calls · Verified financial reporting",
    note: "Influences Employer Clarity Score",
  },
  {
    level: "Low",
    icon: AlertTriangle,
    className: "text-muted-foreground",
    sources: "News reports · User submissions · Unverified sources",
    note: "Shown in reports but does not affect scoring",
  },
];

export function DataFreshnessCard({
  lastReviewed,
  updatedAt,
  recordStatus,
  scanCompletion,
  intelligenceReports,
  refreshStatuses,
  isAnyRefreshing,
  onRefreshAll,
}: DataFreshnessCardProps) {
  const dateStr = updatedAt || lastReviewed;
  const freshness = dateStr ? freshnessLabel(dateStr) : null;

  const scanKeys = scanCompletion ? Object.values(scanCompletion) : [];
  const completedScans = scanKeys.filter(Boolean).length;
  const totalScans = scanKeys.length || 0;

  // Intelligence cache summary
  const reports = intelligenceReports ? Object.values(intelligenceReports) : [];
  const totalSections = reports.length;
  const freshSections = reports.filter(r => !r.isStale && r.last_successful_update).length;
  const staleSections = reports.filter(r => r.isStale).length;
  const failedSections = reports.filter(r => r.last_error).length;
  const hasAnyData = totalSections > 0;

  // Overall freshness from intelligence cache (most recent update)
  const mostRecent = reports
    .filter(r => r.last_successful_update)
    .sort((a, b) => new Date(b.last_successful_update!).getTime() - new Date(a.last_successful_update!).getTime())[0];
  const cacheFreshness = mostRecent?.last_successful_update ? freshnessLabel(mostRecent.last_successful_update) : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Intelligence Cache Status */}
        {hasAnyData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Intelligence Cache</span>
              </div>
              {isAnyRefreshing ? (
                <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Refreshing…
                </Badge>
              ) : cacheFreshness ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-mono",
                    cacheFreshness.stale
                      ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"
                      : "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"
                  )}
                >
                  {cacheFreshness.label}
                </Badge>
              ) : null}
            </div>

            {/* Section health bar */}
            <div className="flex items-center gap-1.5 text-xs">
              {freshSections > 0 && (
                <Badge variant="secondary" className="text-[9px] font-mono gap-1 bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20">
                  <Wifi className="w-2.5 h-2.5" />
                  {freshSections} fresh
                </Badge>
              )}
              {staleSections > 0 && (
                <Badge variant="secondary" className="text-[9px] font-mono gap-1 bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20">
                  <Clock className="w-2.5 h-2.5" />
                  {staleSections} saved
                </Badge>
              )}
              {failedSections > 0 && (
                <Badge variant="secondary" className="text-[9px] font-mono gap-1 bg-destructive/10 text-destructive border-destructive/20">
                  <WifiOff className="w-2.5 h-2.5" />
                  {failedSections} offline
                </Badge>
              )}
            </div>

            {/* Refresh button */}
            {staleSections > 0 && onRefreshAll && !isAnyRefreshing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshAll}
                className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Refresh {staleSections} stale section{staleSections > 1 ? 's' : ''}
              </Button>
            )}

            {failedSections > 0 && staleSections === 0 && (
              <p className="text-[10px] text-muted-foreground/70 italic">
                Some live data sources are temporarily unavailable
              </p>
            )}
          </div>
        )}

        {/* Legacy Data Freshness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Freshness</span>
          </div>
          {freshness ? (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                freshness.stale
                  ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"
                  : "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"
              )}
            >
              {freshness.label}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">No timestamp</Badge>
          )}
        </div>

        {dateStr && (
          <p className="text-[10px] text-muted-foreground">
            Last verified: {new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {totalScans > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scan coverage</span>
              <span className="font-medium text-foreground">{completedScans}/{totalScans} modules</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedScans / totalScans) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Confidence Tiers Legend */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Signal Confidence Tiers</p>
          {CONFIDENCE_TIERS.map((tier) => (
            <div key={tier.level} className="flex items-start gap-2">
              <tier.icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", tier.className)} />
              <div>
                <span className={cn("text-xs font-medium", tier.className)}>{tier.level} Confidence</span>
                <p className="text-[10px] text-muted-foreground">{tier.sources}</p>
                <p className="text-[10px] text-muted-foreground/70 italic">{tier.note}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
