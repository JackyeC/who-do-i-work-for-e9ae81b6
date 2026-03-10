import { Users, AlertTriangle, TrendingDown, Briefcase, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TalentSignal {
  type: string;
  label: string;
  detail: string;
  severity?: "info" | "warning" | "critical";
  source?: string;
}

interface TalentContextProps {
  signals: TalentSignal[];
  jobFamilies?: string[];
  skillClusters?: string[];
  companyName: string;
}

export function TalentContextLayer({ signals, jobFamilies, skillClusters, companyName }: TalentContextProps) {
  return (
    <div className="space-y-5">
      {/* Job families & skills */}
      {((jobFamilies && jobFamilies.length > 0) || (skillClusters && skillClusters.length > 0)) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobFamilies && jobFamilies.length > 0 && (
            <div>
              <h4 className="text-caption font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Common Job Families
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {jobFamilies.map((jf, i) => <Badge key={i} variant="secondary" className="text-micro">{jf}</Badge>)}
              </div>
            </div>
          )}
          {skillClusters && skillClusters.length > 0 && (
            <div>
              <h4 className="text-caption font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Skill Clusters
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skillClusters.map((sc, i) => <Badge key={i} variant="outline" className="text-micro">{sc}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workforce signals */}
      {signals.length === 0 ? (
        <div className="text-center py-6">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-caption text-muted-foreground">No talent context signals available yet for {companyName}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map((signal, i) => {
            const icon = signal.severity === "critical" ? AlertTriangle : signal.severity === "warning" ? TrendingDown : Users;
            const Icon = icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${signal.severity === "critical" ? "text-destructive" : signal.severity === "warning" ? "text-civic-yellow" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <span className="font-medium text-foreground text-caption">{signal.label}</span>
                  <p className="text-caption text-muted-foreground mt-0.5">{signal.detail}</p>
                </div>
                {signal.source && <Badge variant="outline" className="text-micro shrink-0">{signal.source}</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
