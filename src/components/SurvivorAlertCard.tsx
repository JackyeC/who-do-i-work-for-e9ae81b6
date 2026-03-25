import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, MapPin, Shield, Globe, Target, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SurvivorAlertProps {
  companyName: string;
  dbCompanyId: string;
}

interface StateData {
  affected: number;
  notices: number;
  cities: string[];
}

interface SurvivorAlert {
  contact_id: string;
  contact_name: string;
  contact_title: string | null;
  contact_company: string;
  risk_level: string;
  reason: string;
  impacted_states: string[];
  total_affected: number;
}

interface StrategicAutopsy {
  abolished_pattern: string;
  retained_pattern: string;
  strategic_shift: string;
  risk_level: string;
  poaching_targets: string;
  offshore_alert?: string;
}

type ViewScope = "national" | "state" | "local";

const HEATMAP_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/70 text-destructive-foreground",
  moderate: "bg-civic-yellow/80 text-white",
  low: "bg-civic-yellow/60 text-foreground",
};

export function SurvivorAlertCard({ companyName, dbCompanyId }: SurvivorAlertProps) {
  const { user } = useAuth();
  const [scope, setScope] = useState<ViewScope>("national");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAutopsy, setShowAutopsy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["survivor-alert", dbCompanyId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("survivor-alert", {
        body: { company_id: dbCompanyId, user_id: user?.id },
      });
      if (error) throw error;
      return data as {
        alerts: SurvivorAlert[];
        heatmap: Record<string, StateData>;
        strategicAutopsy: StrategicAutopsy | null;
        offshoreFlag: boolean;
        offshoreSignals: string[];
        totalNotices: number;
        totalAffected: number;
      };
    },
    enabled: !!dbCompanyId && !!user?.id,
  });

  if (!user) return null;

  const heatmap = data?.heatmap || {};
  const alerts = data?.alerts || [];
  const autopsy = data?.strategicAutopsy;
  const stateEntries = Object.entries(heatmap).sort((a, b) => b[1].affected - a[1].affected);

  const getIntensity = (affected: number): string => {
    if (affected >= 1000) return "critical";
    if (affected >= 500) return "high";
    if (affected >= 100) return "moderate";
    return "low";
  };

  const filteredStates = scope === "state" && selectedState
    ? stateEntries.filter(([s]) => s === selectedState)
    : stateEntries;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.totalNotices) return null;

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            RIF Intelligence & Survivor Alerts
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {(data.totalAffected ?? 0).toLocaleString()} affected
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          National workforce reduction intelligence for {companyName} with connection impact analysis.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scope Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["national", "state", "local"] as ViewScope[]).map((s) => (
            <button
              key={s}
              onClick={() => { setScope(s); if (s !== "state") setSelectedState(null); }}
              className={cn(
                "flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors capitalize",
                scope === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "national" ? "🇺🇸 National" : s === "state" ? "📍 State" : "🏘️ Local"}
            </button>
          ))}
        </div>

        {/* State selector when in state mode */}
        {scope === "state" && (
          <div className="flex flex-wrap gap-1.5">
            {stateEntries.map(([state, info]) => (
              <button
                key={state}
                onClick={() => setSelectedState(state === selectedState ? null : state)}
                className={cn(
                  "text-xs px-2 py-1 rounded-md border transition-colors font-mono",
                  selectedState === state
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent/40"
                )}
              >
                {state} ({info.affected.toLocaleString()})
              </button>
            ))}
          </div>
        )}

        {/* Layoff Heatmap */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">Layoff Heatmap</span>
            <span className="text-xs text-muted-foreground">
              {filteredStates.length} state{filteredStates.length !== 1 ? "s" : ""} impacted
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredStates.map(([state, info]) => {
              const intensity = getIntensity(info.affected);
              return (
                <div
                  key={state}
                  className={cn(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    HEATMAP_COLORS[intensity],
                    "border-border/20"
                  )}
                  onClick={() => { setScope("state"); setSelectedState(state); }}
                >
                  <div className="font-bold text-lg font-mono">{state}</div>
                  <div className="text-xs opacity-90">
                    {info.affected.toLocaleString()} affected
                  </div>
                  <div className="text-xs opacity-70">
                    {info.notices} filing{info.notices !== 1 ? "s" : ""}
                    {info.cities.length > 0 && ` · ${info.cities.slice(0, 2).join(", ")}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Survivor Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                Survivor Alerts — {alerts.length} Connection{alerts.length !== 1 ? "s" : ""} Impacted
              </span>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.contact_id} className="flex items-start gap-3 p-2 rounded-md bg-background/60">
                  <Users className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{alert.contact_name}</span>
                    {alert.contact_title && (
                      <span className="text-xs text-muted-foreground ml-1.5">· {alert.contact_title}</span>
                    )}
                    <p className="text-xs text-destructive/80 mt-0.5">{alert.reason}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {alert.risk_level.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              💡 These connections may be high-priority poaching targets or need outreach support.
            </p>
          </div>
        )}

        {/* Offshore / Strategic Workforce Shift */}
        {data.offshoreFlag && (
          <div className="rounded-lg border border-civic-yellow/30 bg-civic-yellow/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-civic-yellow" />
              <span className="text-sm font-semibold text-civic-yellow">
                Strategic Workforce Shift Detected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              US WARN filings detected alongside international entity growth — potential offshoring pattern.
            </p>
            {data.offshoreSignals.map((sig, i) => (
              <p key={i} className="text-xs text-foreground/80 pl-3 border-l-2 border-civic-yellow/40 mb-1">
                {sig}
              </p>
            ))}
          </div>
        )}

        {/* Strategic Autopsy */}
        {autopsy && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <button
              onClick={() => setShowAutopsy(!showAutopsy)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Strategic Autopsy</span>
                <Badge
                  variant={autopsy.risk_level === "critical" ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {autopsy.risk_level.toUpperCase()} RISK
                </Badge>
              </div>
              {showAutopsy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAutopsy && (
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase text-destructive tracking-wider">Abolished Roles</span>
                  <p className="text-xs text-foreground mt-0.5">{autopsy.abolished_pattern}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-civic-green tracking-wider">Retained / Growing</span>
                  <p className="text-xs text-foreground mt-0.5">{autopsy.retained_pattern}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-primary tracking-wider">Strategic Shift</span>
                  <p className="text-xs text-foreground mt-0.5">{autopsy.strategic_shift}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-civic-yellow tracking-wider">Poaching Targets</span>
                  <p className="text-xs text-foreground mt-0.5">{autopsy.poaching_targets}</p>
                </div>
                {autopsy.offshore_alert && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-civic-yellow tracking-wider">Offshore Alert</span>
                    <p className="text-xs text-foreground mt-0.5">{autopsy.offshore_alert}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Intensity:</span>
          {[
            { label: "Low", color: "bg-civic-yellow/60" },
            { label: "Moderate", color: "bg-civic-yellow/80" },
            { label: "High", color: "bg-destructive/70" },
            { label: "Critical", color: "bg-destructive" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
