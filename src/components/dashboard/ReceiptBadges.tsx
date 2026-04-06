/**
 * ReceiptBadges — Collectible badge grid.
 * Shows earned badges lit up, unearned badges grayed out.
 * Earned badges have rarity glow and a micro-celebration on first view.
 */
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCivicImpact } from "@/hooks/use-civic-impact";
import { usePersona } from "@/hooks/use-persona";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, evaluateBadges, RARITY_STYLES, type BadgeDef, type BadgeInput } from "@/lib/dopamine-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Radio, Eye, Shield, Search, FileText, Heart, Send,
  TrendingUp, FileCheck, CheckCircle, Flame, Dna, Zap, Lock,
  Award, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Bell, Radio, Eye, Shield, Search, FileText, Heart, Send,
  TrendingUp, FileCheck, CheckCircle, Flame, Dna, Zap,
};

const STORAGE_KEY = "wdiwf_seen_badges";

function getSeenBadges(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markBadgesSeen(ids: string[]) {
  const seen = getSeenBadges();
  ids.forEach((id) => seen.add(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

function getStreakDays(): number {
  try {
    const raw = localStorage.getItem("wdiwf_streak");
    if (!raw) return 0;
    return JSON.parse(raw).count || 0;
  } catch {
    return 0;
  }
}

/** Single badge tile */
function BadgeTile({
  badge,
  earned,
  isNew,
  onClick,
}: {
  badge: BadgeDef;
  earned: boolean;
  isNew: boolean;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[badge.icon] || Award;
  const rarity = RARITY_STYLES[badge.rarity];

  return (
    <motion.button
      onClick={onClick}
      initial={isNew ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={isNew ? { type: "spring", stiffness: 400, damping: 15 } : { duration: 0.2 }}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center group",
        earned
          ? `${badge.bg} ${badge.color} ${rarity.ring} ring-1 ${rarity.glow} hover:scale-[1.03] cursor-pointer`
          : "bg-muted/20 text-muted-foreground/30 border-border/20 cursor-default"
      )}
    >
      {/* New badge sparkle */}
      {isNew && earned && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-civic-gold"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: 2, duration: 0.4 }}
        />
      )}

      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        earned ? badge.bg : "bg-muted/30"
      )}>
        {earned ? (
          <Icon className="w-4 h-4" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-muted-foreground/30" />
        )}
      </div>

      <span className={cn(
        "text-[10px] font-semibold leading-tight",
        earned ? "text-foreground" : "text-muted-foreground/40"
      )}>
        {badge.label}
      </span>

      {earned && (
        <span className={cn(
          "text-[9px] font-mono uppercase tracking-wider",
          rarity.ring.replace("ring-", "text-").replace("/40", "/60").replace("/50", "/70").replace("/60", "/80")
        )}>
          {rarity.label}
        </span>
      )}
    </motion.button>
  );
}

/** Badge detail popup */
function BadgeDetail({ badge, onClose }: { badge: BadgeDef; onClose: () => void }) {
  const Icon = ICON_MAP[badge.icon] || Award;
  const rarity = RARITY_STYLES[badge.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      className={cn(
        "rounded-2xl border p-5 text-center max-w-xs mx-auto",
        badge.bg, rarity.ring, "ring-1", rarity.glow,
      )}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3",
        badge.bg,
      )}>
        <Icon className={cn("w-6 h-6", badge.color)} />
      </div>
      <h4 className={cn("text-base font-bold", badge.color)}>{badge.label}</h4>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{badge.description}</p>
      <span className={cn(
        "inline-block mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border",
        badge.bg, badge.color,
      )}>
        {rarity.label}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function ReceiptBadges() {
  const { user } = useAuth();
  const { data: civic } = useCivicImpact();
  const { hasTakenQuiz } = usePersona();
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  // Fetch additional user data for badge evaluation
  const { data: userData } = useQuery({
    queryKey: ["badge-data", user?.id],
    queryFn: async () => {
      const [apps, values, docs] = await Promise.all([
        supabase
          .from("applications_tracker")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id),
        (supabase as any)
          .from("user_values_profile")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("user_documents")
          .select("id")
          .limit(1),
      ]);
      return {
        applications: apps.count || 0,
        hasValuesProfile: !!values.data,
        hasResume: (docs.data?.length ?? 0) > 0 || localStorage.getItem("wdiwf_resume_uploaded") === "true",
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const earnedIds = useMemo(() => {
    if (!civic || !userData) return [];
    const input: BadgeInput = {
      signalsUncovered: civic.signalsUncovered,
      employersTracked: civic.employersTracked,
      intelligenceActions: civic.intelligenceActions,
      applications: userData.applications,
      hasValuesProfile: userData.hasValuesProfile,
      hasResume: userData.hasResume,
      hasTakenQuiz: hasTakenQuiz,
      streakDays: getStreakDays(),
    };
    return evaluateBadges(input);
  }, [civic, userData, hasTakenQuiz]);

  const earnedSet = useMemo(() => new Set(earnedIds), [earnedIds]);

  // Track new badges for sparkle effect
  const [newBadges, setNewBadges] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (earnedIds.length === 0) return;
    const seen = getSeenBadges();
    const fresh = earnedIds.filter((id) => !seen.has(id));
    if (fresh.length > 0) {
      setNewBadges(new Set(fresh));
      markBadgesSeen(fresh);
    }
  }, [earnedIds]);

  const earnedCount = earnedIds.length;
  const totalCount = BADGES.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">Receipt Badges</h3>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {earnedCount}/{totalCount} collected
        </span>
      </div>

      {/* Collection progress bar */}
      <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-civic-blue via-primary to-civic-gold"
          initial={{ width: 0 }}
          animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {BADGES.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            earned={earnedSet.has(badge.id)}
            isNew={newBadges.has(badge.id)}
            onClick={() => earnedSet.has(badge.id) && setSelectedBadge(badge)}
          />
        ))}
      </div>

      {/* Detail popup */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="relative">
            <BadgeDetail badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
