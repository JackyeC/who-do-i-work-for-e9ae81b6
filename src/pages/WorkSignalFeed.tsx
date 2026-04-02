import { useSignalStories, useDailyWrap } from "@/hooks/use-signal-stories";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function WorkSignalFeed() {
  const { data: stories, isLoading } = useSignalStories(30);
  const { data: dailyWrap } = useDailyWrap();

  return (
    <div className="min-h-screen bg-background">
      {/* Masthead — editorial magazine feel */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="font-mono text-micro uppercase tracking-[0.3em] text-muted-foreground mb-3">
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
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

        {/* Live Ticker */}
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
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : stories && stories.length > 0 ? (
            <div className="space-y-6">
              {stories.map((story) => (
                <SignalStoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-body italic">No live signals right now. Check back soon.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
