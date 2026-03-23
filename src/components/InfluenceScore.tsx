import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InfluenceScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "text-destructive", bg: "bg-destructive/10", label: "Very active in politics" };
  if (score >= 60) return { ring: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", label: "Quite active in politics" };
  if (score >= 40) return { ring: "text-primary", bg: "bg-primary/10", label: "Somewhat active" };
  if (score >= 20) return { ring: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/10", label: "Not very active" };
  return { ring: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", label: "Little to no political activity" };
}

export function calculateInfluenceScore(data: {
  totalPacSpending?: number;
  lobbyingSpend?: number;
  governmentContracts?: number;
  revolvingDoorCount?: number;
  tradeAssociationCount?: number;
  executiveDonations?: number;
}): number {
  let score = 0;

  const pac = data.totalPacSpending || 0;
  if (pac > 5_000_000) score += 25;
  else if (pac > 1_000_000) score += 20;
  else if (pac > 500_000) score += 15;
  else if (pac > 100_000) score += 10;
  else if (pac > 0) score += 5;

  const lobby = data.lobbyingSpend || 0;
  if (lobby > 10_000_000) score += 25;
  else if (lobby > 5_000_000) score += 20;
  else if (lobby > 1_000_000) score += 15;
  else if (lobby > 100_000) score += 10;
  else if (lobby > 0) score += 5;

  const contracts = data.governmentContracts || 0;
  if (contracts > 1_000_000_000) score += 20;
  else if (contracts > 100_000_000) score += 15;
  else if (contracts > 10_000_000) score += 10;
  else if (contracts > 0) score += 5;

  const rd = data.revolvingDoorCount || 0;
  if (rd >= 5) score += 15;
  else if (rd >= 3) score += 10;
  else if (rd >= 1) score += 5;

  const ta = data.tradeAssociationCount || 0;
  const exec = data.executiveDonations || 0;
  if (ta >= 5 || exec > 500_000) score += 15;
  else if (ta >= 3 || exec > 100_000) score += 10;
  else if (ta >= 1 || exec > 0) score += 5;

  return Math.min(100, score);
}

export function InfluenceScore({ score, size = "md", showLabel = true, animated = true }: InfluenceScoreProps) {
  const { ring, label } = getScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizes = {
    sm: { container: "w-16 h-16", text: "text-lg", label: "text-xs" },
    md: { container: "w-24 h-24", text: "text-2xl", label: "text-xs" },
    lg: { container: "w-32 h-32", text: "text-4xl", label: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className={cn("relative", s.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
            className={ring}
            initial={animated ? { strokeDashoffset: circumference } : undefined}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-display", s.text, ring)}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn("font-semibold text-foreground", s.label)}>{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">How much this company tries to influence government</p>
        </div>
      )}
    </div>
  );
}
