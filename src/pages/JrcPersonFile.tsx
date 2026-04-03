import { useParams, useNavigate } from "react-router-dom";
import { useJrcStoriesByPerson } from "@/hooks/use-jrc-stories";
import { JrcStoryCard } from "@/components/jrc/JrcStoryCard";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, User, FileText, Radio } from "lucide-react";
import { format } from "date-fns";

export default function JrcPersonFile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: stories, isLoading } = useJrcStoriesByPerson(slug || "");

  const person = stories?.[0]?.people.find((p) => p.slug === slug);
  const personName = person?.name || slug || "Person";
  const personTitle = person?.title;

  const totalReceipts =
    stories?.reduce((sum, s) => sum + s.receipt_items.length, 0) || 0;

  const earliestDate = stories?.length
    ? stories[stories.length - 1].published_at
    : null;
  const latestDate = stories?.length ? stories[0].published_at : null;

  return (
    <>
      <Helmet>
        <title>{personName} — JRC EDIT Person File</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate("/jrc")}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to feed
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-2xl text-foreground">{personName}</h1>
                {personTitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{personTitle}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    {stories?.length || 0} stories
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {totalReceipts} receipts
                  </span>
                  {earliestDate && latestDate && (
                    <span>
                      {format(new Date(earliestDate), "MMM yyyy")} — {format(new Date(latestDate), "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Timeline */}
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {isLoading && (
            <p className="text-center text-muted-foreground py-12">Loading person file…</p>
          )}

          {stories?.map((story) => (
            <JrcStoryCard key={story.id} story={story} />
          ))}

          {!isLoading && stories?.length === 0 && (
            <div className="text-center py-20">
              <p className="font-serif text-xl text-muted-foreground">
                No stories filed for this person yet.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}