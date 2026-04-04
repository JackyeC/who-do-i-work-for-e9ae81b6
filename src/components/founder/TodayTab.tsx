import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList, Activity, Database, AlertCircle, Zap,
  StickyNote, AlertOctagon, ChevronRight, Link2, CheckCircle,
  Clock, Search, AlertTriangle, ShieldCheck, FileText, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

/* ─── Shared UI ─── */
function TriageCard({ title, icon: Icon, children, iconColor = "text-primary", badge }: {
  title: string;
  icon: typeof ClipboardList;
  children: React.ReactNode;
  iconColor?: string;
  badge?: { label: string; variant: "warning" | "info" };
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColor)} /> {title}
        {badge && (
          <Badge variant="outline" className={cn(
            "text-[10px] font-mono ml-auto",
            badge.variant === "warning" && "border-amber-500/40 text-amber-600 bg-amber-500/10",
            badge.variant === "info" && "border-primary/40 text-primary bg-primary/10",
          )}>{badge.label}</Badge>
        )}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, loading, highlight }: {
  label: string; value: string | number; loading?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", highlight && "text-amber-600 font-medium")}>{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <span className={cn("font-mono font-medium tabular-nums text-foreground", highlight && "text-amber-600")}>{value}</span>
      )}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic leading-relaxed">{text}</p>;
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

type AlertItem = { label: string; count: number; tab: string; severity: "critical" | "data_gap" };

export function TodayTab() {
  const navigate = useNavigate();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // ════════════════════════════════════════════
  // LEVEL 1: CRITICAL (Interrupt)
  // ════════════════════════════════════════════
  const { data: critical, isLoading: criticalLoading } = useQuery({
    queryKey: ["founder-alert-critical"],
    queryFn: async () => {
      const [missingWebsite, missingClaims, recentFeedback] = await Promise.all([
        /* Not HTTP link-checking — companies with dossier copy but no website_url on file */
        supabase.from("companies").select("id", { count: "exact", head: true }).is("website_url", null).not("description", "is", null),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null),
        supabase.from("beta_feedback").select("message, created_at").gte("created_at", fortyEightHoursAgo).order("created_at", { ascending: false }).limit(100),
      ]);

      const missingWebsiteCount = missingWebsite.count ?? 0;
      const claimCount = missingClaims.count ?? 0;

      // Detect recurring friction: same theme 3+ times in 48h
      let recurringTheme: string | null = null;
      if (recentFeedback.data && recentFeedback.data.length > 0) {
        const themes: Record<string, number> = {};
        for (const f of recentFeedback.data) {
          const msg = (f.message || "").toLowerCase();
          let theme = "other";
          if (msg.includes("nav") || msg.includes("find") || msg.includes("where") || msg.includes("dashboard")) theme = "navigation";
          else if (msg.includes("broken") || msg.includes("error") || msg.includes("bug") || msg.includes("crash")) theme = "broken_ux";
          else if (msg.includes("trust") || msg.includes("source") || msg.includes("data")) theme = "trust";
          themes[theme] = (themes[theme] || 0) + 1;
        }
        const top = Object.entries(themes).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] >= 3 && top[0] !== "other") {
          const labels: Record<string, string> = {
            navigation: "Navigation confusion",
            broken_ux: "Broken UX",
            trust: "Trust & transparency",
          };
          recurringTheme = labels[top[0]] || top[0];
        }
      }

      const alerts: AlertItem[] = [];
      if (missingWebsiteCount > 0) {
        alerts.push({
          label:
            missingWebsiteCount === 1
              ? "1 company is missing a website URL"
              : `${missingWebsiteCount.toLocaleString()} companies are missing a website URL`,
          count: missingWebsiteCount,
          tab: "signals",
          severity: "data_gap",
        });
      }
      if (claimCount > 0) {
        alerts.push({
          label: `${claimCount} ${claimCount === 1 ? "claim" : "claims"} missing sources`,
          count: claimCount,
          tab: "signals",
          severity: "critical",
        });
      }
      if (recurringTheme) {
        alerts.push({
          label: `Recurring issue: "${recurringTheme}" (3+ in 48h)`,
          count: 3,
          tab: "users",
          severity: "critical",
        });
      }

      return { alerts, missingWebsiteCount };
    },
  });

  // ════════════════════════════════════════════
  // LEVEL 2: WATCH (Important — inside cards)
  // ════════════════════════════════════════════
  const { data: watchData, isLoading: watchLoading } = useQuery({
    queryKey: ["founder-alert-watch"],
    queryFn: async () => {
      const [pendingReviews, draftResearch, certQueue, waitlist, pendingJobs, dataGaps, signupsWeek] = await Promise.all([
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("vetted_status", "unverified").not("creation_source", "is", null),
        supabase.from("career_waitlist").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("admin_approved", false).eq("is_active", true),
        supabase.from("companies").select("id", { count: "exact", head: true }).or("description.is.null,employer_clarity_score.eq.0"),
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      ]);

      const reviews = {
        pendingReviews: pendingReviews.count ?? 0,
        draftResearch: draftResearch.count ?? 0,
        certQueue: certQueue.count ?? 0,
        waitlist: waitlist.count ?? 0,
        pendingJobs: pendingJobs.count ?? 0,
      };
      const totalPending = reviews.pendingReviews + reviews.draftResearch + reviews.certQueue + reviews.waitlist + reviews.pendingJobs;

      return {
        reviews,
        totalPending,
        reviewsElevated: totalPending > 5,
        certsElevated: (certQueue.count ?? 0) > 5,
        dataGaps: dataGaps.count ?? 0,
        engagementUp: (signupsWeek.count ?? 0) > 10,
        signupsWeek: signupsWeek.count ?? 0,
      };
    },
  });

  // ─── Product Health ───
  const { data: productHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["founder-today-health"],
    queryFn: async () => {
      const [signupsToday, signupsWeek, reports] = await Promise.all([
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("intelligence_reports" as any).select("id", { count: "exact", head: true }),
      ]);
      return {
        signupsToday: signupsToday.count ?? 0,
        signupsWeek: signupsWeek.count ?? 0,
        reports: reports.count ?? 0,
      };
    },
  });

  // ─── Data Health + Product Readiness ───
  const { data: dataHealth, isLoading: dataLoading } = useQuery({
    queryKey: ["founder-today-data"],
    queryFn: async () => {
      const [total, withEvidence, noEvidence, withWebsite, fullyAudited, withClaims, totalClaims, attributedClaims] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).not("description", "is", null).gt("employer_clarity_score", 0),
        supabase.from("companies").select("id", { count: "exact", head: true }).or("description.is.null,employer_clarity_score.eq.0"),
        supabase.from("companies").select("id", { count: "exact", head: true }).not("website_url", "is", null),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("vetted_status", "fully_audited"),
        // Companies with at least 1 claim
        (supabase as any).from("company_claims").select("company_id", { count: "exact", head: false }).eq("is_active", true),
        (supabase as any).from("company_claims").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("company_claims").select("id", { count: "exact", head: true }).eq("is_active", true).not("source_url", "is", null).not("source_label", "is", null),
      ]);

      // Count distinct companies with claims
      const claimCompanyIds = new Set((withClaims.data ?? []).map((r: any) => r.company_id));
      const companiesWithClaims = claimCompanyIds.size;

      const totalCount = total.count ?? 0;
      const totalClaimsCount = totalClaims.count ?? 0;
      const attributedCount = attributedClaims.count ?? 0;
      const websiteCount = withWebsite.count ?? 0;

      return {
        total: totalCount,
        strong: withEvidence.count ?? 0,
        none: noEvidence.count ?? 0,
        withWebsite: websiteCount,
        websitePct: totalCount > 0 ? Math.round((websiteCount / totalCount) * 100) : 0,
        fullyAudited: fullyAudited.count ?? 0,
        companiesWithClaims,
        claimCoveragePct: totalCount > 0 ? Math.round((companiesWithClaims / totalCount) * 100) : 0,
        companiesNoClaims: totalCount - companiesWithClaims,
        totalClaims: totalClaimsCount,
        attributedClaims: attributedCount,
        attributionPct: totalClaimsCount > 0 ? Math.round((attributedCount / totalClaimsCount) * 100) : 0,
        unattributedClaims: totalClaimsCount - attributedCount,
      };
    },
  });

  // ─── User Friction ───
  const { data: friction, isLoading: frictionLoading } = useQuery({
    queryKey: ["founder-today-friction"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_feedback")
        .select("feedback_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data || data.length === 0) return { themes: [] as [string, { count: number; lastSeen: string }][], count: 0 };

      const themes: Record<string, { count: number; lastSeen: string }> = {};
      for (const f of data) {
        const msg = (f.message || "").toLowerCase();
        let theme = "Other";
        if (msg.includes("nav") || msg.includes("find") || msg.includes("where") || msg.includes("dashboard")) theme = "Navigation confusion";
        else if (msg.includes("trust") || msg.includes("source") || msg.includes("data")) theme = "Trust & transparency";
        else if (msg.includes("broken") || msg.includes("error") || msg.includes("bug") || msg.includes("crash")) theme = "Broken UX";
        else if (msg.includes("feature") || msg.includes("wish") || msg.includes("would be") || msg.includes("add")) theme = "Feature requests";
        else if (msg.includes("content") || msg.includes("info") || msg.includes("missing") || msg.includes("empty")) theme = "Content quality";
        if (!themes[theme]) themes[theme] = { count: 0, lastSeen: f.created_at };
        themes[theme].count += 1;
        if (f.created_at > themes[theme].lastSeen) themes[theme].lastSeen = f.created_at;
      }
      const sorted = Object.entries(themes).sort((a, b) => b[1].count - a[1].count).slice(0, 3) as [string, { count: number; lastSeen: string }][];
      return { themes: sorted, count: data.length };
    },
  });

  // ─── Since Last Visit ───
  const LAST_VISIT_KEY = "founder-last-visit";
  const { data: sinceLastVisit, isLoading: sinceLoading } = useQuery({
    queryKey: ["founder-since-last-visit"],
    queryFn: async () => {
      const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
      const since = lastVisit || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [newCompanies, newReviews, newFeedback] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("beta_feedback").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      return {
        companies: newCompanies.count ?? 0,
        reviews: newReviews.count ?? 0,
        issues: newFeedback.count ?? 0,
        hasPreviousVisit: !!lastVisit,
      };
    },
  });

  useEffect(() => {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const topAlerts = critical?.alerts ?? [];
  const missingWebsiteCount = critical?.missingWebsiteCount ?? 0;
  const topAlertTone = topAlerts.some((a) => a.severity === "critical") ? "critical" : "data_gap";

  return (
    <div className="space-y-4">

      {/* ════ LEVEL 1: Top alerts (critical vs data backfill) ════ */}
      {criticalLoading ? (
        <Skeleton className="h-14 rounded-2xl" />
      ) : topAlerts.length > 0 ? (
        <div
          className={cn(
            "rounded-2xl p-4 border",
            topAlertTone === "critical"
              ? "bg-destructive/5 border-destructive/30"
              : "bg-amber-500/5 border-amber-500/25",
          )}
        >
          <h3
            className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5",
              topAlertTone === "critical" ? "text-destructive" : "text-amber-800 dark:text-amber-200",
            )}
          >
            {topAlertTone === "critical" ? (
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {topAlertTone === "critical"
              ? `Critical — ${topAlerts.length} ${topAlerts.length === 1 ? "issue" : "issues"} require attention`
              : `Data quality — ${topAlerts.length} ${topAlerts.length === 1 ? "item" : "items"} to improve`}
          </h3>
          <div className="space-y-1">
            {topAlerts.map((alert) => (
              <button
                key={alert.label}
                onClick={() => navigate(`/founder?tab=${alert.tab}`)}
                className={cn(
                  "flex items-center justify-between w-full text-left px-2.5 py-2 rounded-lg transition-colors group",
                  topAlertTone === "critical" ? "hover:bg-destructive/10" : "hover:bg-amber-500/10",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      alert.severity === "critical" ? "bg-destructive" : "bg-amber-500",
                    )}
                  />
                  <span className="text-sm text-foreground">{alert.label}</span>
                </div>
                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-colors",
                    topAlertTone === "critical" ? "group-hover:text-destructive" : "group-hover:text-amber-700 dark:group-hover:text-amber-300",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-civic-green/5 border border-civic-green/20 rounded-2xl px-4 py-3">
          <p className="text-xs text-civic-green flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> No critical issues. All clear.
          </p>
        </div>
      )}

      {/* ════ LEVEL 2: WATCH (inside cards) ════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Needs Review */}
        <TriageCard
          title="Needs Review"
          icon={ClipboardList}
          iconColor="text-civic-yellow"
          badge={watchData?.reviewsElevated ? { label: "ELEVATED", variant: "warning" } : undefined}
        >
          {watchLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : !watchData || watchData.totalPending === 0 ? (
            <EmptyLine text="No urgent items right now. Queues are clear." />
          ) : (
            <>
              {watchData.reviews.pendingReviews > 0 && <MetricRow label="Company reviews" value={watchData.reviews.pendingReviews} highlight={watchData.reviews.pendingReviews > 5} />}
              {watchData.reviews.draftResearch > 0 && <MetricRow label="Draft research" value={watchData.reviews.draftResearch} />}
              {watchData.reviews.certQueue > 0 && <MetricRow label="Certifications" value={watchData.reviews.certQueue} highlight={watchData.certsElevated} />}
              {watchData.reviews.waitlist > 0 && <MetricRow label="Waitlist" value={watchData.reviews.waitlist} />}
              {watchData.reviews.pendingJobs > 0 && <MetricRow label="Job posts" value={watchData.reviews.pendingJobs} />}
            </>
          )}
        </TriageCard>

        {/* Product Health */}
        <TriageCard
          title="Product Health"
          icon={Activity}
          iconColor="text-civic-green"
          badge={watchData?.engagementUp ? { label: "TRENDING", variant: "info" } : undefined}
        >
          <MetricRow label="Signups today" value={productHealth?.signupsToday ?? "—"} loading={healthLoading} />
          <MetricRow label="Signups (7d)" value={productHealth?.signupsWeek ?? "—"} loading={healthLoading} highlight={watchData?.engagementUp} />
          <MetricRow label="Reports generated" value={productHealth?.reports ?? "—"} loading={healthLoading} />
        </TriageCard>

        {/* Data Health */}
        <TriageCard
          title="Data Health"
          icon={Database}
          iconColor="text-primary"
          badge={watchData && watchData.dataGaps > (dataHealth?.total ?? 0) * 0.3 ? { label: "GAPS", variant: "warning" } : undefined}
        >
          <MetricRow label="Companies indexed" value={dataHealth?.total ?? "—"} loading={dataLoading} />
          <MetricRow label="Strong evidence" value={dataHealth?.strong ?? "—"} loading={dataLoading} />
          <MetricRow label="No evidence yet" value={dataHealth?.none ?? "—"} loading={dataLoading} highlight={watchData ? watchData.dataGaps > (dataHealth?.total ?? 0) * 0.3 : false} />
          {!criticalLoading && (
            <div className={cn(
              "mt-1 flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5",
              missingWebsiteCount > 0 ? "bg-amber-500/10 text-amber-800 dark:text-amber-200" : "bg-civic-green/10 text-civic-green"
            )}>
              {missingWebsiteCount > 0 ? (
                <><Link2 className="w-3 h-3" />{missingWebsiteCount.toLocaleString()} missing website {missingWebsiteCount === 1 ? "URL" : "URLs"}</>
              ) : (
                <><CheckCircle className="w-3 h-3" />All indexed companies have a website URL</>
              )}
            </div>
          )}
        </TriageCard>

        {/* Product Readiness */}
        <TriageCard
          title="Product Readiness"
          icon={ShieldCheck}
          iconColor="text-[hsl(var(--civic-green))]"
          badge={dataHealth && dataHealth.fullyAudited >= 10 ? { label: "READY", variant: "info" } : undefined}
        >
          {dataLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !dataHealth ? (
            <EmptyLine text="Loading readiness metrics…" />
          ) : (
            <div className="space-y-3">
              <MetricRow label="Fully audited" value={dataHealth.fullyAudited} />
              <MetricRow label="Companies with website" value={`${dataHealth.websitePct}%`} />
              <MetricRow label="Companies with ≥1 claim" value={`${dataHealth.claimCoveragePct}%`} />
              <MetricRow label="Claims with sources" value={`${dataHealth.attributionPct}%`} />

              <div className="pt-2 space-y-2.5 border-t border-border/30">
                <ProgressBar label="Identity Completion" value={dataHealth.websitePct} color="hsl(var(--civic-green))" />
                <ProgressBar label="Claim Coverage" value={dataHealth.claimCoveragePct} color="hsl(var(--primary))" />
                <ProgressBar label="Attribution Integrity" value={dataHealth.attributionPct} color="hsl(var(--civic-gold, var(--primary)))" />
              </div>

              {dataHealth.companiesNoClaims > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5" style={{ background: "hsl(var(--civic-yellow) / 0.1)", color: "hsl(var(--civic-yellow))" }}>
                  <FileText className="w-3 h-3 shrink-0" />
                  {dataHealth.companiesNoClaims} {dataHealth.companiesNoClaims === 1 ? "company has" : "companies have"} no claims
                </div>
              )}
              {dataHealth.unattributedClaims > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5 bg-destructive/10 text-destructive">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {dataHealth.unattributedClaims} {dataHealth.unattributedClaims === 1 ? "claim" : "claims"} missing sources
                </div>
              )}
              {dataHealth.companiesNoClaims === 0 && dataHealth.unattributedClaims === 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5 bg-civic-green/10 text-civic-green">
                  <CheckCircle className="w-3 h-3" /> All systems green. Ready to scale.
                </div>
              )}
            </div>
          )}
        </TriageCard>

        {/* User Friction */}
        <TriageCard
          title="User Friction"
          icon={AlertCircle}
          iconColor="text-destructive"
          badge={friction && friction.themes.some(([, info]) => info.count >= 3) ? { label: "RECURRING", variant: "warning" } : undefined}
        >
          {frictionLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : !friction || friction.count === 0 ? (
            <EmptyLine text="No user friction captured yet." />
          ) : (
            friction.themes.map(([theme, info]) => (
              <div key={theme} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <span className={cn("text-muted-foreground", info.count >= 3 && "text-amber-600 font-medium")}>{theme}</span>
                  <span className="text-xs text-muted-foreground ml-1">({info.count})</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">{timeAgo(info.lastSeen)}</span>
              </div>
            ))
          )}
        </TriageCard>

        {/* Since Last Visit */}
        <TriageCard title="Since Last Visit" icon={Clock} iconColor="text-primary">
          {sinceLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : !sinceLastVisit || (!sinceLastVisit.companies && !sinceLastVisit.reviews && !sinceLastVisit.issues) ? (
            <EmptyLine text={sinceLastVisit?.hasPreviousVisit ? "No changes since your last visit." : "First visit — tracking starts now."} />
          ) : (
            <>
              {sinceLastVisit.companies > 0 && <MetricRow label="New companies indexed" value={`+${sinceLastVisit.companies}`} />}
              {sinceLastVisit.reviews > 0 && <MetricRow label="Reviews submitted" value={`+${sinceLastVisit.reviews}`} />}
              {sinceLastVisit.issues > 0 && <MetricRow label="Issues detected" value={`+${sinceLastVisit.issues}`} />}
            </>
          )}
        </TriageCard>

        {/* Quick Actions */}
        <TriageCard title="Quick Actions" icon={Zap} iconColor="text-civic-yellow">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=queue")}>
            <ClipboardList className="w-3.5 h-3.5" /> Review pending companies
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=signals")}>
            <Search className="w-3.5 h-3.5" /> Approve research
          </Button>
          {missingWebsiteCount > 0 ? (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8 border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/10" onClick={() => navigate("/founder?tab=signals")}>
              <Link2 className="w-3.5 h-3.5" /> Backfill website URLs ({missingWebsiteCount.toLocaleString()})
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8 text-muted-foreground" disabled>
              <CheckCircle className="w-3.5 h-3.5 text-civic-green" /> Website URLs complete
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=notes")}>
            <StickyNote className="w-3.5 h-3.5" /> Add note
          </Button>
        </TriageCard>
      </div>
    </div>
  );
}
