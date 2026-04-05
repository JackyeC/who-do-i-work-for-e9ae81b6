import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Badge Definitions ── */
export interface BadgeDef {
  id: string;
  label: string;
  meaning: string;
  icon: string; // emoji fallback — replaced by SVG below
}

export const BADGES: BadgeDef[] = [
  {
    id: "auditor",
    label: "The Auditor",
    meaning: "You check the record before you trust the pitch.",
    icon: "🔍",
  },
  {
    id: "truth-seeker",
    label: "Truth Seeker",
    meaning: "You make the workplace more legible.",
    icon: "📡",
  },
  {
    id: "signal-ready",
    label: "Signal Ready",
    meaning: "You've defined how you evaluate risk and values.",
    icon: "🎯",
  },
];

type BadgeState = "earned" | "in-progress" | "locked";

interface SignalBadgeProps {
  badge: BadgeDef;
  state: BadgeState;
  progress?: number; // 0-100 for in-progress
  delay?: number;
}

/* ── Metallic gold palette ── */
const GOLD = "hsl(40, 50%, 55%)";
const GOLD_MUTED = "hsla(40, 50%, 55%, 0.15)";
const GOLD_BORDER = "hsla(40, 50%, 55%, 0.35)";

function SignalBadge({ badge, state, progress = 0, delay = 0 }: SignalBadgeProps) {
  const isEarned = state === "earned";
  const isInProgress = state === "in-progress";
  const isLocked = state === "locked";

  const tooltipText = isEarned
    ? badge.meaning
    : isInProgress
    ? `In progress — ${badge.meaning.toLowerCase()}`
    : `Locked — ${badge.meaning.toLowerCase()}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-2.5 text-center cursor-default"
          >
            {/* Coin */}
            <div className="relative">
              {isInProgress && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="33" fill="none" stroke="hsla(40, 50%, 55%, 0.12)" strokeWidth="2" />
                  <circle
                    cx="36" cy="36" r="33" fill="none"
                    stroke={GOLD}
                    strokeWidth="2"
                    strokeDasharray={`${(progress / 100) * 207.35} 207.35`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
              )}
              <div
                className={cn(
                  "w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl transition-all duration-300",
                  isEarned && "shadow-[0_0_20px_hsla(40,50%,55%,0.15)]",
                  isLocked && "grayscale opacity-30"
                )}
                style={{
                  background: isEarned
                    ? `linear-gradient(145deg, hsla(40, 55%, 62%, 0.2), hsla(40, 45%, 48%, 0.12))`
                    : isInProgress
                    ? GOLD_MUTED
                    : "hsla(0,0%,50%,0.06)",
                  border: `1px solid ${isEarned ? GOLD_BORDER : isInProgress ? "hsla(40, 50%, 55%, 0.2)" : "hsla(0,0%,50%,0.1)"}`,
                }}
              >
                <span className={cn(isLocked && "opacity-40")}>{badge.icon}</span>
              </div>
            </div>

            {/* Label */}
            <div>
              <p className={cn(
                "text-xs font-bold tracking-wide uppercase",
                isEarned ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {badge.label}
              </p>
              {isInProgress && (
                <p className="text-[10px] font-mono mt-1" style={{ color: GOLD }}>
                  {progress}% there
                </p>
              )}
              {isLocked && (
                <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">Locked</p>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Credentials Section ── */
interface CredentialsSectionProps {
  scanCount: number;
  tipCount: number;
  onboardingCompleted: boolean;
}

export function CredentialsSection({ scanCount, tipCount, onboardingCompleted }: CredentialsSectionProps) {
  const auditorState: BadgeState = scanCount >= 5 ? "earned" : scanCount > 0 ? "in-progress" : "locked";
  const auditorProgress = Math.min(Math.round((scanCount / 5) * 100), 100);

  const truthState: BadgeState = tipCount >= 1 ? "earned" : "locked";

  const signalState: BadgeState = onboardingCompleted ? "earned" : "locked";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-bold text-foreground tracking-tight">Credentials & Proof</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5">
        Earned through action — not participation trophies.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <SignalBadge badge={BADGES[0]} state={auditorState} progress={auditorProgress} delay={0.1} />
        <SignalBadge badge={BADGES[1]} state={truthState} delay={0.2} />
        <SignalBadge badge={BADGES[2]} state={signalState} delay={0.3} />
      </div>
    </div>
  );
}
