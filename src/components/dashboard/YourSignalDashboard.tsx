/**
 * YourSignalDashboard — "Your Signal" single-scroll page
 * Data-bound to: profiles, tracked_companies, user_alerts, scan_usage
 */
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, AlertTriangle, TrendingUp, Shield, Building2 } from "lucide-react";
import { useState } from "react";
import { CredentialsSection } from "./SignalBadges";

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

/* ── Severity classification ── */
function alertSeverity(cat: string | null): string {
  const c = (cat || "").toLowerCase();
  if (["criminal", "fraud", "monopoly"].some(k => c.includes(k))) return "CRITICAL";
  if (["enforcement", "regulatory", "lawsuit", "safety", "osha", "doj", "sec"].some(k => c.includes(k))) return "HIGH";
  return "MEDIUM";
}

const SEV_DOT: Record<string, string> = {
  CRITICAL: "bg-destructive",
  HIGH: "bg-[hsl(35,100%,50%)]",
  MEDIUM: "bg-[hsl(45,100%,50%)]",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-[hsl(142,70%,45%)]";
  if (score >= 40) return "text-[hsl(45,100%,50%)]";
  return "text-destructive";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-[hsla(142,70%,45%,0.15)] text-[hsl(142,70%,45%)]";
  if (score >= 40) return "bg-[hsla(45,100%,50%,0.15)] text-[hsl(45,100%,50%)]";
  return "bg-destructive/15 text-destructive";
}

/* ── Card wrapper ── */
function SignalCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 bg-card border border-border/30 ${className}`}>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse bg-muted ${className}`} />;
}

/* ════════════════════════════════════════════════
   YOUR SIGNAL — main component
   ════════════════════════════════════════════════ */
export function YourSignalDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardBriefing();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Scan count for badge system
  const { data: scanCount = 0 } = useQuery({
    queryKey: ["scan-count-badge", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("scan_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Tip count (community_record_updates)
  const { data: tipCount = 0 } = useQuery({
    queryKey: ["tip-count-badge", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("community_record_updates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Onboarding status
  const { data: onboardingCompleted = false } = useQuery({
    queryKey: ["onboarding-status-signal", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.onboarding_completed ?? false;
    },
    enabled: !!user,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[800px] mx-auto">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const firstName = data?.firstName || "there";
  const alerts = data?.alerts || [];
  const tracked = (data?.tracked || [])
    .map((t: any) => ({
      name: t.company?.name,
      slug: t.company?.slug,
      industry: t.company?.industry,
      score: t.company?.employer_clarity_score ?? 0,
      updatedAt: t.company?.updated_at,
    }))
    .filter((t: any) => t.name)
    .slice(0, 5);

  // Derived "What Stands Out" insights
  const insights: { icon: React.ReactNode; text: string }[] = [];
  const highRiskCount = tracked.filter((t: any) => t.score < 40).length;
  if (highRiskCount > 0) {
    insights.push({
      icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
      text: `${highRiskCount} tracked ${highRiskCount === 1 ? "company shows" : "companies show"} high-risk signals`,
    });
  }
  const regAlerts = alerts.filter((a: any) => {
    const c = (a.signal_category || "").toLowerCase();
    return ["regulatory", "enforcement", "sec", "osha", "doj"].some(k => c.includes(k));
  });
  if (regAlerts.length > 0) {
    insights.push({
      icon: <Shield className="w-4 h-4 text-[hsl(35,100%,50%)]" />,
      text: `${regAlerts.length} regulatory ${regAlerts.length === 1 ? "flag" : "flags"} detected across your watchlist`,
    });
  }
  const goodCount = tracked.filter((t: any) => t.score >= 70).length;
  if (goodCount > 0) {
    insights.push({
      icon: <TrendingUp className="w-4 h-4 text-[hsl(142,70%,45%)]" />,
      text: `${goodCount} ${goodCount === 1 ? "company" : "companies"} in your watchlist ${goodCount === 1 ? "scores" : "score"} above 70 — looking solid`,
    });
  }

  return (
    <div className="space-y-6 max-w-[800px] mx-auto pb-8">

      {/* ═══ HEADER & IDENTITY ═══ */}
      <motion.div {...anim(0)}>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">
            Your Signal
          </h1>
          <p className="text-sm text-muted-foreground">
            Your receipts, your signals, your next move.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-semibold text-foreground">{firstName}</span>
            {onboardingCompleted && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border"
                style={{
                  color: "hsl(40, 50%, 55%)",
                  backgroundColor: "hsla(40, 50%, 55%, 0.08)",
                  borderColor: "hsla(40, 50%, 55%, 0.25)",
                }}
              >
                Signal Ready
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ CREDENTIALS & PROOF ═══ */}
      <motion.div {...anim(0.06)}>
        <SignalCard>
          <CredentialsSection
            scanCount={scanCount}
            tipCount={tipCount}
            onboardingCompleted={onboardingCompleted}
          />
        </SignalCard>
      </motion.div>

      {/* ═══ RECENT WORK ═══ */}
      <motion.div {...anim(0.12)}>
        <SignalCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground tracking-tight">Your Recent Work</h3>
            {tracked.length > 0 && (
              <span
                className="text-[10px] font-bold rounded-full px-2.5 py-1 border"
                style={{
                  color: "hsl(40, 50%, 55%)",
                  backgroundColor: "hsla(40, 50%, 55%, 0.08)",
                  borderColor: "hsla(40, 50%, 55%, 0.25)",
                }}
              >
                {tracked.length} audited
              </span>
            )}
          </div>

          {tracked.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Your lens is clear.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                No companies audited yet. Start your first scan to build your signal.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tracked.map((t: any, i: number) => (
                <motion.div
                  key={t.slug || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/dossier/${t.slug}`}
                    className="flex flex-col gap-0.5 p-3 rounded-xl transition-all duration-200 group bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t.name}
                      </span>
                      <span className={`text-xs font-bold shrink-0 rounded-full px-2 py-0.5 ${scoreBg(t.score)}`}>
                        {t.score}
                      </span>
                      {t.updatedAt && (
                        <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 hidden sm:block">
                          {timeAgo(t.updatedAt)}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    {t.score > 0 && (
                      <span className="text-[10px] text-muted-foreground/60 pl-0.5">
                        {t.score >= 70
                          ? `${t.industry || "Company"} · Strong clarity signals`
                          : t.score >= 40
                          ? `${t.industry || "Company"} · Mixed signals — review recommended`
                          : `${t.industry || "Company"} · Low clarity — proceed with caution`}
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </SignalCard>
      </motion.div>

      {/* ═══ WHAT STANDS OUT ═══ */}
      {insights.length > 0 && (
        <motion.div {...anim(0.18)}>
          <SignalCard>
            <h3 className="text-sm font-bold text-foreground tracking-tight mb-3">What Stands Out</h3>
            <div className="space-y-2.5">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
                >
                  <span className="shrink-0 mt-0.5">{insight.icon}</span>
                  <p className="text-sm text-foreground leading-snug">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </SignalCard>
        </motion.div>
      )}

      {/* ═══ WHAT CHANGED ═══ */}
      {alerts.length > 0 && (
        <motion.div {...anim(0.24)}>
          <SignalCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground tracking-tight">What Changed</h3>
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </div>
            <div className="space-y-2">
              {alerts.map((a: any, i: number) => {
                const sev = alertSeverity(a.signal_category);
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.26 + i * 0.04, duration: 0.35 }}
                  >
                    <Link
                      to={a.company_id ? `/dossier/${a.company_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "#"}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-all group"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEV_DOT[sev] || SEV_DOT.MEDIUM}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{a.company_name}</p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{a.change_description}</p>
                        <span className="text-[10px] text-muted-foreground/50 font-mono mt-1 block">
                          {a.date_detected ? new Date(a.date_detected).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </SignalCard>
        </motion.div>
      )}

      {/* ═══ PRIMARY ACTION ═══ */}
      <motion.div {...anim(0.3)}>
        <button
          onClick={() => navigate("/search?q=")}
          className="w-full rounded-2xl py-4 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.995]"
          style={{
            backgroundColor: "hsl(40, 50%, 55%)",
            color: "hsl(0, 0%, 8%)",
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Audit a Company Before You Apply
          </div>
        </button>
      </motion.div>
    </div>
  );
}
