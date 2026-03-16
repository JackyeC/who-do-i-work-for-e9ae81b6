import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingDown, Landmark, UserMinus, Shield, Share2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Severity = "clear" | "watch" | "alert";

interface RiskSignal {
  key: string;
  label: string;
  icon: React.ElementType;
  severity: Severity;
  summary: string;
}

interface CompanyRiskRadarProps {
  companyId: string;
  companyName: string;
  slug: string;
  lobbyingSpend?: number | null;
  totalPacSpending?: number | null;
  hasCompensationData?: boolean;
}

const SEVERITY_STYLES: Record<Severity, { badge: string; dot: string; ring: string }> = {
  clear: {
    badge: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
    dot: "bg-[hsl(var(--civic-green))]",
    ring: "stroke-[hsl(var(--civic-green))]",
  },
  watch: {
    badge: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
    dot: "bg-[hsl(var(--civic-yellow))]",
    ring: "stroke-[hsl(var(--civic-yellow))]",
  },
  alert: {
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
    ring: "stroke-destructive",
  },
};

const SEVERITY_LABELS: Record<Severity, string> = {
  clear: "Clear",
  watch: "Watch",
  alert: "Alert",
};

type OverallRisk = "low" | "moderate" | "elevated" | "high";

function computeOverall(signals: RiskSignal[]): OverallRisk {
  const alerts = signals.filter((s) => s.severity === "alert").length;
  const watches = signals.filter((s) => s.severity === "watch").length;
  if (alerts >= 3) return "high";
  if (alerts >= 2) return "elevated";
  if (alerts >= 1 || watches >= 2) return "moderate";
  return "low";
}

const OVERALL_STYLES: Record<OverallRisk, { label: string; color: string; ringColor: string }> = {
  low: { label: "Low", color: "text-[hsl(var(--civic-green))]", ringColor: "stroke-[hsl(var(--civic-green))]" },
  moderate: { label: "Moderate", color: "text-[hsl(var(--civic-yellow))]", ringColor: "stroke-[hsl(var(--civic-yellow))]" },
  elevated: { label: "Elevated", color: "text-[hsl(var(--civic-yellow))]", ringColor: "stroke-[hsl(var(--civic-yellow))]" },
  high: { label: "High", color: "text-destructive", ringColor: "stroke-destructive" },
};

function RadarRing({ overall }: { overall: OverallRisk }) {
  const { ringColor } = OVERALL_STYLES[overall];
  const pct = overall === "low" ? 0.15 : overall === "moderate" ? 0.45 : overall === "elevated" ? 0.7 : 0.95;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          className={cn(ringColor, "transition-all duration-700")}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Shield className={cn("w-4 h-4 mb-0.5", OVERALL_STYLES[overall].color)} strokeWidth={1.5} />
        <span className={cn("font-mono text-xs font-bold tracking-wider uppercase", OVERALL_STYLES[overall].color)}>
          {OVERALL_STYLES[overall].label}
        </span>
      </div>
    </div>
  );
}

export function CompanyRiskRadar({ companyId, companyName, slug, lobbyingSpend, totalPacSpending, hasCompensationData = false }: CompanyRiskRadarProps) {
  const { toast } = useToast();

  // Fetch WARN notices
  const { data: warnCount } = useQuery({
    queryKey: ["risk-radar-warns", companyId],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { count } = await supabase
        .from("company_warn_notices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("notice_date", oneYearAgo.toISOString().split("T")[0]);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch executive departures
  const { data: execDepartures } = useQuery({
    queryKey: ["risk-radar-execs", companyId],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_executives")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .not("departed_at", "is", null);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build signals
  const warns = warnCount ?? 0;
  const comp = hasCompensationData ? 1 : 0;
  const execs = execDepartures ?? 0;
  const lobby = (lobbyingSpend || 0) + (totalPacSpending || 0);

  const signals: RiskSignal[] = [
    {
      key: "layoffs",
      label: "Recent Layoffs",
      icon: TrendingDown,
      severity: warns >= 3 ? "alert" : warns >= 1 ? "watch" : "clear",
      summary: warns > 0 ? `${warns} WARN notice${warns > 1 ? "s" : ""} in past 12 months` : "No recent layoff signals detected",
    },
    {
      key: "compensation",
      label: "Below-Market Comp",
      icon: AlertTriangle,
      severity: comp === 0 ? "watch" : "clear",
      summary: comp === 0 ? "No compensation data disclosed — low transparency" : `${comp} salary data point${comp > 1 ? "s" : ""} on record`,
    },
    {
      key: "lobbying",
      label: "Lobbying Exposure",
      icon: Landmark,
      severity: lobby >= 5_000_000 ? "alert" : lobby >= 500_000 ? "watch" : "clear",
      summary: lobby > 0
        ? `$${lobby >= 1e6 ? `${(lobby / 1e6).toFixed(1)}M` : `${(lobby / 1e3).toFixed(0)}K`} total political spending`
        : "Minimal political spending detected",
    },
    {
      key: "turnover",
      label: "Executive Turnover",
      icon: UserMinus,
      severity: execs >= 4 ? "alert" : execs >= 2 ? "watch" : "clear",
      summary: execs > 0 ? `${execs} executive departure${execs > 1 ? "s" : ""} on record` : "Stable leadership team",
    },
  ];

  const overall = computeOverall(signals);
  const activeCount = signals.filter((s) => s.severity !== "clear").length;

  const handleShare = () => {
    const activeSignals = signals.filter((s) => s.severity !== "clear");
    const details = activeSignals.map((s) => s.label).join(", ");
    const text = activeCount > 0
      ? `⚠️ ${companyName} Risk Radar: ${activeCount} of 4 signals active — ${details}. Check the receipts → https://wdiwf.jackyeclayton.com/company/${slug}`
      : `✅ ${companyName} Risk Radar: All clear — 0 of 4 risk signals active. → https://wdiwf.jackyeclayton.com/company/${slug}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Risk radar summary ready to share." });
  };

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" strokeWidth={1.5} />
          <span className="font-mono text-xs tracking-[0.15em] uppercase text-foreground font-semibold">
            Career Risk Radar
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground" onClick={handleShare}>
          <Copy className="w-3 h-3 mr-1" /> Share
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 flex gap-5 items-start">
        {/* Ring */}
        <RadarRing overall={overall} />

        {/* Signal list */}
        <div className="flex-1 space-y-2.5">
          {signals.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-start gap-2.5">
                <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", SEVERITY_STYLES[s.severity].dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-mono text-xs font-medium text-foreground">{s.label}</span>
                    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", SEVERITY_STYLES[s.severity].badge)}>
                      {SEVERITY_LABELS[s.severity]}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{s.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
