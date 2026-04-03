/**
 * CompanyCoverageSummary — Shows signal coverage per source family
 * with intelligence-grade messaging: What we found, what's missing, what it means.
 */
import { useState } from "react";
import { useCompanyCoverage, getSourceLabel, getCoverageIntelligence, type CoverageEntry } from "@/hooks/useCompanyCoverage";
import { useOsintParallelScan } from "@/hooks/use-osint-parallel-scan";
import { usePremium } from "@/hooks/use-premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, FileText, DollarSign, HardHat, AlertTriangle, Newspaper,
  Briefcase, Scale, BarChart3, Search, Loader2, Scan, Lock,
  ChevronDown, CheckCircle, Eye, XCircle, HelpCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; badgeClass: string }> = {
  rich: {
    label: "Strong",
    icon: CheckCircle,
    badgeClass: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/10",
  },
  limited: {
    label: "Partial",
    icon: Eye,
    badgeClass: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/10",
  },
  no_trail: {
    label: "No trail",
    icon: XCircle,
    badgeClass: "text-muted-foreground border-border bg-muted/30",
  },
  never_checked: {
    label: "Not scanned",
    icon: HelpCircle,
    badgeClass: "text-muted-foreground/60 border-border/50 bg-muted/20",
  },
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
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
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
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/20" />
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
      <div className="flex items-center gap-1.5 flex-wrap">
        {coverage.entries.map((entry) => {
          const status = STATUS_CONFIG[entry.coverage_status];
          const StatusIcon = status.icon;
          return (
            <Badge key={entry.source_family} variant="outline" className={cn("text-[9px] gap-1 px-1.5 py-0", status.badgeClass)}>
              <StatusIcon className="w-2.5 h-2.5" />
              {getSourceLabel(entry.source_family).split(" ")[0]}
            </Badge>
          );
        })}
        <span className="text-xs text-muted-foreground ml-1">
          {coverage.coveredSources}/{coverage.totalSources} sources
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">What can you trust here?</h3>
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

      <p className="text-xs text-foreground/70 leading-relaxed -mt-1">
        Each source below shows what we found, what's missing, and what it means for your decision. Click any source to see the full picture.
      </p>

      {/* Source cards */}
      <div className="space-y-1.5">
        {coverage.entries.map((entry) => {
          const isExpanded = expandedSource === entry.source_family;
          const isThisScanning = scanning && (scanningSource === entry.source_family || scanningSource === "all");
          const isScannable = entry.coverage_status === "never_checked" || entry.coverage_status === "no_trail";

          return (
            <CoverageIntelligenceCard
              key={entry.source_family}
              entry={entry}
              isExpanded={isExpanded}
              isScanning={!!isThisScanning}
              isScannable={isScannable}
              isLocked={!canScanSingle}
              onToggle={() => setExpandedSource(isExpanded ? null : entry.source_family)}
              onScan={canScanSingle ? () => handleScanSource(entry.source_family) : handleUpgrade}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CoverageIntelligenceCardProps {
  entry: CoverageEntry;
  isExpanded: boolean;
  isScanning: boolean;
  isScannable: boolean;
  isLocked: boolean;
  onToggle: () => void;
  onScan: () => void;
}

function CoverageIntelligenceCard({
  entry, isExpanded, isScanning, isScannable, isLocked, onToggle, onScan,
}: CoverageIntelligenceCardProps) {
  const Icon = SOURCE_ICONS[entry.source_family] || Search;
  const status = STATUS_CONFIG[entry.coverage_status];
  const StatusIcon = status.icon;
  const intel = getCoverageIntelligence(entry);

  return (
    <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors"
      >
        {isScanning ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">
            {getSourceLabel(entry.source_family)}
          </span>
          <p className="text-xs text-foreground/70 truncate mt-0.5 leading-snug">
            {isScanning ? "Scanning public records…" : intel.whatWeFound}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0 shrink-0", status.badgeClass)}>
          <StatusIcon className="w-2.5 h-2.5" />
          {status.label}
        </Badge>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="bg-muted/20 rounded-md p-3 mt-2 space-y-3">
            {/* What we found */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-[hsl(var(--civic-green))]" />
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">What we found</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed pl-[18px]">
                {intel.whatWeFound}
              </p>
            </div>

            {/* What we didn't find */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-[hsl(var(--civic-yellow))]" />
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">What we didn't find</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed pl-[18px]">
                {intel.whatWeMissed}
              </p>
            </div>

            {/* What it means */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">What it means for you</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed pl-[18px]">
                {intel.whatItMeans}
              </p>
            </div>

            {/* Metadata row */}
            <div className="flex items-center justify-between pt-1 border-t border-border/20">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {entry.signal_count > 0 && (
                  <span className="font-mono">{entry.signal_count} record{entry.signal_count !== 1 ? "s" : ""}</span>
                )}
                {entry.last_checked_at && (
                  <span>Checked {formatDistanceToNow(new Date(entry.last_checked_at), { addSuffix: true })}</span>
                )}
              </div>
              {isScannable && !isScanning && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10 px-2"
                  onClick={(e) => { e.stopPropagation(); onScan(); }}
                >
                  {isLocked ? <Lock className="w-3 h-3" /> : <Scan className="w-3 h-3" />}
                  {isLocked ? "Upgrade to scan" : "Scan now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransparencyBadge({ index }: { index: number }) {
  const color = index >= 70
    ? "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10"
    : index >= 40
    ? "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10"
    : "text-destructive bg-destructive/10";

  return (
    <Badge variant="outline" className={cn("text-[10px] border-0", color)}>
      Transparency: {index}%
    </Badge>
  );
}
