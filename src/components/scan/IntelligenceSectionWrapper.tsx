/**
 * Wrapper for intelligence sections that handles:
 * - Loading state
 * - Stale data indicators
 * - Section-level failures with polished messaging
 * - Refresh buttons with status
 */

import { ReactNode } from 'react';
import { RefreshCw, Clock, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SectionReport, RefreshStatus } from '@/hooks/use-company-intelligence';
import type { IntelligenceSection } from '@/lib/intelligence-provider';
import { SECTION_LABELS } from '@/lib/intelligence-provider';

interface IntelligenceSectionWrapperProps {
  section: IntelligenceSection;
  report: SectionReport | null;
  loading?: boolean;
  refreshStatus?: RefreshStatus;
  onRefresh?: () => void;
  children: ReactNode;
  showRefresh?: boolean;
}

export function IntelligenceSectionWrapper({
  section,
  report,
  loading,
  refreshStatus = 'idle',
  onRefresh,
  children,
  showRefresh = true,
}: IntelligenceSectionWrapperProps) {
  const isRefreshing = refreshStatus === 'refreshing';

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const hasData = report && report.content &&
    (typeof report.content !== 'object' || Object.keys(report.content).length > 0);

  // No data at all — interpreted intelligence state
  if (!hasData) {
    const sectionLabel = SECTION_LABELS[section]?.toLowerCase() || section;
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border/40 bg-muted/10 overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                We checked public sources for {sectionLabel} signals. No records were found in the databases we monitor.
              </p>
              {report?.last_error ? (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Some live sources were temporarily unavailable during the last scan.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  Absence of data is still a signal.
                </p>
              )}
            </div>
          </div>
          {showRefresh && onRefresh && (
            <div className="px-4 pb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Scanning…' : 'Scan Again'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Freshness / status bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isRefreshing && (
            <Badge variant="secondary" className="text-[10px] font-mono gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              Refresh in progress
            </Badge>
          )}
          {refreshStatus === 'success' && (
            <Badge variant="secondary" className="text-[10px] font-mono gap-1 border-primary/30 text-primary">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Just updated
            </Badge>
          )}
          {report.isStale && refreshStatus !== 'refreshing' && (
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Clock className="w-2.5 h-2.5" />
              Using saved intelligence
            </Badge>
          )}
          {report.last_successful_update && !report.isStale && (
            <Badge variant="secondary" className="text-[10px] font-mono gap-1">
              <Database className="w-2.5 h-2.5" />
              {report.freshnessLabel}
            </Badge>
          )}
          {report.last_error && refreshStatus !== 'refreshing' && (
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-destructive/30 text-destructive">
              Live refresh unavailable
            </Badge>
          )}
        </div>

        {showRefresh && onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground shrink-0"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Actual content */}
      {children}
    </div>
  );
}
