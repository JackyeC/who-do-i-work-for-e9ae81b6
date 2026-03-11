import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Heart, Briefcase, Clock, Baby, GraduationCap } from "lucide-react";
import { useBenefitsBenchmarks, type BLSBenefitBenchmark } from "@/hooks/use-bls-data";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const CATEGORY_ORDER = ["healthcare", "retirement", "leave", "education", "other"];

const CATEGORY_META: Record<string, { icon: typeof Heart; label: string }> = {
  healthcare: { icon: Heart, label: "Healthcare" },
  retirement: { icon: Briefcase, label: "Retirement & Savings" },
  leave: { icon: Clock, label: "Leave & Time Off" },
  education: { icon: GraduationCap, label: "Education & Development" },
  insurance: { icon: Shield, label: "Insurance" },
  other: { icon: Shield, label: "Other Benefits" },
};

function RateBar({ rate, label }: { rate: number | null; label: string }) {
  const value = rate ?? 0;
  const color =
    value >= 70 ? "bg-civic-green" :
    value >= 40 ? "bg-primary" :
    "bg-civic-yellow";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-foreground w-10 text-right tabular-nums">
          {rate != null ? `${rate.toFixed(0)}%` : "—"}
        </span>
      </div>
    </div>
  );
}

export function BLSBenefitsCard({ className }: Props) {
  const { data: benefits, isLoading } = useBenefitsBenchmarks();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!benefits?.length) return null;

  const latestYear = benefits[0]?.data_year;
  const latest = benefits.filter(b => b.data_year === latestYear && b.worker_type === "all");

  // Group and sort by category order
  const byCategory: Record<string, BLSBenefitBenchmark[]> = {};
  for (const b of latest) {
    (byCategory[b.benefit_category] ??= []).push(b);
  }
  // Sort items within each category by participation rate descending
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => (b.participation_rate ?? 0) - (a.participation_rate ?? 0));
  }

  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Compute overall average
  const rates = latest.map(b => b.participation_rate).filter((r): r is number => r != null);
  const avgRate = rates.length ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : null;

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          National Benefits Benchmark
          <Badge variant="outline" className="text-[10px] ml-auto">{latestYear} NCS</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          What percentage of U.S. civilian workers have access to each benefit
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stat */}
        {avgRate != null && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">{avgRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Access</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Average benefit participation rate across {rates.length} tracked benefit types nationally.
            </p>
          </div>
        )}

        {/* Category groups */}
        {sortedCategories.map(cat => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
          const Icon = meta.icon;
          const items = byCategory[cat];

          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground tracking-wide">{meta.label}</p>
              </div>
              <div className="pl-5 border-l border-border/40">
                {items.map(item => (
                  <RateBar
                    key={item.benefit_type}
                    rate={item.participation_rate}
                    label={item.benefit_type}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Source: Bureau of Labor Statistics National Compensation Survey (NCS). Participation rates for civilian workers.
        </p>
      </CardContent>
    </Card>
  );
}
