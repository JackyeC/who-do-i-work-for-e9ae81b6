import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, TrendingDown, CheckCircle2, Info, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

const DISCLOSURE_TYPES = [
  { key: "eeo1_report", label: "EEO-1 Report" },
  { key: "diversity_report", label: "Diversity & Inclusion Report" },
  { key: "pay_equity_audit", label: "Pay Equity Audit" },
  { key: "esg_report", label: "ESG Report" },
  { key: "workforce_demographics", label: "Workforce Demographics" },
];

export function DiversityDisclosureTracker({ companyId, companyName }: Props) {
  const { data: disclosures, isLoading } = useQuery({
    queryKey: ["diversity-disclosures", companyId],
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

  if (isLoading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  if (!companyId) return null;

  // Build disclosure history per type
  const byType: Record<string, { years: { year: number; published: boolean; url?: string }[] }> = {};
  for (const dt of DISCLOSURE_TYPES) {
    const typeRecords = disclosures?.filter((d: any) => d.disclosure_type === dt.key) || [];
    byType[dt.key] = {
      years: typeRecords.map((r: any) => ({ year: r.year, published: r.is_published, url: r.report_url })),
    };
  }

  const hasAnyData = disclosures && disclosures.length > 0;

  // Detect declining transparency
  const decliningTypes = DISCLOSURE_TYPES.filter(dt => {
    const years = byType[dt.key].years;
    if (years.length < 2) return false;
    return !years[0].published && years[1].published;
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Diversity Disclosure Tracker
          </CardTitle>
          {decliningTypes.length > 0 && (
            <Badge variant="outline" className="text-xs text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20">
              <TrendingDown className="w-3 h-3 mr-1" />
              Transparency Declining
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Tracks whether {companyName} publicly discloses workforce and equity data
        </p>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="text-center py-5">
            <EyeOff className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">
              No diversity disclosure history tracked for {companyName}.
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              Non-disclosure is itself a transparency signal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {DISCLOSURE_TYPES.map(dt => {
              const data = byType[dt.key];
              const latestYear = data.years[0];
              const isDeclining = decliningTypes.includes(dt);

              if (data.years.length === 0) {
                return (
                  <div key={dt.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-muted/20">
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground">{dt.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">Not tracked</Badge>
                  </div>
                );
              }

              return (
                <div
                  key={dt.key}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border",
                    isDeclining
                      ? "border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/5"
                      : latestYear?.published
                      ? "border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/5"
                      : "border-border/30 bg-muted/20"
                  )}
                >
                  {isDeclining ? (
                    <TrendingDown className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))] shrink-0" />
                  ) : latestYear?.published ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))] shrink-0" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-foreground">{dt.label}</span>
                    {isDeclining && (
                      <p className="text-xs text-[hsl(var(--civic-yellow))]">Previously published — now stopped</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {data.years.slice(0, 4).map(y => (
                      <div
                        key={y.year}
                        title={`${y.year}: ${y.published ? "Published" : "Not published"}`}
                        className={cn(
                          "w-5 h-5 rounded text-xs font-mono flex items-center justify-center border",
                          y.published
                            ? "bg-[hsl(var(--civic-green))]/15 border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]"
                            : "bg-muted/50 border-border/40 text-muted-foreground"
                        )}
                      >
                        {String(y.year).slice(-2)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-3">
          Sources: Company websites, SEC filings, Open Diversity Data, ESG reports.
          Many companies have reduced diversity reporting since 2023 — declining transparency is tracked as a signal.
        </p>
      </CardContent>
    </Card>
  );
}
