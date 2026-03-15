import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function CompensationHealthPanel() {
  const { data: audit = [], isLoading } = useQuery({
    queryKey: ["comp-freshness-audit"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("compensation_freshness_audit")
        .select("*")
        .limit(20);
      return (data || []) as {
        company: string;
        freshness_status: string;
        days_since_update: number;
        health_status: string;
      }[];
    },
  });

  const ok = audit.filter((r) => r.health_status === "OK").length;
  const needs = audit.filter((r) => r.health_status === "NEEDS_REFRESH").length;
  const failed = audit.filter((r) => r.health_status === "FAILED").length;
  const partial = audit.filter((r) => r.health_status === "PARTIAL").length;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4.5 h-4.5 text-primary" /> Compensation Data Health
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : audit.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No compensation data indexed yet</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-civic-green">{ok}</p>
              <p className="text-[10px] text-muted-foreground">Fresh</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-civic-yellow">{needs}</p>
              <p className="text-[10px] text-muted-foreground">Stale</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{failed}</p>
              <p className="text-[10px] text-muted-foreground">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground">{partial}</p>
              <p className="text-[10px] text-muted-foreground">Partial</p>
            </div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {audit.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-muted/30">
                <span className="text-foreground font-medium truncate max-w-[140px]">{r.company}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">{Math.round(r.days_since_update)}d</span>
                  {r.health_status === "OK" && <CheckCircle className="w-3 h-3 text-civic-green" />}
                  {r.health_status === "NEEDS_REFRESH" && <Clock className="w-3 h-3 text-civic-yellow" />}
                  {r.health_status === "FAILED" && <AlertTriangle className="w-3 h-3 text-destructive" />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
