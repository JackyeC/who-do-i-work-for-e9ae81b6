import { useState } from "react";
import { useWorkNews, useWorkNewsCount, type WorkNewsArticle } from "@/hooks/use-work-news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, ExternalLink, Lock, Newspaper, TrendingUp,
  Scale, Brain, Megaphone, DollarSign, Users, Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface WorkNewsRepositoryProps {
  className?: string;
  isPro?: boolean;
  maxFreeCards?: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  regulation: { label: "Regulation", icon: Scale, color: "text-blue-500" },
  future_of_work: { label: "Future of Work", icon: TrendingUp, color: "text-emerald-500" },
  worker_rights: { label: "Worker Rights", icon: Users, color: "text-orange-500" },
  ai_workplace: { label: "AI & Work", icon: Brain, color: "text-violet-500" },
  legislation: { label: "Legislation", icon: Gavel, color: "text-amber-500" },
  layoffs: { label: "Layoffs", icon: AlertTriangle, color: "text-destructive" },
  pay_equity: { label: "Pay Equity", icon: DollarSign, color: "text-green-500" },
  labor_organizing: { label: "Labor", icon: Megaphone, color: "text-rose-500" },
  general: { label: "General", icon: Newspaper, color: "text-muted-foreground" },
};

const TONE_COLORS: Record<string, string> = {
  "Very Positive": "bg-green-500/10 text-green-600 border-green-500/20",
  "Positive": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Neutral": "bg-muted text-muted-foreground border-border",
  "Negative": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Very Negative": "bg-destructive/10 text-destructive border-destructive/20",
};

function NewsCard({ article, locked }: { article: WorkNewsArticle; locked: boolean }) {
  const config = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.general;
  const Icon = config.icon;
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : "";

  return (
    <Card className={cn(
      "border-border/40 transition-all hover:border-border/80 group",
      article.is_controversy && "border-destructive/20 hover:border-destructive/40",
      locked && "opacity-60 blur-[2px] select-none pointer-events-none"
    )}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={cn("w-4 h-4 shrink-0", config.color)} />
            <Badge variant="outline" className="text-[10px] shrink-0">
              {config.label}
            </Badge>
            {article.is_controversy && (
              <Badge variant="destructive" className="text-[10px] shrink-0">
                ⚠ Controversy
              </Badge>
            )}
          </div>
          {article.tone_label && (
            <Badge
              variant="outline"
              className={cn("text-[10px] shrink-0", TONE_COLORS[article.tone_label])}
            >
              {article.tone_label}
            </Badge>
          )}
        </div>

        <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {article.headline}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{article.source_name || "Unknown source"}</span>
          <span>{timeAgo}</span>
        </div>

        {/* Jackye's Take section */}
        {article.jackye_take && article.jackye_take_approved ? (
          <div className="mt-2 p-2.5 bg-primary/5 border border-primary/10 rounded">
            <p className="text-[10px] font-mono uppercase text-primary tracking-wider mb-1">
              Jackye's Take
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{article.jackye_take}</p>
          </div>
        ) : !locked ? (
          <div className="mt-2 p-2.5 bg-muted/50 border border-border/50 rounded flex items-center gap-2">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Jackye's Take — Pro members only</p>
          </div>
        ) : null}

        {article.source_url && !locked && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
          >
            Read full article <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkNewsRepository({ className, isPro = false, maxFreeCards = 3 }: WorkNewsRepositoryProps) {
  const { data: articles, isLoading } = useWorkNews(100);
  const { data: totalCount } = useWorkNewsCount();
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();

  const filtered = activeCategory === "all"
    ? articles
    : articles?.filter(a => a.category === activeCategory);

  const categories = ["all", ...Object.keys(CATEGORY_CONFIG)];

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
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
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

      {/* News Cards */}
      <div className="grid gap-3">
        {filtered?.map((article, index) => (
          <NewsCard
            key={article.id}
            article={article}
            locked={!isPro && index >= maxFreeCards}
          />
        ))}
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

      <p className="text-[10px] text-muted-foreground text-center">
        Powered by GDELT Global Knowledge Graph · Updated every 4 hours · Free, open-source intelligence
      </p>
    </div>
  );
}
