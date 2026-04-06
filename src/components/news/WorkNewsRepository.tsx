import { useState } from "react";
import { useWorkNews, useWorkNewsCount, type WorkNewsArticle } from "@/hooks/use-work-news";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SignalStoryCard } from "@/components/work-signal/SignalStoryCard";
import type { SignalStory, SignalCategory, HeatLevel } from "@/lib/work-signal-schema";

interface WorkNewsRepositoryProps {
  className?: string;
  isPro?: boolean;
  maxFreeCards?: number;
}

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  regulation: { label: "Regulation" },
  future_of_work: { label: "Future of Work" },
  worker_rights: { label: "Worker Rights" },
  ai_workplace: { label: "AI & Work" },
  legislation: { label: "Legislation" },
  layoffs: { label: "Layoffs" },
  pay_equity: { label: "Pay Equity" },
  labor_organizing: { label: "Labor" },
  general: { label: "General" },
};

/* ── Adapt WorkNewsArticle → SignalStory for poster cards ── */
function toSignalStory(a: WorkNewsArticle): SignalStory & { poster_url: string | null; poster_pool_url: string | null; source_count_left: number; source_count_center: number; source_count_right: number; source_total: number } {
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
    poster_pool_url: null,
    source_count_left: a.source_count_left ?? 0,
    source_count_center: a.source_count_center ?? 0,
    source_count_right: a.source_count_right ?? 0,
    source_total: a.source_total ?? 0,
  };
}

export function WorkNewsRepository({ className, isPro = false, maxFreeCards = 3 }: WorkNewsRepositoryProps) {
  const { data: articles, isLoading } = useWorkNews(100);
  const { data: totalCount } = useWorkNewsCount();
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();

  const filtered = activeCategory === "all"
    ? articles
    : articles?.filter(a => a.category === activeCategory);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stat Card */}
      <Card className="bg-card border-primary/15">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-1">
              Global Workforce Signals
            </p>
            <p className="text-3xl font-black text-foreground tabular-nums">
              {(totalCount ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              articles tracked across {Object.keys(CATEGORY_CONFIG).length} categories
            </p>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Poster-Style News Cards */}
      <div className="grid gap-4">
        {filtered?.map((article, index) => {
          const locked = !isPro && index >= maxFreeCards;
          if (locked) return (
            <div key={article.id} className="opacity-50 blur-[2px] select-none pointer-events-none">
              <SignalStoryCard story={toSignalStory(article)} />
            </div>
          );
          return <SignalStoryCard key={article.id} story={toSignalStory(article)} />;
        })}
      </div>

      {/* Pro Upsell */}
      {!isPro && filtered && filtered.length > maxFreeCards && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-center space-y-3">
            <Lock className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {filtered.length - maxFreeCards} more articles behind Pro
            </p>
            <p className="text-xs text-muted-foreground">
              Get full access to the Workforce Intelligence Repository plus Jackye's expert analysis on every story.
            </p>
            <Button onClick={() => navigate("/pricing")} className="gap-2">
              Upgrade to Pro <TrendingUp className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Powered by GDELT Global Knowledge Graph · Updated every 4 hours · Free, open-source intelligence
      </p>
    </div>
  );
}
