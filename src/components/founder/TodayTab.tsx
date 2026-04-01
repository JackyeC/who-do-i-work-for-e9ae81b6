import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList, Activity, Database, AlertCircle, Zap,
  StickyNote, AlertOctagon, ChevronRight, Link2, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Card Shell ─── */
function TriageCard({ title, icon: Icon, children, iconColor = "text-primary" }: {
  title: string;
  icon: typeof ClipboardList;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColor)} /> {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, loading }: {
  label: string; value: string | number; loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <span className="font-mono font-medium tabular-nums text-foreground">{value}</span>
      )}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic leading-relaxed">{text}</p>;
}

export function TodayTab() {
  const navigate = useNavigate();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

  // ─── Priority Items ───
  const { data: priority, isLoading: priorityLoading } = useQuery({
    queryKey: ["founder-today-priority"],
    queryFn: async () => {
      const [pendingReviews, missingClaims, brokenLinks] = await Promise.all([
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null),
        supabase.from("companies").select("id", { count: "exact", head: true }).is("website_url", null).not("description", "is", null),
      ]);
      const reviewCount = pendingReviews.count ?? 0;
      const claimCount = missingClaims.count ?? 0;
      const linkCount = brokenLinks.count ?? 0;
      const items: { label: string; count: number; tab: string }[] = [];
      if (reviewCount > 0) items.push({ label: `${reviewCount} ${reviewCount === 1 ? "company needs" : "companies need"} review`, count: reviewCount, tab: "queue" });
      if (claimCount > 0) items.push({ label: `${claimCount} ${claimCount === 1 ? "claim" : "claims"} missing sources`, count: claimCount, tab: "signals" });
      if (linkCount > 0) items.push({ label: `${linkCount} broken ${linkCount === 1 ? "link" : "links"} detected`, count: linkCount, tab: "signals" });
      return { items: items.slice(0, 3), brokenLinkCount: linkCount };
    },
  });

  // ─── Needs Review ───
  const { data: reviewCounts, isLoading: reviewLoading } = useQuery({
    queryKey: ["founder-today-reviews"],
    queryFn: async () => {
      const [pendingReviews, draftResearch, certQueue, waitlist, pendingJobs] = await Promise.all([
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("vetted_status", "unverified").not("creation_source", "is", null),
        supabase.from("career_waitlist").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("admin_approved", false).eq("is_active", true),
      ]);
      return {
        pendingReviews: pendingReviews.count ?? 0,
        draftResearch: draftResearch.count ?? 0,
        certQueue: certQueue.count ?? 0,
        waitlist: waitlist.count ?? 0,
        pendingJobs: pendingJobs.count ?? 0,
      };
    },
  });

  const totalPending = reviewCounts
    ? reviewCounts.pendingReviews + reviewCounts.draftResearch + reviewCounts.certQueue + reviewCounts.waitlist + reviewCounts.pendingJobs
    : 0;

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

  // ─── Data Health ───
  const { data: dataHealth, isLoading: dataLoading } = useQuery({
    queryKey: ["founder-today-data"],
    queryFn: async () => {
      const [total, withEvidence, noEvidence] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).not("description", "is", null).gt("employer_clarity_score", 0),
        supabase.from("companies").select("id", { count: "exact", head: true }).or("description.is.null,employer_clarity_score.eq.0"),
      ]);
      const totalCount = total.count ?? 0;
      const strongCount = withEvidence.count ?? 0;
      const noEvidenceCount = noEvidence.count ?? 0;
      return { total: totalCount, strong: strongCount, none: noEvidenceCount };
    },
  });

  // ─── User Friction ───
  const { data: friction, isLoading: frictionLoading } = useQuery({
    queryKey: ["founder-today-friction"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_feedback")
        .select("feedback_type, message")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data || data.length === 0) return { themes: [], count: 0 };

      const themes: Record<string, number> = {};
      for (const f of data) {
        const msg = (f.message || "").toLowerCase();
        let theme = "Other";
        if (msg.includes("nav") || msg.includes("find") || msg.includes("where") || msg.includes("dashboard")) theme = "Navigation confusion";
        else if (msg.includes("trust") || msg.includes("source") || msg.includes("data")) theme = "Trust & transparency";
        else if (msg.includes("broken") || msg.includes("error") || msg.includes("bug") || msg.includes("crash")) theme = "Broken UX";
        else if (msg.includes("feature") || msg.includes("wish") || msg.includes("would be") || msg.includes("add")) theme = "Feature requests";
        else if (msg.includes("content") || msg.includes("info") || msg.includes("missing") || msg.includes("empty")) theme = "Content quality";
        themes[theme] = (themes[theme] || 0) + 1;
      }
      const sorted = Object.entries(themes).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return { themes: sorted, count: data.length };
    },
  });

  return (
    <div className="space-y-4">
      {/* Priority */}
      {priorityLoading ? (
        <Skeleton className="h-12 rounded-2xl" />
      ) : priority && priority.items.length > 0 ? (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Priority
          </h3>
          <div className="space-y-1.5">
            {priority.items.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(`/founder?tab=${item.tab}`)}
                className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-destructive/5 transition-colors group"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : !priorityLoading ? (
        <div className="bg-civic-green/5 border border-civic-green/20 rounded-2xl px-4 py-3">
          <p className="text-xs text-civic-green flex items-center gap-1.5">
            ✓ Nothing urgent right now. All clear.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Needs Review */}
      <TriageCard title="Needs Review" icon={ClipboardList} iconColor="text-civic-yellow">
        {reviewLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : totalPending === 0 ? (
          <EmptyLine text="No urgent items right now. Queues are clear." />
        ) : (
          <>
            {reviewCounts!.pendingReviews > 0 && <MetricRow label="Company reviews" value={reviewCounts!.pendingReviews} />}
            {reviewCounts!.draftResearch > 0 && <MetricRow label="Draft research" value={reviewCounts!.draftResearch} />}
            {reviewCounts!.certQueue > 0 && <MetricRow label="Certifications" value={reviewCounts!.certQueue} />}
            {reviewCounts!.waitlist > 0 && <MetricRow label="Waitlist" value={reviewCounts!.waitlist} />}
            {reviewCounts!.pendingJobs > 0 && <MetricRow label="Job posts" value={reviewCounts!.pendingJobs} />}
          </>
        )}
      </TriageCard>

      {/* 2. Product Health — capped to 3 rows */}
      <TriageCard title="Product Health" icon={Activity} iconColor="text-civic-green">
        <MetricRow label="Signups today" value={productHealth?.signupsToday ?? "—"} loading={healthLoading} />
        <MetricRow label="Signups (7d)" value={productHealth?.signupsWeek ?? "—"} loading={healthLoading} />
        <MetricRow label="Reports generated" value={productHealth?.reports ?? "—"} loading={healthLoading} />
      </TriageCard>

      {/* 3. Data Health — capped to 3 rows */}
      <TriageCard title="Data Health" icon={Database} iconColor="text-primary">
        <MetricRow label="Companies indexed" value={dataHealth?.total ?? "—"} loading={dataLoading} />
        <MetricRow label="Strong evidence" value={dataHealth?.strong ?? "—"} loading={dataLoading} />
        <MetricRow label="No evidence yet" value={dataHealth?.none ?? "—"} loading={dataLoading} />
      </TriageCard>

      {/* 4. User Friction — capped to 3 themes */}
      <TriageCard title="User Friction" icon={AlertCircle} iconColor="text-destructive">
        {frictionLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : !friction || friction.count === 0 ? (
          <EmptyLine text="No user friction captured yet." />
        ) : (
          friction.themes.map(([theme, count]) => (
            <div key={theme} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{theme}</span>
              <Badge variant="outline" className="text-xs font-mono">{count}</Badge>
            </div>
          ))
        )}
      </TriageCard>

      {/* 5. Quick Actions — 4 actions max */}
      <TriageCard title="Quick Actions" icon={Zap} iconColor="text-civic-yellow">
        <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=queue")}>
          <ClipboardList className="w-3.5 h-3.5" /> Review pending items
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=signals")}>
          <Database className="w-3.5 h-3.5" /> Check data health
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8" onClick={() => navigate("/founder?tab=notes")}>
          <StickyNote className="w-3.5 h-3.5" /> Add founder note
        </Button>
      </TriageCard>
      </div>
    </div>
  );
}
