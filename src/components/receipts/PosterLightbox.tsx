import { useEffect, useCallback } from "react";
import { Linkedin, Facebook, Twitter, X } from "lucide-react";
import { BiasBar, getSourceBiasKey } from "./BiasBar";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

// Poster pool for lightbox — matches Newsletter.tsx
const CDN = "/posters";
const ALL_POSTERS = [
  `${CDN}/poster-jackye-throne.jpg`, `${CDN}/poster-jackye-receipts.jpg`, `${CDN}/poster-jackye-broadcast.jpg`,
  `${CDN}/poster-boardroom.jpg`, `${CDN}/poster-golden-parachute.jpg`, `${CDN}/poster-ghost-jobs.jpg`,
  `${CDN}/poster-water-cooler.jpg`, `${CDN}/poster-supply-chain.jpg`, `${CDN}/poster-rto-commute.jpg`,
  `${CDN}/poster-surveillance.jpg`, `${CDN}/poster-tech-stack.jpg`, `${CDN}/poster-robot-helper.jpg`,
  `${CDN}/poster-fewer-humans.jpg`, `${CDN}/poster-follow-money.jpg`, `${CDN}/poster-exit-interview.jpg`,
  `${CDN}/poster-dei-rollback.jpg`, `${CDN}/poster-smile-more.jpg`, `${CDN}/poster-pay-ratio.jpg`,
];
function getPosterForArticle(article: ReceiptArticle): string {
  const s = article.headline || article.id || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ALL_POSTERS[Math.abs(h) % ALL_POSTERS.length];
}

const CAT_COLORS: Record<string, string> = {
  ai_workplace: "#38BDF8",
  future_of_work: "#F0C040",
  labor_organizing: "#2DD4BF",
  worker_rights: "#A78BFA",
  regulation: "#FB7185",
  layoffs: "#FB7185",
  pay_equity: "#34D399",
  legislation: "#60A5FA",
};

interface PosterLightboxProps {
  article: ReceiptArticle | null;
  onClose: () => void;
}

export function PosterLightbox({ article, onClose }: PosterLightboxProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  if (!article) return null;
  const catColor = CAT_COLORS[article.category ?? ""] || "#EDE8DC";
  const biasKey = getSourceBiasKey(article.source_name);
  const lid = `lb-${article?.id}`;

  const downloadPoster = async () => {
    const el = document.getElementById(lid);
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, logging: false });
      const size = Math.max(canvas.width, canvas.height);
      const sq = document.createElement("canvas");
      sq.width = size;
      sq.height = size;
      const ctx = sq.getContext("2d")!;
      ctx.fillStyle = el.style.background || "#0A0A0E";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(canvas, (size - canvas.width) / 2, (size - canvas.height) / 2);
      sq.toBlob((blob) => {
        if (!blob) return;
        const fname = `receipts-${(article.headline || "poster").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 36)}.png`;
        const a = document.createElement("a");
        a.download = fname;
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }, "image/png");
    } catch {}
  };

  const txt = encodeURIComponent(`"${article.headline}" — Jackye's Take: ${(article.jackye_take || "").split(/(?<=[.!?])\s/)[0]}\n\n\u{1F4F0} via \u{265B}DIWF by Jackye Clayton`);
  const shareUrl = encodeURIComponent("https://wdiwf.jackyeclayton.com/newsletter");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.9)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl p-8 max-w-[520px] w-full border border-border animate-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
      >
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="border border-border text-muted-foreground rounded-md px-3 py-1 text-sm hover:bg-muted/20 transition-colors">
            <X className="w-3.5 h-3.5 inline mr-1" /> Close
          </button>
        </div>
        <div className="flex justify-center mb-5">
          <div
            id={lid}
            className="relative w-full max-w-[480px] aspect-[3/4] rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${article.poster_url || getPosterForArticle(article)})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <h2 className="text-white text-lg font-black leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
                {article.headline}
              </h2>
              {article.jackye_take && (
                <p className="text-primary/90 text-sm font-bold mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  👑 {article.jackye_take.split(/(?<=[.!?])\s/)[0]}
                </p>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0A0A0E]/90 flex items-center px-3 z-20">
              <span className="text-[10px] font-bold text-primary font-mono tracking-wider">W?</span>
              <span className="text-[9px] text-[#F0EBE0]/60 font-mono ml-2">WhoDoIWorkFor.com</span>
              <span className="text-[9px] text-[#F0EBE0]/40 font-mono ml-auto">by Jackye Clayton</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: catColor }}>
            {article.category?.replace("_", " ") || "NEWS"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{article.source_name}</span>
          <BiasBar bias={biasKey} big />
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={downloadPoster} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            📤 Save Image
          </button>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#0A66C2" }}
          >
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${txt}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold text-white bg-foreground hover:opacity-90 transition-opacity"
          >
            <Twitter className="w-3.5 h-3.5" /> X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${txt}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#1877F2" }}
          >
            <Facebook className="w-3.5 h-3.5" /> FB
          </a>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 font-mono leading-relaxed">
          💡 Tap "Save Image" → post to Instagram, LinkedIn, Stories. On desktop it downloads the PNG.
        </p>
      </div>
    </div>
  );
}
