import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export function ConversionFunnelPanel() {
  const { data: funnel, isLoading } = useQuery({
    queryKey: ["admin-conversion-funnel"],
    queryFn: async () => {
      const [emailRes, profileRes, vibeRes, reportRes, trackedRes] = await Promise.all([
        supabase.from("email_signups" as any).select("id", { count: "exact", head: true }),
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }),
        supabase.from("vibe_match_responses" as any).select("id", { count: "exact", head: true }),
        supabase.from("intelligence_reports" as any).select("id", { count: "exact", head: true }),
        supabase.from("tracked_companies" as any).select("id", { count: "exact", head: true }),
      ]);
      return {
        emailSignups: emailRes.count ?? 0,
        registeredUsers: profileRes.count ?? 0,
        vibeChecks: vibeRes.count ?? 0,
        reportsRun: reportRes.count ?? 0,
        companiesTracked: trackedRes.count ?? 0,
      };
    },
  });

  const steps: FunnelStep[] = funnel
    ? [
        { label: "Email Signups", count: funnel.emailSignups, color: "bg-primary" },
        { label: "Registered Users", count: funnel.registeredUsers, color: "bg-civic-blue" },
        { label: "Reality Checks", count: funnel.vibeChecks, color: "bg-civic-green" },
        { label: "Reports Generated", count: funnel.reportsRun, color: "bg-civic-yellow" },
        { label: "Companies Tracked", count: funnel.companiesTracked, color: "bg-destructive" },
      ]
    : [];

  const maxCount = steps.length > 0 ? Math.max(...steps.map((s) => s.count), 1) : 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
        <TrendingDown className="w-4.5 h-4.5 text-primary" /> Conversion Funnel
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = Math.max((step.count / maxCount) * 100, 4);
            const convRate =
              i > 0 && steps[i - 1].count > 0
                ? ((step.count / steps[i - 1].count) * 100).toFixed(1)
                : null;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground tabular-nums">
                      {step.count.toLocaleString()}
                    </span>
                    {convRate && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {convRate}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", step.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
