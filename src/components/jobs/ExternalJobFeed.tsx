import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Rss, ExternalLink, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  publishedAt: string;
  source: string;
  category?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "We Work Remotely": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "Remotive": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  "Himalayas": "bg-sky-500/10 text-sky-700 border-sky-500/20",
};

export function ExternalJobFeed() {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["external-job-feeds"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-job-feeds", {
        body: { limit: 20 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch feeds");
      return data as { jobs: FeedJob[]; totalFound: number; errors: string[] };
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
    retry: 1,
  });

  // Only show HR / People / Talent roles relevant to our audience
  const HR_KEYWORDS = [
    "talent", "recruiter", "recruiting", "recruitment",
    "hr", "human resources", "people ops", "people operations",
    "people partner", "hrbp", "hr business partner",
    "deib", "dei", "diversity", "equity", "inclusion",
    "compensation", "benefits", "total rewards",
    "workforce", "organizational development",
    "people team", "people strategy", "employee experience",
    "talent acquisition", "employer brand",
    "learning and development", "l&d", "learning",
    "culture", "employee relations", "onboarding", "ta",
  ];

  const jobs = (data?.jobs || []).filter((job) => {
    const text = `${job.title} ${job.category || ""} ${job.company || ""}`.toLowerCase();
    return HR_KEYWORDS.some((kw) => text.includes(kw));
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm mb-6">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Rss className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  People & HR Job Feeds
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? "Loading feeds…"
                    : `${jobs.length} HR & Talent roles from We Work Remotely, Remotive & Himalayas`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!open && jobs.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {jobs.length} new
                </Badge>
              )}
              {open ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-destructive py-4 text-center">
                Unable to load feeds. Try again later.
              </p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No HR/People/Talent roles in this feed right now — check back soon.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {jobs.map((job, i) => (
                  <a
                    key={`${job.url}-${i}`}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {job.company}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {job.location}
                        </div>
                        {job.category && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {job.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs py-0 ${SOURCE_COLORS[job.source] || ""}`}
                      >
                        {job.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.publishedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {jobs.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                These listings are sourced from external job boards and are not vetted by our platform.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
