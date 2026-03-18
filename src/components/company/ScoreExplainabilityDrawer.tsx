import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Info, Shield, TrendingUp, DollarSign, Landmark, Scale, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  companyId: string;
  score: number | null;
}

interface SubScoreData {
  label: string;
  value: number;
  weight: number;
  icon: React.ElementType;
  sources: string[];
  description: string;
}

export function ScoreExplainabilityDrawer({ companyId, score }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch the raw signals used to compute the score
  const { data: signalCounts } = useQuery({
    queryKey: ["score-explainability", companyId],
    queryFn: async () => {
      const [comp, warn, lobby, sentiment, jobs, execs] = await Promise.all([
        (supabase as any).from("company_compensation").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        (supabase as any).from("warn_notices").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("companies").select("lobbying_spend").eq("id", companyId).single(),
        (supabase as any).from("worker_sentiment").select("id, sentiment").eq("company_id", companyId),
        (supabase as any).from("company_jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        (supabase as any).from("company_executives").select("id, departed_at").eq("company_id", companyId),
      ]);

      const lobbySpend = lobby.data?.lobbying_spend || 0;
      const positiveCount = (sentiment.data || []).filter((s: any) => s.sentiment === "positive").length;
      const departedExecs = (execs.data || []).filter((e: any) => e.departed_at).length;

      // Replicate the DB function logic
      const salaryTransparency = Math.min((comp.count || 0) * 2, 10);
      const layoffRisk = Math.max(10 - (warn.count || 0) * 2, 0);
      const lobbyingActivity = lobbySpend <= 0 ? 8 : lobbySpend < 100000 ? 7 : lobbySpend < 1000000 ? 5 : lobbySpend < 10000000 ? 3 : 1;
      const employeeSentiment = Math.min(positiveCount * 1.5, 10);
      const hiringStability = Math.min((jobs.count || 0) * 0.5, 10);
      const executiveTurnover = Math.max(10 - departedExecs * 2, 0);

      return {
        salaryTransparency: { value: salaryTransparency, count: comp.count || 0, source: "Company Compensation Data" },
        layoffRisk: { value: layoffRisk, count: warn.count || 0, source: "WARN Act Notices" },
        lobbyingActivity: { value: lobbyingActivity, amount: lobbySpend, source: "Senate LDA / OpenSecrets" },
        employeeSentiment: { value: employeeSentiment, count: positiveCount, source: "Worker Sentiment Signals" },
        hiringStability: { value: hiringStability, count: jobs.count || 0, source: "Active Job Postings" },
        executiveTurnover: { value: executiveTurnover, count: departedExecs, source: "Leadership Tracking" },
      };
    },
    enabled: !!companyId && isOpen,
  });

  const value = score ?? 0;

  const getConfidenceLabel = () => {
    if (!signalCounts) return "—";
    const filledSignals = [
      signalCounts.salaryTransparency.count > 0,
      signalCounts.layoffRisk.count > 0 || signalCounts.layoffRisk.value === 10,
      signalCounts.lobbyingActivity.amount > 0 || signalCounts.lobbyingActivity.value === 8,
      signalCounts.employeeSentiment.count > 0,
      signalCounts.hiringStability.count > 0,
      signalCounts.executiveTurnover.count > 0 || signalCounts.executiveTurnover.value === 10,
    ].filter(Boolean).length;
    if (filledSignals >= 5) return "High";
    if (filledSignals >= 3) return "Medium";
    return "Low";
  };

  const subScores: SubScoreData[] = signalCounts ? [
    {
      label: "Salary Transparency",
      value: signalCounts.salaryTransparency.value,
      weight: 0.20,
      icon: DollarSign,
      sources: [signalCounts.salaryTransparency.source],
      description: `${signalCounts.salaryTransparency.count} compensation record${signalCounts.salaryTransparency.count !== 1 ? "s" : ""} found`,
    },
    {
      label: "Layoff Risk",
      value: signalCounts.layoffRisk.value,
      weight: 0.15,
      icon: Shield,
      sources: [signalCounts.layoffRisk.source],
      description: `${signalCounts.layoffRisk.count} WARN notice${signalCounts.layoffRisk.count !== 1 ? "s" : ""} on file`,
    },
    {
      label: "Lobbying Activity",
      value: signalCounts.lobbyingActivity.value,
      weight: 0.15,
      icon: Landmark,
      sources: [signalCounts.lobbyingActivity.source],
      description: signalCounts.lobbyingActivity.amount > 0 ? `$${(signalCounts.lobbyingActivity.amount / 1000).toFixed(0)}K in lobbying spend` : "No lobbying spend detected",
    },
    {
      label: "Employee Sentiment",
      value: signalCounts.employeeSentiment.value,
      weight: 0.20,
      icon: TrendingUp,
      sources: [signalCounts.employeeSentiment.source],
      description: `${signalCounts.employeeSentiment.count} positive sentiment signal${signalCounts.employeeSentiment.count !== 1 ? "s" : ""}`,
    },
    {
      label: "Hiring Stability",
      value: signalCounts.hiringStability.value,
      weight: 0.15,
      icon: Scale,
      sources: [signalCounts.hiringStability.source],
      description: `${signalCounts.hiringStability.count} active job posting${signalCounts.hiringStability.count !== 1 ? "s" : ""}`,
    },
    {
      label: "Executive Turnover",
      value: signalCounts.executiveTurnover.value,
      weight: 0.15,
      icon: Eye,
      sources: [signalCounts.executiveTurnover.source],
      description: `${signalCounts.executiveTurnover.count} executive departure${signalCounts.executiveTurnover.count !== 1 ? "s" : ""} recorded`,
    },
  ] : [];

  const getBarColor = (val: number) => {
    if (val >= 7) return "bg-[hsl(var(--civic-green))]";
    if (val >= 4) return "bg-[hsl(var(--civic-yellow))]";
    return "bg-destructive";
  };

  return (
    <Card className="border-border/40 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">
            Career Intelligence Score
          </div>
          <span className={cn(
            "text-xl font-bold font-data tabular-nums",
            value >= 7 ? "text-[hsl(var(--civic-green))]" : value >= 4 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive"
          )}>
            {value.toFixed(1)}/10
          </span>
          {signalCounts && (
            <Badge variant="outline" className={cn(
              "text-xs",
              getConfidenceLabel() === "High" ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" :
              getConfidenceLabel() === "Medium" ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" :
              "bg-muted text-muted-foreground"
            )}>
              {getConfidenceLabel()} Confidence
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-5 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 leading-relaxed">
              This score is computed from 6 weighted signal groups. Every factor includes its data source
              and evidence count. Click any factor to understand what drives it.
            </p>
          </div>

          {/* Sub-scores */}
          <div className="space-y-3">
            {subScores.map((sub) => {
              const Icon = sub.icon;
              const weightedContribution = (sub.value * sub.weight).toFixed(1);
              return (
                <div key={sub.label} className="p-3 rounded-lg border border-border/20 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{sub.label}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs px-1.5">{(sub.weight * 100).toFixed(0)}% weight</Badge>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            Contributes {weightedContribution} to the final score
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className={cn(
                      "text-sm font-bold font-data tabular-nums",
                      sub.value >= 7 ? "text-[hsl(var(--civic-green))]" : sub.value >= 4 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive"
                    )}>
                      {sub.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", getBarColor(sub.value))} style={{ width: `${(sub.value / 10) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">{sub.description}</span>
                    <span className="text-xs text-muted-foreground/70">Source: {sub.sources[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formula */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              CIS = (0.20 × Salary) + (0.15 × Layoff) + (0.15 × Lobbying) + (0.20 × Sentiment) + (0.15 × Hiring) + (0.15 × Turnover)
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
