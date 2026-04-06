/**
 * StreakBadge — Daily login streak with fire icon.
 *
 * Persists via localStorage. Streak resets if you miss a calendar day.
 * The fire icon pulses when you extend your streak.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wdiwf_streak";

interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lastDate: "" };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lastDate: "" };
  }
}

function advanceStreak(prev: StreakData): StreakData {
  const today = todayKey();
  if (prev.lastDate === today) return prev;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (prev.lastDate === yesterdayKey) {
    return { count: prev.count + 1, lastDate: today };
  }

  // Missed a day → reset to 1
  return { count: 1, lastDate: today };
}

export function StreakBadge() {
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: "" });
  const [justAdvanced, setJustAdvanced] = useState(false);

  useEffect(() => {
    const prev = readStreak();
    const next = advanceStreak(prev);
    if (next.count !== prev.count || next.lastDate !== prev.lastDate) {
      setJustAdvanced(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setStreak(next);
  }, []);

  if (streak.count === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "bg-gradient-to-r from-civic-gold/15 to-destructive/10",
          "border border-civic-gold/25"
        )}
        initial={justAdvanced ? { scale: 0.8 } : false}
        animate={justAdvanced ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          animate={
            justAdvanced
              ? { rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.3, 1] }
              : {}
          }
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Flame
            className={cn(
              "w-3.5 h-3.5",
              streak.count >= 7 ? "text-destructive" : "text-civic-gold"
            )}
          />
        </motion.div>
        <span className="text-xs font-bold text-foreground font-mono tabular-nums">
          {streak.count}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          day{streak.count !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Streak milestone celebration */}
      <AnimatePresence>
        {justAdvanced && streak.count > 1 && streak.count % 7 === 0 && (
          <motion.span
            initial={{ opacity: 0, x: -8, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-xs font-bold text-civic-gold"
          >
            {streak.count >= 30 ? "On fire" : "Consistent"}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
