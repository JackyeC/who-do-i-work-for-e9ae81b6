/**
 * CompanyCoverageSummary — Shows signal coverage per source family
 * with nuanced empty states and clickable scan triggers.
 */
import { useCompanyCoverage, getSourceLabel, getCoverageMessage, type CoverageEntry } from "@/hooks/useCompanyCoverage";
import { useOsintParallelScan } from "@/hooks/use-osint-parallel-scan";
import { usePremium } from "@/hooks/use-premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, FileText, DollarSign, HardHat, AlertTriangle, Newspaper, Briefcase, Scale, BarChart3, Search, RefreshCw, Loader2, Scan, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SOURCE_ICONS: Record<string, any> = {
  sec: FileText,
  fec: DollarSign,
  osha: HardHat,
  warn: AlertTriangle,
  news: Newspaper,
  careers: Briefcase,
  nlrb: Scale,
  bls: BarChart3,
};

const STATUS_COLORS: Record<string, string> = {
  rich: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  limited: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  no_trail: "bg-muted/50 text-muted-foreground border-border",
  never_checked: "bg-muted/30 text-muted-foreground/60 border-border/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
};

interface Props {
  companyId: string;
  companyName?: string;
  compact?: boolean;
}

export function CompanyCoverageSummary({ companyId, companyName, compact = false }: Props) {
  const { data: coverage, isLoading } = useCompanyCoverage(companyId);
  const { scanning, runParallelScan } = useOsintParallelScan();
  const { canScanSingle, canScanAll, tier } = usePremium();
  const [scanningSource, setScanningSource] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleScanSource = async (sourceFamily: string) => {
    if (scanning || !canScanSingle) return;
    setScanningSource(sourceFamily);
    await runParallelScan(companyId, companyName || "", [sourceFamily]);
    setScanningSource(null);
    queryClient.invalidateQueries({ queryKey: ["company-coverage", companyId] });
  };

  const handleScanAll = async () => {
    if (scanning || !canScanAll) return;
    const unscanned = coverage?.entries
      .filter(e => e.coverage_status === "never_checked" || e.coverage_status === "no_trail")
      .map(e => e.source_family) || [];
    const sources = unscanned.length > 0 ? unscanned : undefined;
    setScanningSource("all");
    await runParallelScan(companyId, companyName || "", sources);
    setScanningSource(null);
    queryClient.invalidateQueries({ queryKey: ["company-coverage", companyId] });
  };

  const handleUpgrade = () => navigate("/pricing");

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/20" />
        ))}
      </div>
    );
  }

  if (!coverage) return null;

  const hasUnscanned = coverage.entries.some(
    e => e.coverage_status === "never_checked" || e.coverage_status === "no_trail"
  );

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5 flex-wrap">
          {coverage.entries.map((entry) => (
            <CoverageDot key={entry.source_family} entry={entry} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {coverage.coveredSources}/{coverage.totalSources} sources
          </span>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Data Coverage</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasUnscanned && canScanAll && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleScanAll}
                disabled={scanning}
              >
                {scanning && scanningSource === "all" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Scan className="w-3 h-3" />
                )}
                {scanning && scanningSource === "all" ? "Scanning..." : "Scan All Sources"}
              </Button>
            )}
            {hasUnscanned && !canScanAll && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleUpgrade}
              >
                <Lock className="w-3 h-3" />
                {tier === "free" ? "Upgrade to Scan" : "Upgrade for Full Scan"}
              </Button>
            )}
            <TransparencyBadge index={coverage.transparencyIndex} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {coverage.entries.map((entry) => (
            <CoverageCard
              key={entry.source_family}
              entry={entry}
              isScanning={scanning && (scanningSource === entry.source_family || scanningSource === "all")}
              onScan={canScanSingle ? () => handleScanSource(entry.source_family) : handleUpgrade}
              isLocked={!canScanSingle}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function CoverageDot({ entry }: { entry: CoverageEntry }) {
  const Icon = SOURCE_ICONS[entry.source_family] || Search;
  const dotColor = entry.coverage_status === "rich" ? "bg-emerald-400"
    : entry.coverage_status === "limited" ? "bg-amber-400"
    : entry.coverage_status === "no_trail" ? "bg-muted-foreground/40"
    : "bg-muted-foreground/20";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${dotColor}/20 border border-current/10`}>
          <Icon className={`w-3 h-3 ${dotColor.replace("bg-", "text-")}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium text-xs">{getSourceLabel(entry.source_family)}</p>
        <p className="text-xs text-muted-foreground">{getCoverageMessage(entry)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface CoverageCardProps {
  entry: CoverageEntry;
  isScanning?: boolean;
  onScan?: () => void;
  isLocked?: boolean;
}

function CoverageCard({ entry, isScanning, onScan, isLocked }: CoverageCardProps) {
  const Icon = SOURCE_ICONS[entry.source_family] || Search;
  const statusClass = STATUS_COLORS[entry.coverage_status];
  const isScannable = entry.coverage_status === "never_checked" || entry.coverage_status === "no_trail";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`rounded-lg border px-3 py-2 ${statusClass} transition-all ${isScannable && !isScanning ? "group" : "cursor-default"}`}
          onClick={isScannable && !isScanning ? onScan : undefined}
          role={isScannable ? "button" : undefined}
          tabIndex={isScannable ? 0 : undefined}
          onKeyDown={isScannable && !isScanning ? (e) => { if (e.key === "Enter") onScan?.(); } : undefined}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium truncate">
              {getSourceLabel(entry.source_family)}
            </span>
          </div>
          <div className="text-[10px] opacity-80 truncate">
            {isScanning && "Scanning..."}
            {!isScanning && entry.coverage_status === "rich" && `${entry.signal_count} records`}
            {!isScanning && entry.coverage_status === "limited" && `${entry.signal_count} found`}
            {!isScanning && entry.coverage_status === "no_trail" && (
              <span className="group-hover:hidden">No trail</span>
            )}
            {!isScanning && entry.coverage_status === "no_trail" && (
              <span className="hidden group-hover:inline text-primary">Click to rescan</span>
            )}
            {!isScanning && entry.coverage_status === "never_checked" && (
              <span className="group-hover:hidden">Not scanned</span>
            )}
            {!isScanning && entry.coverage_status === "never_checked" && (
              <span className="hidden group-hover:inline text-primary">
                {isLocked ? "Upgrade to scan" : "Click to scan"}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{isScanning ? "Scanning public records..." : getCoverageMessage(entry)}</p>
        {!isScanning && isScannable && (
          <p className="text-[10px] text-primary mt-1">
            {isLocked ? "Upgrade your plan to scan" : "Click to scan this source"}
          </p>
        )}
        {entry.last_checked_at && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Last checked {formatDistanceToNow(new Date(entry.last_checked_at), { addSuffix: true })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function TransparencyBadge({ index }: { index: number }) {
  const color = index >= 70 ? "bg-emerald-500/15 text-emerald-400"
    : index >= 40 ? "bg-amber-500/15 text-amber-400"
    : "bg-destructive/15 text-destructive";

  return (
    <Badge variant="outline" className={`text-[10px] ${color} border-0`}>
      Transparency: {index}%
    </Badge>
  );
}
