import { useState } from "react";
import { cn } from "@/lib/utils";

// Import vintage ad poster images
import posterAiTrust from "@/assets/posters/poster-ai-trust.jpg";
import posterLayoffs from "@/assets/posters/poster-layoffs.jpg";
import posterRestructuring from "@/assets/posters/poster-restructuring.jpg";
import posterHealthcare from "@/assets/posters/poster-healthcare.jpg";
import posterStruggling from "@/assets/posters/poster-struggling.jpg";
import posterTrillion from "@/assets/posters/poster-trillion.jpg";

interface PosterData {
  bg: string;
  accent: string;
  dark: string;
  emoji: string;
  bigTxt: string;
  sub: string;
  tag: string;
  copy: string;
  fine: string;
}

interface ReceiptPosterProps {
  poster: PosterData | null | undefined;
  category?: string | null;
  spiceLevel?: number;
  className?: string;
  big?: boolean;
  id?: string;
  headline?: string;
  onClickEnlarge?: () => void;
}

/* ── Vintage ad image matching ── */
const POSTER_IMAGE_RULES: { keywords: string[]; image: string }[] = [
  { keywords: ["nvidia", "trillion", "inference", "orders"], image: posterTrillion },
  { keywords: ["layoff", "cuts", "job cuts", "workforce drop", "plans job", "workforce drops"], image: posterLayoffs },
  { keywords: ["restructuring", "fired", "pink slip", "let go"], image: posterRestructuring },
  { keywords: ["healthcare", "hospital", "nurse", "health sector", "job growth"], image: posterHealthcare },
  { keywords: ["struggling", "thriving", "gallup", "miserable", "wellbeing"], image: posterStruggling },
];

function matchPosterImage(headline: string | undefined): string | null {
  const h = (headline || "").toLowerCase();
  for (const rule of POSTER_IMAGE_RULES) {
    if (rule.keywords.some((kw) => h.includes(kw))) return rule.image;
  }
  return null; // no match → use emoji template fallback
}

/* ── Emoji template fallback system ── */
const WDIWF_QUOTES = [
  "Stop applying. Start aligning.",
  "We pull the receipts.",
  "Career intelligence. Not paid reviews.",
  "Every company runs a check on you. WDIWF runs one on them.",
  "Intelligence meets defiance.",
  "Know before you go.",
];

function quoteIdx(id: string) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) & 0xffff;
  return n % WDIWF_QUOTES.length;
}

function getTextOnAccent(accent: string): string {
  const hex = (accent || "#F0C040").replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#000" : "#FFF";
}

const FALLBACK_POSTERS: Record<string, PosterData> = {
  ai_workplace: { bg: "#005F73", accent: "#FFE66D", dark: "#001219", emoji: "🤖", bigTxt: "AI", sub: "is watching", tag: "automation nation", copy: "Your job title has been optimized.", fine: "*by someone who doesn't do your job" },
  future_of_work: { bg: "#5A189A", accent: "#E0AAFF", dark: "#10002B", emoji: "🔮", bigTxt: "FUTURE", sub: "of work™", tag: "disruption incoming", copy: "The future is here. Your desk isn't.", fine: "*remote means we removed your role" },
  labor_organizing: { bg: "#1B4332", accent: "#95D5B2", dark: "#081C15", emoji: "✊", bigTxt: "UNION", sub: "busting budget: $$$", tag: "collective action", copy: "They said family. We said contract.", fine: "*family doesn't dock your PTO" },
  worker_rights: { bg: "#6A0572", accent: "#FFD6FF", dark: "#1A001E", emoji: "⚖️", bigTxt: "EQUITY", sub: "report: missing", tag: "the culture audit", copy: "Diversity is our strength™", fine: "*our legal team's too" },
  regulation: { bg: "#9D0208", accent: "#FFB3B3", dark: "#370617", emoji: "📋", bigTxt: "POLICY", sub: "update pending", tag: "the fine print", copy: "We updated our policy. You didn't notice.", fine: "*that was the point" },
  layoffs: { bg: "#370617", accent: "#FF758F", dark: "#1A000A", emoji: "📦", bigTxt: "CUTS", sub: "restructuring™", tag: "involuntary flexibility", copy: "We're a family. A smaller one.", fine: "*effective immediately" },
  pay_equity: { bg: "#0B3D0B", accent: "#34D399", dark: "#001A00", emoji: "💰", bigTxt: "MONEY", sub: "trail exposed", tag: "follow the money", copy: "Competitive salary*", fine: "*competing with poverty" },
  legislation: { bg: "#1E3A5F", accent: "#60A5FA", dark: "#0C1B2E", emoji: "📝", bigTxt: "HIRING", sub: "or pretending to", tag: "talent acquisition", copy: "We're always hiring!", fine: "*the listing is 8 months old" },
};

const DEFAULT_FALLBACK: PosterData = { bg: "#1A1A2E", accent: "#F0C040", dark: "#0A0A1A", emoji: "🧾", bigTxt: "RECEIPT", sub: "pulled.", tag: "the receipts", copy: "They thought we wouldn't notice.", fine: "*we noticed" };

function getFallbackPoster(category: string | null): PosterData {
  return FALLBACK_POSTERS[category || ""] || DEFAULT_FALLBACK;
}

/* ── Emoji template renderer ── */
function EmojiPoster({ poster, big, id, accent, onAccent, wdiwfQuote, className }: {
  poster: PosterData; big: boolean; id: string; accent: string; onAccent: string; wdiwfQuote: string; className?: string;
}) {
  const { bg: pbg, emoji, bigTxt, sub, tag, copy, fine } = poster;
  return (
    <div
      id={id || undefined}
      className={cn("flex-shrink-0 flex flex-col overflow-hidden rounded-lg relative", className)}
      style={{
        width: big ? 320 : 220,
        minHeight: big ? 440 : 320,
        background: pbg,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      }}
    >
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 7, border: `1.5px solid ${accent}`, opacity: 0.7 }} />
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 11, border: `0.5px solid ${accent}`, opacity: 0.3 }} />

      <div className="flex-shrink-0 text-center" style={{ background: accent, padding: big ? "8px 12px" : "6px 8px" }}>
        <div style={{ fontSize: big ? 12 : 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: onAccent, lineHeight: 1.3 }}>
          JACKYE CLAYTON 👑 × WDIWF
        </div>
        <div style={{ fontSize: big ? 10 : 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: onAccent, opacity: 0.8 }}>
          PRESENTS
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-evenly" style={{ padding: big ? "20px 20px 10px" : "16px 14px 8px", gap: big ? 14 : 10 }}>
        <div className="font-mono text-center" style={{ fontSize: big ? 16 : 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: accent }}>
          {tag}
        </div>
        <div className="text-center" style={{ fontSize: big ? 80 : 64, lineHeight: 1, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.45))" }}>
          {emoji}
        </div>
        <div className="text-center">
          <div style={{ fontSize: big ? 64 : 48, fontWeight: 900, color: accent, lineHeight: 0.9, letterSpacing: "-0.02em", textShadow: `0 0 28px ${accent}55, 0 2px 8px rgba(0,0,0,0.5)`, fontFamily: "'Inter', sans-serif" }}>
            {bigTxt}
          </div>
          <div className="font-mono" style={{ fontSize: big ? 20 : 16, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 8, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {sub}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ width: "76%" }}>
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.5 }} />
          <div className="rounded-full" style={{ width: 5, height: 5, background: accent, opacity: 0.8 }} />
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.5 }} />
        </div>
        <div className="text-center italic" style={{ fontSize: big ? 22 : 18, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.4, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
          "{copy}"
        </div>
        <div className="text-center italic font-mono" style={{ fontSize: big ? 16 : 14, fontWeight: 600, color: accent, lineHeight: 1.4 }}>
          {fine}
        </div>
      </div>

      <div className="flex-shrink-0 text-center" style={{ background: `${accent}22`, borderTop: `1.5px solid ${accent}55`, padding: big ? "10px 14px" : "8px 10px" }}>
        <div className="font-mono" style={{ fontSize: big ? 15 : 13, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.2 }}>
          wdiwf.jackyeclayton.com
        </div>
        <div className="font-mono" style={{ fontSize: big ? 12 : 10, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.4, marginTop: 4 }}>
          {wdiwfQuote}
        </div>
      </div>
    </div>
  );
}

/* ── Main component: uses vintage ad image if matched, emoji template otherwise ── */
export function ReceiptPoster({ poster: rawPoster, category, className, big = false, id = "", headline, onClickEnlarge }: ReceiptPosterProps) {
  const [hover, setHover] = useState(false);
  const vintageImage = matchPosterImage(headline);

  // For emoji fallback
  const posterData = rawPoster && rawPoster.bg ? rawPoster : getFallbackPoster(category ?? null);
  const accent = posterData.accent || "#F0C040";
  const onAccent = getTextOnAccent(accent);
  const wdiwfQuote = WDIWF_QUOTES[quoteIdx(id)];

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: onClickEnlarge ? "pointer" : "default" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClickEnlarge}
    >
      {vintageImage ? (
        /* ── Vintage ad image poster ── */
        <div
          id={id || undefined}
          className={cn("flex-shrink-0 overflow-hidden rounded-lg relative", className)}
          style={{ width: big ? 340 : 220, boxShadow: "0 12px 40px rgba(0,0,0,0.55)" }}
        >
          <img
            src={vintageImage}
            alt={headline || "The Receipts poster"}
            loading="lazy"
            className="w-full h-auto block"
            style={{ filter: "contrast(1.05) saturate(0.92) sepia(0.08)" }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,248,230,0.12) 0%, rgba(0,0,0,0.08) 100%)", mixBlendMode: "multiply" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.25)" }} />
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none" style={{ fontSize: big ? 10 : 8, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.8)", textTransform: "uppercase" }}>
            THE RECEIPTS × WDIWF
          </div>
        </div>
      ) : (
        /* ── Emoji template poster ── */
        <EmojiPoster poster={posterData} big={big} id={id} accent={accent} onAccent={onAccent} wdiwfQuote={wdiwfQuote} className={className} />
      )}

      {/* Hover overlay */}
      {onClickEnlarge && (
        <div
          className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2 transition-opacity duration-150"
          style={{ background: "rgba(0,0,0,0.52)", opacity: hover ? 1 : 0, pointerEvents: hover ? "auto" : "none" }}
        >
          <span style={{ fontSize: 26 }}>🔍</span>
          <span className="font-bold text-white" style={{ fontSize: 13, letterSpacing: "0.05em" }}>Click to enlarge + share</span>
        </div>
      )}
    </div>
  );
}
