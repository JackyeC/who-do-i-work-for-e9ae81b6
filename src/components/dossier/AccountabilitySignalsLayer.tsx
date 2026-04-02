import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ShieldAlert, Users, Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountabilitySignals, type AccountabilitySignal } from "@/hooks/use-accountability-signals";

/* ── Category config ── */
const CATEGORIES = [
  {
    key: "power_influence",
    label: "Power & Influence",
    tag: "Influence Network",
    icon: Eye,
    color: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
  },
  {
    key: "conduct_culture",
    label: "Conduct & Culture",
    tag: "Conduct Signal",
    icon: ShieldAlert,
    color: "text-destructive",
    border: "border-destructive/20",
    bg: "bg-destructive/5",
  },
  {
    key: "nepotism_governance",
    label: "Governance & Oversight",
    tag: "Governance Signal",
    icon: Users,
    color: "text-[hsl(var(--civic-yellow))]",
    border: "border-[hsl(var(--civic-yellow))]/20",
    bg: "bg-[hsl(var(--civic-yellow))]/5",
  },
  {
    key: "narrative_gap",
    label: "Narrative Gap",
    tag: "Narrative Gap",
    icon: AlertTriangle,
    color: "text-[hsl(var(--civic-yellow))]",
    border: "border-[hsl(var(--civic-yellow))]/20",
    bg: "bg-[hsl(var(--civic-yellow))]/5",
  },
] as const;

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-destructive/10 text-destructive border-destructive/30",
  convicted: "bg-destructive/15 text-destructive border-destructive/40",
  settled: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  alleged: "bg-muted/40 text-muted-foreground border-border/40",
  reported: "bg-muted/30 text-muted-foreground border-border/30",
  under_investigation: "bg-primary/10 text-primary border-primary/30",
  dismissed: "bg-muted/20 text-muted-foreground/60 border-border/20",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-[hsl(var(--civic-yellow))]",
  medium: "bg-primary",
  low: "bg-muted-foreground/40",
};

function formatDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch { return null; }
}

/* ── Main component ── */
interface Props {
  companyId: string;
  companyName: string;
}

export function AccountabilitySignalsLayer({ companyId, companyName }: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const { signals, grouped: hookGrouped, isEnabled, isLoading } = useAccountabilitySignals(companyId);

  // Feature gate: hide for unapproved companies
  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-10 px-6">
        <ShieldAlert className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No public-record accountability signals found for {companyName}.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          This section surfaces documented patterns of power, conduct, governance, and narrative gaps when public records exist.
        </p>
      </div>
    );
  }

  // Merge hook grouping with UI config (icons, colors)
  const grouped = CATEGORIES
    .map(cat => {
      const match = hookGrouped.find(g => g.category === cat.key);
      if (!match || match.signals.length === 0) return null;
      return { ...cat, signals: match.signals, highSeverityCount: match.highSeverityCount };
    })
    .filter(Boolean) as (typeof CATEGORIES[number] & { signals: AccountabilitySignal[]; highSeverityCount: number })[];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed px-1 italic">
        This section summarizes public records and reputable reporting. Inclusion does not by itself imply endorsement, guilt, or innocence. It is here so workers can see how power, money, and decisions may affect their jobs.
      </p>

      {grouped.map(group => {
        const isExpanded = expandedCat === group.key;
        const Icon = group.icon;
        const criticalCount = group.highSeverityCount;

        return (
          <div key={group.key} className={cn("border rounded-lg overflow-hidden transition-colors", group.border, isExpanded && group.bg)}>
            <button
              onClick={() => setExpandedCat(isExpanded ? null : group.key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
            >
              <Icon className={cn("w-4 h-4 shrink-0", group.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{group.signals.length}</Badge>
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {criticalCount} high severity
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{group.tag}</span>
              </div>
              <span className="text-[10px] text-muted-foreground mr-1">
                {isExpanded ? "Hide" : "See signals"}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {group.signals.map(signal => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Individual signal card ── */
function SignalCard({ signal }: { signal: AccountabilitySignal }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = formatDate(signal.event_date);
  const statusStyle = STATUS_STYLES[signal.status_label] || STATUS_STYLES.reported;
  const severityDot = SEVERITY_DOT[signal.severity] || SEVERITY_DOT.medium;

  return (
    <div className="border border-border/30 rounded-lg bg-background/60">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", severityDot)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">{signal.headline}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="outline" className={cn("text-[10px] capitalize", statusStyle)}>
                {signal.status_label.replace(/_/g, " ")}
              </Badge>
              {signal.subject_name && (
                <span className="text-[11px] text-muted-foreground">
                  {signal.subject_name}{signal.subject_role ? ` · ${signal.subject_role}` : ""}
                </span>
              )}
              {dateStr && <span className="text-[10px] text-muted-foreground font-mono">{dateStr}</span>}
              {signal.is_verified && (
                <Badge variant="outline" className="text-[10px] border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]">
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3 animate-in fade-in duration-150">
          {signal.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{signal.description}</p>
          )}

          {signal.why_it_matters && (
            <div className="bg-primary/5 border border-primary/10 rounded-md px-3 py-2">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">Why this matters to workers</p>
              <p className="text-sm text-foreground leading-relaxed">{signal.why_it_matters}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              Source: {signal.source_name || signal.source_type.replace(/_/g, " ")}
            </span>
            {signal.source_url && (
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                View receipt <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
