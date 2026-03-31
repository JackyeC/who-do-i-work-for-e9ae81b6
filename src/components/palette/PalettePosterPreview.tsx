import { motion } from "framer-motion";
import type { PaletteEntry } from "./palette-data";

function getTextOnBg(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#000" : "#FFF";
}

interface Props {
  palette: PaletteEntry;
}

const POSTER_QUOTES = [
  "They thought we wouldn't notice.",
  "The math isn't mathing.",
  "We pull the receipts.",
  "Your culture page is fiction.",
  "Family doesn't dock your PTO.",
];

function quoteForPalette(id: string): string {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) & 0xffff;
  return POSTER_QUOTES[n % POSTER_QUOTES.length];
}

export function PalettePosterPreview({ palette }: Props) {
  const { bg, accent, dark, text: textColor, sub } = palette;
  const onAccent = getTextOnBg(accent);
  const isMaison = palette.mood === "maison";
  const quote = quoteForPalette(palette.id);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Label */}
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[9px] font-mono tracking-[0.3em] uppercase text-muted-foreground/50 mb-2"
        >
          LIVE ARTBOARD
        </motion.p>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {palette.name}
        </h2>
        {palette.inspiration && (
          <p className="text-[11px] italic mt-1" style={{ color: accent, opacity: 0.7 }}>
            {palette.inspiration}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {palette.description}
        </p>
      </div>

      {/* The poster */}
      <div
        className="w-full max-w-[400px] rounded-2xl overflow-hidden relative"
        style={{
          boxShadow: `
            0 40px 100px -20px ${accent}25,
            0 20px 40px -8px rgba(0,0,0,0.6),
            inset 0 1px 0 ${accent}15
          `,
        }}
      >
        {/* Double border frame */}
        <div
          className="absolute pointer-events-none z-10"
          style={{ inset: 7, border: `1.5px solid ${accent}`, opacity: 0.4, borderRadius: 12 }}
        />
        <div
          className="absolute pointer-events-none z-10"
          style={{ inset: 11, border: `0.5px solid ${accent}`, opacity: 0.15, borderRadius: 8 }}
        />

        {/* Header lockup */}
        <div className="relative overflow-hidden" style={{ background: accent }}>
          {/* Subtle texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, ${onAccent}03 2px, ${onAccent}03 4px)`,
            }}
          />
          <div className="relative text-center py-4 px-4">
            <div
              className="text-[11px] font-black tracking-[0.25em] uppercase leading-tight"
              style={{ color: onAccent }}
            >
              JACKYE CLAYTON 👑 × WDIWF
            </div>
            <div
              className="text-[7px] font-bold tracking-[0.2em] uppercase mt-1"
              style={{ color: onAccent, opacity: 0.6 }}
            >
              PRESENTS
            </div>
          </div>
        </div>

        {/* Poster body */}
        <div
          className="relative flex flex-col items-center py-12 px-6 gap-5"
          style={{ background: bg, minHeight: 340 }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${accent}10 0%, transparent 70%)`,
            }}
          />

          <span
            className="relative text-[10px] font-mono font-extrabold tracking-[0.25em] uppercase"
            style={{ color: accent }}
          >
            {isMaison ? "HAUTE INTELLIGENCE" : "THE CULTURE AUDIT"}
          </span>

          <span
            className="text-5xl relative"
            style={{ filter: `drop-shadow(0 6px 20px ${accent}30)` }}
          >
            {isMaison ? "💅" : "🧾"}
          </span>

          <div className="text-center relative">
            <div
              className="text-5xl font-black leading-none tracking-[-0.02em]"
              style={{
                color: accent,
                textShadow: `0 0 50px ${accent}35, 0 2px 10px rgba(0,0,0,0.5)`,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              RECEIPT
            </div>
            <div
              className="text-sm font-mono font-bold uppercase tracking-[0.15em] mt-3"
              style={{ color: textColor, opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
            >
              pulled.
            </div>
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3 w-4/5">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}60)` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.7 }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${accent}60)` }} />
          </div>

          <p
            className="relative text-center text-[15px] font-extrabold italic leading-relaxed max-w-[85%]"
            style={{ color: textColor, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
          >
            "{quote}"
          </p>
          <p
            className="text-center text-[10px] font-mono italic font-semibold"
            style={{ color: sub || accent }}
          >
            *we noticed
          </p>
        </div>

        {/* Footer */}
        <div
          className="relative text-center py-3.5 px-4"
          style={{
            background: `linear-gradient(180deg, ${accent}10 0%, ${accent}08 100%)`,
            borderTop: `1px solid ${accent}25`,
          }}
        >
          <div
            className="text-[13px] font-mono font-black tracking-[0.08em] uppercase"
            style={{ color: accent }}
          >
            wdiwf.jackyeclayton.com
          </div>
          <div
            className="text-[9px] font-mono font-semibold uppercase tracking-[0.12em] mt-1.5"
            style={{ color: textColor, opacity: 0.5 }}
          >
            Career intelligence. Not paid reviews.
          </div>
        </div>

        {/* JRC EDIT watermark — 1s fade */}
        <div
          className="absolute bottom-2 right-3 pointer-events-none"
          style={{
            fontSize: 9,
            fontWeight: 300,
            letterSpacing: "0.22em",
            color: `${textColor}30`,
            fontFamily: "Georgia, 'Times New Roman', serif",
            textTransform: "uppercase",
            animation: "fadeIn 1s ease-in 0.5s forwards",
            opacity: 0,
          }}
        >
          JRC EDIT
        </div>
      </div>

      {/* Swatch row — refined */}
      <div className="flex items-center gap-4 mt-1">
        {[
          { hex: bg, label: "BG" },
          { hex: accent, label: "ACCENT" },
          { hex: dark, label: "DARK" },
          { hex: textColor, label: "TEXT" },
        ].map(({ hex, label }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3 }}
            className="flex flex-col items-center gap-1.5 cursor-default"
          >
            <div
              className="w-11 h-11 rounded-lg border transition-all duration-300"
              style={{
                background: hex,
                borderColor: `${accent}25`,
                boxShadow: `0 4px 12px ${hex}30`,
              }}
            />
            <span className="text-[7px] font-mono tracking-[0.2em] text-muted-foreground/50 uppercase">
              {label}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/35">
              {hex.toUpperCase()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
