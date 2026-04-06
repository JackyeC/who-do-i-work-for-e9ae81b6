import { useState, useMemo, useCallback } from "react";
import { useWorkNews, usePosterPool, type WorkNewsArticle, type PosterPoolItem } from "@/hooks/use-work-news";
import { useSignalStories, useDailyWrap } from "@/hooks/use-signal-stories";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import { EnforcementReceiptsTicker } from "@/components/work-signal/EnforcementReceiptsTicker";
import { SourceBiasKey } from "@/components/work-signal/SourceBiasKey";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import workSignalLogo from "@/assets/work-signal-logo.png";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";

/* ── Constants ── */
const PAGE_SIZE = 12;

const CATEGORY_CHIPS = [
  { key: "all", label: "All Stories" },
  { key: "regulation", label: "Regulation" },
  { key: "future_of_work", label: "Future of Work" },
  { key: "worker_rights", label: "Worker Rights" },
  { key: "ai_workplace", label: "AI & Work" },
  { key: "legislation", label: "Legislation" },
  { key: "layoffs", label: "Layoffs" },
  { key: "pay_equity", label: "Pay Equity" },
  { key: "labor_organizing", label: "Labor" },
  { key: "general", label: "General" },
] as const;

const SORT_OPTIONS = [
  { key: "latest", label: "Latest" },
  { key: "most_covered", label: "Most Covered" },
  { key: "hottest", label: "🔥 Highest Heat" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

const HEAT_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

/* ── Adapt WorkNewsArticle → SignalStory ── */
function toSignalStory(
  a: WorkNewsArticle,
  posterPool: PosterPoolItem[],
  usedPoolIds: Set<string>
): SignalStory & {
  poster_url: string | null;
  poster_pool_url: string | null;
  source_count_left: number;
  source_count_center: number;
  source_count_right: number;
  source_total: number;
} {
  const catMap: Record<string, SignalCategory> = {
    layoffs: "c_suite",
    worker_rights: "fine_print",
    ai_workplace: "tech_stack",
    regulation: "fine_print",
    pay_equity: "paycheck",
    future_of_work: "daily_grind",
    legislation: "fine_print",
    labor_organizing: "daily_grind",
    general: "daily_grind",
  };

  const sentimentToHeat = (s: number | null): HeatLevel => {
    if (s === null) return "medium";
    const abs = Math.abs(s);
    return abs >= 8 ? "high" : abs >= 4 ? "medium" : "low";
  };

  // Pick poster from pool (round-robin by category, avoid repeats)
  let poolUrl: string | null = null;
  if (!a.poster_url) {
    const candidates = posterPool.filter(
      p => p.category === a.category && !usedPoolIds.has(p.id)
    );
    if (candidates.length > 0) {
      const pick = candidates[0];
      poolUrl = pick.poster_url;
      usedPoolIds.add(pick.id);
    } else {
      // Allow reuse if exhausted
      const allCat = posterPool.filter(p => p.category === a.category);
      if (allCat.length > 0) {
        poolUrl = allCat[Math.floor(Math.random() * allCat.length)].poster_url;
      }
    }
  }

  return {
    id: a.id,
    company_name: null,
    category: catMap[a.category] || "daily_grind",
    signal_type: a.is_controversy ? "breaking" : "developing",
    headline: a.headline,
    heat_level: sentimentToHeat(a.sentiment_score),
    source_name: a.source_name,
    source_url: a.source_url,
    receipt: null,
    jrc_take: a.jackye_take_approved ? a.jackye_take : null,
    why_it_matters_applicants: null,
    why_it_matters_employees: null,
    why_it_matters_execs: null,
    before_you_say_yes: null,
    published_at: a.published_at ?? new Date().toISOString(),
    status: "live",
    created_at: a.created_at ?? new Date().toISOString(),
    updated_at: a.created_at ?? new Date().toISOString(),
    poster_url: a.poster_url ?? null,
    poster_pool_url: poolUrl,
    source_count_left: a.source_count_left ?? 0,
    source_count_center: a.source_count_center ?? 0,
    source_count_right: a.source_count_right ?? 0,
    source_total: a.source_total ?? 0,
  };
}

export default function WorkSignalFeed() {
  const { data: workNewsRaw, isLoading: workNewsLoading } = useWorkNews(100);
  const { data: signalStories, isLoading: signalLoading } = useSignalStories(50);
  const { data: dailyWrap } = useDailyWrap();
  const { data: posterPool } = usePosterPool();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("latest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isLoading = workNewsLoading && signalLoading;

  // Merge work_news + signal_stories into unified list
  const allStories = useMemo(() => {
    const pool = posterPool ?? [];
    const usedPoolIds = new Set<string>();

    const fromWorkNews = (workNewsRaw ?? []).map(a => toSignalStory(a, pool, usedPoolIds));

    // Signal stories already in the right shape, add bias fields
    const fromSignals = (signalStories ?? []).map(s => ({
      ...s,
      poster_url: null as string | null,
      poster_pool_url: null as string | null,
      source_count_left: 0,
      source_count_center: 0,
      source_count_right: 0,
      source_total: 0,
    }));

    // Merge & dedup by headline
    const seen = new Set<string>();
    const merged: typeof fromWorkNews = [];
    for (const s of [...fromWorkNews, ...fromSignals]) {
      const key = s.headline.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(s);
    }
    return merged;
  }, [workNewsRaw, signalStories, posterPool]);

  // Filter
  const filtered = useMemo(() => {
    let list = allStories;

    // Category filter (maps newsletter categories → work_news categories)
    if (categoryFilter !== "all") {
      // The category chips use work_news categories, but stories are mapped to SignalCategory
      // Filter on original category from work_news
      const catMapReverse: Record<string, string[]> = {
        regulation: ["fine_print"],
        future_of_work: ["daily_grind"],
        worker_rights: ["fine_print"],
        ai_workplace: ["tech_stack"],
        legislation: ["fine_print"],
        layoffs: ["c_suite"],
        pay_equity: ["paycheck"],
        labor_organizing: ["daily_grind"],
        general: ["daily_grind"],
      };
      // We need to match by checking the original work_news article's category
      // Since we adapted it, let's use a simple approach: filter from workNewsRaw
      const matchingHeadlines = new Set(
        (workNewsRaw ?? [])
          .filter(a => a.category === categoryFilter)
          .map(a => a.headline.toLowerCase().trim())
      );
      list = list.filter(s => matchingHeadlines.has(s.headline.toLowerCase().trim()));
    }

    // Sort
    if (sortBy === "most_covered") {
      list = [...list].sort((a, b) => (b.source_total ?? 0) - (a.source_total ?? 0));
    } else if (sortBy === "hottest") {
      list = [...list].sort((a, b) => {
        const heatDiff = (HEAT_ORDER[b.heat_level] ?? 0) - (HEAT_ORDER[a.heat_level] ?? 0);
        if (heatDiff !== 0) return heatDiff;
        return 0;
      });
    } else {
      list = [...list].sort((a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }

    return list;
  }, [allStories, categoryFilter, sortBy, workNewsRaw]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-background">
      <EnforcementReceiptsTicker />

      {/* Masthead */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <img src={workSignalLogo} alt="The Work Signal" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Live Employer Intelligence
          </p>
          <h1 className="text-display font-display font-bold text-foreground tracking-tight">
            The Work Signal
          </h1>
          <div className="w-12 h-[2px] bg-primary mx-auto mt-4 mb-3" />
          <p className="text-body text-foreground/70 max-w-sm mx-auto leading-relaxed">
            Receipts and signals you shouldn't ignore before you say yes.
          </p>
          <p className="text-caption text-muted-foreground mt-2 font-mono tracking-wider">
            Produced by WDIWF (Who Do I Work For?)
          </p>
        </div>
      </header>

      {/* FIX 2: Source Bias Key */}
      <SourceBiasKey />

      {/* ── FILTER BAR ── */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">
          {/* Category chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_CHIPS.map(chip => (
              <button
                key={chip.key}
                onClick={() => { setCategoryFilter(chip.key); setVisibleCount(PAGE_SIZE); }}
                className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all border"
                style={
                  categoryFilter === chip.key
                    ? { background: "#F0C040", color: "#2c1a00", borderColor: "#F0C040" }
                    : undefined
                }
                {...(categoryFilter !== chip.key && {
                  className: "px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all border bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground",
                })}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                  sortBy === opt.key
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Daily Wrap */}
        {dailyWrap && (
          <section className="border-l-2 border-primary pl-5 py-1">
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-heading-3 font-display font-semibold text-foreground">
                {dailyWrap.title}
              </h2>
              <span className="text-caption text-muted-foreground font-mono">
                {format(new Date(dailyWrap.wrap_date), "MMMM d, yyyy")}
              </span>
            </div>
            {dailyWrap.intro && (
              <p className="text-body-lg text-foreground/85 leading-relaxed mb-3 whitespace-pre-line">
                {dailyWrap.intro}
              </p>
            )}
            {dailyWrap.summary_take && (
              <p className="text-body text-foreground/60 italic leading-relaxed border-t border-border/40 pt-3">
                {dailyWrap.summary_take}
              </p>
            )}
          </section>
        )}

        {/* Live Signals */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-green" />
            </span>
            <h2 className="text-eyebrow uppercase tracking-[0.2em] text-muted-foreground">
              Live Signals
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-mono">
              {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[480px] rounded-2xl" />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                {visible.map(story => (
                  <SignalStoryCard key={story.id} story={story} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-8">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="px-8"
                  >
                    Load more stories ({filtered.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-body italic">No receipts match your filters. Try widening your search.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
