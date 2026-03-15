import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, TrendingDown, TrendingUp, DollarSign,
  Users, Ghost, Headphones, Scale, Award, Eye, Minus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

type SignalStatus = "positive" | "negative" | "neutral" | "no_data";

interface RealitySignal {
  label: string;
  value: string;
  status: SignalStatus;
  icon: typeof AlertTriangle;
}

export function RealityCheckCard({ companyId, companyName }: Props) {
  const { data: sentiment } = useQuery({
    queryKey: ["rc-sentiment", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_worker_sentiment")
        .select("overall_rating, work_life_balance, compensation_rating, ceo_approval")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
  });

  const { data: warnCount } = useQuery({
    queryKey: ["rc-warn", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase
        .from("warn_notices" as any)
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      return count || 0;
    },
  });

  const { data: execData } = useQuery({
    queryKey: ["rc-execs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("departed_at")
        .eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: jobStats } = useQuery({
    queryKey: ["rc-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("posted_at, scraped_at, salary_range, is_active, title")
        .eq("company_id", companyId!)
        .eq("is_active", true);
      return data || [];
    },
  });

  const { data: courtCount } = useQuery({
    queryKey: ["rc-court", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase
        .from("company_court_cases")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      return count || 0;
    },
  });

  if (!companyId) return null;

  // Compute signals
  const signals: RealitySignal[] = [];

  // Compensation
  const compRating = sentiment?.compensation_rating;
  signals.push({
    label: "Compensation vs. Market",
    icon: DollarSign,
    value: compRating ? (compRating >= 3.5 ? "Competitive" : compRating >= 2.5 ? "Below Average" : "Below Market") : "Unknown",
    status: compRating ? (compRating >= 3.5 ? "positive" : compRating >= 2.5 ? "neutral" : "negative") : "no_data",
  });

  // Promotion velocity (simplified from sentiment)
  const overallRating = sentiment?.overall_rating;
  signals.push({
    label: "Promotion Velocity",
    icon: Award,
    value: overallRating ? (overallRating >= 3.8 ? "Normal" : overallRating >= 3.0 ? "Slow" : "Very Slow") : "Unknown",
    status: overallRating ? (overallRating >= 3.8 ? "positive" : overallRating >= 3.0 ? "neutral" : "negative") : "no_data",
  });

  // Leadership turnover
  const totalExecs = execData?.length || 0;
  const departed = execData?.filter(e => e.departed_at).length || 0;
  const turnoverPct = totalExecs > 0 ? Math.round((departed / totalExecs) * 100) : null;
  signals.push({
    label: "Leadership Turnover",
    icon: Users,
    value: turnoverPct !== null ? (turnoverPct > 30 ? "High" : turnoverPct > 15 ? "Moderate" : "Low") : "Unknown",
    status: turnoverPct !== null ? (turnoverPct > 30 ? "negative" : turnoverPct > 15 ? "neutral" : "positive") : "no_data",
  });

  // Recent layoffs
  signals.push({
    label: "Recent Layoffs",
    icon: TrendingDown,
    value: (warnCount || 0) > 0 ? `Yes (${warnCount} WARN notices)` : "None detected",
    status: (warnCount || 0) > 0 ? "negative" : "positive",
  });

  // Hiring transparency (ghost jobs)
  const jobs = jobStats || [];
  const staleJobs = jobs.filter(j => {
    const d = j.posted_at || j.scraped_at;
    return d && (Date.now() - new Date(d).getTime()) > 60 * 86400000;
  });
  const stalePct = jobs.length > 0 ? Math.round((staleJobs.length / jobs.length) * 100) : 0;
  signals.push({
    label: "Recruiting Difficulty",
    icon: Ghost,
    value: stalePct > 30 ? "High" : stalePct > 15 ? "Moderate" : jobs.length > 0 ? "Normal" : "Unknown",
    status: stalePct > 30 ? "negative" : stalePct > 15 ? "neutral" : jobs.length > 0 ? "positive" : "no_data",
  });

  // Legal exposure
  signals.push({
    label: "Legal Exposure",
    icon: Scale,
    value: (courtCount || 0) > 5 ? "Elevated" : (courtCount || 0) > 0 ? "Some" : "None detected",
    status: (courtCount || 0) > 5 ? "negative" : (courtCount || 0) > 0 ? "neutral" : "positive",
  });

  // Work-life balance
  const wlb = sentiment?.work_life_balance;
  signals.push({
    label: "Work-Life Balance",
    icon: Eye,
    value: wlb ? (wlb >= 3.5 ? "Healthy" : wlb >= 2.5 ? "Mixed" : "Concerning") : "Unknown",
    status: wlb ? (wlb >= 3.5 ? "positive" : wlb >= 2.5 ? "neutral" : "negative") : "no_data",
  });

  const negCount = signals.filter(s => s.status === "negative").length;
  const posCount = signals.filter(s => s.status === "positive").length;
  const overallVerdict = negCount >= 3 ? "Proceed with Caution"
    : negCount >= 1 && posCount <= 2 ? "Mixed Signals"
    : posCount >= 4 ? "Generally Positive"
    : "Insufficient Data";

  const verdictColor = overallVerdict === "Proceed with Caution" ? "text-destructive border-destructive/20 bg-destructive/5"
    : overallVerdict === "Mixed Signals" ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/5"
    : overallVerdict === "Generally Positive" ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/5"
    : "text-muted-foreground border-border/30 bg-muted/20";

  const STATUS_ICON = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Minus,
    no_data: Minus,
  };
  const STATUS_COLOR = {
    positive: "text-[hsl(var(--civic-green))]",
    negative: "text-destructive",
    neutral: "text-[hsl(var(--civic-yellow))]",
    no_data: "text-muted-foreground/50",
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/[0.02] to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Reality Check
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          What employees wish they knew before joining {companyName}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall verdict */}
        <div className={cn("text-center p-3 rounded-xl border", verdictColor)}>
          <p className="text-lg font-bold">{overallVerdict}</p>
          <p className="text-[10px] mt-0.5 opacity-80">
            Based on {signals.filter(s => s.status !== "no_data").length} of {signals.length} signals with data
          </p>
        </div>

        {/* Signal grid */}
        <div className="grid grid-cols-2 gap-2">
          {signals.map(signal => {
            const StatusIcon = STATUS_ICON[signal.status];
            const Icon = signal.icon;
            return (
              <div
                key={signal.label}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/30 bg-card"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">{signal.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StatusIcon className={cn("w-3 h-3", STATUS_COLOR[signal.status])} />
                    <span className={cn("text-xs font-semibold", STATUS_COLOR[signal.status])}>{signal.value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Aggregated from WARN filings, court records, worker reviews, job postings, and leadership data.
          Signals are directional — verify during interviews.
        </p>
      </CardContent>
    </Card>
  );
}
