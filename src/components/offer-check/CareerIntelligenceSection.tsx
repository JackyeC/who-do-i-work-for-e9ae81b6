import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SourceLabel, type SourceTier } from "@/components/ui/source-label";
import {
  Briefcase, TrendingUp, DollarSign, ShieldCheck,
  BarChart3, Target, Info, AlertTriangle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSignalFreshness, getLastUpdatedLabel, type FreshnessInfo } from "@/lib/signal-freshness";

interface Props {
  companyId: string;
  companyName: string;
  role?: string;
  civicScore: number;
  employerClarityScore: number | null;
}

interface InsightRow {
  icon: typeof Briefcase;
  title: string;
  detail: string;
  tier: SourceTier;
  iconColor?: string;
  freshness: FreshnessInfo;
}

export default function CareerIntelligenceSection({ companyId, companyName, role, civicScore, employerClarityScore }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["offer-check-career-intel", companyId],
    queryFn: async () => {
      const [
        warns,
        sentiment,
        jobs,
        compensation,
        execTurnover,
        careerPaths,
      ] = await Promise.all([
        (supabase.from("company_warn_notices" as any) as any).select("employees_affected, notice_date").eq("company_id", companyId),
        supabase.from("company_worker_sentiment").select("sentiment, created_at").eq("company_id", companyId),
        supabase.from("company_jobs").select("id, title, created_at", { count: "exact" }).eq("company_id", companyId).eq("is_active", true).limit(5),
        (supabase.from("compensation_data" as any) as any).select("median_total_compensation_usd, top_roles, source_summary, created_at").eq("company", companyId).limit(5),
        supabase.from("company_executives").select("id, created_at", { count: "exact", head: true }).eq("company_id", companyId).not("departed_at", "is", null),
        supabase.from("career_paths").select("role_title, next_role, success_rate_pct, created_at").eq("company_id", companyId).limit(3),
      ]);

      return {
        warnCount: warns.data?.length ?? 0,
        totalAffected: (warns.data ?? []).reduce((s: number, w: any) => s + (w.employees_affected || 0), 0),
        latestWarnDate: (warns.data ?? []).sort((a: any, b: any) => (b.notice_date ?? "").localeCompare(a.notice_date ?? ""))[0]?.notice_date ?? null,
        positiveSentiment: (sentiment.data ?? []).filter((s: any) => s.sentiment === "positive").length,
        negativeSentiment: (sentiment.data ?? []).filter((s: any) => s.sentiment === "negative").length,
        totalSentiment: sentiment.data?.length ?? 0,
        latestSentimentDate: (sentiment.data ?? [])[0]?.created_at ?? null,
        activeJobs: jobs.count ?? 0,
        jobTitles: (jobs.data ?? []).map((j: any) => j.title as string),
        latestJobDate: (jobs.data ?? [])[0]?.created_at ?? null,
        compensation: (compensation.data ?? []) as any[] as { median_total_compensation_usd: number | null; top_roles: any; source_summary: string | null; created_at: string }[],
        execTurnover: execTurnover.count ?? 0,
        careerPaths: (careerPaths.data ?? []) as { role_title: string; next_role: string; success_rate_pct: number | null; created_at: string }[],
      };
    },
  });

  if (isLoading) return null;
  if (!data) return null;

  const insights: InsightRow[] = [];
  const allDates: (string | null)[] = [];

  // Role stability
  allDates.push(data.latestWarnDate);
  const stabilityRisk = data.warnCount > 2 ? "high" : data.warnCount > 0 ? "moderate" : "low";
  if (stabilityRisk === "high") {
    insights.push({
      icon: AlertTriangle,
      title: "Role Stability Risk",
      detail: `${data.warnCount} layoff events affecting ${data.totalAffected.toLocaleString()} workers suggest elevated risk. Consider asking about recent restructuring.`,
      tier: "verified",
      iconColor: "text-destructive",
      freshness: getSignalFreshness(data.latestWarnDate),
    });
  } else if (stabilityRisk === "moderate") {
    insights.push({
      icon: Target,
      title: "Role Stability",
      detail: `Some workforce reductions on record (${data.totalAffected.toLocaleString()} affected). Ask about team stability and growth plans in your interview.`,
      tier: "verified",
      iconColor: "text-civic-yellow",
      freshness: getSignalFreshness(data.latestWarnDate),
    });
  } else {
    insights.push({
      icon: ShieldCheck,
      title: "Role Stability",
      detail: "No mass layoff events found in public records. This is a positive signal for workforce stability.",
      tier: "no_evidence",
      freshness: getSignalFreshness(null),
    });
  }

  // Compensation signals
  const compDate = data.compensation[0]?.created_at ?? null;
  allDates.push(compDate);
  if (data.compensation.length > 0) {
    const c = data.compensation[0];
    const median = c.median_total_compensation_usd;
    insights.push({
      icon: DollarSign,
      title: "Compensation Signals",
      detail: median
        ? `Median total compensation: $${median.toLocaleString()}. ${c.source_summary || ""}`
        : `Compensation data on file. ${c.source_summary || ""}`,
      tier: "multi_source",
      freshness: getSignalFreshness(c.created_at),
    });
  } else {
    insights.push({
      icon: DollarSign,
      title: "Compensation Signals",
      detail: "No salary or compensation data available yet. Consider using Glassdoor or Levels.fyi for comparison.",
      tier: "no_evidence",
      freshness: getSignalFreshness(null),
    });
  }

  // Negotiation signals
  allDates.push(data.latestJobDate);
  const negotiationPower: string[] = [];
  if (data.activeJobs > 5) negotiationPower.push(`${data.activeJobs} active job listings suggest strong hiring demand`);
  if (data.execTurnover > 2) negotiationPower.push("leadership turnover may create openings for negotiation");
  if (civicScore < 35) negotiationPower.push("lower transparency score — research offer terms carefully");
  if (employerClarityScore && employerClarityScore > 70) negotiationPower.push("high employer clarity score is a positive sign");

  if (negotiationPower.length > 0) {
    insights.push({
      icon: BarChart3,
      title: "Negotiation Signals",
      detail: negotiationPower.join(". ") + ".",
      tier: data.activeJobs > 0 ? "multi_source" : "inferred",
      freshness: getSignalFreshness(data.latestJobDate),
    });
  } else {
    insights.push({
      icon: BarChart3,
      title: "Negotiation Signals",
      detail: "Not enough data to assess negotiation leverage yet. Ask about competing offers during your process.",
      tier: "no_evidence",
      freshness: getSignalFreshness(null),
    });
  }

  // Career trajectory
  const pathDate = data.careerPaths[0]?.created_at ?? null;
  allDates.push(pathDate);
  if (data.careerPaths.length > 0) {
    const paths = data.careerPaths.map(p => `${p.role_title} → ${p.next_role}${p.success_rate_pct ? ` (${p.success_rate_pct}% success)` : ""}`).join("; ");
    insights.push({
      icon: TrendingUp,
      title: "Career Trajectory",
      detail: `Known progression paths: ${paths}.`,
      tier: "inferred",
      freshness: getSignalFreshness(pathDate),
    });
  } else if (data.activeJobs > 0) {
    insights.push({
      icon: TrendingUp,
      title: "Career Trajectory",
      detail: `${data.activeJobs} open role(s) suggest growth. Sample titles: ${data.jobTitles.slice(0, 3).join(", ") || "various"}.`,
      tier: "inferred",
      freshness: getSignalFreshness(data.latestJobDate),
    });
  } else {
    insights.push({
      icon: TrendingUp,
      title: "Career Trajectory",
      detail: "No career path data or active listings available yet.",
      tier: "no_evidence",
      freshness: getSignalFreshness(null),
    });
  }

  // Worker sentiment → candidate meaning
  allDates.push(data.latestSentimentDate);
  if (data.totalSentiment > 0) {
    const ratio = data.positiveSentiment / data.totalSentiment;
    const verdict = ratio >= 0.6 ? "Mostly positive" : ratio >= 0.4 ? "Mixed" : "Concerning";
    insights.push({
      icon: Briefcase,
      title: "What Workers Are Saying",
      detail: `${verdict} sentiment (${data.positiveSentiment}/${data.totalSentiment} positive). This reflects the experience of current and former employees.`,
      tier: "inferred",
      freshness: getSignalFreshness(data.latestSentimentDate),
    });
  }

  const hasData = insights.some(r => r.tier !== "no_evidence");
  const lastUpdated = getLastUpdatedLabel(allDates);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Career Intelligence
        </h3>
        {!hasData && (
          <span className="text-[10px] text-muted-foreground italic">Limited data available</span>
        )}
      </div>

      {/* Last updated header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3 shrink-0" />
        <span>{lastUpdated}</span>
      </div>

      {!hasData && (
        <div className="bg-muted/30 border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Limited data available — this is what we found so far.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {insights.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", row.iconColor ?? "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{row.title}</p>
                    <SourceLabel tier={row.tier} className="shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.detail}</p>
                  {/* Freshness label */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", row.freshness.className)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", row.freshness.dotClassName)} />
                      {row.freshness.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {row.freshness.timeLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System note */}
      <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
        Signals are continuously updated as new public data becomes available.
      </p>
    </div>
  );
}
