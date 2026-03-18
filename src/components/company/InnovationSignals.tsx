import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, TrendingUp, TrendingDown, Minus, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyStateExplainer } from "./EmptyStateExplainer";

interface InnovationSignalsProps {
  companyId: string;
  companyName: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI & Machine Learning": "bg-purple-100 text-purple-700 border-purple-200",
  "Cybersecurity": "bg-red-100 text-red-700 border-red-200",
  "Healthcare": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cloud Computing": "bg-blue-100 text-blue-700 border-blue-200",
  "Energy & Sustainability": "bg-green-100 text-green-700 border-green-200",
  "Semiconductors": "bg-orange-100 text-orange-700 border-orange-200",
  "Communications": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Blockchain": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Autonomous Systems": "bg-amber-100 text-amber-700 border-amber-200",
  "User Interface": "bg-pink-100 text-pink-700 border-pink-200",
};

export function InnovationSignals({ companyId, companyName }: InnovationSignalsProps) {
  const [expanded, setExpanded] = useState(false);
  const [scanning, setScanning] = useState(false);

  const { data: patents, isLoading, refetch } = useQuery({
    queryKey: ["company-patents", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_patents")
        .select("*")
        .eq("company_id", companyId)
        .order("filing_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      await supabase.functions.invoke("scan-patents", {
        body: { companyId, companyName },
      });
      refetch();
    } finally {
      setScanning(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  // Calculate signals from patent data
  const total = patents?.length || 0;
  const categories: Record<string, number> = {};
  const yearCounts: Record<number, number> = {};

  patents?.forEach((p: any) => {
    const cat = p.category || "Other";
    categories[cat] = (categories[cat] || 0) + 1;
    if (p.filing_date) {
      const year = new Date(p.filing_date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });

  const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b - a);
  const years = Object.keys(yearCounts).map(Number).sort();
  const recentYear = years[years.length - 1];
  const prevYear = years[years.length - 2];
  const trend = recentYear && prevYear
    ? ((yearCounts[recentYear] - yearCounts[prevYear]) / yearCounts[prevYear]) * 100
    : null;

  // Generate signals
  const signals: { summary: string; confidence: string; recency: string }[] = [];

  if (total === 0) {
    // Show scan prompt
    return (
      <section className="mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
              <Badge variant="outline" className="text-xs ml-auto">Patents</Badge>
            </div>
            <EmptyStateExplainer type="jobs" />
            <p className="text-xs text-muted-foreground mt-2">
              No patent data yet. Scan to check USPTO records.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleScan}
              disabled={scanning}
              className="mt-3 text-xs h-7 gap-1.5"
            >
              {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              {scanning ? "Scanning patents…" : "Scan USPTO Records"}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Build intelligence signals
  if (trend !== null) {
    const direction = trend > 10 ? "increased" : trend < -10 ? "decreased" : "remained stable";
    const pct = Math.abs(Math.round(trend));
    signals.push({
      summary: `Patent filings ${direction}${pct > 0 ? ` ${pct}%` : ""} year-over-year${sortedCategories[0] ? `, led by ${sortedCategories[0][0]}` : ""}`,
      confidence: "High",
      recency: recentYear >= new Date().getFullYear() - 1 ? "Last 12 months" : "Last 2 years",
    });
  }

  if (sortedCategories.length > 0) {
    const topCats = sortedCategories.slice(0, 3).map(([c]) => c).join(", ");
    signals.push({
      summary: `Top innovation areas: ${topCats}`,
      confidence: "High",
      recency: "Current portfolio",
    });
  }

  if (total > 20) {
    signals.push({
      summary: `Active innovation portfolio with ${total} patents on file`,
      confidence: "High",
      recency: "Cumulative",
    });
  } else if (total > 0) {
    signals.push({
      summary: `${total} patent${total > 1 ? "s" : ""} detected — modest innovation footprint`,
      confidence: "Medium",
      recency: "Cumulative",
    });
  }

  const displayPatents = expanded ? patents : patents?.slice(0, 3);
  const TrendIcon = trend && trend > 10 ? TrendingUp : trend && trend < -10 ? TrendingDown : Minus;

  return (
    <section className="mb-6">
      <Card>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Innovation Signals</h3>
            <span className="text-xs text-muted-foreground ml-1">What they're building</span>
            <div className="ml-auto flex items-center gap-2">
              {trend !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
                  trend > 10 ? "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10" :
                  trend < -10 ? "text-destructive bg-destructive/10" :
                  "text-muted-foreground bg-muted"
                )}>
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(Math.round(trend))}% YoY
                </div>
              )}
              <Badge variant="outline" className="text-xs">{total} patents</Badge>
            </div>
          </div>

          {/* Signals */}
          <div className="space-y-2 mb-4">
            {signals.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="flex-1 text-foreground/85 leading-relaxed">{s.summary}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    s.confidence === "High" ? "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" :
                    "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]"
                  )}>
                    {s.confidence}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{s.recency}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sortedCategories.slice(0, 6).map(([cat, count]) => (
              <Badge
                key={cat}
                variant="outline"
                className={cn("text-xs gap-1", CATEGORY_COLORS[cat] || "bg-muted text-muted-foreground")}
              >
                {cat} ({count})
              </Badge>
            ))}
          </div>

          {/* Recent patents list */}
          <div className="border-t border-border/30 pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Filings</p>
            <div className="space-y-2">
              {displayPatents?.map((p: any) => (
                <div key={p.id} className="flex items-start gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{p.title}</p>
                    <p className="text-muted-foreground">
                      {p.filing_date && new Date(p.filing_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                      {p.category && ` · ${p.category}`}
                    </p>
                  </div>
                  {p.source_url && (
                    <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            {patents && patents.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs h-6 mt-2 gap-1 text-primary"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Show less" : `Show all ${patents.length} patents`}
              </Button>
            )}
          </div>

          {/* Refresh button */}
          <div className="border-t border-border/30 pt-3 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleScan}
              disabled={scanning}
              className="text-xs h-7 gap-1.5"
            >
              {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              {scanning ? "Refreshing…" : "Refresh Patent Data"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
