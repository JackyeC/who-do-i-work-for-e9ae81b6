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
  return null;
}

/* ── Emoji template fallback system ── */
const WDIWF_QUOTES = [
  "Every company runs a background check on you. This is yours on them.",
  "The data was always public. Nobody was reading it for you.",
  "Career intelligence, not career advice.",
  "What the offer letter doesn't say is usually the most important part.",
  "Employer brand is marketing. Employer reality is data.",
  "Know the company before the company knows you.",
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

/*
 * ── POSTER PALETTE POOL ──
 * 24 distinct palettes across warm, cool, jewel-tone, earthy, neon, and muted ranges.
 * Each story gets a palette deterministically via headline hash — no two adjacent
 * stories should look the same. Category is used as a secondary signal only.
 */
const PALETTE_POOL: { bg: string; accent: string; dark: string }[] = [
  // Warm editorial
  { bg: "#7B2D26", accent: "#F5C882", dark: "#2E0E0A" },   // Tuscan clay + gold
  { bg: "#8B4513", accent: "#FFD700", dark: "#3A1C00" },   // Saddlebrown + bright gold
  { bg: "#A0522D", accent: "#FAEBD7", dark: "#3B1A0A" },   // Sienna + antique white
  { bg: "#C0392B", accent: "#FFF5E1", dark: "#5A1A12" },   // Valentino Rosso + cream
  // Cool editorial
  { bg: "#005F73", accent: "#FFE66D", dark: "#001219" },   // Deep teal + yellow
  { bg: "#1E3A5F", accent: "#60A5FA", dark: "#0C1B2E" },   // Navy + sky blue
  { bg: "#1A365D", accent: "#90CDF4", dark: "#0A1929" },   // Midnight + ice
  { bg: "#234E70", accent: "#FBD38D", dark: "#0E2233" },   // Steel blue + warm gold
  // Jewel tones
  { bg: "#5A189A", accent: "#E0AAFF", dark: "#10002B" },   // Amethyst + lavender
  { bg: "#6A0572", accent: "#FFD6FF", dark: "#1A001E" },   // Magenta + pink
  { bg: "#1B4332", accent: "#95D5B2", dark: "#081C15" },   // Emerald + sage
  { bg: "#0B3D0B", accent: "#34D399", dark: "#001A00" },   // Forest + mint
  // Earth + neutrals
  { bg: "#2C2C34", accent: "#E8D5B7", dark: "#111115" },   // Charcoal + parchment
  { bg: "#3D3024", accent: "#D4A373", dark: "#1A1410" },   // Espresso + caramel
  { bg: "#4A4238", accent: "#C9B99A", dark: "#201D17" },   // Taupe + sand
  { bg: "#2D3436", accent: "#DFE6E9", dark: "#141819" },   // Graphite + silver
  // Bold + neon
  { bg: "#9D0208", accent: "#FFB3B3", dark: "#370617" },   // Crimson + blush
  { bg: "#370617", accent: "#FF758F", dark: "#1A000A" },   // Oxblood + coral
  { bg: "#0A3200", accent: "#AAFF00", dark: "#051900" },   // Dark green + chartreuse
  { bg: "#1B1464", accent: "#00D4FF", dark: "#0A0A32" },   // Indigo + cyan
  // Luxury muted
  { bg: "#2C1810", accent: "#C4956A", dark: "#150C08" },   // Cocoa + bronze
  { bg: "#1F2937", accent: "#F9FAFB", dark: "#0F1520" },   // Slate + white
  { bg: "#312E81", accent: "#A5B4FC", dark: "#1A1850" },   // Royal purple + periwinkle
  { bg: "#064E3B", accent: "#6EE7B7", dark: "#022C22" },   // Deep teal + seafoam
];

/* Poster copy — category-specific content with varied palettes */
const CATEGORY_COPY: Record<string, { emoji: string; bigTxt: string; sub: string; tag: string; copy: string; fine: string }[]> = {
  ai_workplace: [
    { emoji: "🤖", bigTxt: "AI", sub: "is watching", tag: "automation nation", copy: "Your job title has been optimized.", fine: "*by someone who doesn't do your job" },
    { emoji: "🧠", bigTxt: "ALGO", sub: "made the call", tag: "machine learning", copy: "The algorithm knows best.", fine: "*best for shareholders" },
    { emoji: "⚡", bigTxt: "AUTO", sub: "pilot engaged", tag: "future shock", copy: "We automated your workflow.", fine: "*and your paycheck" },
  ],
  future_of_work: [
    { emoji: "🔮", bigTxt: "FUTURE", sub: "of work™", tag: "disruption incoming", copy: "The future is here. Your desk isn't.", fine: "*remote means we removed your role" },
    { emoji: "🏢", bigTxt: "RTO", sub: "mandatory", tag: "back to the office", copy: "Culture requires proximity.", fine: "*surveillance requires it more" },
    { emoji: "🌐", bigTxt: "HYBRID", sub: "in theory", tag: "flexible work", copy: "Work from anywhere!", fine: "*as long as it's the office" },
  ],
  labor_organizing: [
    { emoji: "✊", bigTxt: "UNION", sub: "busting budget: $$$", tag: "collective action", copy: "They said family. We said contract.", fine: "*family doesn't dock your PTO" },
    { emoji: "📢", bigTxt: "VOICE", sub: "suppressed", tag: "worker power", copy: "We value employee feedback.", fine: "*that agrees with management" },
  ],
  worker_rights: [
    { emoji: "⚖️", bigTxt: "EQUITY", sub: "report: missing", tag: "the culture audit", copy: "Diversity is our strength™", fine: "*our legal team's too" },
    { emoji: "🛡️", bigTxt: "RIGHTS", sub: "under review", tag: "worker protections", copy: "We stand with our employees.", fine: "*in the press release" },
  ],
  regulation: [
    { emoji: "📋", bigTxt: "POLICY", sub: "update pending", tag: "the fine print", copy: "We updated our policy. You didn't notice.", fine: "*that was the point" },
    { emoji: "🔒", bigTxt: "COMPLY", sub: "or else", tag: "regulatory risk", copy: "We take compliance seriously.", fine: "*when we get caught" },
  ],
  layoffs: [
    { emoji: "📦", bigTxt: "CUTS", sub: "restructuring™", tag: "involuntary flexibility", copy: "We're a family. A smaller one.", fine: "*effective immediately" },
    { emoji: "💼", bigTxt: "EXIT", sub: "strategy: yours", tag: "workforce reduction", copy: "We're right-sizing the organization.", fine: "*left-sizing your income" },
    { emoji: "🚪", bigTxt: "LEAN", sub: "and mean", tag: "operational efficiency", copy: "Doing more with less.", fine: "*less people, less benefits, less hope" },
  ],
  pay_equity: [
    { emoji: "💰", bigTxt: "MONEY", sub: "trail exposed", tag: "follow the money", copy: "Competitive salary*", fine: "*competing with poverty" },
    { emoji: "📊", bigTxt: "GAP", sub: "is a feature", tag: "pay transparency", copy: "We believe in fair pay.", fine: "*for executives" },
  ],
  legislation: [
    { emoji: "📝", bigTxt: "HIRING", sub: "or pretending to", tag: "talent acquisition", copy: "We're always hiring!", fine: "*the listing is 8 months old" },
    { emoji: "🏛️", bigTxt: "BILL", sub: "killed quietly", tag: "legislative watch", copy: "Bipartisan support for workers.", fine: "*support for the press release" },
  ],
};

const DEFAULT_COPY = { emoji: "🧾", bigTxt: "RECEIPT", sub: "pulled.", tag: "the receipts", copy: "They thought we wouldn't notice.", fine: "*we noticed" };

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getFallbackPoster(category: string | null, headline?: string): PosterData {
  const hash = hashString(headline || category || "default");

  // Pick palette from pool — deterministic by headline so each story is unique
  const palette = PALETTE_POOL[hash % PALETTE_POOL.length];

  // Pick copy from category variants
  const copies = CATEGORY_COPY[category || ""] || [DEFAULT_COPY];
  const copyData = copies[hash % copies.length];

  return { ...palette, ...copyData };
}

/* ── Poster sizes: LARGE for readability ── */
const POSTER_W_BIG = 540;
const POSTER_H_BIG = 700;
const POSTER_W_SM = 420;
const POSTER_H_SM = 560;

/* ── Emoji template renderer ── */
function EmojiPoster({ poster, big, id, accent, onAccent, wdiwfQuote, className }: {
  poster: PosterData; big: boolean; id: string; accent: string; onAccent: string; wdiwfQuote: string; className?: string;
}) {
  const { bg: pbg, emoji, bigTxt, sub, tag, copy, fine } = poster;
  const w = big ? POSTER_W_BIG : POSTER_W_SM;
  const h = big ? POSTER_H_BIG : POSTER_H_SM;
  return (
    <div
      id={id || undefined}
      className={cn("flex-shrink-0 flex flex-col overflow-hidden rounded-lg relative w-full", className)}
      style={{
        maxWidth: w,
        minHeight: h,
        background: pbg,
        boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`,
      }}
    >
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 8, border: `1.5px solid ${accent}`, opacity: 0.7 }} />
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 12, border: `0.5px solid ${accent}`, opacity: 0.3 }} />

      <div className="flex-shrink-0 text-center" style={{ background: accent, padding: big ? "10px 14px" : "8px 10px" }}>
        <div style={{ fontSize: big ? 14 : 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: onAccent, lineHeight: 1.3 }}>
          JACKYE CLAYTON 👑 × WDIWF
        </div>
        <div style={{ fontSize: big ? 11 : 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: onAccent, opacity: 0.8 }}>
          PRESENTS
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-evenly" style={{ padding: big ? "18px 18px 10px" : "14px 14px 8px", gap: big ? 10 : 8 }}>
        <div className="font-mono text-center" style={{ fontSize: big ? 14 : 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: accent }}>
          {tag}
        </div>
        <div className="text-center" style={{ fontSize: big ? 64 : 48, lineHeight: 1, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.45))" }}>
          {emoji}
        </div>
        <div className="text-center">
          <div style={{ fontSize: big ? 56 : 42, fontWeight: 900, color: accent, lineHeight: 0.9, letterSpacing: "-0.02em", textShadow: `0 0 28px ${accent}55, 0 2px 8px rgba(0,0,0,0.5)`, fontFamily: "'Inter', sans-serif" }}>
            {bigTxt}
          </div>
          <div className="font-mono" style={{ fontSize: big ? 16 : 13, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 8, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {sub}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ width: "76%" }}>
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.5 }} />
          <div className="rounded-full" style={{ width: 5, height: 5, background: accent, opacity: 0.8 }} />
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.5 }} />
        </div>
        <div className="text-center italic" style={{ fontSize: big ? 18 : 14, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.4, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
          "{copy}"
        </div>
        <div className="text-center italic font-mono" style={{ fontSize: big ? 13 : 11, fontWeight: 600, color: accent, lineHeight: 1.4 }}>
          {fine}
        </div>
      </div>

      <div className="flex-shrink-0 text-center" style={{ background: `${accent}22`, borderTop: `1.5px solid ${accent}55`, padding: big ? "12px 16px" : "10px 12px" }}>
        <div className="font-mono" style={{ fontSize: big ? 16 : 14, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.2 }}>
          wdiwf.jackyeclayton.com
        </div>
        <div className="font-mono" style={{ fontSize: big ? 13 : 11, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.4, marginTop: 4 }}>
          {wdiwfQuote}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ReceiptPoster({ poster: rawPoster, category, className, big = false, id = "", headline, onClickEnlarge }: ReceiptPosterProps) {
  const [hover, setHover] = useState(false);
  const vintageImage = matchPosterImage(headline);

  const posterData = rawPoster && rawPoster.bg ? rawPoster : getFallbackPoster(category ?? null, headline);
  const accent = posterData.accent || "#F0C040";
  const onAccent = getTextOnAccent(accent);
  const wdiwfQuote = WDIWF_QUOTES[quoteIdx(id)];

  const imgW = big ? POSTER_W_BIG : POSTER_W_SM;

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: onClickEnlarge ? "pointer" : "default", maxWidth: "100%" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClickEnlarge}
    >
      {vintageImage ? (
        <div
          id={id || undefined}
          className={cn("flex-shrink-0 overflow-hidden rounded-lg relative w-full", className)}
          style={{ maxWidth: imgW, boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
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
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none" style={{ fontSize: big ? 12 : 10, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.8)", textTransform: "uppercase" }}>
            JRC EDIT × WDIWF
          </div>
        </div>
      ) : (
        <EmojiPoster poster={posterData} big={big} id={id} accent={accent} onAccent={onAccent} wdiwfQuote={wdiwfQuote} className={className} />
      )}

      {/* Hover overlay */}
      {onClickEnlarge && (
        <div
          className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.52)", opacity: hover ? 1 : 0, pointerEvents: hover ? "auto" : "none" }}
        >
          <span style={{ fontSize: 32 }}>🔍</span>
          <span className="font-bold text-white text-base" style={{ letterSpacing: "0.05em" }}>Click to enlarge + share</span>
        </div>
      )}
    </div>
  );
}
