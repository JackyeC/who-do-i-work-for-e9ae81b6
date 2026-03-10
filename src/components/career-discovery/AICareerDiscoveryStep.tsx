import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shuffle, Lightbulb, ArrowRight, Star } from "lucide-react";
import { DiscoveryLoadingState } from "./DiscoveryLoadingState";
import type { CareerDiscoveryData } from "@/hooks/use-career-discovery";

interface Props {
  data: CareerDiscoveryData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AICareerDiscoveryStep({ data, loading, error, onRetry }: Props) {
  return (
    <DiscoveryLoadingState loading={loading} error={error} onRetry={onRetry}>
      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Likely Career Paths
              </CardTitle>
              <p className="text-xs text-muted-foreground">Roles people with similar skills often move into.</p>
            </CardHeader>
            <CardContent>
              {data.likely.map((path, i) => (
                <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{path.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-primary">{path.to}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {path.skills.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-foreground">{path.confidence}%</div>
                    <div className="text-[10px] text-muted-foreground">match</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
                Adjacent Career Paths
              </CardTitle>
              <p className="text-xs text-muted-foreground">Roles that use similar skills but in different industries.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.adjacent.map((path, i) => (
                <div key={i} className="p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{path.role}</p>
                        <Badge variant="outline" className="text-[10px]">{path.industry}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{path.reason}</p>
                    </div>
                    <div className="text-lg font-bold text-[hsl(var(--civic-blue))] shrink-0">{path.match}%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--civic-gold))]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
                Unexpected Career Paths
              </CardTitle>
              <p className="text-xs text-muted-foreground">Roles you may not have considered but for which you are well suited.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.unexpected.map((path, i) => (
                <div key={i} className="p-4 rounded-xl bg-[hsl(var(--civic-gold-light))] border border-[hsl(var(--civic-gold))]/15">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-[hsl(var(--civic-gold))]" />
                        <p className="text-sm font-semibold text-foreground">{path.role}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{path.reason}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {path.skills.map(s => <Badge key={s} variant="outline" className="text-[10px] border-[hsl(var(--civic-gold))]/30">{s}</Badge>)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[hsl(var(--civic-gold))] shrink-0">{path.match}%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </DiscoveryLoadingState>
  );
}
