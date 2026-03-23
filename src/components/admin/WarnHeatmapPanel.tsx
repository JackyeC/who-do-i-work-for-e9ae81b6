import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, AlertTriangle, Users, Building2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface WarnNotice {
  company_id: string;
  employees_affected: number;
  location_state: string | null;
  location_city: string | null;
  notice_date: string;
  layoff_type: string;
  employer_name_raw: string | null;
}

interface StateData {
  state: string;
  totalAffected: number;
  noticeCount: number;
  topCities: string[];
  companies: { name: string; affected: number }[];
}

function getIntensity(affected: number): { label: string; color: string; bg: string } {
  if (affected >= 5000) return { label: "Critical", color: "text-destructive", bg: "bg-destructive/15 border-destructive/30" };
  if (affected >= 1000) return { label: "High", color: "text-civic-yellow", bg: "bg-civic-yellow/10 border-civic-yellow/30" };
  if (affected >= 200) return { label: "Moderate", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
  return { label: "Low", color: "text-muted-foreground", bg: "bg-muted/40 border-border/40" };
}

export function WarnHeatmapPanel() {
  const [expandedState, setExpandedState] = useState<string | null>(null);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["admin-warn-heatmap"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const { data } = await supabase
        .from("company_warn_notices")
        .select("company_id, employees_affected, location_state, location_city, notice_date, layoff_type, employer_name_raw")
        .gte("notice_date", cutoff.toISOString().split("T")[0])
        .order("employees_affected", { ascending: false })
        .limit(1000);
      return (data || []) as WarnNotice[];
    },
  });

  // Aggregate by state
  const stateMap = new Map<string, StateData>();
  for (const n of notices) {
    const st = n.location_state || "Unknown";
    if (!stateMap.has(st)) {
      stateMap.set(st, { state: st, totalAffected: 0, noticeCount: 0, topCities: [], companies: [] });
    }
    const s = stateMap.get(st)!;
    s.totalAffected += n.employees_affected || 0;
    s.noticeCount += 1;
    if (n.location_city && !s.topCities.includes(n.location_city)) s.topCities.push(n.location_city);
    const companyName = n.employer_name_raw || "Unknown";
    const existing = s.companies.find((c) => c.name === companyName);
    if (existing) existing.affected += n.employees_affected || 0;
    else s.companies.push({ name: companyName, affected: n.employees_affected || 0 });
  }

  const states = Array.from(stateMap.values()).sort((a, b) => b.totalAffected - a.totalAffected);
  const totalAffected = states.reduce((s, st) => s + st.totalAffected, 0);
  const totalNotices = notices.length;

  // Top companies across all states
  const companyAgg = new Map<string, number>();
  for (const n of notices) {
    const name = n.employer_name_raw || "Unknown";
    companyAgg.set(name, (companyAgg.get(name) || 0) + (n.employees_affected || 0));
  }
  const topCompanies = Array.from(companyAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
        <AlertTriangle className="w-4.5 h-4.5 text-destructive" /> WARN / Layoff Heatmap
        <Badge variant="outline" className="text-xs font-mono ml-auto">Last 12 months</Badge>
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : notices.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">No WARN notices in the last 12 months</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
              <p className="text-xs text-muted-foreground">Notices</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{totalNotices.toLocaleString()}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
              <p className="text-xs text-muted-foreground">Workers Affected</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{totalAffected.toLocaleString()}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
              <p className="text-xs text-muted-foreground">States Impacted</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{states.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* State heatmap grid */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> By State
              </p>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {states.map((st) => {
                  const intensity = getIntensity(st.totalAffected);
                  const isExpanded = expandedState === st.state;
                  return (
                    <div key={st.state}>
                      <button
                        onClick={() => setExpandedState(isExpanded ? null : st.state)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-lg border text-sm transition-colors text-left",
                          intensity.bg
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-foreground">{st.state}</span>
                          <Badge variant="outline" className={cn("text-xs font-mono", intensity.color)}>
                            {intensity.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground tabular-nums">{st.totalAffected.toLocaleString()} affected</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="ml-3 mt-1 mb-2 space-y-1 pl-3 border-l-2 border-border/40">
                          {st.companies.sort((a, b) => b.affected - a.affected).slice(0, 5).map((co, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1">
                              <span className="text-foreground truncate max-w-[180px]">{co.name}</span>
                              <span className="text-muted-foreground tabular-nums">{co.affected.toLocaleString()}</span>
                            </div>
                          ))}
                          {st.topCities.length > 0 && (
                            <p className="text-xs text-muted-foreground/70 pt-1">
                              Cities: {st.topCities.slice(0, 4).join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top impacted companies */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Top Impacted Companies
              </p>
              <div className="space-y-2">
                {topCompanies.map(([name, affected], i) => {
                  const pct = topCompanies[0] ? Math.round((affected / topCompanies[0][1]) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground font-medium truncate max-w-[180px]">{name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{affected.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {topCompanies.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No company data available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
