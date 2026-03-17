import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, Users, DollarSign, Scale, Eye, 
  TrendingDown, Megaphone, MessageSquareWarning, Shield
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

interface WarningSignal {
  id: string;
  label: string;
  status: "elevated" | "moderate" | "low" | "no_data";
  detail: string;
  source: string;
  icon: typeof AlertTriangle;
}

const STATUS_STYLES = {
  elevated: "bg-[hsl(var(--civic-yellow))]/8 border-[hsl(var(--civic-yellow))]/20 text-[hsl(var(--civic-yellow))]",
  moderate: "bg-[hsl(var(--civic-yellow))]/5 border-[hsl(var(--civic-yellow))]/15 text-[hsl(var(--civic-yellow))]",
  low: "bg-[hsl(var(--civic-green))]/8 border-[hsl(var(--civic-green))]/20 text-[hsl(var(--civic-green))]",
  no_data: "bg-muted/50 border-border/30 text-muted-foreground",
};

const STATUS_BADGE = {
  elevated: "Review Required",
  moderate: "Moderate",
  low: "Low Risk",
  no_data: "No Data",
};

export function EarlyWarningSignals({ companyId, companyName }: Props) {
  // Fetch all the signal sources in parallel
  const { data: executiveTurnover } = useQuery({
    queryKey: ["ew-exec-turnover", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("departed_at, created_at")
        .eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: courtCases } = useQuery({
    queryKey: ["ew-court-cases", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase
        .from("company_court_cases")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      return count || 0;
    },
  });

  const { data: sentiment } = useQuery({
    queryKey: ["ew-sentiment", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_worker_sentiment")
        .select("overall_rating, ceo_approval")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
  });

  const { data: warnNotices } = useQuery({
    queryKey: ["ew-warn", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase
        .from("warn_notices" as any)
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      return count || 0;
    },
  });

  const { data: lobbyingSpend } = useQuery({
    queryKey: ["ew-lobbying", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("lobbying_spend, total_pac_spending")
        .eq("id", companyId!)
        .single();
      return data;
    },
  });

  const { data: diversityDisclosures } = useQuery({
    queryKey: ["ew-diversity-disc", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_diversity_disclosures" as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("year", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: hypocrisy } = useQuery({
    queryKey: ["ew-hypocrisy", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_hypocrisy_index")
        .select("chi_grade, direct_conflicts")
        .eq("company_id", companyId!)
        .maybeSingle();
      return data;
    },
  });

  if (!companyId) return null;

  // Build signals
  const signals: WarningSignal[] = [];

  // 1. Executive Turnover
  const departedExecs = executiveTurnover?.filter(e => e.departed_at) || [];
  const turnoverPct = executiveTurnover?.length ? Math.round((departedExecs.length / executiveTurnover.length) * 100) : 0;
  signals.push({
    id: "leadership",
    label: "Leadership Stability",
    icon: Users,
    status: !executiveTurnover?.length ? "no_data" : turnoverPct > 30 ? "elevated" : turnoverPct > 15 ? "moderate" : "low",
    detail: !executiveTurnover?.length
      ? "No executive roster data available"
      : `${departedExecs.length} of ${executiveTurnover.length} tracked executives have departed (${turnoverPct}% turnover)`,
    source: "SEC filings, corporate pages",
  });

  // 2. Pay Compression (using BLS comparison - simplified)
  signals.push({
    id: "compensation",
    label: "Compensation Position",
    icon: DollarSign,
    status: "no_data",
    detail: "Compare offered salaries against BLS benchmarks using Offer Check",
    source: "BLS OES, company postings",
  });

  // 3. Litigation Exposure
  const caseCount = courtCases || 0;
  signals.push({
    id: "legal",
    label: "Legal Exposure",
    icon: Scale,
    status: caseCount === 0 ? "no_data" : caseCount > 5 ? "elevated" : caseCount > 2 ? "moderate" : "low",
    detail: caseCount === 0
      ? "No court cases detected in scanned records"
      : `${caseCount} court case${caseCount > 1 ? "s" : ""} detected in federal records`,
    source: "CourtListener, PACER/RECAP",
  });

  // 4. Diversity Disclosure Trend
  const recentDisclosures = diversityDisclosures || [];
  const stoppedPublishing = recentDisclosures.length > 1 && !recentDisclosures[0]?.is_published && recentDisclosures[1]?.is_published;
  signals.push({
    id: "transparency",
    label: "Diversity Disclosure",
    icon: Eye,
    status: recentDisclosures.length === 0 ? "no_data" : stoppedPublishing ? "elevated" : recentDisclosures[0]?.is_published ? "low" : "moderate",
    detail: recentDisclosures.length === 0
      ? "No diversity reporting history tracked"
      : stoppedPublishing
      ? "Company previously published diversity data but has stopped — transparency decline detected"
      : recentDisclosures[0]?.is_published
      ? "Company actively publishes diversity reports"
      : "No public diversity report detected for most recent period",
    source: "Company reports, Open Diversity Data",
  });

  // 5. Workforce Stability
  const warnCount = warnNotices || 0;
  signals.push({
    id: "stability",
    label: "Workforce Stability",
    icon: TrendingDown,
    status: warnCount === 0 ? (companyId ? "low" : "no_data") : warnCount > 3 ? "elevated" : "moderate",
    detail: warnCount === 0
      ? "No WARN layoff notices detected"
      : `${warnCount} WARN layoff notice${warnCount > 1 ? "s" : ""} on record`,
    source: "WARN Act filings, state databases",
  });

  // 6. Political Influence
  const totalInfluence = (lobbyingSpend?.lobbying_spend || 0) + (lobbyingSpend?.total_pac_spending || 0);
  signals.push({
    id: "influence",
    label: "Political Influence",
    icon: Megaphone,
    status: totalInfluence === 0 ? "low" : totalInfluence > 500000 ? "elevated" : "moderate",
    detail: totalInfluence === 0
      ? "No significant political spending detected"
      : `$${totalInfluence.toLocaleString()} in combined PAC + lobbying spending detected`,
    source: "FEC, OpenSecrets, Senate LDA",
  });

  // 7. Culture Alignment (sentiment vs messaging)
  const rating = sentiment?.overall_rating;
  const hasSayDoConflicts = hypocrisy?.direct_conflicts && hypocrisy.direct_conflicts > 0;
  signals.push({
    id: "culture",
    label: "Culture Alignment",
    icon: MessageSquareWarning,
    status: !rating && !hasSayDoConflicts ? "no_data"
      : (rating && rating < 3.0) || hasSayDoConflicts ? "elevated"
      : rating && rating < 3.5 ? "moderate"
      : "low",
    detail: !rating && !hasSayDoConflicts
      ? "Insufficient sentiment data to assess culture alignment"
      : hasSayDoConflicts
      ? `Say-Do conflicts detected (${hypocrisy?.chi_grade} grade)${rating ? ` with ${rating}/5 employee rating` : ""}`
      : `Employee rating: ${rating}/5 — ${rating && rating >= 3.8 ? "above" : "near"} average`,
    source: "Worker reviews, company stances, FEC",
  });

  // Composite score
  const elevatedCount = signals.filter(s => s.status === "elevated").length;
  const moderateCount = signals.filter(s => s.status === "moderate").length;
  const compositeLevel = elevatedCount >= 3 ? "High" : elevatedCount >= 1 || moderateCount >= 3 ? "Moderate" : "Low";
  const compositeColor = compositeLevel === "High" ? "text-[hsl(var(--civic-yellow))]" : compositeLevel === "Moderate" ? "text-[hsl(var(--civic-yellow))]" : "text-[hsl(var(--civic-green))]";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Early Warning Signals
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Overall Risk:</span>
            <Badge variant="outline" className={cn("text-[10px]", compositeColor)}>
              {compositeLevel}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          7 investigative signals journalists use to evaluate employer health
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map(signal => {
          const Icon = signal.icon;
          return (
            <div
              key={signal.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                STATUS_STYLES[signal.status]
              )}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{signal.label}</p>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {STATUS_BADGE[signal.status]}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{signal.detail}</p>
                <p className="text-[9px] text-muted-foreground/70 mt-1">{signal.source}</p>
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-3">
          These signals highlight patterns observed in public records. We recommend employers provide
          an "Insider Context" statement to clarify their stance. No single signal is conclusive.
        </p>
      </CardContent>
    </Card>
  );
}
