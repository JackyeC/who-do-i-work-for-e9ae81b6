import { useState, useMemo } from "react";
import { useSignalStories, useDailyWrap } from "@/hooks/use-signal-stories";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import { EnforcementReceiptsTicker } from "@/components/work-signal/EnforcementReceiptsTicker";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subHours, subDays } from "date-fns";
import workSignalLogo from "@/assets/work-signal-logo.png";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";

/* ── Filter constants ── */
const TOPIC_CHIPS = [
  { key: "all", label: "All" },
  { key: "tech_stack", label: "AI" },
  { key: "daily_grind", label: "Work" },
  { key: "c_suite", label: "C-Suite" },
  { key: "paycheck", label: "Money" },
  { key: "fine_print", label: "Policy" },
] as const;

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "hottest", label: "⭐ Hottest" },
  { key: "drama", label: "Drama" },
] as const;

const TIME_OPTIONS = [
  { key: "all", label: "All Time" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];
type TimeKey = (typeof TIME_OPTIONS)[number]["key"];

const HEAT_ORDER: Record<HeatLevel, number> = { high: 3, medium: 2, low: 1 };

export default function WorkSignalFeed() {
  const { data: stories, isLoading } = useSignalStories(50);
  const { data: dailyWrap } = useDailyWrap();

  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [timeRange, setTimeRange] = useState<TimeKey>("all");

  const filtered = useMemo(() => {
    if (!stories) return [];
    let list = [...stories];

    // Topic filter
    if (topicFilter !== "all") {
      list = list.filter((s) => s.category === topicFilter);
    }

    // Time filter
    const now = new Date();
    if (timeRange === "24h") list = list.filter((s) => new Date(s.published_at) > subHours(now, 24));
    else if (timeRange === "7d") list = list.filter((s) => new Date(s.published_at) > subDays(now, 7));
    else if (timeRange === "30d") list = list.filter((s) => new Date(s.published_at) > subDays(now, 30));

    // Sort
    if (sortBy === "hottest") {
      list.sort((a, b) => HEAT_ORDER[b.heat_level] - HEAT_ORDER[a.heat_level]);
    } else if (sortBy === "drama") {
      list.sort((a, b) => HEAT_ORDER[b.heat_level] - HEAT_ORDER[a.heat_level] || b.headline.length - a.headline.length);
    } else {
      list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }

    return list;
  }, [stories, topicFilter, sortBy, timeRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Enforcement Receipts Ticker */}
      <EnforcementReceiptsTicker />

      {/* Masthead */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <img
            src={workSignalLogo}
            alt="The Work Signal"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
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

      {/* ── FILTER BAR ── */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">
          {/* Topic chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {TOPIC_CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setTopicFilter(chip.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all border ${
                  topicFilter === chip.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sort + Time */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              {SORT_OPTIONS.map((opt) => (
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
            <div className="h-3 w-px bg-border/50" />
            <div className="flex items-center gap-1.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTimeRange(opt.key)}
                  className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                    timeRange === opt.key
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
          ) : filtered.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {filtered.map((story) => (
                <SignalStoryCard key={story.id} story={story} />
              ))}
            </div>
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
