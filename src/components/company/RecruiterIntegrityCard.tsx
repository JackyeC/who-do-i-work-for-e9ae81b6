import { Shield, AlertTriangle, TrendingUp, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CompanyIntegrityResult } from "@/hooks/use-company-integrity";

const RISK_STYLES: Record<string, string> = {
  LOW: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30",
  MODERATE: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30",
  HIGH: "text-destructive bg-destructive/10 border-destructive/30",
  CRITICAL: "text-destructive bg-destructive/15 border-destructive/40",
};

const RISK_ICONS: Record<string, React.ElementType> = {
  LOW: Shield,
  MODERATE: Eye,
  HIGH: AlertTriangle,
  CRITICAL: AlertTriangle,
};

interface Props {
  result: CompanyIntegrityResult;
}

function ScoreRow({ label, value, icon: Icon, max = 100 }: { label: string; value: number; icon: React.ElementType; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "bg-destructive" : pct >= 40 ? "bg-[hsl(var(--civic-yellow))]" : "bg-[hsl(var(--civic-green))]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RecruiterIntegrityCard({ result }: Props) {
  const RiskIcon = RISK_ICONS[result.risk_level] || Shield;

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Warning banner */}
      {result.company_integrity_flag && (
        <div className="flex items-start gap-2 px-5 py-3 bg-[hsl(var(--civic-yellow))]/10 border-b border-[hsl(var(--civic-yellow))]/20">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-[hsl(var(--civic-yellow))]">
            {result.company_integrity_flag}
          </p>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <CardTitle className="text-sm">Recruiter View</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-xs gap-1 border", RISK_STYLES[result.risk_level])}>
            <RiskIcon className="w-3 h-3" />
            {result.risk_level} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score bars */}
        <div className="space-y-3">
          <ScoreRow label="Integrity Gap" value={result.reality_gap_score} icon={TrendingUp} />
          <ScoreRow label="Connected Dots" value={result.insider_score} icon={Users} />
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {result.summary_for_recruiter}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Source: WDIWF Intelligence Pipeline · Recruiter-grade analysis
        </p>
      </CardContent>
    </Card>
  );
}

export function RecruiterIntegrityCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <CardTitle className="text-sm">Recruiter View</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
