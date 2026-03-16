import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio, TrendingUp, Minus, TrendingDown, AlertCircle } from "lucide-react";

interface MediaNarrativeCardProps {
  companyId: string;
  companyName: string;
}

interface NewsItem {
  headline: string;
  sentiment_score: number | null;
  tone_label: string | null;
  is_controversy: boolean | null;
  controversy_type: string | null;
  published_at: string | null;
}

export function MediaNarrativeCard({ companyId, companyName }: MediaNarrativeCardProps) {
  // Use work_news which is the actual table in the schema
  const { data: newsItems } = useQuery({
    queryKey: ["media-narrative", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_news")
        .select("headline, sentiment_score, tone_label, is_controversy, controversy_type, published_at")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!newsItems?.length) {
    return (
      <div className="bg-card border border-border">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Radio className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
            Media Narrative
          </span>
        </div>
        <div className="p-6 text-center">
          <span className="font-mono text-xs text-muted-foreground">
            Intelligence Gathering in Progress...
          </span>
          <p className="text-xs text-muted-foreground/70 mt-1">
            We are verifying the receipts to ensure 100% accuracy.
          </p>
        </div>
      </div>
    );
  }

  const positive = newsItems.filter((s) => (s.sentiment_score ?? 0) > 0.3).length;
  const neutral = newsItems.filter((s) => {
    const sc = s.sentiment_score ?? 0;
    return sc >= -0.3 && sc <= 0.3;
  }).length;
  const negative = newsItems.filter((s) => (s.sentiment_score ?? 0) < -0.3).length;
  const total = newsItems.length;

  const pctPos = total ? Math.round((positive / total) * 100) : 0;
  const pctNeu = total ? Math.round((neutral / total) * 100) : 0;
  const pctNeg = total ? Math.round((negative / total) * 100) : 0;

  const controversies = newsItems.filter((s) => s.is_controversy).slice(0, 3);

  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Radio className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
          Media Narrative
        </span>
      </div>
      <div className="p-5">
        {/* Sentiment bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          {pctPos > 0 && <div className="bg-primary" style={{ width: `${pctPos}%` }} />}
          {pctNeu > 0 && <div className="bg-muted-foreground/30" style={{ width: `${pctNeu}%` }} />}
          {pctNeg > 0 && <div className="bg-destructive" style={{ width: `${pctNeg}%` }} />}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <div className="font-mono text-lg font-bold text-foreground tabular-nums">{pctPos}%</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground">Positive</div>
          </div>
          <div className="text-center">
            <Minus className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
            <div className="font-mono text-lg font-bold text-foreground tabular-nums">{pctNeu}%</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground">Neutral</div>
          </div>
          <div className="text-center">
            <TrendingDown className="w-3.5 h-3.5 text-destructive mx-auto mb-1" />
            <div className="font-mono text-lg font-bold text-foreground tabular-nums">{pctNeg}%</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground">Negative</div>
          </div>
        </div>

        {controversies.length > 0 && (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Recent Controversies
            </div>
            {controversies.map((c, i) => (
              <div key={i} className="text-xs text-foreground border-l-2 border-destructive/50 pl-2.5 py-0.5">
                {c.headline}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
