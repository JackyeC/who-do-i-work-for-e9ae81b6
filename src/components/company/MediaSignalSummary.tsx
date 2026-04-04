import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Radio, TrendingUp, TrendingDown, Minus, ExternalLink,
  ShieldCheck, AlertTriangle, Eye, Tag, ChevronDown, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IntelligenceEmptyState } from "@/components/intelligence/IntelligenceEmptyState";

/* ─── Types ─── */
interface Props {
  companyId: string;
  companyName: string;
}

type TimeWindow = "6m" | "12m" | "all";

interface NewsSignal {
  id: string;
  headline: string;
  sentiment_score: number | null;
  tone_label: string | null;
  is_controversy: boolean | null;
  controversy_type: string | null;
  themes: string[] | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
}

const TIME_LABELS: Record<TimeWindow, string> = {
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  all: "All time",
};

function getDateCutoff(window: TimeWindow): string | null {
  if (window === "all") return null;
  const d = new Date();
  d.setMonth(d.getMonth() - (window === "6m" ? 6 : 12));
  return d.toISOString();
}

/* ─── Theme categorization ─── */
const THEME_MAP: Record<string, string> = {
  layoff: "Layoffs",
  layoffs: "Layoffs",
  restructuring: "Layoffs",
  "job cuts": "Layoffs",
  lawsuit: "Legal Risk",
  legal: "Legal Risk",
  litigation: "Legal Risk",
  settlement: "Legal Risk",
  growth: "Growth",
  revenue: "Growth",
  expansion: "Growth",
  profit: "Growth",
  earnings: "Growth",
  ceo: "Leadership Change",
  executive: "Leadership Change",
  leadership: "Leadership Change",
  resign: "Leadership Change",
  appoint: "Leadership Change",
  culture: "Culture Signals",
  dei: "Culture Signals",
  diversity: "Culture Signals",
  inclusion: "Culture Signals",
  toxic: "Culture Signals",
  harassment: "Culture Signals",
  safety: "Safety",
  osha: "Safety",
  accident: "Safety",
  injury: "Safety",
  union: "Labor",
  strike: "Labor",
  wage: "Labor",
  workers: "Labor",
};

function categorizeThemes(themes: string[]): string {
  const lower = themes.join(" ").toLowerCase();
  for (const [keyword, category] of Object.entries(THEME_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "Other";
}

/* ─── Confidence logic ─── */
function getConfidence(count: number, total: number): { label: string; color: string } {
  const ratio = total > 0 ? count / total : 0;
  if (count >= 3 && ratio >= 0.15)
    return { label: "High", color: "text-[hsl(var(--civic-green))]" };
  if (count >= 2)
    return { label: "Medium", color: "text-[hsl(var(--civic-yellow))]" };
  return { label: "Low", color: "text-muted-foreground" };
}

/* ─── Overall tone ─── */
function deriveOverallTone(items: NewsSignal[]): { label: string; icon: typeof TrendingUp; color: string } {
  if (items.length === 0) return { label: "No Data", icon: Minus, color: "text-muted-foreground" };
  const avg = items.reduce((s, i) => s + (i.sentiment_score ?? 0), 0) / items.length;
  if (avg > 0.15) return { label: "Positive", icon: TrendingUp, color: "text-[hsl(var(--civic-green))]" };
  if (avg < -0.15) return { label: "Negative", icon: TrendingDown, color: "text-destructive" };
  return { label: "Mixed", icon: Minus, color: "text-[hsl(var(--civic-yellow))]" };
}

/* ─── Synthesis generation ─── */
function generateSynthesis(
  tagCounts: Map<string, number>,
  tone: { label: string },
  companyName: string,
  total: number
): { whatsHappening: string; whatItMeans: string } {
  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topTags = sorted.slice(0, 3).map(([tag]) => tag);

  if (total === 0) {
    return {
      whatsHappening: `No significant media signals detected for ${companyName} in this period. That's not necessarily good or bad — it means there's limited public signal to read.`,
      whatItMeans: "No news isn't always good news. It can also mean low transparency. If you're evaluating this employer, look at other signal categories.",
    };
  }

  const themes = topTags.join(", ").toLowerCase();
  const direction =
    tone.label === "Positive" ? "trending positively" :
    tone.label === "Negative" ? "showing signs of stress" :
    "sending mixed signals";

  const whatsHappening = topTags.length > 1
    ? `Coverage of ${companyName} centers on ${themes}. The overall narrative is ${direction}. ${
        topTags.includes("Layoffs")
          ? "Workforce reductions are a recurring theme — not a one-off mention."
          : topTags.includes("Growth")
          ? "Growth signals are present but worth checking against hiring data."
          : "Pattern consistency across outlets gives this a moderate confidence read."
      }`
    : `Limited thematic variety in ${companyName} coverage. The narrative appears focused on ${themes}, which is ${direction}.`;

  const whatItMeans = topTags.includes("Layoffs")
    ? "If stability matters to you, this is a pattern, not a headline. Ask about team tenure and backfill timelines in any interview."
    : topTags.includes("Legal Risk")
    ? "Legal exposure doesn't always mean dysfunction — but it signals where the company's attention (and budget) is going. That matters for your role."
    : topTags.includes("Leadership Change")
    ? "New leadership can mean opportunity or chaos. The question isn't who's arriving — it's what they're inheriting. Dig into the transition timeline."
    : topTags.includes("Growth")
    ? "Growth headlines are easy to celebrate. The real question: is the growth reaching the people doing the work, or just the balance sheet?"
    : "Read the pattern, not the individual headline. One article is noise. Three is a signal.";

  return { whatsHappening, whatItMeans };
}

/* ═══ Component ═══ */
export function MediaSignalSummary({ companyId, companyName }: Props) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("6m");
  const [showArticles, setShowArticles] = useState(false);

  const cutoff = getDateCutoff(timeWindow);

  const { data: newsItems, isLoading } = useQuery({
    queryKey: ["media-signal-summary", companyId, timeWindow],
    queryFn: async () => {
      let query = supabase
        .from("company_news_signals")
        .select("id, headline, sentiment_score, tone_label, is_controversy, controversy_type, themes, source_name, source_url, published_at")
        .eq("company_id", companyId)
        .order("published_at", { ascending: false });

      if (cutoff) {
        query = query.gte("published_at", cutoff);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as NewsSignal[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const analysis = useMemo(() => {
    if (!newsItems) return null;

    const tone = deriveOverallTone(newsItems);

    // Build tag counts
    const tagCounts = new Map<string, number>();
    for (const item of newsItems) {
      const category = categorizeThemes(item.themes ?? [item.headline]);
      tagCounts.set(category, (tagCounts.get(category) ?? 0) + 1);
    }
    tagCounts.delete("Other"); // Don't surface uncategorized

    const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
    const { whatsHappening, whatItMeans } = generateSynthesis(tagCounts, tone, companyName, newsItems.length);

    return { tone, sortedTags, whatsHappening, whatItMeans, total: newsItems.length };
  }, [newsItems, companyName]);

  /* ─── Render ─── */
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
            Media Signal Summary
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            ({TIME_LABELS[timeWindow]})
          </span>
        </div>

        {/* Time toggle */}
        <div className="flex gap-1">
          {(["6m", "12m", "all"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors",
                w === timeWindow
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {w === "all" ? "All" : w}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Analyzing coverage…</div>
      ) : !analysis || analysis.total === 0 ? (
        <div className="p-5">
          <IntelligenceEmptyState category="media" state="after" />
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {/* Overall tone */}
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border",
              analysis.tone.label === "Positive" ? "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5" :
              analysis.tone.label === "Negative" ? "border-destructive/30 bg-destructive/5" :
              "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5"
            )}>
              <analysis.tone.icon className={cn("w-4 h-4", analysis.tone.color)} />
              <span className={cn("text-sm font-bold", analysis.tone.color)}>
                {analysis.tone.label}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              across {analysis.total} signal{analysis.total !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Signal tags with frequency */}
          {analysis.sortedTags.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                Coverage Themes
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.sortedTags.slice(0, 5).map(([tag, count]) => {
                  const conf = getConfidence(count, analysis.total);
                  return (
                    <div key={tag} className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5 border-border">
                        <Tag className="w-3 h-3" />
                        {tag}
                        <span className="text-muted-foreground ml-1">×{count}</span>
                      </Badge>
                      <span className={cn("text-[9px] font-mono", conf.color)}>
                        {conf.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What's actually happening */}
          <div className="border-l-2 border-primary/40 pl-4 space-y-1">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary">
              What's actually happening
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {analysis.whatsHappening}
            </p>
          </div>

          {/* What this means for you — Jackye voice */}
          <div className="border-l-2 border-[hsl(var(--civic-yellow))]/40 pl-4 space-y-1">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--civic-yellow))]">
              What this means for you
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed italic">
              {analysis.whatItMeans}
            </p>
          </div>

          {/* Article list — collapsible */}
          {newsItems && newsItems.length > 0 && (
            <div className="border-t border-border pt-3">
              <button
                onClick={() => setShowArticles(!showArticles)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {showArticles ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  {showArticles ? "Hide" : "View"} individual articles
                </span>
              </button>

              {showArticles && (
                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                  {newsItems.slice(0, 15).map((item) => {
                    const sentiment = (item.sentiment_score ?? 0);
                    const sentColor = sentiment > 0.15 ? "border-[hsl(var(--civic-green))]/50" :
                      sentiment < -0.15 ? "border-destructive/50" : "border-border";

                    return (
                      <div key={item.id} className={cn("border-l-2 pl-3 py-1.5", sentColor)}>
                        <p className="text-xs text-foreground leading-snug font-medium">
                          {item.headline}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {item.source_name || "Unknown source"}
                          </span>
                          {item.published_at && (
                            <span className="text-[10px] text-muted-foreground">
                              · {new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          {item.source_url && (
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                            >
                              View source <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
