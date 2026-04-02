import { useSignalStories, useDailyWrap } from "@/hooks/use-signal-stories";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WorkSignalFeed() {
  const { data: stories, isLoading } = useSignalStories(30);
  const { data: dailyWrap } = useDailyWrap();

  return (
    <div className="min-h-screen bg-background">
      {/* Masthead */}
      <header className="border-b border-border/40 bg-card">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
              Live Employer Intelligence
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
            The Work Signal
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Live employer signals for people deciding where to work.
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono">
            Produced by WDIWF (Who Do I Work For?)
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Daily Wrap (if available) */}
        {dailyWrap && (
          <section className="rounded-xl border border-primary/20 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground font-display">
                {dailyWrap.title}
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                {format(new Date(dailyWrap.wrap_date), "MMM d, yyyy")}
              </span>
            </div>
            {dailyWrap.intro && (
              <p className="text-sm text-foreground/85 leading-relaxed mb-3 whitespace-pre-line">
                {dailyWrap.intro}
              </p>
            )}
            {dailyWrap.summary_take && (
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {dailyWrap.summary_take}
              </p>
            )}
          </section>
        )}

        {/* Live Signal Feed */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Live Work Signals
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : stories && stories.length > 0 ? (
            <div className="space-y-4">
              {stories.map((story) => (
                <SignalStoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No live signals right now. Check back soon.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
