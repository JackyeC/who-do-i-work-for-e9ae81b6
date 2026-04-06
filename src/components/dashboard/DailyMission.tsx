/**
 * DailyMission — Today's challenge card with XP reward.
 * Rotates daily. Completing it marks it done with a micro-celebration.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getTodaysMission, isMissionCompleted, completeMission } from "@/lib/dopamine-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, FileText, Bell, Heart, Mic, Shield, Briefcase,
  Sparkles, Check, ArrowRight, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Eye, FileText, Bell, Heart, Mic, Shield, Briefcase,
};

interface DailyMissionProps {
  onNavigate: (tab: string) => void;
}

export function DailyMission({ onNavigate }: DailyMissionProps) {
  const mission = getTodaysMission();
  const [completed, setCompleted] = useState(isMissionCompleted);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();
  const Icon = ICON_MAP[mission.icon] || Sparkles;

  const handleAction = useCallback(() => {
    if (!completed) {
      completeMission();
      setCompleted(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    if (mission.targetType === "route") {
      navigate(mission.target);
    } else {
      onNavigate(mission.target);
    }
  }, [completed, mission, navigate, onNavigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all",
        completed
          ? "border-civic-green/25 bg-civic-green/[0.04]"
          : "border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent hover:border-primary/35"
      )}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          completed ? "bg-civic-green/10" : "bg-primary/10"
        )}>
          {completed ? (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Check className="w-5 h-5 text-civic-green" />
            </motion.div>
          ) : (
            <Icon className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-primary">
              Daily Mission
            </span>
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-bold font-mono rounded-full px-1.5 py-0.5",
              completed
                ? "bg-civic-green/10 text-civic-green"
                : "bg-civic-gold/10 text-civic-gold"
            )}>
              <Star className="w-2.5 h-2.5" />
              +{mission.xp} XP
            </span>
          </div>
          <p className={cn(
            "text-sm font-semibold leading-tight",
            completed ? "text-civic-green line-through decoration-civic-green/30" : "text-foreground"
          )}>
            {mission.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {mission.description}
          </p>
        </div>

        {/* Action */}
        <button
          onClick={handleAction}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
            completed
              ? "bg-civic-green/10 text-civic-green hover:bg-civic-green/15"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {completed ? "Done" : mission.action}
          {!completed && <ArrowRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Confetti-like particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: [
                    "hsl(var(--civic-gold))",
                    "hsl(var(--civic-green))",
                    "hsl(var(--primary))",
                    "hsl(var(--civic-blue))",
                  ][i % 4],
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 4) * 60,
                  y: Math.sin((i * Math.PI) / 4) * 40 - 20,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1 }}
              className="text-lg font-bold text-civic-gold"
            >
              +{mission.xp} XP
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
