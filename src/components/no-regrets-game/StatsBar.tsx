import { cn } from "@/lib/utils";
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
              {/* Vertical bar concept */}
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm md:text-base font-mono font-bold text-foreground">{value}</span>
                {diff !== 0 && (
                  <span className={cn(
                    "ml-1 text-[10px] font-mono font-semibold",
                    diff > 0 ? "text-[hsl(var(--civic-green))]" : "text-[hsl(var(--destructive))]"
                  )}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
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
