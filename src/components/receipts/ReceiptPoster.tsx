import { useState } from "react";
import { cn } from "@/lib/utils";

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
  posterUrl?: string | null;
  category?: string | null;
  spiceLevel?: number;
  className?: string;
  big?: boolean;
  id?: string;
  headline?: string;
  onClickEnlarge?: () => void;
}

/* ── Poster copy — category-specific content with varied palettes ── */
const CATEGORY_COPY: Record<string, { bigTxt: string; sub: string; tag: string; copy: string; fine: string }[]> = {
  ai_workplace: [
    { bigTxt: "AI", sub: "in the workplace", tag: "automation watch", copy: "The algorithm is making decisions about your career.", fine: "Who audits the auditor?" },
    { bigTxt: "ALGO", sub: "hiring now", tag: "machine decisions", copy: "Automated screening is not neutral screening.", fine: "Bias doesn't disappear because it's coded." },
  ],
  future_of_work: [
    { bigTxt: "FUTURE", sub: "of work", tag: "workforce trends", copy: "The workplace is being redesigned. Were you consulted?", fine: "Policy changes deserve worker input." },
    { bigTxt: "RTO", sub: "mandated", tag: "return to office", copy: "Culture is not a zip code.", fine: "Track what the data says about productivity." },
  ],
  worker_rights: [
    { bigTxt: "EQUITY", sub: "under review", tag: "workplace equity", copy: "Commitment to equity is measurable. Measure it.", fine: "EEOC data is public record." },
    { bigTxt: "RIGHTS", sub: "at stake", tag: "worker protections", copy: "Workplace protections exist. Are they being enforced?", fine: "Check the enforcement record." },
  ],
  regulation: [
    { bigTxt: "POLICY", sub: "update", tag: "regulatory watch", copy: "New regulation, new compliance landscape.", fine: "What changes for workers on the ground?" },
  ],
  layoffs: [
    { bigTxt: "CUTS", sub: "announced", tag: "workforce reduction", copy: "Restructuring is a strategy. So is understanding who it impacts.", fine: "WARN notices are public." },
    { bigTxt: "EXIT", sub: "strategy", tag: "workforce planning", copy: "Right-sizing has a human cost. Here are the numbers.", fine: "Track the pattern across quarters." },
  ],
  pay_equity: [
    { bigTxt: "PAY", sub: "transparency", tag: "compensation data", copy: "Competitive compensation is verifiable. Verify it.", fine: "BLS benchmarks are available." },
    { bigTxt: "GAP", sub: "analysis", tag: "pay equity", copy: "Pay gaps aren't opinions. They're data points.", fine: "Compare against industry benchmarks." },
  ],
  legislation: [
    { bigTxt: "BILL", sub: "in committee", tag: "legislative watch", copy: "Legislation moves faster than most workers realize.", fine: "Track who's lobbying for and against." },
  ],
  labor_organizing: [
    { bigTxt: "LABOR", sub: "in motion", tag: "collective action", copy: "Workers are organizing. Here's what the filings show.", fine: "Follow the NLRB docket." },
  ],
};

const DEFAULT_COPY = { bigTxt: "RECEIPT", sub: "on file", tag: "the record", copy: "The public record is available. We're reading it.", fine: "Data over narrative." };

/*
 * ── POSTER PALETTE POOL ──
 * 24 distinct palettes — deterministic by headline hash.
 */
const PALETTE_POOL: { bg: string; accent: string; dark: string }[] = [
  { bg: "#7B2D26", accent: "#F5C882", dark: "#2E0E0A" },
  { bg: "#8B4513", accent: "#FFD700", dark: "#3A1C00" },
  { bg: "#A0522D", accent: "#FAEBD7", dark: "#3B1A0A" },
  { bg: "#C0392B", accent: "#FFF5E1", dark: "#5A1A12" },
  { bg: "#005F73", accent: "#FFE66D", dark: "#001219" },
  { bg: "#1E3A5F", accent: "#60A5FA", dark: "#0C1B2E" },
  { bg: "#1A365D", accent: "#90CDF4", dark: "#0A1929" },
  { bg: "#234E70", accent: "#FBD38D", dark: "#0E2233" },
  { bg: "#5A189A", accent: "#E0AAFF", dark: "#10002B" },
  { bg: "#6A0572", accent: "#FFD6FF", dark: "#1A001E" },
  { bg: "#1B4332", accent: "#95D5B2", dark: "#081C15" },
  { bg: "#0B3D0B", accent: "#34D399", dark: "#001A00" },
  { bg: "#2C2C34", accent: "#E8D5B7", dark: "#111115" },
  { bg: "#3D3024", accent: "#D4A373", dark: "#1A1410" },
  { bg: "#4A4238", accent: "#C9B99A", dark: "#201D17" },
  { bg: "#2D3436", accent: "#DFE6E9", dark: "#141819" },
  { bg: "#9D0208", accent: "#FFB3B3", dark: "#370617" },
  { bg: "#370617", accent: "#FF758F", dark: "#1A000A" },
  { bg: "#0A3200", accent: "#AAFF00", dark: "#051900" },
  { bg: "#1B1464", accent: "#00D4FF", dark: "#0A0A32" },
  { bg: "#2C1810", accent: "#C4956A", dark: "#150C08" },
  { bg: "#1F2937", accent: "#F9FAFB", dark: "#0F1520" },
  { bg: "#312E81", accent: "#A5B4FC", dark: "#1A1850" },
  { bg: "#064E3B", accent: "#6EE7B7", dark: "#022C22" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getTextOnAccent(accent: string): string {
  const hex = (accent || "#F0C040").replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#000" : "#FFF";
}

function getFallbackPoster(category: string | null, headline?: string): PosterData {
  const hash = hashString(headline || category || "default");
  const palette = PALETTE_POOL[hash % PALETTE_POOL.length];
  const copies = CATEGORY_COPY[category || ""] || [DEFAULT_COPY];
  const copyData = copies[hash % copies.length];
  return { ...palette, emoji: "", ...copyData };
}

/* ── Poster sizes ── */
const POSTER_W_BIG = 540;
const POSTER_H_BIG = 700;
const POSTER_W_SM = 420;
const POSTER_H_SM = 560;

/* ══════════════════════════════════════════════════════════
   TYPOGRAPHIC POSTER — bold text hierarchy, NO emoji hero
   ══════════════════════════════════════════════════════════ */
function TypographicPoster({ poster, big, id, className }: {
  poster: PosterData; big: boolean; id: string; className?: string;
}) {
  const { bg: pbg, accent, bigTxt, sub, copy, fine, tag } = poster;
  const w = big ? POSTER_W_BIG : POSTER_W_SM;
  const h = big ? POSTER_H_BIG : POSTER_H_SM;

  const bgHex = (pbg || "#0A0A0E").replace("#", "");
  const bgLum = (0.299 * parseInt(bgHex.substr(0, 2), 16) + 0.587 * parseInt(bgHex.substr(2, 2), 16) + 0.114 * parseInt(bgHex.substr(4, 2), 16)) / 255;
  const headlineColor = bgLum < 0.4 ? "#FFFFFF" : "#111111";

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
      {/* Inner border frame */}
      <div className="absolute pointer-events-none rounded-sm z-10" style={{ inset: 10, border: `1px solid ${accent}44` }} />

      {/* LEVEL 0: Presenter label */}
      <div className="flex-shrink-0 text-center" style={{ padding: big ? "20px 22px 0" : "14px 16px 0" }}>
        <div style={{
          fontSize: big ? 9 : 8,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: accent,
          opacity: 0.75,
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}>
          JACKYE CLAYTON × WDIWF PRESENTS
        </div>
      </div>

      {/* LEVEL 1: Dominant headline text */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: big ? "0 28px" : "0 20px" }}>
        {/* Category tag — small, above headline */}
        <div style={{
          fontSize: big ? 10 : 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: headlineColor,
          opacity: 0.45,
          marginBottom: big ? 8 : 6,
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}>
          {tag}
        </div>

        {/* Big text — the poster hero */}
        <div style={{
          fontSize: big ? 72 : 52,
          fontWeight: 900,
          color: accent,
          lineHeight: 0.88,
          letterSpacing: "-0.04em",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          textShadow: `0 2px 16px rgba(0,0,0,0.5), 0 0 40px ${accent}20`,
        }}>
          {bigTxt}
        </div>

        {/* Subhead */}
        <div style={{
          fontSize: big ? 22 : 17,
          fontWeight: 800,
          color: headlineColor,
          lineHeight: 1.15,
          marginTop: big ? 12 : 10,
          textTransform: "uppercase",
          letterSpacing: "0.015em",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}>
          {sub}
        </div>

        {/* Separator line */}
        <div style={{
          width: big ? 48 : 36,
          height: 2,
          background: accent,
          opacity: 0.5,
          marginTop: big ? 16 : 12,
          marginBottom: big ? 16 : 12,
        }} />

        {/* One-line explainer */}
        <div style={{
          fontSize: big ? 14 : 12,
          fontWeight: 400,
          color: headlineColor,
          opacity: 0.7,
          lineHeight: 1.55,
          maxWidth: "92%",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}>
          {copy}
        </div>

        {/* Punchline quote */}
        <div style={{
          fontSize: big ? 15 : 12,
          fontWeight: 600,
          fontStyle: "italic",
          color: accent,
          lineHeight: 1.4,
          marginTop: big ? 18 : 12,
          maxWidth: "90%",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          borderLeft: `3px solid ${accent}55`,
          paddingLeft: big ? 14 : 10,
        }}>
          "{fine}"
        </div>
      </div>

      {/* LEVEL 5: Footer */}
      <div className="flex-shrink-0" style={{
        padding: big ? "14px 28px 18px" : "10px 20px 14px",
        borderTop: `1px solid ${accent}20`,
      }}>
        <div style={{
          fontSize: big ? 13 : 11,
          fontWeight: 900,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}>
          WDIWF.JACKYECLAYTON.COM
        </div>
        <div style={{
          fontSize: big ? 9 : 7,
          fontWeight: 500,
          color: headlineColor,
          opacity: 0.4,
          marginTop: 3,
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          letterSpacing: "0.04em",
        }}>
          Every company runs a check on you. WDIWF runs one on them.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMAGE POSTER — renders a pre-generated poster_url asset
   ══════════════════════════════════════════════════════════ */
function ImagePoster({ posterUrl, headline, big, id, className }: {
  posterUrl: string; headline?: string; big: boolean; id: string; className?: string;
}) {
  const w = big ? POSTER_W_BIG : POSTER_W_SM;

  return (
    <div
      id={id || undefined}
      className={cn("flex-shrink-0 overflow-hidden rounded-lg relative w-full", className)}
      style={{ maxWidth: w, boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
    >
      <img
        src={posterUrl}
        alt={headline || "WDIWF poster"}
        loading="lazy"
        className="w-full h-auto block"
      />
      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.2)" }} />
      {/* Brand watermark */}
      <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none" style={{
        fontSize: big ? 12 : 10,
        fontWeight: 900,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.55)",
        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        textTransform: "uppercase",
      }}>
        WDIWF × JRC
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ReceiptPoster({ poster: rawPoster, posterUrl, category, className, big = false, id = "", headline, onClickEnlarge }: ReceiptPosterProps) {
  const [hover, setHover] = useState(false);

  const posterData = rawPoster && rawPoster.bg ? rawPoster : getFallbackPoster(category ?? null, headline);
  const hasPosterUrl = posterUrl && posterUrl.trim().length > 0;

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: onClickEnlarge ? "pointer" : "default", maxWidth: "100%" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClickEnlarge}
    >
      {hasPosterUrl ? (
        <ImagePoster posterUrl={posterUrl!} headline={headline} big={big} id={id} className={className} />
      ) : (
        <TypographicPoster poster={posterData} big={big} id={id} className={className} />
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
