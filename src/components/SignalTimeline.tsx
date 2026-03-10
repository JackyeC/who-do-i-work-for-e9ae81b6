import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, TrendingUp, TrendingDown, Plus, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CHANGE_ICONS: Record<string, typeof Plus> = {
  "New Signal": Plus,
  "Signal Removed": Minus,
  "Evidence Update": RefreshCw,
  "Source Change": RefreshCw,
};

const CHANGE_COLORS: Record<string, string> = {
  "New Signal": "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30",
  "Signal Removed": "text-destructive bg-destructive/10 border-destructive/30",
  "Evidence Update": "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30",
  "Source Change": "text-primary bg-primary/10 border-primary/30",
};

interface SignalTimelineProps {
  companyId: string;
}

export function SignalTimeline({ companyId }: SignalTimelineProps) {
  const { data: changes, isLoading } = useQuery({
    queryKey: ["signal-timeline", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("signal_change_log")
        .select("*")
        .eq("company_id", companyId)
        .order("scan_timestamp", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: scans } = useQuery({
    queryKey: ["signal-scans", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_signal_scans")
        .select("*")
        .eq("company_id", companyId)
        .order("scan_timestamp", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Check if any Browse AI monitoring is active
  const { data: monitors } = useQuery({
    queryKey: ["timeline-monitors", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("browse_ai_monitors" as any)
        .select("status")
        .eq("company_id", companyId)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!companyId,
  });

  const hasActiveMonitoring = (monitors || []).length > 0;
  const hasMonitoringScans = (scans || []).some((s: any) => s.signal_category === 'monitoring');

  // Group changes by month
  const grouped = (changes || []).reduce<Record<string, typeof changes>>((acc, change) => {
    const date = new Date(change.scan_timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(change);
    return acc;
  }, {});

  const months = Object.keys(grouped).sort().reverse();
  const hasData = months.length > 0 || (scans && scans.length > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Signal Timeline</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Loading timeline…</p></CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Signal Timeline</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No signal history available yet. Timeline entries will appear after the next scan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Signal Timeline
          {scans && scans.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto">{scans.length} scans recorded</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(hasActiveMonitoring || hasMonitoringScans) && (
          <p className="text-xs text-muted-foreground mb-3 italic">
            Timeline includes updates detected through monitored public pages.
          </p>
        )}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          {months.length > 0 ? months.map((monthKey) => {
            const [year, month] = monthKey.split("-");
            const label = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });

            return (
              <div key={monthKey} className="mb-6 last:mb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>

                <div className="ml-9 space-y-2">
                  {grouped[monthKey]!.map((change) => {
                    const Icon = CHANGE_ICONS[change.change_type] || RefreshCw;
                    const colorClass = CHANGE_COLORS[change.change_type] || CHANGE_COLORS["Source Change"];

                    return (
                      <div key={change.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border">
                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 border", colorClass)}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <Badge variant="outline" className="text-[10px]">{change.signal_category}</Badge>
                            <Badge variant="outline" className={cn("text-[10px]", colorClass)}>{change.change_type}</Badge>
                          </div>
                          <p className="text-sm text-foreground">
                            {change.new_value || change.previous_value || "Signal change detected"}
                          </p>
                          {change.confidence_change && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Evidence strength: {change.confidence_change === "high" ? "Strong" : change.confidence_change === "medium" ? "Some" : change.confidence_change}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(change.scan_timestamp).toLocaleDateString()}
                            </span>
                            {change.source_url && (
                              <a href={change.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                                Source <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className="ml-9">
              <p className="text-sm text-muted-foreground">
                {scans && scans.length > 0
                  ? `${scans.length} scan${scans.length !== 1 ? "s" : ""} recorded. No signal changes detected between scans yet.`
                  : "No changes detected yet."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
