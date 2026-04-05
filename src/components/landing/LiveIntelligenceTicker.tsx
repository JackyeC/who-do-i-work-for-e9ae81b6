import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";
import { decodeEscapes, isLikelyEnglish, TICKER_SEPARATOR } from "@/lib/ticker-filters";
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

const ALLOWED_CATEGORIES = [
  "regulation", "worker_rights", "ai_workplace",
  "legislation", "layoffs", "pay_equity", "labor_organizing",
  "dei", "workplace", "policy", "wdiwf_intel",
];

const CATEGORY_LABELS: Record<string, string> = {
  regulation: "REG",
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
};

// Trusted sources for workplace/labor intelligence
const TRUSTED_SOURCES = /\b(nlrb|osha|bls|sec\.gov|dol\.gov|eeoc|reuters|bloomberg|associated press|ap news|hr dive|shrm|the guardian|washington post|new york times|nyt|propublica|politico|the hill|cnn|cnbc|npr|pbs|marketplace|fortune|fast company|harvard business review|hbr|wall street journal|wsj|labor department|department of labor|bureau of labor|national labor|federal register)\b/i;

// Expanded blocklist: reject anything off-topic
const BLOCKED_CONTENT = /\b(bible|church|gospel|devotion|prayer|christian|catholic|faith|sermon|cricket|soccer|football|nfl|nba|mlb|nhl|espn|sport|athletic|fashion|vogue|glamour|cosmopolitan|allure|bazaar|style|beauty|horoscope|astrology|recipe|cooking|celebrity|gossip|entertainment|bollywood|telenovela|pageant|runway|bitcoin|crypto|ethereum|solana|blockchain|nft|token|defi|memecoin|meme coin|k-?drama|dramabeans|korean drama|anime|manga|kpop|k-pop|streaming|netflix|disney\+|hulu|movie review|box office|album|concert|tour dates|real estate|mortgage|home price|housing market|stock pick|day trading|forex|hedge fund|mutual fund|portfolio|investment tip|weight loss|diet|fitness|workout|wellness|meditation|yoga|skincare|makeup|perfume|fragrance|wedding|bridal|baby shower|parenting tip|pet|puppy|kitten|garden|landscaping|diy craft|interior design|home decor|travel deal|vacation|resort|cruise|airline miles|frequent flyer|botnet|ddos|search warrant|social media company|holiday.*rename|college sports|executive order.*sport|tamil nadu|piyush goyal|dmk)\b/i;

// Require workplace/labor relevance keywords
const RELEVANCE_KEYWORDS = /\b(worker|employee|employer|labor|union|strike|layoff|fired|hiring|wage|salary|pay gap|discrimination|harassment|osha|nlrb|eeoc|sec filing|workplace|dei|diversity|equity|inclusion|pension|benefits|401k|health insurance|parental leave|remote work|return to office|rto|gig economy|contractor|independent contractor|minimum wage|overtime|whistleblower|retaliation|wrongful termination|severance|non-?compete|arbitration|class action|settlement|compliance|regulation|enforcement|safety|violation|fine|penalty|investigation|audit|accountability|lobby|lobbying|pac|political action|campaign contribution|corporate governance|board of directors|ceo pay|executive compensation|stock buyback|restructuring|downsizing|outsourcing|offshoring|ai hiring|automated|surveillance|monitoring)\b/i;

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
        .eq("language", "en")
        .in("category", ALLOWED_CATEGORIES)
        .order("published_at", { ascending: false })
        .limit(60);

      if (error) throw error;

      return ((data as TickerNewsItem[]) || [])
        .map(item => ({
          ...item,
          headline: decodeEscapes(item.headline || ""),
          source_name: item.source_name ? decodeEscapes(item.source_name) : null,
        }))
        .filter(item => {
          if (!isLikelyEnglish(item.headline)) return false;
          const combined = `${item.headline} ${item.source_name || ""}`;
          // Block garbage content
          if (BLOCKED_CONTENT.test(combined)) return false;
          // Must have workplace relevance OR come from a trusted source
          const fromTrustedSource = item.source_name && TRUSTED_SOURCES.test(item.source_name);
          const hasRelevance = RELEVANCE_KEYWORDS.test(item.headline);
          return fromTrustedSource || hasRelevance;
        })
        .slice(0, 12);
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
            headline: "Live intelligence scanning active — world-of-work news loading",
            source_name: "Who Do I Work For",
            source_url: null,
            category: "general",
            is_controversy: false,
            published_at: null,
            jackye_take: null,
          },
        ];

  const totalChars = tickerItems.reduce(
    (sum, i) => sum + (i.headline?.length || 0) + (i.source_name?.length || 0) + 20,
    0
  );
  const duration = Math.max(160, Math.min((totalChars * 0.8), 400));

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

        {item.source_name && (
          <span className="font-sans text-ticker text-muted-foreground/50 shrink-0">
            via {item.source_name}
          </span>
        )}

        <span className="px-2" style={{ color: "hsl(43 85% 59% / 0.5)" }}>
          {TICKER_SEPARATOR.trim()}
        </span>
      </button>
    );
  };

  return (
    <div
      className="bg-background overflow-hidden whitespace-nowrap h-[36px] flex items-center relative"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Radio className="w-3 h-3 animate-pulse text-primary" />
        <span className="font-sans text-eyebrow">LIVE</span>
      </div>

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
