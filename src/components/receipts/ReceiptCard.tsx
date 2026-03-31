import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeatChip } from "./HeatChip";
import { ReceiptPoster } from "./ReceiptPoster";
import { formatDistanceToNow } from "date-fns";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_workplace: "AI & Work",
  future_of_work: "Future of Work",
  labor_organizing: "Labor",
  worker_rights: "DEI",
  regulation: "Policy",
  layoffs: "Layoffs",
  pay_equity: "Money",
  legislation: "Hiring",
  general: "News",
};

function getSourceBias(source: string | null): string {
  if (!source) return "Center";
  const left = ["Truthout", "Democracy Now", "Jacobin", "Mother Jones"];
  const leanLeft = ["Al Jazeera English", "The Conversation Africa", "The Guardian", "MSNBC", "CNN", "NPR", "Vox"];
  const right = ["Freerepublic.com", "Breitbart", "Daily Wire", "Newsmax", "OAN"];
  const leanRight = ["Reason", "New York Post", "Fox News", "Washington Examiner", "Daily Caller"];
  const center = ["CBS News", "NBER", "CompTIA", "Gallup", "ADP Research", "BLS", "Reuters", "AP News", "BBC"];
  if (left.includes(source)) return "Left";
  if (leanLeft.includes(source)) return "Leaning Left";
  if (right.includes(source)) return "Right";
  if (leanRight.includes(source)) return "Leaning Right";
  if (center.includes(source)) return "Center";
  return "Center";
}

const BIAS_COLORS: Record<string, string> = {
  "Left": "bg-[hsl(210,70%,92%)] text-[hsl(210,70%,35%)] border-[hsl(210,70%,70%)]",
  "Leaning Left": "bg-[hsl(210,50%,93%)] text-[hsl(210,50%,42%)] border-[hsl(210,50%,78%)]",
  "Center": "bg-[hsl(145,40%,92%)] text-[hsl(145,40%,35%)] border-[hsl(145,40%,70%)]",
  "Leaning Right": "bg-[hsl(0,50%,94%)] text-[hsl(0,50%,42%)] border-[hsl(0,50%,78%)]",
  "Right": "bg-[hsl(0,70%,92%)] text-[hsl(0,70%,35%)] border-[hsl(0,70%,70%)]",
};

interface ReceiptCardProps {
  article: ReceiptArticle;
  featured?: boolean;
}

export function ReceiptCard({ article, featured = false }: ReceiptCardProps) {
  const bias = getSourceBias(article.source_name);
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : "";

  return (
    <Card className={cn(
      "border-border/40 transition-all duration-300 overflow-hidden group",
      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.04]",
      featured && "md:col-span-2 lg:col-span-3"
    )}>
      <CardContent className={cn(
        "p-0",
        featured ? "md:grid md:grid-cols-[380px_1fr] lg:grid-cols-[440px_1fr]" : ""
      )}>
        {/* Poster */}
        <ReceiptPoster
          poster={article.poster_data}
          category={article.category}
          spiceLevel={article.spice_level}
          className={cn(
            featured ? "md:rounded-r-none aspect-[4/5] md:aspect-auto md:min-h-[480px]" : "aspect-[4/5]"
          )}
        />

        {/* Content — Locked section labels */}
        <div className={cn(
          "p-4 md:p-5 space-y-3",
          featured && "md:p-6 md:space-y-4"
        )}>
          {/* Row 1: Heat chip — mobile-first, immediately visible */}
          <div className="flex items-center gap-2 flex-wrap">
            <HeatChip level={article.spice_level} />
            {timeAgo && (
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            )}
          </div>

          {/* Category */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Category</span>
            <p className="text-sm font-medium text-foreground">
              {CATEGORY_DISPLAY[article.category ?? ""] || "News"}
            </p>
          </div>

          {/* Source */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Source</span>
            <p className="text-sm text-foreground">{article.source_name || "Unknown"}</p>
          </div>

          {/* Bias */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Bias</span>
            <div className="mt-0.5">
              <Badge variant="outline" className={cn("text-xs font-semibold", BIAS_COLORS[bias])}>
                {bias}
              </Badge>
            </div>
          </div>

          {/* Heat Level */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Heat Level</span>
            <p className="text-sm font-semibold text-foreground">
              {article.spice_level}/5
            </p>
          </div>

          {/* Headline */}
          <h3 className={cn(
            "font-bold text-foreground leading-tight group-hover:text-primary transition-colors",
            featured ? "text-xl md:text-2xl" : "text-base"
          )}>
            {article.headline}
          </h3>

          {/* The Receipt */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary font-bold">The Receipt</span>
            <p className="text-sm text-foreground/80 leading-relaxed mt-0.5">
              {article.receipt_connection}
            </p>
          </div>

          {/* Jackye's Take */}
          <div className="bg-primary/[0.04] border border-primary/10 rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary font-bold">Jackye's Take</span>
            <p className="text-sm text-foreground/90 leading-relaxed mt-0.5 italic" style={{ fontFamily: "'Georgia', serif" }}>
              "{article.jackye_take}"
            </p>
          </div>

          {/* Why It Matters */}
          {article.debate_prompt && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Why It Matters</span>
              <p className="text-sm text-foreground/80 leading-relaxed mt-0.5">
                {article.debate_prompt}
              </p>
            </div>
          )}

          {/* Use This */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Use This</span>
            <div className="flex flex-wrap gap-2 mt-1">
              <Link
                to="/search"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                Search employer <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                to="/money-trail"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                Follow the money <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Read the Source */}
          {article.source_url && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Read the Source</span>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold mt-0.5"
              >
                {article.source_name || "Original article"} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
