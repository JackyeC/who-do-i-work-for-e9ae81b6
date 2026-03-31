import { motion } from "framer-motion";
import { MOOD_FILTERS } from "./palette-data";

interface PaletteHeaderProps {
  mood: string;
  onMoodChange: (mood: string) => void;
}

export function PaletteHeader({ mood, onMoodChange }: PaletteHeaderProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Dramatic gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 30%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 80% at 80% 70%, hsl(348 90% 65% / 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative pt-12 pb-10 md:pt-20 md:pb-14 px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Atelier label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-primary" />
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase text-primary">
              JACKYE CLAYTON × WDIWF PRESENTS
            </p>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-[6rem] font-bold text-foreground leading-[0.85] tracking-[-0.03em] mb-6"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <span className="block">PALETTE</span>
            <span className="block text-primary italic" style={{ fontWeight: 800 }}>
              Studio
            </span>
          </h1>

          <div className="flex items-start gap-8 max-w-xl">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Creative direction for The Receipts poster series.
              <span className="block mt-1 text-foreground/60 text-xs font-mono tracking-wider">
                Select a palette. Watch it transform.
              </span>
            </p>
          </div>
        </motion.div>

        {/* Mood filters — editorial pill row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1"
        >
          {MOOD_FILTERS.map((f, i) => {
            const isActive = mood === f.value;
            const isMaison = f.value === "maison";
            return (
              <motion.button
                key={f.value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onMoodChange(f.value)}
                className={`
                  relative px-5 py-2.5 rounded-full text-[10px] font-mono tracking-[0.18em] border transition-all duration-300 whitespace-nowrap
                  ${isActive
                    ? isMaison
                      ? "bg-[#BE0B2B] text-white border-[#BE0B2B] shadow-[0_0_20px_rgba(190,11,43,0.3)]"
                      : "bg-foreground text-background border-foreground"
                    : isMaison
                      ? "bg-transparent text-[#BE0B2B]/70 border-[#BE0B2B]/30 hover:border-[#BE0B2B]/60 hover:text-[#BE0B2B]"
                      : "bg-transparent text-muted-foreground border-border/40 hover:border-foreground/30 hover:text-foreground"
                  }
                `}
              >
                {f.label}
                {isMaison && !isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#BE0B2B] animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Thin rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mt-8 h-px bg-border/30 origin-left"
        />
      </div>
    </header>
  );
}
