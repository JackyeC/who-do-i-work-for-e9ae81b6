import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { useWageBenchmark, type BLSWageBenchmark } from "@/hooks/use-bls-data";
import { cn } from "@/lib/utils";

interface Props {
  occupationTitle?: string;
  offeredSalary?: number;
  className?: string;
}

function fmt(val: number | null | undefined) {
  if (val == null) return "—";
  return "$" + val.toLocaleString();
}

function PercentileBar({ data, offeredSalary }: { data: BLSWageBenchmark; offeredSalary?: number }) {
  const vals = [data.annual_10th, data.annual_25th, data.annual_median, data.annual_75th, data.annual_90th]
    .filter((v): v is number => v != null);
  if (vals.length < 3) return null;

  const min = vals[0];
  const max = vals[vals.length - 1];
  const range = max - min || 1;

  const pct = (v: number) => ((v - min) / range) * 100;
  const offerPct = offeredSalary ? Math.max(0, Math.min(100, pct(offeredSalary))) : null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="relative h-3 bg-muted rounded-full overflow-visible">
        <div
          className="absolute h-full bg-gradient-to-r from-destructive/40 via-primary/60 to-[hsl(var(--civic-green))]/60 rounded-full"
          style={{ left: "0%", width: "100%" }}
        />
        {offerPct !== null && (
          <div
            className="absolute top-[-4px] w-0.5 h-5 bg-foreground rounded-full z-10"
            style={{ left: `${offerPct}%` }}
            title={`Your offer: ${fmt(offeredSalary)}`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>10th: {fmt(data.annual_10th)}</span>
        <span>Median: {fmt(data.annual_median)}</span>
        <span>90th: {fmt(data.annual_90th)}</span>
      </div>
      {offeredSalary && data.annual_median && (
        <OfferVsMedian offered={offeredSalary} median={data.annual_median} />
      )}
    </div>
  );
}

function OfferVsMedian({ offered, median }: { offered: number; median: number }) {
  const diff = ((offered - median) / median) * 100;
  const isAbove = diff >= 0;
  return (
    <div className={cn(
      "text-xs font-medium flex items-center gap-1 mt-1",
      isAbove ? "text-[hsl(var(--civic-green))]" : "text-destructive"
    )}>
      <TrendingUp className={cn("w-3 h-3", !isAbove && "rotate-180")} />
      Your offer is {Math.abs(diff).toFixed(0)}% {isAbove ? "above" : "below"} the national median
    </div>
  );
}

export function BLSWageBenchmarkCard({ occupationTitle, offeredSalary, className }: Props) {
  const { data: wages, isLoading } = useWageBenchmark(occupationTitle);
  const best = wages?.[0];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (!best) return null;

  return (
    <Card className={cn("border-primary/15", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          BLS Salary Benchmark
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {best.occupation_title} — {best.area_title} ({best.data_year})
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox label="Annual Median" value={fmt(best.annual_median)} />
          <StatBox label="Annual Mean" value={fmt(best.annual_mean)} />
          <StatBox label="Hourly Median" value={fmt(best.hourly_median)} sub="/hr" />
          <StatBox label="Employment" value={best.total_employment?.toLocaleString() ?? "—"} icon={<Users className="w-3 h-3" />} />
        </div>

        <PercentileBar data={best} offeredSalary={offeredSalary} />

        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Source: BLS Occupational Employment & Wage Statistics (OES). National estimates.
        </p>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50 text-center">
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">{icon}{label}</p>
      <p className="text-sm font-bold text-foreground">{value}{sub && <span className="text-xs text-muted-foreground">{sub}</span>}</p>
    </div>
  );
}
