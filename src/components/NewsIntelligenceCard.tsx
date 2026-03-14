import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, AlertTriangle, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

function sentimentColor(score: number) {
  if (score >= 1.5) return "text-[hsl(var(--civic-green))]";
  if (score <= -1.5) return "text-destructive";
  return "text-muted-foreground";
}

function sentimentBg(score: number) {
  if (score >= 1.5) return "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20";
  if (score <= -1.5) return "bg-destructive/10 border-destructive/20";
  return "bg-muted/50 border-border";
}

export function NewsIntelligenceCard({ companyId, companyName }: Props) {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["news-signals", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_news_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("published_at", { ascending: false })
        .limit(15);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (isLoading || !signals?.length) return null;

  const controversies = signals.filter((s: any) => s.is_controversy);
  const avgTone = signals.reduce((a: number, s: any) => a + (Number(s.sentiment_score) || 0), 0) / signals.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Newspaper className="w-4 h-4" />
          News Intelligence
          {controversies.length > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-auto">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {controversies.length} Controvers{controversies.length === 1 ? "y" : "ies"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sentiment summary */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          {avgTone >= 0 ? (
            <TrendingUp className={cn("w-5 h-5", sentimentColor(avgTone))} />
          ) : (
            <TrendingDown className={cn("w-5 h-5", sentimentColor(avgTone))} />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              Overall Tone: <span className={sentimentColor(avgTone)}>
                {avgTone >= 1.5 ? "Positive" : avgTone <= -1.5 ? "Negative" : "Neutral"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Based on {signals.length} recent articles (90 days)</p>
          </div>
        </div>

        {/* Article list */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {signals.slice(0, 10).map((s: any) => (
            <div key={s.id} className={cn("p-2.5 rounded-lg border text-sm", sentimentBg(Number(s.sentiment_score) || 0))}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm leading-snug truncate">{s.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {s.source_name && <span className="text-[10px] text-muted-foreground">{s.source_name}</span>}
                    {s.published_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {s.is_controversy && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                        {s.controversy_type || "controversy"}
                      </Badge>
                    )}
                  </div>
                </div>
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Source: GDELT Global News Database • Sentiment analysis via GDELT tone scoring
        </p>
      </CardContent>
    </Card>
  );
}
