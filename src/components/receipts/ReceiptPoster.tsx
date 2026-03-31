import { cn } from "@/lib/utils";
import { HeatChip } from "./HeatChip";

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
  poster: PosterData;
  category: string | null;
  spiceLevel: number;
  className?: string;
}

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_workplace: "AI & WORK",
  future_of_work: "FUTURE OF WORK",
  labor_organizing: "LABOR",
  worker_rights: "DEI",
  regulation: "POLICY",
  layoffs: "LAYOFFS",
  pay_equity: "MONEY",
  legislation: "HIRING",
  general: "NEWS",
};

/*
 * Poster archetype families — determined from the tag/category.
 * Each maps to a distinct vintage ad vibe:
 *   1. The Happy Corporate Lie   — warm cream/gold, cheerful 50s optimism
 *   2. The Miracle Product Pitch  — cool teal/mint, "scientific" ad energy
 *   3. The Family Values Office   — soft rose/blush, domestic-wholesomeness
 *   4. The Scientific Progress    — steel blue/slate, authoritative/clinical
 */
type PosterFamily = "corporate-lie" | "miracle-pitch" | "family-values" | "scientific-progress";

function getPosterFamily(category: string | null, tag: string): PosterFamily {
  const t = (tag + " " + (category ?? "")).toLowerCase();
  if (t.includes("dei") || t.includes("culture") || t.includes("inclusion") || t.includes("worker"))
    return "family-values";
  if (t.includes("ai") || t.includes("tech") || t.includes("automation") || t.includes("data"))
    return "scientific-progress";
  if (t.includes("money") || t.includes("pay") || t.includes("ceo") || t.includes("lobby"))
    return "miracle-pitch";
  return "corporate-lie";
}

const FAMILY_STYLES: Record<PosterFamily, {
  bgGradient: string;
  textureOpacity: string;
  borderAccent: string;
  badgeBg: string;
  ornament: string;
}> = {
  "corporate-lie": {
    bgGradient: "linear-gradient(175deg, #F5EDDB 0%, #E8DCBF 40%, #D4C8A4 100%)",
    textureOpacity: "0.12",
    borderAccent: "#B8A070",
    badgeBg: "rgba(184, 160, 112, 0.2)",
    ornament: "✦",
  },
  "miracle-pitch": {
    bgGradient: "linear-gradient(175deg, #D8EDE8 0%, #B5D8CF 40%, #8CC0B3 100%)",
    textureOpacity: "0.10",
    borderAccent: "#5B9E8E",
    badgeBg: "rgba(91, 158, 142, 0.2)",
    ornament: "◆",
  },
  "family-values": {
    bgGradient: "linear-gradient(175deg, #F5E1E1 0%, #E8CFC8 40%, #D4B5AD 100%)",
    textureOpacity: "0.10",
    borderAccent: "#B08878",
    badgeBg: "rgba(176, 136, 120, 0.2)",
    ornament: "❧",
  },
  "scientific-progress": {
    bgGradient: "linear-gradient(175deg, #D8DFE8 0%, #BCC7D5 40%, #96A5B8 100%)",
    textureOpacity: "0.14",
    borderAccent: "#6B7B8F",
    badgeBg: "rgba(107, 123, 143, 0.2)",
    ornament: "◎",
  },
};

export function ReceiptPoster({ poster, category, spiceLevel, className }: ReceiptPosterProps) {
  const family = getPosterFamily(category, poster.tag);
  const style = FAMILY_STYLES[family];
  const darkColor = poster.dark || "#1a1a1a";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg aspect-[4/5] md:aspect-[3/4] flex flex-col justify-between select-none",
        className
      )}
      style={{ background: style.bgGradient }}
    >
      {/* Aged print grain texture */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          opacity: style.textureOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.12) 100%)",
        }}
      />

      {/* Decorative border inset */}
      <div
        className="absolute inset-3 border pointer-events-none rounded-sm"
        style={{ borderColor: style.borderAccent + "22" }}
      />

      {/* ── Top: Category + Heat ── */}
      <div className="relative z-10 flex items-start justify-between p-5 md:p-6">
        <span
          className="text-[9px] font-mono uppercase tracking-[0.25em] px-2.5 py-1 rounded-sm font-bold"
          style={{ backgroundColor: style.badgeBg, color: darkColor }}
        >
          {CATEGORY_DISPLAY[category ?? ""] || "NEWS"}
        </span>
        <HeatChip level={spiceLevel} />
      </div>

      {/* ── Center: Headline zone ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-3 px-6 md:px-8">
        {/* Ornamental divider */}
        <span
          className="text-lg opacity-30"
          style={{ color: darkColor }}
        >
          {style.ornament}
        </span>

        {/* Big fake-ad headline */}
        <h2
          className="text-[1.5rem] md:text-[1.75rem] leading-[1.05] tracking-tight uppercase"
          style={{
            color: darkColor,
            fontWeight: 900,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {poster.bigTxt}
        </h2>

        {/* Ironic support line */}
        <p
          className="text-[0.8rem] md:text-sm leading-snug italic max-w-[85%]"
          style={{ color: darkColor + "bb", fontFamily: "'Georgia', serif" }}
        >
          "{poster.sub}"
        </p>

        {/* Ornamental divider */}
        <span
          className="text-lg opacity-30"
          style={{ color: darkColor }}
        >
          {style.ornament}
        </span>
      </div>

      {/* ── Bottom: Issue tag + copy + footer ── */}
      <div className="relative z-10 px-5 pb-5 md:px-6 md:pb-6 space-y-2 text-center">
        {/* Issue tag pill */}
        <p
          className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold"
          style={{ color: darkColor + "77" }}
        >
          {poster.tag}
        </p>

        {/* Copy line */}
        <p
          className="text-[11px] font-semibold leading-snug"
          style={{ color: darkColor + "99", fontFamily: "'Georgia', serif" }}
        >
          {poster.copy}
        </p>

        {/* Fine print */}
        <p
          className="text-[8px] italic opacity-40 leading-tight"
          style={{ color: darkColor }}
        >
          {poster.fine}
        </p>

        {/* Brand footer lockup */}
        <div
          className="pt-2.5 mt-1 border-t flex items-center justify-center gap-2"
          style={{ borderColor: darkColor + "1a" }}
        >
          <span
            className="text-[8px] font-mono uppercase tracking-[0.3em] font-bold opacity-35"
            style={{ color: darkColor }}
          >
            The Receipts by Jackye
          </span>
          <span className="text-[8px] opacity-20" style={{ color: darkColor }}>·</span>
          <span
            className="text-[8px] font-mono uppercase tracking-[0.3em] font-bold opacity-35"
            style={{ color: darkColor }}
          >
            WDIWF
          </span>
        </div>
      </div>
    </div>
  );
}
