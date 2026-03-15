import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Info, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

interface EEO1Row {
  job_category: string;
  total_employees: number;
  male_count: number;
  female_count: number;
  white_count: number;
  black_count: number;
  hispanic_count: number;
  asian_count: number;
  native_american_count: number;
  pacific_islander_count: number;
  two_or_more_races_count: number;
  report_year: number;
  source: string;
  source_url: string | null;
}

const RACE_COLORS: Record<string, string> = {
  White: "bg-[hsl(var(--civic-blue))]/40",
  "Black / African American": "bg-[hsl(var(--civic-green))]/50",
  "Hispanic / Latino": "bg-[hsl(var(--civic-yellow))]/50",
  Asian: "bg-primary/40",
  "Native American": "bg-accent/60",
  "Pacific Islander": "bg-secondary/60",
  "Two+ Races": "bg-muted-foreground/30",
};

const JOB_CATEGORY_ORDER = [
  "Executive/Senior Officials",
  "First/Mid-Level Managers",
  "Professionals",
  "Technicians",
  "Sales Workers",
  "Administrative Support",
  "Craft Workers",
  "Operatives",
  "Laborers",
  "Service Workers",
  "Total",
];

export function EEO1WorkforceCard({ companyId, companyName }: Props) {
  const { data: eeo1Data, isLoading } = useQuery({
    queryKey: ["eeo1-data", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_eeo1_data" as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("report_year", { ascending: false });
      return (data || []) as unknown as EEO1Row[];
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  }

  // Get latest year
  const latestYear = eeo1Data?.[0]?.report_year;
  const latestData = eeo1Data?.filter(d => d.report_year === latestYear) || [];

  // Sort by job category order
  const sorted = [...latestData].sort((a, b) => {
    const ai = JOB_CATEGORY_ORDER.findIndex(c => a.job_category.includes(c));
    const bi = JOB_CATEGORY_ORDER.findIndex(c => b.job_category.includes(c));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const hasData = sorted.length > 0;

  // Compute totals for summary
  const totals = sorted.reduce(
    (acc, row) => ({
      total: acc.total + row.total_employees,
      female: acc.female + row.female_count,
      white: acc.white + row.white_count,
      black: acc.black + row.black_count,
      hispanic: acc.hispanic + row.hispanic_count,
      asian: acc.asian + row.asian_count,
    }),
    { total: 0, female: 0, white: 0, black: 0, hispanic: 0, asian: 0 }
  );

  const pct = (n: number) => (totals.total > 0 ? Math.round((n / totals.total) * 100) : 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          EEO-1 Workforce Demographics
          {hasData && (
            <Badge variant="outline" className="text-[10px] ml-auto">{latestYear}</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          EEOC-mandated workforce composition by job category, race, and gender
        </p>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-6">
            <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">
              {companyName} has not publicly disclosed EEO-1 workforce data.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              Companies with 100+ employees are required to file — non-disclosure is itself a signal.
            </p>
            <a
              href="https://www.opendiversitydata.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
            >
              Check Open Diversity Data <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Women", value: `${pct(totals.female)}%` },
                { label: "Black", value: `${pct(totals.black)}%` },
                { label: "Hispanic", value: `${pct(totals.hispanic)}%` },
                { label: "Asian", value: `${pct(totals.asian)}%` },
              ].map(m => (
                <div key={m.label} className="text-center p-2 rounded-lg bg-muted/40 border border-border/30">
                  <p className="text-base font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Job category breakdown */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">By Job Category</h4>
              {sorted.map(row => {
                const t = row.total_employees || 1;
                const segments = [
                  { label: "White", count: row.white_count, color: RACE_COLORS.White },
                  { label: "Black / African American", count: row.black_count, color: RACE_COLORS["Black / African American"] },
                  { label: "Hispanic / Latino", count: row.hispanic_count, color: RACE_COLORS["Hispanic / Latino"] },
                  { label: "Asian", count: row.asian_count, color: RACE_COLORS.Asian },
                  { label: "Other", count: row.native_american_count + row.pacific_islander_count + row.two_or_more_races_count, color: RACE_COLORS["Two+ Races"] },
                ];

                return (
                  <div key={row.job_category}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-foreground font-medium truncate">{row.job_category}</span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                        {row.total_employees} • {Math.round((row.female_count / t) * 100)}% F
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden flex">
                      {segments.map(seg => (
                        <div
                          key={seg.label}
                          className={cn("h-full transition-all", seg.color)}
                          style={{ width: `${(seg.count / t) * 100}%` }}
                          title={`${seg.label}: ${Math.round((seg.count / t) * 100)}%`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-1">
              {Object.entries(RACE_COLORS).slice(0, 5).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={cn("w-2.5 h-2.5 rounded-sm", color)} />
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
              Source: EEOC EEO-1 filings. Companies with 100+ employees must file annually.
              {sorted[0]?.source_url && (
                <a href={sorted[0].source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  View source <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
