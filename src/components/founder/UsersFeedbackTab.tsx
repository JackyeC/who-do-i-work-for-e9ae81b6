import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, TrendingDown, MessageSquare, Building2,
} from "lucide-react";

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic py-3">{text}</p>;
}

export function UsersFeedbackTab() {
  // ─── Recent Signups (capped to 5) ───
  const { data: signups = [], isLoading: signupsLoading } = useQuery({
    queryKey: ["founder-users-signups"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data || []) as { email: string; created_at: string }[];
    },
  });

  // ─── Conversion Funnel ───
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ["founder-users-funnel"],
    queryFn: async () => {
      const [emailRes, profileRes, vibeRes, reportRes, trackedRes] = await Promise.all([
        supabase.from("email_signups" as any).select("id", { count: "exact", head: true }),
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }),
        supabase.from("vibe_match_responses" as any).select("id", { count: "exact", head: true }),
        supabase.from("intelligence_reports" as any).select("id", { count: "exact", head: true }),
        supabase.from("tracked_companies" as any).select("id", { count: "exact", head: true }),
      ]);
      return [
        { label: "Email Signups", count: emailRes.count ?? 0 },
        { label: "Registered Users", count: profileRes.count ?? 0 },
        { label: "Reality Checks", count: vibeRes.count ?? 0 },
        { label: "Reports Generated", count: reportRes.count ?? 0 },
        { label: "Companies Tracked", count: trackedRes.count ?? 0 },
      ];
    },
  });

  // ─── Feedback Themes ───
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ["founder-users-feedback"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_feedback")
        .select("feedback_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!data || data.length === 0) return { themes: [], recent: [] };

      const themes: Record<string, number> = {};
      for (const f of data) {
        const msg = (f.message || "").toLowerCase();
        let theme = "Other";
        if (msg.includes("nav") || msg.includes("find") || msg.includes("where") || msg.includes("dashboard") || msg.includes("lost")) theme = "Navigation confusion";
        else if (msg.includes("trust") || msg.includes("source") || msg.includes("data") || msg.includes("where does")) theme = "Trust & transparency";
        else if (msg.includes("broken") || msg.includes("error") || msg.includes("bug") || msg.includes("crash") || msg.includes("doesn't work")) theme = "Broken UX";
        else if (msg.includes("feature") || msg.includes("wish") || msg.includes("would be") || msg.includes("add") || msg.includes("want")) theme = "Feature requests";
        else if (msg.includes("content") || msg.includes("info") || msg.includes("missing") || msg.includes("empty")) theme = "Content quality";
        else if (msg.includes("dark") || msg.includes("color") || msg.includes("mode") || msg.includes("theme")) theme = "Visual / theme";
        else if (msg.includes("premium") || msg.includes("price") || msg.includes("pay") || msg.includes("subscribe")) theme = "Premium & pricing";
        themes[theme] = (themes[theme] || 0) + 1;
      }

      const sorted = Object.entries(themes).sort((a, b) => b[1] - a[1]);
      return { themes: sorted, recent: data.slice(0, 3) };
    },
  });

  // ─── Recently Updated Companies (capped to 5) ───
  const { data: recentCompanies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["founder-users-recent-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, industry, employer_clarity_score")
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Recent Signups
          </h3>
          {signupsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-6" />)}</div>
          ) : signups.length === 0 ? (
            <EmptyState text="No activity recorded yet." />
          ) : (
            <div className="space-y-1.5 font-mono text-xs">
              {signups.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground truncate max-w-[200px]">{u.email}</span>
                  <span className="text-civic-green shrink-0">{timeAgo(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" /> Conversion Funnel
          </h3>
          {funnelLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          ) : !funnel || funnel.length === 0 ? (
            <EmptyState text="Data pipeline has not populated yet." />
          ) : (
            <div className="space-y-2.5">
              {funnel.map((step, i) => {
                const maxCount = Math.max(...funnel.map(s => s.count), 1);
                const pct = Math.max((step.count / maxCount) * 100, 4);
                const convRate = i > 0 && funnel[i - 1].count > 0
                  ? ((step.count / funnel[i - 1].count) * 100).toFixed(1)
                  : null;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{step.count.toLocaleString()}</span>
                        {convRate && <span className="text-muted-foreground font-mono">{convRate}%</span>}
                      </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Themes */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-civic-yellow" /> Feedback Themes
          </h3>
          {feedbackLoading ? (
            <Skeleton className="h-20" />
          ) : !feedbackData || feedbackData.themes.length === 0 ? (
            <EmptyState text="No user friction captured yet." />
          ) : (
            <div className="space-y-2">
              {feedbackData.themes.map(([theme, count]) => (
                <div key={theme} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-sm">
                  <span className="text-foreground">{theme}</span>
                  <Badge variant="outline" className="text-xs font-mono">{count}</Badge>
                </div>
              ))}
            </div>
          )}
          {feedbackData && feedbackData.recent.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Latest feedback</p>
              <div className="space-y-1.5">
                {feedbackData.recent.map((f, i) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-civic-green font-mono mr-1">{timeAgo(f.created_at)}</span>
                    {f.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recently Updated Companies */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Recently Updated Companies
          </h3>
          {companiesLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          ) : recentCompanies.length === 0 ? (
            <EmptyState text="No companies indexed yet." />
          ) : (
            <div className="space-y-1.5">
              {recentCompanies.map((co, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-sm">
                  <div className="min-w-0">
                    <span className="text-foreground font-medium truncate block">{co.name}</span>
                    <span className="text-xs text-muted-foreground">{co.industry}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono shrink-0">{co.employer_clarity_score ?? "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
