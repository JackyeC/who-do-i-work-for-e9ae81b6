import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchPatentData,
  calculateInnovationSignal,
  getPatentGoogleLink,
  getSignalDotColor,
  type PatentScanResult,
} from "@/lib/patent-utils";

interface InnovationSignalsProps {
  companyId: string;
  companyName: string;
}

export function InnovationSignals({ companyId, companyName }: InnovationSignalsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["patent-scan", companyName, companyId],
    queryFn: () => fetchPatentData(companyName, companyId),
    enabled: !!companyName,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  // Ticker integration — upsert notable patent activity
  useEffect(() => {
    if (!data || !companyId || data.totalResults < 100) return;
    const recentCount = data.signals?.patent_count_12m ?? 0;
    let message = "";
    if (data.totalResults >= 100) {
      message = `${companyName}: ${data.totalResults.toLocaleString()} USPTO patents on record — active IP portfolio · PatentsView`;
    }
    if (recentCount >= 5) {
      message = `${companyName}: ${recentCount} new patents filed in 12 months — R&D signal · USPTO`;
    }
    if (!message) return;

    supabase
      .from("ticker_items" as any)
      .upsert(
        {
          company_name: companyName,
          message,
          source_tag: "USPTO",
          item_type: "innovation",
          is_hidden: false,
        } as any,
        { onConflict: "company_name,item_type" as any }
      )
      .then(() => {});
  }, [data, companyId, companyName]);

  if (isLoading) {
    return (
      <section className="mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <p className="text-xs text-muted-foreground mt-2">Checking USPTO records…</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              USPTO data temporarily unavailable — check back shortly
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const totalCount = data.totalResults || 0;
  const recentCount = data.signals?.patent_count_36m ?? 0;
  const signal = calculateInnovationSignal(totalCount, recentCount);
  const dotColor = getSignalDotColor(signal.level);
  const topPatents = data.topPatents || [];

  if (totalCount === 0) {
    return (
      <section className="mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
              <div className="ml-auto flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", dotColor)} />
                <span className="text-xs text-muted-foreground">{signal.label}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              No patents found under "{companyName}". Large companies often file under subsidiaries.{" "}
              <a
                href="https://patentsview.org/search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
              >
                Search USPTO directly <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-3">
              Source: USPTO PatentsView · Public record
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <Card>
        <CardContent className="p-5">
          {/* Header with signal pill */}
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50">
                <span className={cn("w-2 h-2 rounded-full", dotColor)} />
                <span className="text-xs font-medium text-foreground">{signal.label}</span>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {totalCount.toLocaleString()} patents
              </Badge>
            </div>
          </div>

          {/* Signal description */}
          <p className="text-sm text-foreground/85 leading-relaxed mb-4">
            {signal.description}
          </p>

          {/* Counts */}
          <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
            <span>{totalCount.toLocaleString()} total USPTO patents</span>
            <span>·</span>
            <span>{recentCount} filed in last 3 years</span>
          </div>

          {/* Clusters */}
          {data.clusters && data.clusters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {data.clusters.slice(0, 6).map((c, i) => (
                <Badge key={i} variant="outline" className="text-xs gap-1">
                  {c.theme} ({c.count})
                </Badge>
              ))}
            </div>
          )}

          {/* Recent filings */}
          {topPatents.length > 0 && (
            <div className="border-t border-border/30 pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Most Recent Filings</p>
              <div className="space-y-2">
                {topPatents.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium leading-relaxed line-clamp-2">
                        {p.title}
                      </p>
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source + view all */}
          <div className="border-t border-border/30 pt-3 mt-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground/60">
              Source: USPTO PatentsView · Public record
              {data.cached && (
                <Badge variant="outline" className="ml-2 text-[10px]">Cached</Badge>
              )}
            </p>
            <a
              href={`https://patentsview.org/search#q=${encodeURIComponent(companyName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              View all on USPTO <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
