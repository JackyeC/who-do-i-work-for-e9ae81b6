import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { PendingReviewsDashboard } from "@/components/admin/PendingReviewsDashboard";
import { CompensationHealthPanel } from "@/components/admin/CompensationHealthPanel";
import { FounderNotesPanel } from "@/components/admin/FounderNotesPanel";
import { SearchIntelligencePanel } from "@/components/admin/SearchIntelligencePanel";
import { WarnHeatmapPanel } from "@/components/admin/WarnHeatmapPanel";
import { useUserRole } from "@/hooks/use-user-role";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users, Search, LineChart, Activity, ShieldCheck,
  BarChart3, Zap, Settings, TrendingUp, TrendingDown,
  Database, Globe, FileText, Loader2, Download,
  ClipboardCheck, MessageSquare, Shield, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ─── Stat Card ─── */
function StatCard({ label, value, trend, icon: Icon, loading }: {
  label: string; value: string; trend?: string; icon: typeof Users; loading?: boolean;
}) {
  const isPositive = trend?.startsWith("+");
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <Icon className="text-primary w-6 h-6" />
        {trend && (
          <span className={cn(
            "text-xs font-mono font-medium px-2 py-1 rounded-full",
            isPositive ? "bg-civic-green/10 text-civic-green" : "bg-destructive/10 text-destructive"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" />
      ) : (
        <h3 className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</h3>
      )}
    </div>
  );
}

/* ─── Progress Bar ─── */
function HealthBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-medium", color)}>{value}</span>
      </div>
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FounderConsole() {
  const { isOwner } = useUserRole();

  usePageSEO({
    title: "Founder Command Center",
    description: "Platform analytics and founder controls.",
  });

  // ─── Data Queries ──────────────────────────────────────────────────
  const { data: userCount, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-user-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles" as any).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: companyCount, isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-company-count"],
    queryFn: async () => {
      const { count } = await supabase.from("companies").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: vibeResponses, isLoading: vibeLoading } = useQuery({
    queryKey: ["admin-vibe-count"],
    queryFn: async () => {
      const { count } = await supabase.from("vibe_match_responses" as any).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: emailSignups, isLoading: emailLoading } = useQuery({
    queryKey: ["admin-email-signups"],
    queryFn: async () => {
      const { count } = await supabase.from("email_signups" as any).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: topSearched = [] } = useQuery({
    queryKey: ["admin-top-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, industry, civic_footprint_score")
        .order("updated_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: recentSignups = [] } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("email, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return (data || []) as { email: string; created_at: string }[];
    },
  });

  const { data: recentFeedback = [] } = useQuery({
    queryKey: ["admin-recent-feedback"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_feedback")
        .select("feedback_type, message, created_at, user_email")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: reportCount } = useQuery({
    queryKey: ["admin-report-count"],
    queryFn: async () => {
      const { count } = await supabase.from("intelligence_reports" as any).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? "—";
  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Founder Command Center</h1>
            <p className="text-sm text-muted-foreground">Who Do I Work For? · Intelligence Analytics</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <FileText className="w-3.5 h-3.5" /> Reports
              </Button>
            </Link>
            {isOwner && (
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Users" value={fmt(userCount)} icon={Users} loading={usersLoading} />
          <StatCard label="Companies Indexed" value={fmt(companyCount)} icon={Search} loading={companiesLoading} />
          <StatCard label="Reality Checks" value={fmt(vibeResponses)} icon={ClipboardCheck} loading={vibeLoading} />
          <StatCard label="Email Signups" value={fmt(emailSignups)} icon={MessageSquare} loading={emailLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Companies & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Companies */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-primary" /> Top Companies
              </h3>
              <div className="space-y-2.5">
                {topSearched.map((co, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                    <div>
                      <span className="text-sm font-medium text-foreground">{co.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{co.industry}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Score: {co.civic_footprint_score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-civic-yellow" /> Recent Activity
              </h3>
              <div className="space-y-3 font-mono text-sm">
                {recentSignups.map((u, i) => (
                  <p key={i} className="text-muted-foreground">
                    <span className="text-civic-green">{timeAgo(u.created_at)}</span>
                    {" — "}
                    <span className="text-foreground">New signup</span>
                    {" "}
                    <span className="text-muted-foreground/70">{u.email}</span>
                  </p>
                ))}
                {recentSignups.length === 0 && (
                  <p className="text-muted-foreground italic">No recent signups</p>
                )}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-primary" /> User Feedback
              </h3>
              <div className="space-y-3">
                {recentFeedback.map((f, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[9px] font-mono uppercase">{f.feedback_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(f.created_at)}</span>
                      {f.user_email && <span className="text-[10px] text-muted-foreground/60 ml-auto">{f.user_email}</span>}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-5">System Health</h3>
              <div className="space-y-5">
                <HealthBar label="Companies Indexed" value={fmt(companyCount)} pct={Math.min((companyCount || 0) / 10, 100)} color="text-civic-green" />
                <HealthBar label="Intelligence Reports" value={fmt(reportCount)} pct={Math.min((reportCount || 0) / 5, 100) * 20} color="text-primary" />
                <HealthBar label="Reality Checks" value={fmt(vibeResponses)} pct={Math.min((vibeResponses || 0) / 5, 100) * 20} color="text-civic-blue" />
              </div>
            </div>

            {/* Founder Controls */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4.5 h-4.5" /> Founder Controls
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/admin/reports">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 border-primary/20 hover:bg-primary/10">
                    <FileText className="w-3 h-3" /> Reports
                  </Button>
                </Link>
                <Link to="/signal-feed">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 border-primary/20 hover:bg-primary/10">
                    <Activity className="w-3 h-3" /> Signals
                  </Button>
                </Link>
                <Link to="/ask-jackye">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 border-primary/20 hover:bg-primary/10">
                    <MessageSquare className="w-3 h-3" /> Advisor
                  </Button>
                </Link>
                <Link to="/reality-check">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1 border-primary/20 hover:bg-primary/10">
                    <ClipboardCheck className="w-3 h-3" /> Vibe Check
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/rankings" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                  <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-muted-foreground" /> Rankings</span>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
                <Link to="/brand-madness" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                  <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /> Brand Madness</span>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
                <Link to="/investigative" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                  <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-muted-foreground" /> Data Explorer</span>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* WARN / Layoff Heatmap */}
        <div className="mt-8">
          <WarnHeatmapPanel />
        </div>

        {/* Search Intelligence */}
        <div className="mt-6">
          <SearchIntelligencePanel />
        </div>

        {/* Compensation Health + Founder Notes */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompensationHealthPanel />
          <FounderNotesPanel />
        </div>

        {/* Pending Reviews Section */}
        <div className="mt-8">
          <PendingReviewsDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
