import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertTriangle, Users, DollarSign, Building2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLayoffProbability, type LayoffProbabilityInput } from "@/lib/layoffProbabilityScore";
import { useMemo } from "react";

interface Props {
  companyId?: string;
  companyName: string;
  isPubliclyTraded?: boolean;
  revenue?: string | null;
}

const RISK_STYLES = {
  low: { bg: "bg-[hsl(var(--civic-green))]/8", border: "border-[hsl(var(--civic-green))]/20", text: "text-[hsl(var(--civic-green))]", label: "Low Risk" },
  moderate: { bg: "bg-[hsl(var(--civic-yellow))]/8", border: "border-[hsl(var(--civic-yellow))]/20", text: "text-[hsl(var(--civic-yellow))]", label: "Moderate" },
  elevated: { bg: "bg-destructive/8", border: "border-destructive/20", text: "text-destructive", label: "Elevated" },
  high: { bg: "bg-destructive/12", border: "border-destructive/30", text: "text-destructive", label: "High Risk" },
};

const CAT_ICONS = {
  workforce: Users,
  financial: DollarSign,
  operational: Building2,
  leadership: UserMinus,
};

export function LayoffProbabilityCard({ companyId, companyName, isPubliclyTraded, revenue }: Props) {
  // Fetch WARN notices
  const { data: warnData } = useQuery({
    queryKey: ["lp-warn", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("warn_notices")
        .select("id")
        .eq("company_id", companyId!)
        .gte("notice_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      return data || [];
    },
  });

  // Fetch executive departures
  const { data: execDepartures } = useQuery({
    queryKey: ["lp-exec-dep", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("title, departed_at")
        .eq("company_id", companyId!)
        .not("departed_at", "is", null);
      return data || [];
    },
  });

  // Fetch court cases (labor-related)
  const { data: laborCases } = useQuery({
    queryKey: ["lp-labor-cases", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_court_cases")
        .select("id, nature_of_suit")
        .eq("company_id", companyId!);
      const laborKeywords = /labor|wage|flsa|nlrb|employment|discrimination|wrongful/i;
      return (data || []).filter((c: any) =>
        laborKeywords.test(c.nature_of_suit || "")
      );
    },
  });

  const result = useMemo(() => {
    const recentDepartures = execDepartures || [];
    const cfoGone = recentDepartures.some((e: any) => /CFO|Chief Financial/i.test(e.title || ""));
    const ceoGone = recentDepartures.some((e: any) => /CEO|Chief Executive/i.test(e.title || ""));

    const input: LayoffProbabilityInput = {
      jobPostingTrend: "unknown",
      jobPostingDeclinePct: 0,
      hasHiringFreeze: false,
      hasRecruiterLayoffs: false,
      isPubliclyTraded: !!isPubliclyTraded,
      hasRevenueDecline: false,
      hasMissedGuidance: false,
      hasFundingSlowdown: false,
      revenue: revenue || null,
      warnNoticeCount: warnData?.length || 0,
      hasFacilityClosures: false,
      hasRestructuringAnnouncement: false,
      courtCaseCount: laborCases?.length || 0,
      recentExecutiveDepartures: recentDepartures.length,
      hasCfoDeparture: cfoGone,
      hasCeoDeparture: ceoGone,
      boardShakeup: false,
    };

    return calculateLayoffProbability(input);
  }, [warnData, execDepartures, laborCases, isPubliclyTraded, revenue]);

  const style = RISK_STYLES[result.riskLevel];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Layoff Probability
          <Badge variant="outline" className={cn("ml-auto text-[10px]", style.text, style.bg, style.border)}>
            {result.score}/100 · {style.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", 
                result.score >= 70 ? "bg-destructive" : result.score >= 50 ? "bg-[hsl(var(--civic-yellow))]" : "bg-[hsl(var(--civic-green))]"
              )}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>

        {/* Top signals */}
        {result.topSignals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Signals Detected</p>
            {result.topSignals.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0", style.text)} />
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {result.categories.map((cat) => {
            const Icon = CAT_ICONS[cat.key as keyof typeof CAT_ICONS] || Building2;
            const catStyle = RISK_STYLES[
              cat.score >= 70 ? "high" : cat.score >= 50 ? "elevated" : cat.score >= 30 ? "moderate" : "low"
            ];
            return (
              <div key={cat.key} className={cn("p-2.5 rounded-lg border", catStyle.bg, catStyle.border)}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("w-3.5 h-3.5", catStyle.text)} />
                  <span className="text-[11px] font-medium text-foreground">{cat.name}</span>
                </div>
                <span className={cn("text-lg font-bold", catStyle.text)}>{cat.score}</span>
                <span className="text-[10px] text-muted-foreground ml-0.5">/ 100</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Sources: State WARN databases · SEC filings · Court records · Executive disclosures · This is a signal-based estimate, not a prediction.
        </p>
      </CardContent>
    </Card>
  );
}
