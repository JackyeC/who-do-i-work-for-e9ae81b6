/**
 * InvestigatorRank — Shows the user's current rank + progress bar to next.
 * Ranks: Rookie → Investigator → Analyst → Watchdog → Pattern Hunter → Whistleblower
 */
import { useCivicImpact } from "@/hooks/use-civic-impact";
import { getRank, getNextRank, getRankProgress, RANK_TIERS } from "@/lib/dopamine-engine";
import { motion } from "framer-motion";
import { Award, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function InvestigatorRank() {
  const { data: civic, isLoading } = useCivicImpact();

  if (isLoading || !civic) return null;

  const total = civic.signalsUncovered + civic.employersTracked + civic.intelligenceActions;
  const rank = getRank(total);
  const next = getNextRank(total);
  const progress = getRankProgress(total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-xl border p-4",
        rank.border, rank.bg,
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          rank.bg,
        )}>
          <Award className={cn("w-4.5 h-4.5", rank.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", rank.color)}>{rank.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Rank
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {rank.tagline}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={cn("text-lg font-bold font-mono", rank.color)}>{total}</span>
          <p className="text-[10px] text-muted-foreground">impact</p>
        </div>
      </div>

      {/* Progress bar to next rank */}
      {next && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">
              Next: {next.label}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {total}/{next.threshold}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", rank.id === "rookie" ? "bg-muted-foreground" : `bg-current ${rank.color}`)}
              style={{ backgroundColor: undefined }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Max rank celebration */}
      {!next && (
        <div className="mt-2 text-center">
          <span className="text-xs font-bold text-civic-gold">Max rank achieved</span>
        </div>
      )}
    </motion.div>
  );
}
