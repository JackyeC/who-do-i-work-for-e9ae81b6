import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { PlayerStats } from "@/types/no-regrets-game";

const STAT_CONFIG: { key: keyof PlayerStats; label: string; emoji: string }[] = [
  { key: "money", label: "Money", emoji: "💰" },
  { key: "safety", label: "Safety", emoji: "🛡️" },
  { key: "sanity", label: "Sanity", emoji: "🧠" },
  { key: "power", label: "Power", emoji: "⚡" },
];

interface StatsBarProps {
  stats: PlayerStats;
  previousStats?: PlayerStats;
}

export function StatsBar({ stats, previousStats }: StatsBarProps) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4 md:p-5 space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60">
        Status Report
      </p>
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {STAT_CONFIG.map(({ key, label, emoji }) => {
          const value = Math.max(0, Math.min(100, stats[key]));
          const diff = previousStats ? stats[key] - previousStats[key] : 0;
          const pct = value;
          const barColor = pct >= 60 ? "bg-[hsl(var(--civic-green))]" : pct >= 30 ? "bg-primary" : "bg-[hsl(var(--destructive))]";

          return (
            <div key={key} className="flex flex-col items-center gap-2">
              <span className="text-base md:text-lg">{emoji}</span>
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], delay: 0.3 }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm md:text-base font-mono font-bold text-foreground">{value}</span>
                {diff !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                    className={cn(
                      "ml-1 text-[10px] font-mono font-semibold",
                      diff > 0 ? "text-[hsl(var(--civic-green))]" : "text-[hsl(var(--destructive))]"
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </motion.span>
                )}
              </div>
              <span className="text-[9px] md:text-[10px] text-muted-foreground/70 uppercase tracking-widest font-mono">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
