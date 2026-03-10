import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shuffle, Sparkles, Building2, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryLoadingState } from "./DiscoveryLoadingState";
import type { MultipleFuturesData } from "@/hooks/use-career-discovery";

interface Props {
  data: MultipleFuturesData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const PATH_CONFIG = {
  expected: { icon: TrendingUp, color: "text-[hsl(var(--civic-green))]", border: "border-[hsl(var(--civic-green))]/20", bg: "bg-[hsl(var(--civic-green))]/5" },
  pivot: { icon: Shuffle, color: "text-[hsl(var(--civic-blue))]", border: "border-[hsl(var(--civic-blue))]/20", bg: "bg-[hsl(var(--civic-blue))]/5" },
  wildcard: { icon: Sparkles, color: "text-[hsl(var(--civic-gold))]", border: "border-[hsl(var(--civic-gold))]/20", bg: "bg-[hsl(var(--civic-gold-light))]" },
};

export function MultipleFuturesStep({ data, loading, error, onRetry }: Props) {
  return (
    <DiscoveryLoadingState loading={loading} error={error} onRetry={onRetry} lines={10}>
      {data && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
            Three possible future paths based on your profile, skills, and career anchors. Each represents a different level of change.
          </p>

          {data.futures.map(future => {
            const config = PATH_CONFIG[future.type] || PATH_CONFIG.expected;
            const Icon = config.icon;
            return (
              <Card key={future.type} className={cn("border", config.border)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{future.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{future.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Role Progression
                    </p>
                    <p className="text-sm font-medium text-foreground">{future.roles}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Skills Needed
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {future.skills.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Companies to Watch
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {future.companies.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{future.timeline}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DiscoveryLoadingState>
  );
}
