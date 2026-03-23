import { cn } from "@/lib/utils";

interface Props {
  score: number; // 0-100
  label?: string;
  size?: "sm" | "md";
}

function getColor(score: number) {
  if (score >= 70) return { ring: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]", label: "Strong Stability" };
  if (score >= 45) return { ring: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]", label: "Moderate Stability" };
  return { ring: "text-[hsl(var(--civic-red))]", bg: "bg-[hsl(var(--civic-red))]", label: "Low Stability" };
}

export function StabilityGauge({ score, label, size = "md" }: Props) {
  const config = getColor(score);
  const dim = size === "sm" ? 64 : 96;
  const stroke = size === "sm" ? 5 : 7;
  const r = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle
            cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={cn("transition-all duration-700", config.ring)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-foreground", size === "sm" ? "text-base" : "text-2xl")}>{score}</span>
        </div>
      </div>
      <p className={cn("font-medium", size === "sm" ? "text-xs" : "text-xs", config.ring)}>{config.label}</p>
      {label && <p className="text-xs text-muted-foreground text-center max-w-[120px]">{label}</p>}
    </div>
  );
}
