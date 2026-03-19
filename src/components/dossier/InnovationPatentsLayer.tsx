import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, ExternalLink, Loader2, Search, Cpu, FlaskConical, Cog, BarChart3, Lock, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";
import { IntelligenceEmptyState } from "@/components/intelligence/IntelligenceEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PatentCluster {
  theme: string;
  count: number;
  examples?: string[];
}

interface TopPatent {
  title: string;
  url?: string | null;
}

interface IpSignals {
  patent_count_12m: number;
  patent_count_36m: number;
  patent_trend: string;
  trademark_count_12m: number;
  trademark_trend: string;
  ownership_change_flag: boolean;
  innovation_signal_score: number;
  expansion_signal_score: number;
  ip_complexity_score: number;
  top_cpc_categories?: string[];
}

interface InnovationPatentsProps {
  totalPatents: number;
  clusters: PatentCluster[];
  companyName: string;
  companyId?: string;
  unlocked?: boolean;
}

const clusterIcons: Record<string, React.ElementType> = {
  "Artificial Intelligence": Cpu,
  "Machine Learning": Cpu,
  "Biotech": FlaskConical,
  "Data Analytics": BarChart3,
  "Manufacturing": Cog,
};

function getClusterIcon(theme: string) {
  for (const [key, Icon] of Object.entries(clusterIcons)) {
    if (theme.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Lightbulb;
}

const clusterColors = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20",
  "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
  "bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20",
  "bg-destructive/10 text-destructive border-destructive/20",
  "bg-accent text-accent-foreground border-accent/20",
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-[hsl(var(--civic-green))]" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function trendLabel(trend: string) {
  if (trend === 'rising') return 'Rising';
  if (trend === 'declining') return 'Declining';
  if (trend === 'flat') return 'Stable';
  return 'Unknown';
}

export function InnovationPatentsLayer({ totalPatents, clusters, companyName, companyId, unlocked = true }: InnovationPatentsProps) {
  const [scanTriggered, setScanTriggered] = useState(false);

  const { data: scanData, isLoading, error } = useQuery({
    queryKey: ["uspto-scan", companyName, companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("uspto-scan", {
        body: { companyName, companyId },
      });
      if (error) throw error;
      return data as {
        cached: boolean;
        usedFallback?: boolean;
        signals: IpSignals;
        clusters: PatentCluster[];
        topPatents: TopPatent[];
        totalResults: number;
      };
    },
    enabled: scanTriggered,
    staleTime: 1000 * 60 * 60,
  });

  const displayClusters = scanData?.clusters || clusters;
  const displayTotal = scanData?.totalResults || totalPatents;
  const topPatents = scanData?.topPatents || [];
  const signals = scanData?.signals;
  const hasData = displayTotal > 0 || displayClusters.length > 0;

  if (!scanTriggered && !hasData) {
    return (
      <IntelligenceEmptyState category="patents" state="before">
        <Button variant="outline" size="sm" onClick={() => setScanTriggered(true)} className="gap-2">
          <Search className="w-4 h-4" /> Check what they're actually building
        </Button>
      </IntelligenceEmptyState>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-caption text-muted-foreground">Resolving company entities & scanning USPTO records…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="w-8 h-8 text-destructive/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">Unable to load patent data. Try again later.</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setScanTriggered(true)}>
          <Search className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Signal Summary Banner */}
      {signals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SignalCard label="Patents (12m)" value={signals.patent_count_12m} trend={signals.patent_trend} />
          <SignalCard label="Patents (3yr)" value={signals.patent_count_36m} />
          <SignalCard label="Innovation Score" value={signals.innovation_signal_score} suffix="/100" />
          <SignalCard label="IP Complexity" value={signals.ip_complexity_score} suffix="/100" />
        </div>
      )}

      {/* Total count banner */}
      {displayTotal > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/30">
          <div className="text-3xl font-bold text-foreground font-mono">{displayTotal.toLocaleString()}</div>
          <div>
            <div className="text-body font-semibold text-foreground">Patents Identified</div>
            <div className="text-micro text-muted-foreground">
              via {scanData?.usedFallback ? 'Google Patents (fallback)' : 'USPTO PatentsView'} for "{companyName}"
              {scanData?.cached && <Badge variant="outline" className="ml-2 text-micro">Cached</Badge>}
            </div>
          </div>
          {!scanTriggered && (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => setScanTriggered(true)}>
              <Search className="w-3.5 h-3.5" /> Refresh
            </Button>
          )}
        </div>
      )}

      {/* Ownership change flag */}
      {signals?.ownership_change_flag && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <Shield className="w-4 h-4 text-destructive" />
          <p className="text-caption text-foreground">Ownership changes detected — recent patent or trademark assignments found.</p>
        </div>
      )}

      {/* Innovation Clusters */}
      {displayClusters.length > 0 && (
        <div className="relative">
          {!unlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-card/60 backdrop-blur-md">
              <Lock className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Innovation Clusters</p>
              <p className="text-micro text-muted-foreground mt-1">Track this company to unlock</p>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground text-body mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Innovation Clusters
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {displayClusters.map((cluster, i) => {
                const Icon = getClusterIcon(cluster.theme);
                const color = clusterColors[i % clusterColors.length];
                return (
                  <Card key={i} className="border-border/30 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.split(" ")[0]}`}>
                          <Icon className={`w-4 h-4 ${color.split(" ")[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-foreground text-caption truncate">{cluster.theme}</h5>
                        </div>
                        <Badge variant="outline" className="text-micro font-mono shrink-0">{cluster.count}</Badge>
                      </div>
                      {cluster.examples && cluster.examples.length > 0 && (
                        <ul className="text-micro text-muted-foreground space-y-1.5 pl-1">
                          {cluster.examples.slice(0, 3).map((ex, j) => (
                            <li key={j} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-primary mt-0.5 shrink-0">·</span>
                              <span className="line-clamp-2">{ex}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Patents List */}
      {topPatents.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground text-body mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-gold))]" /> Top Patents
          </h4>
          <div className="space-y-2">
            {topPatents.slice(0, 5).map((patent, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                <span className="text-micro font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-caption text-foreground leading-relaxed">{patent.title}</p>
                </div>
                {patent.url && (
                  <a href={patent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results after scan */}
      {scanTriggered && !isLoading && displayTotal === 0 && (
        <IntelligenceEmptyState category="patents" state="after" />
      )}
    </div>
  );
}

// ── Signal Card sub-component ─────────────────────────────────────────

function SignalCard({ label, value, trend, suffix }: { label: string; value: number; trend?: string; suffix?: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
      <p className="text-micro text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold font-mono text-foreground">{value}{suffix}</span>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendIcon trend={trend} />
            <span className="text-micro text-muted-foreground">{trendLabel(trend)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
