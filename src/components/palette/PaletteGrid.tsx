import { motion, AnimatePresence } from "framer-motion";
import type { PaletteEntry } from "./palette-data";

interface PaletteGridProps {
  palettes: PaletteEntry[];
  selected: PaletteEntry;
  onSelect: (p: PaletteEntry) => void;
}

export function PaletteGrid({ palettes, selected, onSelect }: PaletteGridProps) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <AnimatePresence mode="popLayout">
        {palettes.map((p, i) => (
          <motion.button
            key={p.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            onClick={() => onSelect(p)}
            className={`
              group relative text-left rounded-xl overflow-hidden border transition-all duration-300
              ${selected.id === p.id
                ? "border-foreground ring-1 ring-foreground/20 scale-[1.01]"
                : "border-border/30 hover:border-foreground/20"
              }
            `}
          >
            {/* Color swatch strip */}
            <div className="flex h-20 relative overflow-hidden">
              <div className="flex-1" style={{ background: p.bg }} />
              <div className="flex-1" style={{ background: p.accent }} />
              <div className="flex-1" style={{ background: p.dark }} />
              <div className="w-1/4" style={{ background: p.text, opacity: 0.15 }} />

              {/* Hover gloss sweep */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
                }}
              />

              {/* Selected indicator */}
              {selected.id === p.id && (
                <motion.div
                  layoutId="palette-indicator"
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </div>

            {/* Info */}
            <div className="p-3.5 bg-card">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  {p.name}
                </h3>
                <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/50">
                  {p.mood}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {p.description}
              </p>

              {/* Hex chips */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {[p.bg, p.accent, p.dark].map((hex) => (
                  <span
                    key={hex}
                    className="inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground/60"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-border/30 shrink-0"
                      style={{ background: hex }}
                    />
                    {hex.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
