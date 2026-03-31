import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Linkedin, Facebook, Twitter } from "lucide-react";
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
  onPosterClick?: (article: ReceiptArticle) => void;
}

export function ReceiptCard({ article, featured = false, onPosterClick }: ReceiptCardProps) {
  const [showTake, setShowTake] = useState(false);
  const catKey = CATEGORY_DISPLAY[article.category ?? ""] || "NEWS";
  const catColor = CAT_COLORS[catKey] || "#EDE8DC";
  const biasKey = getSourceBiasKey(article.source_name);
  const posterId = `p-${article?.id || "x"}-${featured ? "b" : "s"}`;

  const txt = encodeURIComponent(`"${article.headline}" — via The Receipts by Jackye Clayton`);
  const shareUrl = encodeURIComponent("https://wdiwf.jackyeclayton.com/receipts");

  const downloadPoster = async () => {
    const el = document.getElementById(posterId);
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, logging: false });
      const size = Math.max(canvas.width, canvas.height);
      const sq = document.createElement("canvas");
      sq.width = size; sq.height = size;
      const ctx = sq.getContext("2d")!;
      ctx.fillStyle = el.style.background || "#0A0A0E";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(canvas, (size - canvas.width) / 2, (size - canvas.height) / 2);
      sq.toBlob((blob) => {
        if (!blob) return;
        const fname = `receipts-${(article.headline || "poster").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 36)}.png`;
        const a = document.createElement("a"); a.download = fname; a.href = URL.createObjectURL(blob); a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }, "image/png");
    } catch {}
  };

  return (
    <article className={cn("pb-8 mb-8 border-b border-border/30", featured && "pb-12 mb-12")}>
      {/* Poster */}
      <div className={cn("mb-4", featured ? "flex justify-center" : "")}>
        <ReceiptPoster
          poster={article.poster_data}
          category={article.category}
          big={featured}
          id={posterId}
          headline={article.headline}
          onClickEnlarge={onPosterClick ? () => onPosterClick(article) : undefined}
        />
      </div>

      {/* Share bar right below poster */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={downloadPoster} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          📤 Save Image
        </button>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "#0A66C2" }}>
          <Linkedin className="w-3 h-3" /> LinkedIn
        </a>
        <a href={`https://twitter.com/intent/tweet?text=${txt}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-white bg-foreground hover:opacity-90 transition-opacity">
          <Twitter className="w-3 h-3" /> X
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${txt}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "#1877F2" }}>
          <Facebook className="w-3 h-3" /> FB
        </a>
        <a href="https://substack.com/@jackyeclayton" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold border border-primary/40 text-primary hover:bg-primary/5 transition-colors">
          📬 Sub
        </a>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="font-bold uppercase" style={{ fontSize: featured ? 16 : 13, letterSpacing: "0.2em", color: catColor }}>
          {catKey}
        </span>
        {article.spice_level >= 4 && (
          <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded bg-primary text-primary-foreground">HOT</span>
        )}
        <span className="w-px h-3 bg-border" />
        <span className="text-sm font-mono text-muted-foreground">{article.source_name || "Unknown"}</span>
        {article.source_url && (
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            style={{ borderBottom: "1px solid hsl(var(--primary) / 0.35)" }}>
            Read the article <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <span className="ml-auto">
          <BiasBar bias={biasKey} big={featured} />
        </span>
      </div>

      {/* Headline */}
      <h2 className="font-black text-foreground leading-tight mb-4" style={{ fontSize: featured ? "clamp(30px, 4vw, 50px)" : "clamp(24px, 2.8vw, 34px)" }}>
        {article.headline}
      </h2>

      {/* Spice peppers */}
      <div className="mb-5 flex items-center gap-3">
        <SpicePeppers level={article.spice_level} big={featured} />
      </div>

      {/* The Debate */}
      {article.debate_prompt && article.debate_sides && article.debate_sides.length > 0 && (
        <div className="mb-4 p-5 rounded-xl border border-border bg-card">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary mb-3">💬 The Debate</p>
          <p className="text-lg font-bold text-foreground leading-snug mb-4">{article.debate_prompt}</p>
          {article.debate_sides.map((side, i) => (
            <div key={i} className="mb-2">
              <button className="w-full text-left p-3.5 rounded-lg text-base border border-border bg-card hover:border-primary/40 transition-colors text-foreground leading-snug">
                {side}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Jackye's Take — expandable */}
      {article.jackye_take && (
        <>
          <button
            onClick={() => setShowTake(!showTake)}
            className={cn(
              "font-bold text-primary hover:bg-primary/5 transition-colors mb-3",
              featured ? "border border-primary/40 rounded-lg px-5 py-3" : "border-none p-0"
            )}
            style={{ fontSize: featured ? 17 : 16, letterSpacing: "0.04em" }}
          >
            {showTake ? "Hide take ↑" : "Jackye's take →"}
          </button>
          {showTake && (
            <div className="mt-4 mb-4">
              <blockquote className="border-l-[3px] border-primary pl-5 mb-4">
                <p className="text-foreground italic leading-[1.82]" style={{ fontSize: featured ? 21 : 17 }}>
                  "{article.jackye_take}"
                </p>
              </blockquote>
              {article.receipt_connection && (
                <div className="p-5 rounded-xl border" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.2)" }}>
                  <p className="text-[13px] font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">🧾 The Receipts</p>
                  <p className="text-base text-foreground/90 leading-relaxed">{article.receipt_connection}</p>
                </div>
              )}
            </div>
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
          <span className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary">W? WDIWF Intelligence</span>
          <span className="text-base font-bold text-foreground">See the full receipt on WDIWF →</span>
        </span>
        <span className="text-xl flex-shrink-0">🔍</span>
      </Link>
    </article>
  );
}
