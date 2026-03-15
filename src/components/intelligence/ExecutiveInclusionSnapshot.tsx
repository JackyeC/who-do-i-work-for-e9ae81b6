import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// BLS-sourced industry benchmarks (Fortune 500 averages, 2024)
const INDUSTRY_BENCHMARKS = {
  executive_team: { female_pct: 31, poc_pct: 22 },
  board: { female_pct: 33, poc_pct: 24 },
};

interface Props {
  companyId?: string;
  companyName: string;
}

interface DemoRow {
  leadership_level: string;
  total_count: number;
  female_count: number;
  male_count: number;
  white_count: number;
  black_count: number;
  hispanic_count: number;
  asian_count: number;
  other_race_count: number;
  report_year: number | null;
  source: string;
  confidence: string;
}

function GapIndicator({ value, benchmark, label }: { value: number; benchmark: number; label: string }) {
  const gap = value - benchmark;
  const isAbove = gap >= 0;
  const isClose = Math.abs(gap) <= 3;
  const Icon = isClose ? Minus : isAbove ? TrendingUp : TrendingDown;
  const color = isClose
    ? "text-muted-foreground"
    : isAbove
    ? "text-[hsl(var(--civic-green))]"
    : "text-[hsl(var(--civic-yellow))]";

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("w-3 h-3", color)} />
      <span className={cn("text-[10px] font-medium", color)}>
        {isClose ? "At benchmark" : `${Math.abs(gap)}pp ${isAbove ? "above" : "below"} benchmark`}
      </span>
    </div>
  );
}

function DemographicBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{pct}% ({value})</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ExecutiveInclusionSnapshot({ companyId, companyName }: Props) {
  const { data: demographics, isLoading } = useQuery({
    queryKey: ["leadership-demographics", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_leadership_demographics" as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("report_year", { ascending: false });
      return (data || []) as DemoRow[];
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  }

  // Group by leadership level, take latest year
  const levels = ["executive_team", "board"];
  const byLevel: Record<string, DemoRow | null> = {};
  for (const level of levels) {
    byLevel[level] = demographics?.find(d => d.leadership_level === level) || null;
  }

  const hasData = Object.values(byLevel).some(v => v !== null);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Executive Inclusion Snapshot
          {hasData && (
            <Badge variant="outline" className="text-[10px] ml-auto">
              {byLevel.executive_team?.source || "SEC/Public"}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Leadership composition vs. industry benchmarks
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasData ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">
              {companyName} has not disclosed leadership demographic data in scanned sources.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              This represents a transparency gap — not the absence of diversity.
            </p>
          </div>
        ) : (
          levels.map(level => {
            const row = byLevel[level];
            if (!row) return null;
            const benchmarks = INDUSTRY_BENCHMARKS[level as keyof typeof INDUSTRY_BENCHMARKS];
            const total = row.total_count || 1;
            const femalePct = Math.round((row.female_count / total) * 100);
            const pocCount = row.black_count + row.hispanic_count + row.asian_count + row.other_race_count;
            const pocPct = Math.round((pocCount / total) * 100);
            const levelLabel = level === "executive_team" ? "Executive Team" : "Board of Directors";

            return (
              <div key={level} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground">{levelLabel}</h4>
                  {row.report_year && (
                    <Badge variant="secondary" className="text-[9px]">{row.report_year}</Badge>
                  )}
                </div>

                {/* Summary metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                    <p className="text-lg font-bold text-foreground">{femalePct}%</p>
                    <p className="text-[10px] text-muted-foreground">Women</p>
                    <GapIndicator value={femalePct} benchmark={benchmarks.female_pct} label="women" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                    <p className="text-lg font-bold text-foreground">{pocPct}%</p>
                    <p className="text-[10px] text-muted-foreground">People of Color</p>
                    <GapIndicator value={pocPct} benchmark={benchmarks.poc_pct} label="poc" />
                  </div>
                </div>

                {/* Detailed breakdown */}
                <div className="space-y-1.5">
                  <DemographicBar label="White" value={row.white_count} total={total} color="bg-[hsl(var(--civic-blue))]/50" />
                  <DemographicBar label="Black / African American" value={row.black_count} total={total} color="bg-[hsl(var(--civic-green))]/60" />
                  <DemographicBar label="Hispanic / Latino" value={row.hispanic_count} total={total} color="bg-[hsl(var(--civic-yellow))]/60" />
                  <DemographicBar label="Asian" value={row.asian_count} total={total} color="bg-primary/50" />
                  <DemographicBar label="Other / Two+" value={row.other_race_count} total={total} color="bg-muted-foreground/40" />
                </div>

                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Badge variant="outline" className="text-[9px] px-1.5">
                    {row.confidence === "direct" ? "Strong Evidence" : "Inferred"}
                  </Badge>
                  <span>Industry benchmark: {benchmarks.female_pct}% women, {benchmarks.poc_pct}% PoC</span>
                </div>
              </div>
            );
          })
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Sources: SEC DEF 14A, company disclosures, Open Diversity Data. Benchmarks from Fortune 500 averages.
        </p>
      </CardContent>
    </Card>
  );
}
