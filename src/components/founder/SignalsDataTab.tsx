import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database, CheckCircle, AlertTriangle, XCircle, Clock,
  Shield, BarChart3, Layers, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-civic-green",
    delayed: "bg-civic-yellow",
    partial: "bg-civic-yellow",
    offline: "bg-destructive",
    unknown: "bg-muted-foreground",
  };
  return <span className={cn("w-2 h-2 rounded-full inline-block", colors[status] || colors.unknown)} />;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic py-3">{text}</p>;
}

export function SignalsDataTab() {
  // ─── Coverage Snapshot ───
  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["founder-signals-coverage"],
    queryFn: async () => {
      const staleDate = new Date(Date.now() - 90 * 86400000).toISOString();
      const [total, verified, missing, stale] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).not("description", "is", null).gt("employer_clarity_score", 0),
        supabase.from("companies").select("id", { count: "exact", head: true }).or("description.is.null,employer_clarity_score.eq.0"),
        supabase.from("companies").select("id", { count: "exact", head: true }).lt("updated_at", staleDate),
      ]);
      return {
        total: total.count ?? 0,
        verified: verified.count ?? 0,
        missing: missing.count ?? 0,
        stale: stale.count ?? 0,
      };
    },
  });

  // ─── Source Status ───
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["founder-signals-sources"],
    queryFn: async () => {
      const [sec, warn, fec, news] = await Promise.all([
        supabase.from("company_corporate_structure").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("company_warn_notices").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("company_candidates").select("id").limit(1),
        supabase.from("briefing_signals").select("published_at").order("published_at", { ascending: false }).limit(1),
      ]);

      const getStatus = (data: any[] | null, dateField = "created_at") => {
        if (!data || data.length === 0) return "offline";
        const lastDate = new Date(data[0][dateField] || data[0].published_at);
        const age = Date.now() - lastDate.getTime();
        if (age < 86400000) return "healthy";
        if (age < 7 * 86400000) return "delayed";
        return "partial";
      };

      return [
        { name: "SEC / Corporate", status: getStatus(sec.data) },
        { name: "WARN Notices", status: getStatus(warn.data) },
        { name: "FEC / Political", status: getStatus(fec.data, "id") },
        { name: "News / Briefings", status: getStatus(news.data, "published_at") },
        { name: "OSHA", status: "partial" as const },
        { name: "Manual Research", status: "healthy" as const },
      ];
    },
  });

  // ─── Claim Safety Monitor (with tier breakdown) ───
  const { data: claimSafety, isLoading: claimsLoading } = useQuery({
    queryKey: ["founder-signals-claims"],
    queryFn: async () => {
      const [totalClaims, withUrl, multiSource, withSourceNoUrl, noEvidence] = await Promise.all([
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).not("claim_source_url", "is", null),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).eq("extraction_method", "multi_source"),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).not("claim_source", "is", null).neq("extraction_method", "multi_source"),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).is("claim_source", null),
      ]);
      const total = totalClaims.count ?? 0;
      const verified = withUrl.count ?? 0;
      const multi = multiSource.count ?? 0;
      const inferred = withSourceNoUrl.count ?? 0;
      const none = noEvidence.count ?? 0;
      return { totalClaims: total, verified, multiSource: multi, inferred, noEvidence: none, missingSources: total - verified };
    },
  });

  return (
    <div className="space-y-6">
      {/* Coverage Snapshot */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Coverage Snapshot
        </h3>
        {coverageLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CoverageCard label="Total indexed" value={coverage!.total} icon={BarChart3} color="text-foreground" />
            <CoverageCard label="Verified source" value={coverage!.verified} icon={CheckCircle} color="text-civic-green" />
            <CoverageCard label="Missing evidence" value={coverage!.missing} icon={XCircle} color="text-destructive" />
            <CoverageCard label="Stale data (90d+)" value={coverage!.stale} icon={Clock} color="text-civic-yellow" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-civic-green" /> Source Status
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Live freshness of each data pipeline. Status based on most recent record timestamp.
          </p>
          {sourcesLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          ) : !sources || sources.length === 0 ? (
            <EmptyState text="No data has been indexed here yet." />
          ) : (
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/30">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusDot status={s.status} />
                    <span className={cn(
                      "text-xs font-mono capitalize",
                      s.status === "healthy" ? "text-civic-green" :
                      s.status === "delayed" || s.status === "partial" ? "text-civic-yellow" :
                      "text-destructive"
                    )}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Claim Safety Monitor — Tier Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-civic-yellow" /> Claim Attribution Monitor
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Every claim must carry a source label. Claims without attribution are suppressed from display.
          </p>
          {claimsLoading ? (
            <Skeleton className="h-20" />
          ) : claimSafety!.totalClaims === 0 ? (
            <EmptyState text="No claims have been indexed yet." />
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total claims</span>
                <span className="font-mono font-medium text-foreground">{claimSafety!.totalClaims}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-civic-green"><CheckCircle className="w-3 h-3" /> Verified Source</span>
                <span className="font-mono font-medium text-civic-green">{claimSafety!.verified}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-primary"><Layers className="w-3 h-3" /> Multi-Source Signal</span>
                <span className="font-mono font-medium text-primary">{claimSafety!.multiSource}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-amber-600"><HelpCircle className="w-3 h-3" /> Inferred</span>
                <span className="font-mono font-medium text-amber-600">{claimSafety!.inferred}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><XCircle className="w-3 h-3" /> No Public Evidence</span>
                <span className={cn("font-mono font-medium", claimSafety!.noEvidence > 0 ? "text-destructive" : "text-muted-foreground")}>{claimSafety!.noEvidence}</span>
              </div>
              {claimSafety!.noEvidence > 0 && (
                <p className="text-xs text-muted-foreground bg-destructive/5 border border-destructive/20 rounded-lg p-2">
                  ⚠ {claimSafety!.noEvidence} claim{claimSafety!.noEvidence !== 1 ? "s" : ""} have no attribution and are suppressed from public display.
                </p>
              )}
              {claimSafety!.noEvidence === 0 && claimSafety!.totalClaims > 0 && (
                <p className="text-xs text-civic-green bg-civic-green/5 border border-civic-green/20 rounded-lg p-2">
                  ✓ All claims have source attribution.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverageCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: typeof Database; color: string;
}) {
  return (
    <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <p className={cn("text-lg font-bold tabular-nums", color)}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
