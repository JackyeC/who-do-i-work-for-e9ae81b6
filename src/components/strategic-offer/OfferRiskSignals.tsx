import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  companyId?: string;
  companyName: string;
}

interface Signal {
  signal_category: string;
  normalized_value: number;
  direction: string;
  summary: string;
  confidence_score: number;
}

type RiskLevel = "low" | "moderate" | "elevated";

const CATEGORY_LABELS: Record<string, string> = {
  hiring_activity: "Hiring Activity",
  workforce_stability: "Workforce Stability",
  compensation_transparency: "Pay Transparency",
  company_behavior: "Company Behavior",
  innovation_activity: "Innovation & Growth",
  public_sentiment: "Public Sentiment",
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  low: { label: "Low Risk", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/30", icon: ShieldCheck },
  moderate: { label: "Moderate Risk", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30", icon: Shield },
  elevated: { label: "Elevated Risk", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle },
};

function computeRiskLevel(signals: Signal[]): RiskLevel {
  if (signals.length === 0) return "moderate";
  const avg = signals.reduce((s, sig) => s + sig.normalized_value, 0) / signals.length;
  if (avg >= 65) return "low";
  if (avg >= 40) return "moderate";
  return "elevated";
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === "increase") return <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />;
  if (direction === "decrease") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function OfferRiskSignals({ companyId, companyName }: Props) {
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["offer-risk-signals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_signal_scans" as any)
        .select("signal_category, normalized_value, direction, summary, confidence_score")
        .eq("company_id", companyId)
        .order("scanned_at", { ascending: false })
        .limit(12);
      // Dedupe by category (latest only)
      const seen = new Set<string>();
      return ((data || []) as unknown as Signal[]).filter(s => {
        if (seen.has(s.signal_category)) return false;
        seen.add(s.signal_category);
        return true;
      });
    },
    enabled: !!companyId,
  });

  if (!companyId || (signals.length === 0 && !isLoading)) return null;

  const riskLevel = computeRiskLevel(signals);
  const config = RISK_CONFIG[riskLevel];
  const RiskIcon = config.icon;

  return (
    <div id="risk-signals">
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Employer Risk Signals
            </span>
            <Badge variant="outline" className={cn("text-xs gap-1.5", config.color, config.border, config.bg)}>
              <RiskIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Real-time signals from {companyName}'s hiring, stability, and transparency patterns.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading signals…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {signals.map((sig) => (
                <div key={sig.signal_category} className="p-3 bg-muted/30 rounded-xl border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {CATEGORY_LABELS[sig.signal_category] || sig.signal_category}
                    </span>
                    <DirectionIcon direction={sig.direction} />
                  </div>
                  <p className="text-lg font-display font-bold text-foreground">{sig.normalized_value}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{sig.summary}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { computeRiskLevel };
export type { RiskLevel, Signal as RiskSignal };
