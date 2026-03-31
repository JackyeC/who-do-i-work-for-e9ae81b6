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
    { emoji: "🤖", bigTxt: "AI", sub: "in the workplace", tag: "automation watch", copy: "The algorithm is making decisions about your career.", fine: "Who audits the auditor?" },
    { emoji: "🧠", bigTxt: "ALGO", sub: "hiring now", tag: "machine decisions", copy: "Automated screening is not neutral screening.", fine: "Bias doesn't disappear because it's coded." },
    { emoji: "⚡", bigTxt: "AUTO", sub: "mated", tag: "workforce automation", copy: "Efficiency gains. For whom, exactly?", fine: "The productivity math rarely includes the workers." },
  ],
  future_of_work: [
    { emoji: "🔮", bigTxt: "FUTURE", sub: "of work", tag: "workforce trends", copy: "The workplace is being redesigned. Were you consulted?", fine: "Policy changes deserve worker input." },
    { emoji: "🏢", bigTxt: "RTO", sub: "mandated", tag: "return to office", copy: "Culture is not a zip code.", fine: "Track what the data says about productivity." },
    { emoji: "🌐", bigTxt: "HYBRID", sub: "policy shift", tag: "flexible work", copy: "Flexibility without structure is just ambiguity.", fine: "Read the fine print on remote policies." },
  ],
  labor_organizing: [
    { emoji: "✊", bigTxt: "LABOR", sub: "in motion", tag: "collective action", copy: "Workers are organizing. Here's what the filings show.", fine: "Follow the NLRB docket." },
    { emoji: "📢", bigTxt: "VOICE", sub: "on record", tag: "worker power", copy: "Employee feedback channels work both ways.", fine: "Public filings tell you which way." },
  ],
  worker_rights: [
    { emoji: "⚖️", bigTxt: "EQUITY", sub: "under review", tag: "workplace equity", copy: "Commitment to equity is measurable. Measure it.", fine: "EEOC data is public record." },
    { emoji: "🛡️", bigTxt: "RIGHTS", sub: "at stake", tag: "worker protections", copy: "Workplace protections exist. Are they being enforced?", fine: "Check the enforcement record." },
  ],
  regulation: [
    { emoji: "📋", bigTxt: "POLICY", sub: "update", tag: "regulatory watch", copy: "New regulation, new compliance landscape.", fine: "What changes for workers on the ground?" },
    { emoji: "🔒", bigTxt: "COMPLY", sub: "or disclose", tag: "regulatory risk", copy: "Compliance isn't optional. Transparency shouldn't be either.", fine: "Review the enforcement history." },
  ],
  layoffs: [
    { emoji: "📦", bigTxt: "CUTS", sub: "announced", tag: "workforce reduction", copy: "Restructuring is a strategy. So is understanding who it impacts.", fine: "WARN notices are public." },
    { emoji: "💼", bigTxt: "EXIT", sub: "strategy", tag: "workforce planning", copy: "Right-sizing has a human cost. Here are the numbers.", fine: "Track the pattern across quarters." },
    { emoji: "🚪", bigTxt: "LEAN", sub: "operations", tag: "headcount changes", copy: "Efficiency gains often come from the people doing the work.", fine: "What does the WARN data show?" },
  ],
  pay_equity: [
    { emoji: "💰", bigTxt: "PAY", sub: "transparency", tag: "compensation data", copy: "Competitive compensation is verifiable. Verify it.", fine: "BLS benchmarks are available." },
    { emoji: "📊", bigTxt: "GAP", sub: "analysis", tag: "pay equity", copy: "Pay gaps aren't opinions. They're data points.", fine: "Compare against industry benchmarks." },
  ],
  legislation: [
    { emoji: "📝", bigTxt: "HIRING", sub: "practices", tag: "talent acquisition", copy: "Open roles tell a story. So do the ones that never close.", fine: "Ghost jobs are a pattern, not an accident." },
    { emoji: "🏛️", bigTxt: "BILL", sub: "in committee", tag: "legislative watch", copy: "Legislation moves faster than most workers realize.", fine: "Track who's lobbying for and against." },
  ],
};

const DEFAULT_COPY = { emoji: "🧾", bigTxt: "RECEIPT", sub: "on file", tag: "the record", copy: "The public record is available. We're reading it.", fine: "Data over narrative." };

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

/* ── Editorial poster: strict 3-level hierarchy ── */
function EmojiPoster({ poster, big, id, accent, onAccent, className }: {
  poster: PosterData; big: boolean; id: string; accent: string; onAccent: string; className?: string;
}) {
  const { bg: pbg, bigTxt, copy, fine, tag } = poster;
  const w = big ? POSTER_W_BIG : POSTER_W_SM;
  const h = big ? POSTER_H_BIG : POSTER_H_SM;

  // Compute high-contrast headline color — always white or accent, whichever has more contrast against bg
  const bgHex = (pbg || "#0A0A0E").replace("#", "");
  const bgLum = (0.299 * parseInt(bgHex.substr(0, 2), 16) + 0.587 * parseInt(bgHex.substr(2, 2), 16) + 0.114 * parseInt(bgHex.substr(4, 2), 16)) / 255;
  const headlineColor = bgLum < 0.4 ? "#FFFFFF" : "#000000";

  return (
    <div
      id={id || undefined}
      className={cn("flex-shrink-0 flex flex-col overflow-hidden rounded-lg relative w-full", className)}
      style={{
        maxWidth: w,
        minHeight: h,
        background: pbg,
        boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px ${accent}18`,
      }}
    >
      {/* Single thin border frame */}
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 10, border: `1px solid ${accent}44` }} />

      {/* TERTIARY: Brand lockup — small, top-left, unmistakable */}
      <div className="flex-shrink-0 flex items-center justify-between" style={{ padding: big ? "16px 20px 0" : "12px 16px 0" }}>
        <div style={{ fontSize: big ? 10 : 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: accent, opacity: 0.9, fontFamily: "'Inter', sans-serif" }}>
          WDIWF
        </div>
        <div style={{ fontSize: big ? 10 : 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: headlineColor, opacity: 0.4, fontFamily: "'Inter', sans-serif" }}>
          {tag}
        </div>
      </div>

      {/* PRIMARY: One dominant headline — massive, left-aligned for editorial feel */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: big ? "0 24px" : "0 18px" }}>
        <div style={{
          fontSize: big ? 72 : 54,
          fontWeight: 900,
          color: headlineColor,
          lineHeight: 0.88,
          letterSpacing: "-0.03em",
          fontFamily: "'Inter', sans-serif",
          textShadow: bgLum < 0.3 ? `0 0 40px ${accent}30` : "none",
        }}>
          {bigTxt}
          <span style={{ color: accent }}>.</span>
        </div>

        {/* SECONDARY: One short supporting line — smaller, clear separation */}
        <div style={{
          fontSize: big ? 17 : 14,
          fontWeight: 500,
          color: headlineColor,
          opacity: 0.75,
          lineHeight: 1.45,
          marginTop: big ? 16 : 12,
          maxWidth: "85%",
          fontFamily: "'Inter', sans-serif",
        }}>
          {copy}
        </div>
      </div>

      {/* TERTIARY: Footer — brand + fine print, subordinate */}
      <div className="flex-shrink-0" style={{
        padding: big ? "14px 24px 18px" : "10px 18px 14px",
        borderTop: `1px solid ${accent}20`,
      }}>
        <div style={{ fontSize: big ? 10 : 9, fontWeight: 500, color: accent, opacity: 0.65, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
          {fine}
        </div>
        <div style={{
          fontSize: big ? 11 : 9,
          fontWeight: 800,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginTop: 6,
          fontFamily: "'Inter', sans-serif",
        }}>
          JACKYE CLAYTON × WDIWF
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
