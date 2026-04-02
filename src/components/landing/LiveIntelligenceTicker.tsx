import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
import { decodeEscapes, isLikelyEnglish, isUSOrEmployerRelevant } from "@/lib/ticker-filters";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getSourceProfile,
  getBiasColor,
  getBiasShortLabel,
  getFactualityColor,
} from "@/lib/source-bias-map";

interface TickerNewsItem {
  id: string;
  headline: string;
  source_name: string | null;
  source_url: string | null;
  category: string;
  is_controversy: boolean;
  published_at: string | null;
  jackye_take: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  regulation: "REG",
  future_of_work: "WORK",
  worker_rights: "RIGHTS",
  ai_workplace: "AI",
  legislation: "LAW",
  layoffs: "LAYOFFS",
  pay_equity: "PAY",
  labor_organizing: "LABOR",
  dei: "DEI",
  workplace: "WORK",
  policy: "POLICY",
  wdiwf_intel: "WDIWF",
  general: "NEWS",
};

export function LiveIntelligenceTicker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: articles } = useQuery({
    queryKey: ["homepage-live-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_news")
        .select(
          "id, headline, source_name, source_url, category, is_controversy, published_at, jackye_take"
        )
        .order("published_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return ((data as TickerNewsItem[]) || [])
        .map(item => ({
          ...item,
          headline: decodeEscapes(item.headline || ""),
          source_name: item.source_name ? decodeEscapes(item.source_name) : null,
        }))
        .filter(item =>
          isLikelyEnglish(item.headline) &&
          isUSOrEmployerRelevant(item.headline, item.source_name)
        );
    },
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  const tickerItems: TickerNewsItem[] =
    articles && articles.length > 0
      ? articles
      : [
          {
            id: "fallback-1",
            headline: "Live intelligence scanning active \u2014 world-of-work news loading",
            source_name: "Who Do I Work For",
            source_url: null,
            category: "general",
            is_controversy: false,
            published_at: null,
            jackye_take: null,
          },
        ];

  // Calculate speed: ~80px/sec feels readable but not boring
  // More items = longer duration so everything gets seen
  const totalChars = tickerItems.reduce(
    (sum, i) => sum + (i.headline?.length || 0) + (i.source_name?.length || 0) + 20,
    0
  );
  const duration = Math.max(140, Math.min((totalChars * 0.6), 360));

  const handleStoryClick = (storyId: string) => {
    navigate(`/newsletter#story-${storyId}`);

    if (location.pathname === "/newsletter") {
      setTimeout(() => {
        document.getElementById(`story-${storyId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const renderItem = (item: TickerNewsItem, key: string) => {
    const profile = getSourceProfile(item.source_name);
    getBiasColor(profile.bias);
    getBiasShortLabel(profile.bias);
    getFactualityColor(profile.factuality);
    const catLabel = CATEGORY_LABELS[item.category] || "NEWS";

    const headlineText =
      item.headline.length > 70
        ? item.headline.slice(0, 70) + "\u2026"
        : item.headline;

    return (
      <button
        key={key}
        type="button"
        onClick={() => handleStoryClick(item.id)}
        className="px-6 inline-flex items-center gap-2 bg-transparent border-none p-0 font-inherit text-left cursor-pointer hover:text-primary transition-colors"
      >
        {/* Category tag */}
        <span
          className="font-mono text-[10px] tracking-wider uppercase shrink-0"
          style={{
            color: item.is_controversy
              ? "hsl(0 80% 65%)"
              : "hsl(43 85% 59% / 0.7)",
          }}
        >
          {item.is_controversy ? "⚠ " : ""}
          {catLabel}
        </span>

        <span className="font-sans text-ticker text-foreground/90">{headlineText}</span>

        {/* Source + bias label */}
        {item.source_name && (
          <span className="font-sans text-ticker text-muted-foreground/50 shrink-0">
            via {item.source_name}
          </span>
        )}

        <span className="px-2" style={{ color: "hsl(43 85% 59% / 0.5)" }}>
          ·
        </span>
      </button>
    );
  };

  return (
    <div
      className="bg-background overflow-hidden whitespace-nowrap h-[36px] flex items-center"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* LIVE badge */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Radio className="w-3 h-3 animate-pulse text-primary" />
        <span className="font-sans text-eyebrow">LIVE</span>
      </div>

      {/* Scrolling ticker — pauses on hover so people can read + click */}
      <div
        className="ticker-track"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {tickerItems.map((t, i) => renderItem(t, `item-${i}`))}
        {tickerItems.map((t, i) => renderItem(t, `dup-${i}`))}
      </div>
    </div>
  );
}
