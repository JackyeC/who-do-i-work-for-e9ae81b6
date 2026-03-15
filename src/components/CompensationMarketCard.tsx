import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, RefreshCw, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  companyName: string;
  dbCompanyId?: string;
}

interface GradeData {
  grade_code: string;
  title: string;
  median_total_comp_usd: number;
}

interface RoleData {
  role: string;
  median_total_comp_usd: number;
}

interface SourceData {
  source_name: string;
  source_type: string;
  confidence: number;
  notes: string;
}

interface CompensationRecord {
  id: string;
  company: string;
  currency: string;
  median_total_compensation_usd: number | null;
  salary_by_grade: GradeData[] | null;
  top_roles: RoleData[] | null;
  source_summary: SourceData[] | null;
  last_updated: string | null;
  freshness_status: string | null;
}

const FRESHNESS_BADGE: Record<string, { label: string; className: string }> = {
  fresh: { label: "Fresh", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  stale: { label: "Stale", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  partial: { label: "Partial", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function formatUSD(val: number): string {
  return "$" + val.toLocaleString("en-US");
}

function GradeBar({ grade, maxComp }: { grade: GradeData; maxComp: number }) {
  const pct = maxComp > 0 ? Math.round((grade.median_total_comp_usd / maxComp) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate" title={grade.title}>
        {grade.title}
      </span>
      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-24 text-right">
        {formatUSD(grade.median_total_comp_usd)}
      </span>
    </div>
  );
}

export function CompensationMarketCard({ companyName, dbCompanyId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFetching, setIsFetching] = useState(false);

  const { data: compData, isLoading } = useQuery<CompensationRecord | null>({
    queryKey: ["compensation-market", companyName],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("compensation_data" as any)
        .select("*")
        .ilike("company", companyName)
        .maybeSingle() as any);
      if (error) throw error;
      return (data as CompensationRecord | null);
    },
    enabled: !!companyName,
  });

  const handleRefresh = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-company-compensation", {
        body: { company: companyName },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["compensation-market", companyName] });
      toast({ title: "Compensation data updated" });
    } catch (e: any) {
      console.error("Compensation fetch error:", e);
      toast({ title: "Error", description: "Could not refresh compensation data", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  };

  const freshness = compData?.freshness_status || "stale";
  const badge = FRESHNESS_BADGE[freshness] || FRESHNESS_BADGE.stale;
  const grades = (compData?.salary_by_grade || []) as GradeData[];
  const topRoles = ((compData?.top_roles || []) as RoleData[]).slice(0, 3);
  const sources = (compData?.source_summary || []) as SourceData[];
  const maxComp = grades.length > 0 ? Math.max(...grades.map((g) => g.median_total_comp_usd)) : 0;
  const isFailed = freshness === "failed";

  return (
    <Card className={cn(isFailed && "opacity-75")}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Compensation Market Position
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {isFetching ? "Estimating..." : "Refresh"}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          AI-estimated compensation ranges from H1B disclosures, industry benchmarks, and public filings.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !compData ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Compensation intelligence is being gathered for this company.</p>
            <p className="text-xs mt-1">Click Refresh to generate an AI estimate for {companyName}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Failed state banner */}
            {isFailed && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">
                  Compensation data temporarily unavailable — showing last known data from{" "}
                  {compData.last_updated || "unknown date"}.
                </p>
              </div>
            )}

            {/* Median Total Comp */}
            {compData.median_total_compensation_usd && (
              <div className="border border-border rounded-lg p-4 text-center bg-muted/30">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Median Total Compensation
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {formatUSD(compData.median_total_compensation_usd)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{compData.currency || "USD"} / year</div>
              </div>
            )}

            {/* Top Roles */}
            {topRoles.length > 0 && (
              <div className="border border-border rounded-lg p-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Top Paying Roles
                </div>
                <div className="space-y-2">
                  {topRoles.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{r.role}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatUSD(r.median_total_comp_usd)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade Bands */}
            {grades.length > 0 && (
              <div className="border border-border rounded-lg p-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  Compensation by Level
                </div>
                <div className="space-y-2">
                  {grades
                    .sort((a, b) => a.median_total_comp_usd - b.median_total_comp_usd)
                    .map((g, i) => (
                      <GradeBar key={i} grade={g} maxComp={maxComp} />
                    ))}
                </div>
              </div>
            )}

            {/* Freshness + Updated */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-[10px]", badge.className)}>
                {badge.label}
              </Badge>
              {compData.last_updated && (
                <span className="text-[10px] text-muted-foreground">
                  Updated: {new Date(compData.last_updated).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Source + Disclaimer */}
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-[10px] text-muted-foreground">
                Data sourced from H1B disclosure records (base salary), industry benchmarks, and AI estimation.
                {sources.length > 0 && (
                  <span>
                    {" "}Confidence:{" "}
                    {sources.map((s) => `${s.source_name} (${Math.round(s.confidence * 100)}%)`).join(", ")}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground italic">
                H1B data reflects base salary only and may understate total compensation. AI estimates are
                directional and should not be used for negotiation without additional verification.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
