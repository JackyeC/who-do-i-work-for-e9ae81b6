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
    <div className="grid grid-cols-4 gap-3">
      {STAT_CONFIG.map(({ key, label, emoji }) => {
        const value = Math.max(0, Math.min(100, stats[key]));
        const diff = previousStats ? stats[key] - previousStats[key] : 0;
        return (
          <div key={key} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-lg">{emoji}</span>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${value}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-foreground font-bold">{value}</span>
              {diff !== 0 && (
                <span className={cn("text-[10px] font-mono", diff > 0 ? "text-[hsl(var(--civic-green))]" : "text-[hsl(var(--destructive))]")}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
