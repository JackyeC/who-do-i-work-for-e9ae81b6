import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
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
  const { data: articles } = useQuery({
    queryKey: ["homepage-live-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_news")
        .select(
          "id, headline, source_name, source_url, category, is_controversy, published_at, jackye_take"
        )
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as TickerNewsItem[]) || [];
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

  const renderItem = (item: TickerNewsItem, key: string) => {
    const profile = getSourceProfile(item.source_name);
    const biasColor = getBiasColor(profile.bias);
    const biasLabel = getBiasShortLabel(profile.bias);
    const factColor = getFactualityColor(profile.factuality);
    const catLabel = CATEGORY_LABELS[item.category] || "NEWS";

    const headlineText =
      item.headline.length > 70
        ? item.headline.slice(0, 70) + "\u2026"
        : item.headline;

    return (
      <span key={key} className="px-6 inline-flex items-center gap-2">
        {/* Category tag */}
        <span
          className="font-mono text-[10px] tracking-wider uppercase shrink-0"
          style={{
            color: item.is_controversy
              ? "hsl(0 80% 65%)"
              : "hsl(43 85% 59% / 0.7)",
          }}
        >
          {item.is_controversy ? "\u26A0 " : ""}
          {catLabel}
        </span>

        {/* Clickable headline */}
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-ticker text-foreground/90 hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {headlineText}
          </a>
        ) : (
          <span className="font-sans text-ticker text-foreground/90">
            {headlineText}
          </span>
        )}

        {/* Jackye's take (if curated) */}
        {item.jackye_take && (
          <span className="font-sans text-ticker text-primary/80 italic shrink-0">
            \u2014 {item.jackye_take}
          </span>
        )}

        {/* Source + bias label */}
        {item.source_name && (
          <span className="inline-flex items-center gap-1 shrink-0">
            <span className="font-sans text-ticker text-muted-foreground/60">
              via
            </span>
            <span className="font-sans text-ticker text-muted-foreground">
              {item.source_name}
            </span>
            {profile.bias !== "Unknown" && (
              <span
                className={`font-mono text-[9px] font-bold px-1 py-px border rounded ${biasColor}`}
                style={{
                  borderColor: "currentColor",
                  opacity: 0.8,
                  lineHeight: 1,
                }}
                title={`Bias: ${profile.bias} \u00B7 Factuality: ${profile.factuality}`}
              >
                {biasLabel}
              </span>
            )}
            {profile.factuality !== "Unknown" && (
              <span
                className={`font-mono text-[9px] ${factColor}`}
                style={{ opacity: 0.6 }}
                title={`Factuality: ${profile.factuality}`}
              >
                {profile.factuality === "High"
                  ? "\u2713"
                  : profile.factuality === "Mixed"
                  ? "~"
                  : "\u2717"}
              </span>
            )}
          </span>
        )}

        <span className="px-2" style={{ color: "hsl(43 85% 59% / 0.5)" }}>
          \u00B7
        </span>
      </span>
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
