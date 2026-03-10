import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, ExternalLink, Loader2, Search, Cpu, FlaskConical, Cog, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PatentCluster {
  theme: string;
  count: number;
  examples?: string[];
}

interface TopPatent {
  title: string;
  url?: string | null;
}

interface InnovationPatentsProps {
  totalPatents: number;
  clusters: PatentCluster[];
  companyName: string;
  companyId?: string;
}

// Map cluster themes to icons
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
  "bg-civic-blue/10 text-civic-blue border-civic-blue/20",
  "bg-civic-green/10 text-civic-green border-civic-green/20",
  "bg-civic-gold/10 text-civic-gold border-civic-gold/20",
  "bg-civic-red/10 text-civic-red border-civic-red/20",
  "bg-accent/10 text-accent-foreground border-accent/20",
];

export function InnovationPatentsLayer({ totalPatents, clusters, companyName, companyId }: InnovationPatentsProps) {
  const [scanTriggered, setScanTriggered] = useState(false);

  // Fetch patent intelligence from edge function
  const { data: patentData, isLoading, error } = useQuery({
    queryKey: ["patent-intelligence", companyName],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("patent-scan", {
        body: { companyName },
      });
      if (error) throw error;
      return data as { totalResults: number; clusters: PatentCluster[]; topPatents: TopPatent[] };
    },
    enabled: scanTriggered,
    staleTime: 1000 * 60 * 60, // cache 1 hour
  });

  // Merge static props with live data
  const displayClusters = patentData?.clusters || clusters;
  const displayTotal = patentData?.totalResults || totalPatents;
  const topPatents = patentData?.topPatents || [];
  const hasData = displayTotal > 0 || displayClusters.length > 0;

  if (!scanTriggered && !hasData) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground mb-4">
          No patent data loaded yet for {companyName}.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScanTriggered(true)}
          className="gap-2"
        >
          <Search className="w-4 h-4" /> Scan Google Patents
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-caption text-muted-foreground">Searching patents and clustering innovations…</p>
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
      {/* Total count banner */}
      {displayTotal > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/30">
          <div className="text-3xl font-bold text-foreground font-mono">{displayTotal.toLocaleString()}</div>
          <div>
            <div className="text-body font-semibold text-foreground">Patents Identified</div>
            <div className="text-micro text-muted-foreground">via Google Patents for "{companyName}"</div>
          </div>
          {!scanTriggered && (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => setScanTriggered(true)}>
              <Search className="w-3.5 h-3.5" /> Refresh
            </Button>
          )}
        </div>
      )}

      {/* Innovation Clusters */}
      {displayClusters.length > 0 && (
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
      )}

      {/* Top Patents List */}
      {topPatents.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground text-body mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-civic-gold" /> Top Patents
          </h4>
          <div className="space-y-2">
            {topPatents.slice(0, 5).map((patent, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                <span className="text-micro font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-caption text-foreground leading-relaxed">{patent.title}</p>
                </div>
                {patent.url && (
                  <a
                    href={patent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 shrink-0"
                  >
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
        <div className="text-center py-6 rounded-lg bg-muted/20">
          <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-caption text-muted-foreground">
            No patents found for {companyName}. This company may not hold patents or uses a different assignee name.
          </p>
        </div>
      )}
    </div>
  );
}
