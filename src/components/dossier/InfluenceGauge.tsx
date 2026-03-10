import { useMemo } from "react";

interface InfluenceGaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function InfluenceGauge({ value, max = 100, label, size = "md" }: InfluenceGaugeProps) {
  const dimensions = { sm: 80, md: 120, lg: 160 };
  const dim = dimensions[size];
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = (dim - strokeWidth) / 2;
  const circumference = radius * Math.PI; // half circle
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  const color = useMemo(() => {
    if (percentage >= 0.7) return "hsl(var(--destructive))";
    if (percentage >= 0.4) return "hsl(var(--civic-yellow))";
    return "hsl(var(--civic-green))";
  }, [percentage]);

  const fontSize = size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl";

  return (
    <div className="flex flex-col items-center">
      <svg width={dim} height={dim / 2 + 10} viewBox={`0 0 ${dim} ${dim / 2 + 10}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${dim / 2} A ${radius} ${radius} 0 0 1 ${dim - strokeWidth / 2} ${dim / 2}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${dim / 2} A ${radius} ${radius} 0 0 1 ${dim - strokeWidth / 2} ${dim / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className={`-mt-4 ${fontSize} font-bold font-mono text-foreground`}>{value}</div>
      <div className="text-micro text-muted-foreground mt-1 text-center">{label}</div>
    </div>
  );
}
