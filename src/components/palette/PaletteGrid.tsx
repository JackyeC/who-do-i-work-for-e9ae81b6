import { motion, AnimatePresence } from "framer-motion";
import type { PaletteEntry } from "./palette-data";

interface PaletteGridProps {
  palettes: PaletteEntry[];
  selected: PaletteEntry;
  onSelect: (p: PaletteEntry) => void;
}

export function PaletteGrid({ palettes, selected, onSelect }: PaletteGridProps) {
  return (
    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AnimatePresence mode="popLayout">
        {palettes.map((p, i) => {
          const isSelected = selected.id === p.id;
          const isMaison = p.mood === "maison";

          return (
            <motion.button
              key={p.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: i * 0.025, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              onClick={() => onSelect(p)}
              className={`
                group relative text-left rounded-xl overflow-hidden border transition-all duration-300
                ${isSelected
                  ? isMaison
                    ? "border-[#BE0B2B]/60 ring-1 ring-[#BE0B2B]/20"
                    : "border-foreground/60 ring-1 ring-foreground/15"
                  : "border-border/25 hover:border-foreground/20"
                }
              `}
            >
              {/* Color swatch — diagonal split for drama */}
              <div className="relative h-24 overflow-hidden">
                <div className="absolute inset-0" style={{ background: p.bg }} />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, transparent 40%, ${p.accent} 40%, ${p.accent} 60%, ${p.dark} 60%)`,
                  }}
                />

                {/* Accent glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 70% 50%, ${p.accent}18 0%, transparent 60%)`,
                  }}
                />

                {/* Magazine gloss sweep */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.02) 55%, transparent 80%)",
                  }}
                />

                {/* Selected dot */}
                {isSelected && (
                  <motion.div
                    layoutId="palette-dot"
                    className="absolute top-3 right-3 w-3 h-3 rounded-full"
                    style={{
                      background: isMaison ? "#BE0B2B" : "hsl(var(--foreground))",
                      boxShadow: isMaison ? "0 0 12px rgba(190,11,43,0.5)" : "0 0 8px rgba(255,255,255,0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}

                {/* Maison label */}
                {isMaison && (
                  <span
                    className="absolute bottom-2 left-3 text-[8px] font-mono tracking-[0.25em] uppercase"
                    style={{ color: p.accent, opacity: 0.8 }}
                  >
                    MAISON
                  </span>
                )}
              </div>

              {/* Card info */}
              <div className="p-4 bg-card">
                <div className="flex items-baseline justify-between mb-1.5">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {p.name}
                  </h3>
                  <span className="text-[8px] font-mono tracking-[0.15em] uppercase text-muted-foreground/40">
                    {p.mood}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {p.description}
                </p>

                {/* Swatch chips */}
                <div className="flex items-center gap-2 mt-3">
                  {[p.bg, p.accent, p.dark].map((hex) => (
                    <div key={hex} className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full border shrink-0"
                        style={{
                          background: hex,
                          borderColor: isSelected ? `${p.accent}40` : "hsl(var(--border) / 0.3)",
                        }}
                      />
                      <span className="text-[8px] font-mono text-muted-foreground/40">
                        {hex.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Inspiration line for maison */}
                {p.inspiration && (
                  <p
                    className="text-[9px] italic mt-2.5 tracking-wide"
                    style={{ color: p.accent, opacity: 0.6 }}
                  >
                    {p.inspiration}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
