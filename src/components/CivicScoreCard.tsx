import { cn } from "@/lib/utils";
import { Eye, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CivicScoreCardProps {
  score: number;
  companyName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number) {
  if (score >= 70) return { bg: "bg-civic-green/15", border: "border-civic-green/30", text: "text-civic-green", fill: "hsl(var(--civic-green))" };
  if (score >= 40) return { bg: "bg-civic-yellow/15", border: "border-civic-yellow/30", text: "text-civic-yellow", fill: "hsl(var(--civic-yellow))" };
  return { bg: "bg-civic-red/15", border: "border-civic-red/30", text: "text-civic-red", fill: "hsl(var(--civic-red))" };
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Mixed";
  if (score >= 30) return "Concerning";
  return "Poor";
}

function getScoreIcon(score: number) {
  if (score >= 70) return CheckCircle2;
  if (score >= 40) return Shield;
  return AlertTriangle;
}

export function CivicScoreCard({ score, companyName, size = "md", showLabel = true, className }: CivicScoreCardProps) {
  const colors = getScoreColor(score);
  const label = getScoreLabel(score);
  const Icon = getScoreIcon(score);

  const sizeConfig = {
    xs: { container: "w-8 h-8", text: "text-xs font-bold", ring: 2, radius: 12 },
    sm: { container: "w-10 h-10", text: "text-sm font-bold", ring: 2.5, radius: 16 },
    md: { container: "w-14 h-14", text: "text-lg font-bold", ring: 3, radius: 22 },
    lg: { container: "w-20 h-20", text: "text-2xl font-bold", ring: 3.5, radius: 30 },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", config.container)}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${(config.radius + config.ring) * 2} ${(config.radius + config.ring) * 2}`}>
          <circle
            cx={config.radius + config.ring}
            cy={config.radius + config.ring}
            r={config.radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={config.ring}
          />
          <circle
            cx={config.radius + config.ring}
            cy={config.radius + config.ring}
            r={config.radius}
            fill="none"
            stroke={colors.fill}
            strokeWidth={config.ring}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className={cn(config.text, colors.text)}>{score}</span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn("text-xs font-semibold uppercase tracking-wider", colors.text)}>{label}</span>
          <span className="text-xs text-muted-foreground">Employer Reality Score</span>
        </div>
      )}
    </div>
  );
}

/** Compact badge version for embedding in lists */
export function CivicScoreBadge({ score, className }: { score: number; className?: string }) {
  const colors = getScoreColor(score);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
      colors.bg, colors.border, colors.text,
      className
    )}>
      <Eye className="w-3 h-3" />
      {score}
    </span>
  );
}
