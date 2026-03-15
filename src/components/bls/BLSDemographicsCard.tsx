import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BarChart3 } from "lucide-react";
import { useDemographicEarnings, type BLSDemographicEarning } from "@/hooks/use-bls-data";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  offeredSalary?: number;
}

interface BLSDemographicsCardProps extends Props {
  companyName?: string;
}

export function BLSDemographicsCard({ className, offeredSalary, companyName }: BLSDemographicsCardProps) {
  const { data: earnings, isLoading } = useDemographicEarnings();

  if (isLoading) {
    return (
      <Card className={className}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
    );
  }

  if (!earnings?.length) return null;

  // Get latest year's data, grouped by demographic_group
  const latestYear = earnings[0]?.data_year;
  const latest = earnings.filter(e => e.data_year === latestYear);

  // Deduplicate: keep only one entry per demographic_group + demographic_value
  const seen = new Set<string>();
  const byGroup: Record<string, BLSDemographicEarning[]> = {};
  for (const e of latest) {
    const key = `${e.demographic_group}::${e.demographic_value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    (byGroup[e.demographic_group] ??= []).push(e);
  }

  // Friendly group labels
  const groupLabels: Record<string, string> = {
    sex: "Gender",
    race: "Race & Ethnicity",
    age: "Age Group",
    education: "Education Level",
  };

  const maxEarning = Math.max(...latest.map(e => e.median_annual_earnings ?? 0), 1);

  return (
    <Card className={cn("border-[hsl(var(--civic-blue))]/15", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
          National Earnings Benchmarks
          <Badge variant="outline" className="text-[10px] ml-auto">{latestYear}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          U.S. median earnings by demographics — compare {companyName ? `${companyName}'s` : "company"} compensation against national data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(byGroup).map(([group, items]) => (
          <div key={group}>
            <p className="text-xs font-medium text-foreground mb-2">
              {groupLabels[group] || group.charAt(0).toUpperCase() + group.slice(1)}
            </p>
            <div className="space-y-2">
              {items.map(item => {
                const annual = item.median_annual_earnings ?? 0;
                const pct = (annual / maxEarning) * 100;
                return (
                  <div key={`${group}-${item.demographic_value}`} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.demographic_value}</span>
                      <span className="font-medium text-foreground">${annual.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--civic-blue))]/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {offeredSalary && (
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-[10px] text-muted-foreground">Your offered salary: <span className="font-bold text-foreground">${offeredSalary.toLocaleString()}</span></p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Source: BLS Current Population Survey (CPS). Full-time wage and salary workers. This is national benchmark data, not company-specific.
        </p>
      </CardContent>
    </Card>
  );
}
