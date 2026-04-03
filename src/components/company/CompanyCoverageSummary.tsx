/**
 * CompanyCoverageSummary — Shows signal coverage per source family
 * with nuanced empty states instead of "No Recent Data".
 */
import { useCompanyCoverage, getSourceLabel, getCoverageMessage, type CoverageEntry } from "@/hooks/useCompanyCoverage";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, FileText, DollarSign, HardHat, AlertTriangle, Newspaper, Briefcase, Scale, BarChart3, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  never_checked: "bg-muted/30 text-muted-foreground/60 border-border/50",
};

interface Props {
  companyId: string;
  compact?: boolean;
}

export function CompanyCoverageSummary({ companyId, compact = false }: Props) {
  const { data: coverage, isLoading } = useCompanyCoverage(companyId);

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
          <TransparencyBadge index={coverage.transparencyIndex} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {coverage.entries.map((entry) => (
            <CoverageCard key={entry.source_family} entry={entry} />
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

function CoverageCard({ entry }: { entry: CoverageEntry }) {
  const Icon = SOURCE_ICONS[entry.source_family] || Search;
  const statusClass = STATUS_COLORS[entry.coverage_status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`rounded-lg border px-3 py-2 ${statusClass} cursor-default transition-colors`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium truncate">
              {getSourceLabel(entry.source_family)}
            </span>
          </div>
          <div className="text-[10px] opacity-80 truncate">
            {entry.coverage_status === "rich" && `${entry.signal_count} records`}
            {entry.coverage_status === "limited" && `${entry.signal_count} found`}
            {entry.coverage_status === "no_trail" && "No trail"}
            {entry.coverage_status === "never_checked" && "Not scanned"}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{getCoverageMessage(entry)}</p>
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
