import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReceiptPoster } from "./ReceiptPoster";
import { BiasBar, getSourceBiasKey } from "./BiasBar";
import { SpicePeppers } from "./SpicePeppers";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_workplace: "AI",
  future_of_work: "WORK",
  labor_organizing: "LABOR",
  worker_rights: "DEI",
  regulation: "POLICY",
  layoffs: "LAYOFFS",
  pay_equity: "MONEY",
  legislation: "HIRING",
  general: "NEWS",
};

const CAT_COLORS: Record<string, string> = {
  AI: "#38BDF8",
  WORK: "#F0C040",
  POLICY: "#FB7185",
  LABOR: "#2DD4BF",
  DEI: "#A78BFA",
  MONEY: "#34D399",
  HIRING: "#60A5FA",
  LAYOFFS: "#FB7185",
  NEWS: "#EDE8DC",
};

interface ReceiptCardProps {
  article: ReceiptArticle;
  featured?: boolean;
}

export function ReceiptCard({ article, featured = false }: ReceiptCardProps) {
  const [showTake, setShowTake] = useState(false);
  const catKey = CATEGORY_DISPLAY[article.category ?? ""] || "NEWS";
  const catColor = CAT_COLORS[catKey] || "#EDE8DC";
  const biasKey = getSourceBiasKey(article.source_name);
  const posterId = `p-${article?.id || "x"}-${featured ? "b" : "s"}`;

  return (
    <article className="pb-8 mb-8 border-b border-border/30">
      {/* Poster */}
      <div className={cn("mb-4", featured ? "flex justify-center" : "")}>
        <ReceiptPoster
          poster={article.poster_data}
          category={article.category}
          spiceLevel={article.spice_level}
          big={featured}
          id={posterId}
        />
      </div>

      {/* Meta row: Category, Source, Read the article, Bias */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span
          className="font-bold uppercase"
          style={{
            fontSize: featured ? 16 : 13,
            letterSpacing: "0.2em",
            color: catColor,
          }}
        >
          {catKey}
        </span>
        <span className="w-px h-3 bg-border" />
        <span className="text-sm font-mono text-muted-foreground">
          {article.source_name || "Unknown"}
        </span>
        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            style={{ borderBottom: "1px solid hsl(var(--primary) / 0.35)" }}
          >
            Read the article <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <span className="ml-auto">
          <BiasBar bias={biasKey} big={featured} />
        </span>
      </div>

      {/* Headline */}
      <h2
        className="font-bold text-foreground leading-tight mb-4"
        style={{ fontSize: featured ? "clamp(30px, 4vw, 50px)" : "clamp(24px, 2.8vw, 34px)" }}
      >
        {article.headline}
      </h2>

      {/* Spice peppers */}
      <div className="mb-5 flex items-center gap-3">
        <SpicePeppers level={article.spice_level} big={featured} />
      </div>

      {/* The Receipt */}
      {article.receipt_connection && (
        <div className="mb-4 p-5 rounded-xl border" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.2)" }}>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">
            🧾 The Receipt
          </p>
          <p className="text-base text-foreground/90 leading-relaxed">
            {article.receipt_connection}
          </p>
        </div>
      )}

      {/* Debate prompt / Why It Matters */}
      {article.debate_prompt && (
        <div className="mb-4 p-5 rounded-xl border border-border bg-card">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">
            💬 Why It Matters
          </p>
          <p className="text-lg font-bold text-foreground leading-snug">
            {article.debate_prompt}
          </p>
        </div>
      )}

      {/* Jackye's Take — expandable */}
      {article.jackye_take && (
        <>
          <button
            onClick={() => setShowTake(!showTake)}
            className="font-bold text-primary border border-primary/30 rounded-lg px-5 py-3 hover:bg-primary/5 transition-colors mb-3"
            style={{ fontSize: featured ? 17 : 16, letterSpacing: "0.05em" }}
          >
            {showTake ? "Hide take ↑" : "Jackye's take →"}
          </button>
          {showTake && (
            <blockquote className="mt-4 mb-4 border-l-[3px] border-primary pl-5">
              <p
                className="text-foreground italic leading-[1.82]"
                style={{ fontSize: featured ? 21 : 17 }}
              >
                "{article.jackye_take}"
              </p>
            </blockquote>
          )}
        </>
      )}

      {/* WDIWF Action CTA */}
      <Link
        to="/search"
        className="flex items-center justify-between mt-5 p-4 rounded-lg border-[1.5px] border-primary no-underline gap-3 hover:bg-primary/5 transition-colors"
        style={{ background: "hsl(var(--primary) / 0.06)" }}
      >
        <span className="flex flex-col gap-1">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary">
            W? WDIWF Intelligence
          </span>
          <span className="text-base font-bold text-foreground">
            See the full receipt on WDIWF →
          </span>
        </span>
        <span className="text-xl flex-shrink-0">🔍</span>
      </Link>
    </article>
  );
}
