import { Lightbulb, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PatentCluster {
  theme: string;
  count: number;
  examples?: string[];
}

interface InnovationPatentsProps {
  totalPatents: number;
  clusters: PatentCluster[];
  companyName: string;
}

export function InnovationPatentsLayer({ totalPatents, clusters, companyName }: InnovationPatentsProps) {
  if (totalPatents === 0 && clusters.length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No patent or innovation data available yet for {companyName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalPatents > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/30">
          <div className="text-2xl font-bold text-foreground font-mono">{totalPatents.toLocaleString()}</div>
          <div className="text-caption text-muted-foreground">Total Patents Identified</div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {clusters.map((cluster, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground text-body">{cluster.theme}</h4>
                <Badge variant="outline" className="text-micro font-mono">{cluster.count}</Badge>
              </div>
              {cluster.examples && cluster.examples.length > 0 && (
                <ul className="text-caption text-muted-foreground space-y-1">
                  {cluster.examples.slice(0, 3).map((ex, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">·</span>{ex}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
