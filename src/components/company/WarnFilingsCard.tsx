import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WarnNotice {
  id: string;
  notice_date: string;
  employees_affected: number;
  location_city: string | null;
  location_state: string | null;
  layoff_type: string;
  reason: string | null;
  source_url: string | null;
  source_state: string | null;
}

interface WarnFilingsCardProps {
  companyId: string;
  companyName: string;
  /** Render as top-priority signal with caution styling */
  prominent?: boolean;
}

function useWarnFilings(companyId: string) {
  return useQuery({
    queryKey: ["warn-filings", companyId],
    queryFn: async () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const { data, error } = await supabase
        .from("company_warn_notices")
        .select(
          "id, notice_date, employees_affected, location_city, location_state, layoff_type, reason, source_url, source_state"
        )
        .eq("company_id", companyId)
        .gte("notice_date", threeYearsAgo.toISOString().split("T")[0])
        .order("notice_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as WarnNotice[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

function buildSummary(filings: WarnNotice[], companyName: string): string {
  if (filings.length === 0) return "";

  const totalAffected = filings.reduce((s, f) => s + (f.employees_affected || 0), 0);
  const oldestYear = new Date(filings[filings.length - 1].notice_date).getFullYear();
  const states = [...new Set(filings.map((f) => f.location_state).filter(Boolean))];
  const stateList = states.length > 3
    ? `${states.slice(0, 3).join(", ")}, and ${states.length - 3} other state${states.length - 3 > 1 ? "s" : ""}`
    : states.join(", ");

  return `${companyName} filed ${filings.length} WARN notice${filings.length > 1 ? "s" : ""} since ${oldestYear} affecting ${totalAffected.toLocaleString()} workers${stateList ? ` in ${stateList}` : ""}.`;
}

function formatLocation(city: string | null, state: string | null): string {
  if (city && state) return `${city}, ${state}`;
  return state || city || "—";
}

export function WarnFilingsCard({ companyId, companyName, prominent = false }: WarnFilingsCardProps) {
  const { data: filings = [], isLoading } = useWarnFilings(companyId);

  // Loading — don't show anything
  if (isLoading) return null;

  // No filings — show reassuring note
  if (filings.length === 0) {
    return (
      <Card className="border-border/40 bg-muted/10">
        <CardContent className="p-4 flex items-start gap-3">
          <FileWarning className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">No WARN Filings Found</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No WARN filings found. This is a good sign — but WARN only covers layoffs of 50+ employees. Smaller cuts won't appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = buildSummary(filings, companyName);
  const mostRecent = filings[0];
  const severity = filings.length >= 3 ? "high" : filings.length >= 2 ? "moderate" : "low";

  const severityStyles = {
    high: "border-destructive/30 bg-destructive/5",
    moderate: "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5",
    low: "border-border/40 bg-muted/10",
  };

  const severityBadge = {
    high: { label: "Multiple Filings", className: "bg-destructive/10 text-destructive border-destructive/30" },
    moderate: { label: "Active Filings", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
    low: { label: "WARN Filed", className: "bg-muted text-muted-foreground border-border" },
  };

  const badge = severityBadge[severity];
  const warnTrackerUrl = `https://www.warntracker.com/?company=${encodeURIComponent(companyName)}`;

  return (
    <Card className={cn("border", prominent ? severityStyles[severity] : severityStyles[severity])}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("w-4 h-4 shrink-0", severity === "high" ? "text-destructive" : "text-[hsl(var(--civic-yellow))]")} />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Layoff History
            </h3>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-mono", badge.className)}>
            {badge.label}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground leading-relaxed mb-4">
          {summary}
        </p>

        {/* Most recent filing */}
        <div className="bg-muted/30 rounded-lg border border-border/40 p-3 mb-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
            Most Recent Filing
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Date</p>
              <p className="text-sm font-bold text-foreground">
                {format(new Date(mostRecent.notice_date), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Workers Affected</p>
              <p className="text-sm font-bold text-foreground">
                {mostRecent.employees_affected.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Location</p>
              <p className="text-sm font-bold text-foreground">
                {formatLocation(mostRecent.location_city, mostRecent.location_state)}
              </p>
            </div>
          </div>
          {mostRecent.reason && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Reason: {mostRecent.reason}
            </p>
          )}
        </div>

        {/* Additional filings summary */}
        {filings.length > 1 && (
          <div className="space-y-1.5 mb-3">
            {filings.slice(1, 4).map((f) => (
              <div key={f.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{format(new Date(f.notice_date), "MMM yyyy")} · {formatLocation(null, f.location_state)}</span>
                <span className="font-mono">{f.employees_affected.toLocaleString()} workers</span>
              </div>
            ))}
            {filings.length > 4 && (
              <p className="text-xs text-muted-foreground italic">
                + {filings.length - 4} additional filing{filings.length - 4 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Source links */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/40">
          <Badge variant="outline" className="text-[10px] font-mono">
            State WARN Database
          </Badge>
          {mostRecent.source_url && (
            <a
              href={mostRecent.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              View filing <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <a
            href={warnTrackerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline ml-auto"
          >
            WARNTracker <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
