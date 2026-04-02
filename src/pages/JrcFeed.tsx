import { useJrcStories } from "@/hooks/use-jrc-stories";
import { JrcStoryCard } from "@/components/jrc/JrcStoryCard";
import { BiasLegend } from "@/components/jrc/BiasLegend";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";

export default function JrcFeed() {
  const { data: stories, isLoading } = useJrcStories(30);

  return (
    <>
      <Helmet>
        <title>JRC EDIT — Intelligence Feed</title>
        <meta name="description" content="Workplace intelligence, receipts, and editorial analysis by Jackye Clayton." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-6 flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl text-foreground">JRC EDIT</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Workplace intelligence. Receipts. Judgment.
              </p>
            </div>
            <BiasLegend />
          </div>
        </header>

        {/* Feed */}
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded" />
              ))}
            </div>
          )}

          {stories?.map((story) => (
            <JrcStoryCard key={story.id} story={story} />
          ))}

          {!isLoading && stories?.length === 0 && (
            <div className="text-center py-20">
              <p className="font-serif text-xl text-muted-foreground">
                Intelligence feed loading.
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Stories are being prepared.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}