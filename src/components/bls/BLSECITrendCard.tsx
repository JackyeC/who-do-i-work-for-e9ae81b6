import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity } from "lucide-react";
import { useECITrends, type BLSECITrend } from "@/hooks/use-bls-data";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function BLSECITrendCard({ className }: Props) {
  const { data: trends, isLoading } = useECITrends();

  if (isLoading) {
    return (
      <Card className={className}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
    );
  }

  if (!trends?.length) return null;

  // Group by compensation_type, show latest 4 quarters
  const wages = trends.filter(t => t.compensation_type === "wages").slice(0, 4);
  const total = trends.filter(t => t.compensation_type === "total").slice(0, 4);
  const benefits = trends.filter(t => t.compensation_type === "benefits").slice(0, 4);

  const latestWageGrowth = wages[0]?.percent_change_12mo;

  return (
    <Card className={cn("border-[hsl(var(--civic-green))]/15", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-[hsl(var(--civic-green))]" />
          Wage Growth Trends
          {latestWageGrowth != null && (
            <Badge className={cn(
              "text-xs ml-auto",
              latestWageGrowth >= 3.5
                ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20"
                : "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20"
            )}>
              {latestWageGrowth > 0 ? "+" : ""}{latestWageGrowth.toFixed(1)}% YoY
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">BLS Employment Cost Index — quarterly wage & benefit growth</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <TrendSection label="Wages & Salaries" data={wages} color="hsl(var(--civic-green))" />
        <TrendSection label="Total Compensation" data={total} color="hsl(var(--primary))" />
        <TrendSection label="Benefits" data={benefits} color="hsl(var(--civic-blue))" />

        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Source: BLS Employment Cost Index (ECI). 12-month percent changes.
        </p>
      </CardContent>
    </Card>
  );
}

function TrendSection({ label, data, color }: { label: string; data: BLSECITrend[]; color: string }) {
  if (!data.length) return null;
  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      <div className="flex gap-2">
        {data.reverse().map(d => (
          <div key={`${d.year}-${d.period}`} className="flex-1 text-center">
            <div className="text-xs text-muted-foreground">{d.period} {d.year}</div>
            <div className="text-xs font-bold" style={{ color }}>
              {d.percent_change_12mo != null ? `${d.percent_change_12mo > 0 ? "+" : ""}${d.percent_change_12mo.toFixed(1)}%` : `${d.value}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
