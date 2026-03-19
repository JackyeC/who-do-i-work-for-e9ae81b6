import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Clock, DollarSign, ThumbsUp, Users, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

interface DifficultySignal {
  label: string;
  value: string;
  severity: "low" | "moderate" | "high";
  icon: React.ElementType;
  weight: number;
  rawScore: number; // 0-10, higher = harder to recruit
}

const SEVERITY_STYLES = {
  low: { bg: "bg-[hsl(var(--civic-green))]/10", text: "text-[hsl(var(--civic-green))]", border: "border-[hsl(var(--civic-green))]/20", label: "Easy" },
  moderate: { bg: "bg-[hsl(var(--civic-yellow))]/10", text: "text-[hsl(var(--civic-yellow))]", border: "border-[hsl(var(--civic-yellow))]/20", label: "Moderate" },
  high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", label: "Hard" },
};

function getSeverity(score: number): "low" | "moderate" | "high" {
  if (score <= 3) return "low";
  if (score <= 6) return "moderate";
  return "high";
}

function getDifficultyLabel(score: number): string {
  if (score <= 2.5) return "Easy";
  if (score <= 4) return "Moderate";
  if (score <= 6) return "Challenging";
  if (score <= 8) return "Hard";
  return "Very Hard";
}

function getDifficultyColor(score: number): string {
  if (score <= 3) return "text-[hsl(var(--civic-green))]";
  if (score <= 6) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

export function RecruiterDifficultyIndex({ companyId, companyName }: Props) {
  // Ghost jobs (stale listings = harder to fill)
  const { data: jobs } = useQuery({
    queryKey: ["rdi-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("id, posted_at, is_active, created_at")
        .eq("company_id", companyId)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Compensation signals
  const { data: compData } = useQuery({
    queryKey: ["rdi-comp", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_compensation")
        .select("salary_competitiveness, data_source")
        .eq("company_id", companyId)
        .limit(5);
      return data || [];
    },
  });

  // Sentiment
  const { data: sentiment } = useQuery({
    queryKey: ["rdi-sentiment", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("worker_sentiment")
        .select("sentiment, source")
        .eq("company_id", companyId);
      return data || [];
    },
  });

  // Executive turnover (TA/HR leaders departing = recruiting dysfunction)
  const { data: execTurnover } = useQuery({
    queryKey: ["rdi-exec-turnover", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("name, title, departed_at")
        .eq("company_id", companyId)
        .not("departed_at", "is", null);
      return data || [];
    },
  });

  // WARN notices (layoff history tanks talent brand)
  const { data: warns } = useQuery({
    queryKey: ["rdi-warns", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("warn_notices")
        .select("id")
        .eq("company_id", companyId);
      return data || [];
    },
  });

  // Calculate signals
  const signals: DifficultySignal[] = [];

  // 1. Time-to-Fill proxy (stale listings)
  const now = new Date();
  const staleJobs = (jobs || []).filter(j => {
    const posted = new Date(j.posted_at || j.created_at);
    return (now.getTime() - posted.getTime()) > 60 * 24 * 60 * 60 * 1000; // >60 days
  });
  const staleRatio = jobs?.length ? staleJobs.length / jobs.length : 0;
  const ttfScore = Math.min(staleRatio * 10, 10);
  const avgDays = jobs?.length
    ? Math.round((jobs || []).reduce((sum, j) => sum + (now.getTime() - new Date(j.posted_at || j.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) / jobs.length)
    : 0;
  signals.push({
    label: "Time to Fill",
    value: avgDays > 0 ? `~${avgDays} days avg` : "Limited data",
    severity: getSeverity(ttfScore),
    icon: Clock,
    weight: 0.25,
    rawScore: ttfScore,
  });

  // 2. Comp Competitiveness
  const compSignals = compData || [];
  const belowMarket = compSignals.filter((c: any) =>
    c.salary_competitiveness?.toLowerCase().includes("below")
  ).length;
  const compScore = compSignals.length ? (belowMarket / compSignals.length) * 10 : 5;
  signals.push({
    label: "Comp Competitiveness",
    value: belowMarket > 0 ? `${belowMarket} below-market signal${belowMarket !== 1 ? "s" : ""}` : compSignals.length ? "Market rate" : "Limited data",
    severity: getSeverity(compScore),
    icon: DollarSign,
    weight: 0.25,
    rawScore: compScore,
  });

  // 3. Talent Brand Reputation (sentiment + WARN)
  const positiveSentiment = (sentiment || []).filter((s: any) => s.sentiment === "positive").length;
  const negativeSentiment = (sentiment || []).filter((s: any) => s.sentiment === "negative").length;
  const totalSentiment = (sentiment || []).length;
  const warnCount = (warns || []).length;
  const brandScore = totalSentiment
    ? Math.min(((negativeSentiment / totalSentiment) * 7) + (warnCount > 0 ? 3 : 0), 10)
    : warnCount > 0 ? 6 : 5;
  signals.push({
    label: "Talent Brand",
    value: warnCount > 0 ? `${warnCount} WARN notice${warnCount !== 1 ? "s" : ""}` : totalSentiment ? `${positiveSentiment}/${totalSentiment} positive` : "Limited data",
    severity: getSeverity(brandScore),
    icon: ThumbsUp,
    weight: 0.25,
    rawScore: brandScore,
  });

  // 4. TA/HR Leadership Stability
  const hrExecs = (execTurnover || []).filter((e: any) => {
    const title = (e.title || "").toLowerCase();
    return title.includes("hr") || title.includes("human") || title.includes("people") || title.includes("talent") || title.includes("recruit");
  });
  const leadershipScore = Math.min(hrExecs.length * 3, 10);
  signals.push({
    label: "TA Leadership Stability",
    value: hrExecs.length > 0 ? `${hrExecs.length} departure${hrExecs.length !== 1 ? "s" : ""}` : "Stable",
    severity: getSeverity(leadershipScore),
    icon: Users,
    weight: 0.25,
    rawScore: leadershipScore,
  });

  // Composite score
  const compositeScore = Math.round(
    signals.reduce((sum, s) => sum + s.rawScore * s.weight, 0) * 10
  ) / 10;

  const difficultyLabel = getDifficultyLabel(compositeScore);
  const difficultyColor = getDifficultyColor(compositeScore);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Recruiter Difficulty Index
          <Badge variant="outline" className={cn("ml-auto text-xs font-mono", difficultyColor)}>
            {compositeScore.toFixed(1)} / 10 — {difficultyLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              compositeScore <= 3 ? "bg-[hsl(var(--civic-green))]" :
              compositeScore <= 6 ? "bg-[hsl(var(--civic-yellow))]" :
              "bg-destructive"
            )}
            style={{ width: `${compositeScore * 10}%` }}
          />
        </div>

        {/* Signal rows */}
        <div className="grid gap-2">
          {signals.map((signal) => {
            const sev = SEVERITY_STYLES[signal.severity];
            const Icon = signal.icon;
            return (
              <div key={signal.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/20 bg-card">
                <Icon className={cn("w-4 h-4 shrink-0", sev.text)} />
                <span className="text-sm font-medium text-foreground flex-1">{signal.label}</span>
                <span className="text-xs text-muted-foreground">{signal.value}</span>
                <Badge variant="outline" className={cn("text-[10px]", sev.bg, sev.text, sev.border)}>
                  {sev.label}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {compositeScore <= 3
              ? `${companyName} appears relatively easy to recruit for — competitive pay, stable leadership, and positive employer brand signals.`
              : compositeScore <= 6
              ? `${companyName} shows moderate recruiting difficulty. Some signals (${signals.filter(s => s.severity !== "low").map(s => s.label.toLowerCase()).join(", ")}) may slow hiring.`
              : `${companyName} shows high recruiting difficulty. Recruiters should expect longer cycles and may need enhanced offers to close candidates.`
            }
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Based on listing age, compensation signals, workforce sentiment, WARN notices, and HR leadership stability. No judgment, just receipts.
        </p>
      </CardContent>
    </Card>
  );
}
