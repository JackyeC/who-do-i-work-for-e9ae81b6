import { motion } from "framer-motion";
import { MOOD_FILTERS } from "./palette-data";

interface PaletteHeaderProps {
  mood: string;
  onMoodChange: (mood: string) => void;
}

export function PaletteHeader({ mood, onMoodChange }: PaletteHeaderProps) {
  return (
    <header className="pt-10 pb-8 md:pt-16 md:pb-12 px-4 md:px-8 max-w-[1400px] mx-auto">
      {/* Lockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="mb-8"
      >
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-primary mb-3">
          JACKYE CLAYTON × WDIWF PRESENTS
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight mb-4"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          PALETTE<br />
          <span className="text-primary">STUDIO</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
          Creative direction for The Receipts poster series. Select a palette. Watch it transform.
        </p>
      </motion.div>

      {/* Mood filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1"
      >
        {MOOD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onMoodChange(f.value)}
            className={`
              px-4 py-2 rounded-full text-[11px] font-mono tracking-[0.15em] border transition-all duration-200 whitespace-nowrap
              ${mood === f.value
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30 hover:text-foreground"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </motion.div>
    </header>
  );
}
