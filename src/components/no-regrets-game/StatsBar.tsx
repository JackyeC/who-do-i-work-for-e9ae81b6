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
  // Find which stat changed the most
  let maxDiffKey: keyof PlayerStats | null = null;
  let maxDiffAbs = 0;
  if (previousStats) {
    STAT_CONFIG.forEach(({ key }) => {
      const abs = Math.abs(stats[key] - previousStats[key]);
      if (abs > maxDiffAbs) { maxDiffAbs = abs; maxDiffKey = key; }
    });
  }

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
          const isMostChanged = key === maxDiffKey;

          return (
            <motion.div
              key={key}
              className="flex flex-col items-center gap-2"
              animate={isMostChanged ? {
                boxShadow: [
                  "0 0 0 0 transparent",
                  `0 0 12px -2px ${diff > 0 ? "hsl(var(--civic-green) / 0.3)" : "hsl(var(--destructive) / 0.3)"}`,
                  "0 0 0 0 transparent",
                ],
              } : {}}
              transition={isMostChanged ? { duration: 1.2, delay: 0.8, ease: "easeInOut" } : {}}
              style={isMostChanged ? { borderRadius: "0.75rem", padding: "0.25rem" } : {}}
            >
              <span className="text-base md:text-lg">{emoji}</span>
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full motion-reduce:transition-none", barColor)}
                  initial={{ width: previousStats ? `${Math.max(0, Math.min(100, previousStats[key]))}%` : 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm md:text-base font-mono font-bold text-foreground">{value}</span>
                {diff !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: -4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.35, type: "spring", stiffness: 200 }}
                    className={cn(
                      "ml-1 text-[10px] font-mono font-semibold motion-reduce:transition-none",
                      diff > 0 ? "text-[hsl(var(--civic-green))]" : "text-[hsl(var(--destructive))]"
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </motion.span>
                )}
              </div>
              <span className="text-[9px] md:text-[10px] text-muted-foreground/70 uppercase tracking-widest font-mono">{label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
