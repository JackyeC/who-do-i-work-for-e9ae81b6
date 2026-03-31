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

export function PalettePosterPreview({ palette }: Props) {
  const { bg, accent, dark, text: textColor } = palette;
  const onAccent = getTextOnBg(accent);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Palette name + description */}
      <div className="text-center">
        <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-1">
          LIVE PREVIEW
        </p>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {palette.name}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {palette.description}
        </p>
      </div>

      {/* The poster — editorial quality */}
      <div
        className="w-full max-w-[380px] rounded-xl overflow-hidden relative"
        style={{
          boxShadow: `0 24px 80px -12px ${accent}30, 0 8px 24px -4px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Inner border */}
        <div
          className="absolute pointer-events-none rounded-lg z-10"
          style={{ inset: 8, border: `1.5px solid ${accent}`, opacity: 0.5 }}
        />

        {/* Header lockup */}
        <div
          className="text-center py-3 px-4"
          style={{ background: accent }}
        >
          <div
            className="text-[11px] font-black tracking-[0.22em] uppercase leading-tight"
            style={{ color: onAccent }}
          >
            JACKYE CLAYTON 👑 × WDIWF
          </div>
          <div
            className="text-[8px] font-bold tracking-[0.18em] uppercase mt-0.5"
            style={{ color: onAccent, opacity: 0.7 }}
          >
            PRESENTS
          </div>
        </div>

        {/* Body */}
        <div
          className="flex flex-col items-center py-10 px-6 gap-4"
          style={{ background: bg, minHeight: 320 }}
        >
          <span
            className="text-[10px] font-mono font-extrabold tracking-[0.2em] uppercase"
            style={{ color: accent }}
          >
            THE CULTURE AUDIT
          </span>

          <span className="text-5xl" style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.4))" }}>
            🧾
          </span>

          <div className="text-center">
            <div
              className="text-5xl font-black leading-none tracking-tight"
              style={{
                color: accent,
                textShadow: `0 0 40px ${accent}40, 0 2px 8px rgba(0,0,0,0.5)`,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              RECEIPT
            </div>
            <div
              className="text-sm font-mono font-bold uppercase tracking-wider mt-2"
              style={{ color: textColor, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
            >
              pulled.
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 w-3/4">
            <div className="flex-1 h-px" style={{ background: accent, opacity: 0.4 }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.7 }} />
            <div className="flex-1 h-px" style={{ background: accent, opacity: 0.4 }} />
          </div>

          <p
            className="text-center text-sm font-extrabold italic leading-relaxed"
            style={{ color: textColor, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            "They thought we wouldn't notice."
          </p>
          <p
            className="text-center text-[10px] font-mono italic font-semibold"
            style={{ color: accent }}
          >
            *we noticed
          </p>
        </div>

        {/* Footer */}
        <div
          className="text-center py-3 px-4"
          style={{
            background: `${accent}15`,
            borderTop: `1.5px solid ${accent}30`,
          }}
        >
          <div
            className="text-xs font-mono font-black tracking-wider uppercase"
            style={{ color: accent }}
          >
            wdiwf.jackyeclayton.com
          </div>
          <div
            className="text-[10px] font-mono font-semibold uppercase tracking-wider mt-1"
            style={{ color: textColor, opacity: 0.7 }}
          >
            We pull the receipts.
          </div>
        </div>

        {/* JRC EDIT watermark */}
        <div
          className="absolute bottom-2 right-3 pointer-events-none"
          style={{
            fontSize: 9,
            fontWeight: 300,
            letterSpacing: "0.2em",
            color: `${textColor}40`,
            fontFamily: "Georgia, 'Times New Roman', serif",
            textTransform: "uppercase",
          }}
        >
          JRC EDIT
        </div>
      </div>

      {/* Swatch row */}
      <div className="flex items-center gap-3 mt-2">
        {[
          { hex: bg, label: "BG" },
          { hex: accent, label: "ACCENT" },
          { hex: dark, label: "DARK" },
          { hex: textColor, label: "TEXT" },
        ].map(({ hex, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div
              className="w-10 h-10 rounded-lg border border-border/30"
              style={{ background: hex }}
            />
            <span className="text-[8px] font-mono tracking-[0.15em] text-muted-foreground/60">
              {label}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/40">
              {hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
