import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Linkedin, Facebook, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReceiptPoster } from "./ReceiptPoster";
import { BiasBar, getSourceBiasKey } from "./BiasBar";
import { SpicePeppers } from "./SpicePeppers";
import { HeatChip } from "./HeatChip";
import { EDITORIAL_CATEGORIES, EDITORIAL_CAT_COLORS, USE_THIS_CTA } from "./heat-config";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

interface ReceiptCardProps {
  article: ReceiptArticle;
  featured?: boolean;
  onPosterClick?: (article: ReceiptArticle) => void;
}

export function ReceiptCard({ article, featured = false, onPosterClick }: ReceiptCardProps) {
  const [showTake, setShowTake] = useState(false);
  const editorialCat = EDITORIAL_CATEGORIES[article.category ?? ""] || "THE DAILY GRIND";
  const catColor = EDITORIAL_CAT_COLORS[editorialCat] || "#94A3B8";
  const biasKey = getSourceBiasKey(article.source_name);
  const posterId = `p-${article?.id || "x"}-${featured ? "b" : "s"}`;
  const useCta = USE_THIS_CTA[editorialCat] || USE_THIS_CTA["THE DAILY GRIND"];

  const txt = encodeURIComponent(`"${article.headline}" — via JRC EDIT × WDIWF`);
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
        const fname = `jrc-edit-${(article.headline || "poster").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 36)}.png`;
        const a = document.createElement("a"); a.download = fname; a.href = URL.createObjectURL(blob); a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }, "image/png");
    } catch {}
  };

  return (
    <article className={cn("receipt-card pb-8 mb-8 border-b border-border/30", featured && "pb-12 mb-12")}>
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

      {/* Heat chip */}
      <div className="mb-3">
        <HeatChip level={article.spice_level} />
      </div>

      {/* Share bar */}
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
        <span className="font-black uppercase tracking-[0.2em]" style={{ fontSize: featured ? 14 : 11, color: catColor, fontFamily: "'DM Sans', sans-serif" }}>
          {editorialCat}
        </span>
        {article.spice_level >= 4 && (
          <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded" style={{ background: "#EF4444", color: "#fff" }}>HOT</span>
        )}
        <span className="w-px h-3 bg-border" />
        <span className="text-sm font-mono text-muted-foreground">{article.source_name || "Unknown"}</span>
        {article.source_url && (
          <a href={article.source_url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            style={{ borderBottom: "1px solid hsl(var(--primary) / 0.35)" }}>
            Read the Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {/* Bias — hidden on mobile, visible on md+ or when expanded */}
        <span className={cn("ml-auto", showTake ? "" : "hidden md:inline-flex")}>
          <BiasBar bias={biasKey} big={featured} />
        </span>
      </div>

      {/* Headline */}
      <h2 className="font-black text-foreground leading-tight mb-4 uppercase" style={{ fontSize: featured ? "clamp(30px, 4vw, 50px)" : "clamp(24px, 2.8vw, 34px)", letterSpacing: "-0.02em" }}>
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

      {/* Jackye's Take — expandable (handwritten style) */}
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
            {showTake ? "Hide take ↑" : "The Take →"}
          </button>
          {showTake && (
            <div className="mt-4 mb-4">
              <blockquote className="border-l-[3px] border-primary pl-5 mb-4">
                <p className="text-foreground leading-[1.82]" style={{ fontSize: featured ? 21 : 17, fontStyle: "italic", fontFamily: "'DM Sans', cursive, sans-serif" }}>
                  "{article.jackye_take}"
                </p>
              </blockquote>

              {/* The Receipt */}
              {article.receipt_connection && (
                <div className="p-5 rounded-xl border mb-4" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.2)" }}>
                  <p className="text-[13px] font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">🧾 The Receipt</p>
                  <p className="text-base text-foreground/90 leading-relaxed">{article.receipt_connection}</p>
                </div>
              )}

              {/* Why It Matters */}
              <div className="p-4 rounded-lg border border-border/50 bg-card mb-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Why It Matters</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {article.receipt_connection || article.jackye_take}
                </p>
              </div>

              {/* Use This — dynamic CTA */}
              <Link
                to={useCta.link}
                className="flex items-center justify-between p-4 rounded-lg border-[1.5px] border-primary no-underline gap-3 hover:bg-primary/5 transition-colors mb-3"
                style={{ background: "hsl(var(--primary) / 0.06)" }}
              >
                <span className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary">Use This</span>
                  <span className="text-base font-bold text-foreground">{useCta.label}</span>
                </span>
                <span className="text-xl flex-shrink-0">🔧</span>
              </Link>

              {/* Fix This — permanent secondary CTA */}
              <Link
                to="/search"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 no-underline hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <span className="text-sm text-muted-foreground">Is your company doing this?</span>
                <span className="text-sm font-bold text-primary ml-auto">Solve My Puzzle →</span>
              </Link>
            </div>
          )}
        </>
      )}

      {/* WDIWF Intelligence CTA */}
      <Link
        to="/search"
        className="flex items-center justify-between mt-5 p-4 rounded-lg border-[1.5px] border-primary no-underline gap-3 hover:bg-primary/5 transition-colors"
        style={{ background: "hsl(var(--primary) / 0.06)" }}
      >
        <span className="flex flex-col gap-1">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary">WDIWF Intelligence</span>
          <span className="text-base font-bold text-foreground">See the full receipt on WDIWF →</span>
        </span>
        <span className="text-xl flex-shrink-0">🔍</span>
      </Link>

      {/* JRC EDIT Watermark */}
      <div className="flex justify-end mt-4">
        <span className="text-[10px] tracking-[0.25em] uppercase opacity-0 animate-[fadeIn_1s_ease-in_0.5s_forwards]" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "hsl(var(--muted-foreground))", fontWeight: 300 }}>
          JRC EDIT
        </span>
      </div>
    </article>
  );
}
