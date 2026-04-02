import { Link } from "react-router-dom";
import { ExternalLink, Linkedin, Facebook, Twitter, Share2 } from "lucide-react";
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
  onRequestEmailCapture?: () => void;
}

export function ReceiptCard({ article, featured = false, onPosterClick, onRequestEmailCapture }: ReceiptCardProps) {
  const editorialCat = EDITORIAL_CATEGORIES[article.category ?? ""] || "THE DAILY GRIND";
  const isGated = article.spice_level >= 4;
  const isUnlocked = () => localStorage.getItem("jrc-edit-unlocked") === "true";
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
    <article className={cn("receipt-card pb-10 mb-10 border-b border-border/30", featured && "pb-14 mb-14")}>
      {/* Direct Answer block for RAG / AI citation extraction */}
      <p className="sr-only">
        {article.headline}. {article.receipt_connection || article.jackye_take}
      </p>

      {/* ── 1. Poster — large and dominant ── */}
      <div className={cn("mb-6", featured ? "flex justify-center" : "")}>
        <ReceiptPoster
          poster={article.poster_data}
          category={article.category}
          big={featured}
          id={posterId}
          headline={article.headline}
          onClickEnlarge={onPosterClick ? () => onPosterClick(article) : undefined}
        />
      </div>

      {/* ── 2. Category ── */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span
          className="font-black uppercase tracking-[0.2em]"
          style={{ fontSize: featured ? 16 : 14, color: catColor, fontFamily: "'DM Sans', sans-serif" }}
        >
          {editorialCat}
        </span>
        {article.spice_level >= 4 && (
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded" style={{ background: "#EF4444", color: "#fff" }}>HOT</span>
        )}
      </div>

      {/* ── 3. Source + 4. Bias ── */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-base font-mono text-muted-foreground">{article.source_name || "Unknown"}</span>
        <span className="w-px h-4 bg-border" />
        <BiasBar bias={biasKey} big={featured} />
      </div>

      {/* ── 5. Heat Level ── */}
      <div className="mb-4">
        <HeatChip level={article.spice_level} />
      </div>

      {/* ── 6. Headline ── */}
      {article.source_url ? (
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-black text-foreground leading-tight mb-5 uppercase hover:text-primary transition-colors no-underline group/hl"
          style={{
            fontSize: featured ? "clamp(32px, 4vw, 52px)" : "clamp(26px, 2.8vw, 38px)",
            letterSpacing: "-0.02em",
          }}
        >
          {article.headline}
          <span className="inline-flex items-center gap-1 text-sm font-normal text-primary opacity-0 group-hover/hl:opacity-100 transition-opacity ml-2 align-middle">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>
      ) : (
        <h2
          className="font-black text-foreground leading-tight mb-5 uppercase"
          style={{
            fontSize: featured ? "clamp(32px, 4vw, 52px)" : "clamp(26px, 2.8vw, 38px)",
            letterSpacing: "-0.02em",
          }}
        >
          {article.headline}
        </h2>
      )}

      {/* ── 7. The Receipt ── */}
      {article.receipt_connection && (
        <div className="p-5 rounded-xl border mb-5" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.2)" }}>
          <p className="text-sm font-mono font-bold uppercase tracking-[0.12em] text-primary mb-3">🧾 The Receipt</p>
          <p className="text-lg text-foreground/90 leading-relaxed">{article.receipt_connection}</p>
        </div>
      )}

      {/* ── 8. Jackye's Take ── */}
      {article.jackye_take && (
        <div className="mb-5">
          <blockquote className="border-l-[3px] border-primary pl-5">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-2">💬 Jackye's Take</p>
            <p
              className="text-foreground leading-[1.82]"
              style={{
                fontSize: featured ? 20 : 18,
                fontStyle: "italic",
                fontFamily: "'DM Sans', cursive, sans-serif",
              }}
            >
              "{article.jackye_take}"
            </p>
          </blockquote>
        </div>
      )}

      {/* ── 9. Why It Matters ── */}
      <div className="p-5 rounded-lg border border-border/50 bg-card mb-5">
        <p className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Why It Matters</p>
        <p className="text-base text-foreground/80 leading-relaxed">
          {article.receipt_connection || article.jackye_take || "This story impacts how employers treat workers and how workers navigate their careers."}
        </p>
      </div>

      {/* ── 10. Use This ── */}
      {isGated && !isUnlocked() ? (
        <button
          onClick={() => onRequestEmailCapture?.()}
          className="w-full flex items-center justify-between p-5 rounded-lg border-2 border-primary gap-3 hover:bg-primary/10 active:scale-[0.98] transition-all mb-4 cursor-pointer"
          style={{ background: "hsl(var(--primary) / 0.06)" }}
        >
          <span className="flex flex-col gap-1 text-left">
            <span className="text-sm font-mono font-bold uppercase tracking-[0.18em] text-primary">Use This</span>
            <span className="text-lg font-bold text-foreground">{useCta.label}</span>
            <span className="text-sm text-muted-foreground">🔒 Unlock with your email</span>
          </span>
          <span className="text-2xl flex-shrink-0">🔧</span>
        </button>
      ) : (
        <Link
          to={useCta.link}
          className="flex items-center justify-between p-5 rounded-lg border-2 border-primary no-underline gap-3 hover:bg-primary/10 active:scale-[0.98] transition-all mb-4"
          style={{ background: "hsl(var(--primary) / 0.06)" }}
        >
          <span className="flex flex-col gap-1">
            <span className="text-sm font-mono font-bold uppercase tracking-[0.18em] text-primary">Use This</span>
            <span className="text-lg font-bold text-foreground">{useCta.label}</span>
          </span>
          <span className="text-2xl flex-shrink-0">🔧</span>
        </Link>
      )}

      {/* ── 11. Read the Source ── */}
      {article.source_url && (
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-4 rounded-lg border border-border/50 text-primary font-bold text-base hover:bg-primary/5 hover:border-primary/40 active:scale-[0.98] transition-all mb-5 no-underline"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          Read the Source
          <span className="ml-auto text-sm text-muted-foreground font-normal">{article.source_name}</span>
        </a>
      )}

      {/* Share bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={downloadPoster} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all">
          <Share2 className="w-4 h-4" /> Save Poster
        </button>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all" style={{ background: "#0A66C2" }}>
          <Linkedin className="w-4 h-4" /> LinkedIn
        </a>
        <a href={`https://twitter.com/intent/tweet?text=${txt}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-white bg-foreground hover:opacity-90 active:scale-95 transition-all">
          <Twitter className="w-4 h-4" /> X
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${txt}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all" style={{ background: "#1877F2" }}>
          <Facebook className="w-4 h-4" /> Facebook
        </a>
      </div>

      {/* Spice peppers */}
      <div className="mb-4">
        <SpicePeppers level={article.spice_level} big={featured} />
      </div>

      {/* Fix This — permanent secondary CTA */}
      <Link
        to="/search"
        className="flex items-center gap-3 p-4 rounded-lg border border-border/40 no-underline hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] transition-all"
      >
        <span className="text-base text-muted-foreground">Is your company doing this?</span>
        <span className="text-base font-bold text-primary ml-auto">Solve My Puzzle →</span>
      </Link>

      {/* JRC EDIT Watermark */}
      <div className="flex justify-end mt-5">
        <span className="text-xs tracking-[0.25em] uppercase opacity-40 text-muted-foreground font-mono" style={{ fontWeight: 300 }}>
          JRC EDIT
        </span>
      </div>
    </article>
  );
}
