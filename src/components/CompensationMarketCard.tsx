import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, RefreshCw, Loader2, TrendingUp, AlertTriangle, Info, Bot } from "lucide-react";
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

// --- Source hierarchy labels (ordered by confidence) ---
const SOURCE_HIERARCHY = [
  { key: "levels_fyi", label: "Levels.fyi", tier: "High" },
  { key: "glassdoor", label: "Glassdoor", tier: "Medium" },
  { key: "apify", label: "Apify/Glassdoor", tier: "Medium" },
  { key: "h1b", label: "H1B Filings", tier: "Medium" },
  { key: "ai_estimation", label: "AI Estimation", tier: "Low" },
];

const FRESHNESS_BADGE: Record<string, { label: string; className: string }> = {
  fresh: { label: "Fresh", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  stale: { label: "Stale", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  partial: { label: "Partial", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  High: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  Medium: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  Low: "bg-destructive/10 text-destructive border-destructive/30",
};

/** Round to nearest $1,000 and format as $XK */
function formatUSDRounded(val: number): string {
  const rounded = Math.round(val / 1000) * 1000;
  if (rounded >= 1000) return `$${Math.round(rounded / 1000)}K`;
  return `$${rounded.toLocaleString("en-US")}`;
}

/** Check if data is older than 90 days */
function isStaleData(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const diff = Date.now() - new Date(lastUpdated).getTime();
  return diff > 90 * 24 * 60 * 60 * 1000;
}

/** Determine if all sources are AI-only */
function isAIOnly(sources: SourceData[]): boolean {
  if (sources.length === 0) return true;
  return sources.every(
    (s) => s.source_type === "ai_estimation" || s.source_name.toLowerCase().includes("ai")
  );
}

/** Determine overall confidence tier */
function getOverallConfidence(sources: SourceData[]): string {
  if (sources.length === 0) return "Low";
  const maxConf = Math.max(...sources.map((s) => s.confidence));
  if (maxConf >= 0.8) return "High";
  if (maxConf >= 0.5) return "Medium";
  return "Low";
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
        {formatUSDRounded(grade.median_total_comp_usd)}
      </span>
    </div>
  );
}

/** Shared compensation disclaimer for use in exports too */
export const COMPENSATION_DISCLAIMER =
  "Compensation data comes from third-party sources and may include AI estimates. Actual offers vary by role, level, location, and negotiation. H1B data reflects base salary only and excludes bonus or equity.";

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
  const staleWarning = compData ? isStaleData(compData.last_updated) : false;
  const aiOnly = isAIOnly(sources);
  const overallConfidence = getOverallConfidence(sources);

  return (
    <Card className={cn(isFailed && "opacity-75")}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Compensation Market Position
          {/* Confidence badge */}
          <Badge variant="outline" className={cn("text-[9px] ml-1", CONFIDENCE_COLORS[overallConfidence])}>
            {overallConfidence} Confidence
          </Badge>
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
          Market-corrected compensation intelligence from verified and estimated sources.
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

            {/* Freshness warning (>90 days) */}
            {staleWarning && !isFailed && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0" />
                <p className="text-xs text-[hsl(var(--civic-yellow))]">
                  Compensation data may be outdated. Refresh to view updated market estimates.
                </p>
              </div>
            )}

            {/* AI-only estimate badge */}
            {aiOnly && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">
                  AI Estimated — Not Verified by External Source
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
                  {formatUSDRounded(compData.median_total_compensation_usd)}
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
                        {formatUSDRounded(r.median_total_comp_usd)}
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

            {/* Source transparency */}
            {sources.length > 0 && (
              <div className="border border-border rounded-lg p-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Sources
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((s, i) => {
                    const tier = SOURCE_HIERARCHY.find(
                      (h) => s.source_name.toLowerCase().includes(h.key) || s.source_type === h.key
                    );
                    return (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          "text-[9px]",
                          tier ? CONFIDENCE_COLORS[tier.tier] : "text-muted-foreground"
                        )}
                      >
                        {s.source_name} ({Math.round(s.confidence * 100)}%)
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Required disclaimer */}
            <div className="border-t border-border pt-3">
              <div className="flex items-start gap-1.5">
                <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {COMPENSATION_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
