import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, FileCheck, AlertTriangle, CheckCircle2,
  XCircle, Clock, Users, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function MetricCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: string | number; icon: typeof ShieldCheck; color: string; loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-16 mt-0.5" />
        ) : (
          <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

export function ComplianceDashboard() {
  // Consent tracking
  const { data: consentStats, isLoading: consentLoading } = useQuery({
    queryKey: ["compliance-consent-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("auto_apply_settings")
        .select("id", { count: "exact", head: true });
      const { count: consented } = await supabase
        .from("auto_apply_settings")
        .select("id", { count: "exact", head: true })
        .not("consent_accepted_at", "is", null);
      return { total: total ?? 0, consented: consented ?? 0 };
    },
  });

  // Auto-apply queue safety stats
  const { data: queueStats, isLoading: queueLoading } = useQuery({
    queryKey: ["compliance-queue-stats"],
    queryFn: async () => {
      const statuses = ["completed", "skipped", "failed", "queued", "processing"] as const;
      const results: Record<string, number> = {};
      for (const status of statuses) {
        const { count } = await supabase
          .from("apply_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        results[status] = count ?? 0;
      }
      return results;
    },
  });

  // Application audit trail
  const { data: recentApps = [], isLoading: appsLoading } = useQuery({
    queryKey: ["compliance-recent-apps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications_tracker")
        .select("job_title, company_name, status, applied_at, alignment_score")
        .order("applied_at", { ascending: false })
        .limit(8);
      return (data || []) as {
        job_title: string;
        company_name: string;
        status: string;
        applied_at: string | null;
        alignment_score: number | null;
      }[];
    },
  });

  const consentRate = consentStats && consentStats.total > 0
    ? Math.round((consentStats.consented / consentStats.total) * 100)
    : 0;

  const totalProcessed = queueStats
    ? (queueStats.completed || 0) + (queueStats.skipped || 0) + (queueStats.failed || 0)
    : 0;

  const timeAgo = (ts: string | null) => {
    if (!ts) return "—";
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
        <ShieldCheck className="w-4.5 h-4.5 text-civic-green" />
        Compliance Health
      </h3>

      {/* Consent Tracker */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Fairness Contract Consent</span>
          <Badge variant="outline" className="text-xs font-mono">
            {consentStats?.consented ?? "—"} / {consentStats?.total ?? "—"}
          </Badge>
        </div>
        <Progress value={consentRate} className="h-2 mb-1" />
        <p className="text-xs text-muted-foreground">{consentRate}% of auto-apply users accepted</p>
      </div>

      {/* Safety Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <MetricCard
          label="Completed"
          value={queueStats?.completed ?? "—"}
          icon={CheckCircle2}
          color="bg-civic-green/10 text-civic-green"
          loading={queueLoading}
        />
        <MetricCard
          label="Safety Skipped"
          value={queueStats?.skipped ?? "—"}
          icon={AlertTriangle}
          color="bg-civic-yellow/10 text-civic-yellow"
          loading={queueLoading}
        />
        <MetricCard
          label="Failed"
          value={queueStats?.failed ?? "—"}
          icon={XCircle}
          color="bg-destructive/10 text-destructive"
          loading={queueLoading}
        />
        <MetricCard
          label="In Queue"
          value={queueStats?.queued ?? "—"}
          icon={Clock}
          color="bg-primary/10 text-primary"
          loading={queueLoading}
        />
      </div>

      {/* Application Audit Trail */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-muted-foreground" />
          Recent Application Audit Trail
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {appsLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
          ) : recentApps.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No applications tracked yet</p>
          ) : (
            recentApps.map((app, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/30 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground truncate block">{app.job_title}</span>
                  <span className="text-muted-foreground">{app.company_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.alignment_score != null && (
                    <Badge variant="outline" className="text-xs font-mono">{app.alignment_score}%</Badge>
                  )}
                  <span className="text-muted-foreground">{timeAgo(app.applied_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transparency Disclosure */}
      <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <ShieldCheck className="w-3 h-3 inline mr-1 text-civic-green" />
          All applications include a Transparency Receipt confirming 0% of candidate identity data
          (race, age, gender) was used in matching. TRAIGA § 546.103 · EU AI Act Art. 14 compliant.
        </p>
      </div>
    </div>
  );
}
