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
  poster: PosterData;
  category: string | null;
  spiceLevel: number;
  className?: string;
  big?: boolean;
  id?: string;
}

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

export function ReceiptPoster({ poster, className, big = false, id = "" }: ReceiptPosterProps) {
  if (!poster) return null;
  const { bg: pbg, accent, emoji, bigTxt, sub, tag, copy, fine } = poster;
  const onAccent = getTextOnAccent(accent);
  const wdiwfQuote = WDIWF_QUOTES[quoteIdx(id)];
  const W = big ? 320 : 250;
  const H = big ? 450 : 345;

  return (
    <div
      id={id || undefined}
      className={cn("flex-shrink-0 flex flex-col overflow-hidden rounded-lg relative", className)}
      style={{
        width: W,
        minHeight: H,
        background: pbg,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      }}
    >
      {/* Double border inset */}
      <div
        className="absolute pointer-events-none rounded-sm z-10"
        style={{ inset: 7, border: `1.5px solid ${accent}`, opacity: 0.7 }}
      />
      <div
        className="absolute pointer-events-none rounded-sm z-10"
        style={{ inset: 11, border: `0.5px solid ${accent}`, opacity: 0.3 }}
      />

      {/* Header banner */}
      <div className="flex-shrink-0 text-center" style={{ background: accent, padding: big ? "9px 16px" : "7px 12px" }}>
        <div style={{ fontSize: big ? 11 : 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: onAccent, lineHeight: 1.3 }}>
          JACKYE CLAYTON 👑 × WDIWF
        </div>
        <div style={{ fontSize: big ? 9 : 7.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: onAccent, opacity: 0.7 }}>
          PRESENTS
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-evenly" style={{ padding: big ? "16px 16px 8px" : "12px 12px 6px", gap: big ? 11 : 8 }}>
        <div className="font-mono text-center" style={{ fontSize: big ? 10 : 8.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: accent, opacity: 0.9 }}>
          {tag}
        </div>
        <div className="text-center" style={{ fontSize: big ? 68 : 50, lineHeight: 1, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.45))" }}>
          {emoji}
        </div>
        <div className="text-center">
          <div style={{ fontSize: big ? 50 : 36, fontWeight: 900, color: accent, lineHeight: 0.9, letterSpacing: "-0.02em", textShadow: `0 0 28px ${accent}55`, fontFamily: "'Inter', sans-serif" }}>
            {bigTxt}
          </div>
          <div className="font-mono" style={{ fontSize: big ? 13 : 10.5, fontWeight: 500, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 6 }}>
            {sub}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ width: "76%" }}>
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.35 }} />
          <div className="rounded-full" style={{ width: 4, height: 4, background: accent, opacity: 0.7 }} />
          <div className="flex-1 h-px" style={{ background: accent, opacity: 0.35 }} />
        </div>
        <div className="text-center italic" style={{ fontSize: big ? 15 : 12, fontWeight: 700, color: "#FFF", lineHeight: 1.4 }}>
          "{copy}"
        </div>
        <div className="text-center italic font-mono" style={{ fontSize: big ? 12 : 10, fontWeight: 500, color: "rgba(255,255,255,0.68)", lineHeight: 1.4 }}>
          {fine}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-center" style={{ background: `${accent}18`, borderTop: `1px solid ${accent}35`, padding: big ? "8px 14px" : "6px 10px" }}>
        <div className="font-mono" style={{ fontSize: big ? 11 : 9, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.2 }}>
          wdiwf.jackyeclayton.com
        </div>
        <div className="font-mono" style={{ fontSize: big ? 8 : 7, fontWeight: 500, color: accent, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.4, marginTop: 3 }}>
          {wdiwfQuote}
        </div>
      </div>
    </div>
  );
}
