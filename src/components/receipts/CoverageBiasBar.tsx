/**
 * Ground News-style full-width coverage bias bar.
 * Shows Left / Center / Right as a segmented percentage bar.
 */

import { getSourceBiasKey } from "./BiasBar";

interface CoverageBiasBarProps {
  sourceName: string | null;
  className?: string;
}

const BIAS_COLORS = {
  left: "#3B82F6",
  "lean-left": "#60A5FA",
  center: "#A78BFA",
  "lean-right": "#FB7185",
  right: "#EF4444",
};

const BIAS_LABELS: Record<string, string> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
};

/* Simulate a coverage distribution based on bias key — 
   in a real system this would come from multi-source aggregation */
function getCoverageDistribution(bias: string) {
  switch (bias) {
    case "left":
      return { L: 62, C: 24, R: 14 };
    case "lean-left":
      return { L: 48, C: 34, R: 18 };
    case "center":
      return { L: 28, C: 44, R: 28 };
    case "lean-right":
      return { L: 18, C: 34, R: 48 };
    case "right":
      return { L: 14, C: 24, R: 62 };
    default:
      return { L: 30, C: 40, R: 30 };
  }
}

export function CoverageBiasBar({ sourceName, className }: CoverageBiasBarProps) {
  const bias = getSourceBiasKey(sourceName);
  const dist = getCoverageDistribution(bias);
  const label = BIAS_LABELS[bias] || "Center";
  const color = BIAS_COLORS[bias as keyof typeof BIAS_COLORS] || BIAS_COLORS.center;

  return (
    <div className={className}>
      {/* Percentage bar */}
      <div className="flex h-[6px] rounded-full overflow-hidden w-full">
        <div
          className="transition-all"
          style={{ width: `${dist.L}%`, background: "#3B82F6" }}
        />
        <div
          className="transition-all"
          style={{ width: `${dist.C}%`, background: "#A78BFA" }}
        />
        <div
          className="transition-all"
          style={{ width: `${dist.R}%`, background: "#EF4444" }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-mono" style={{ color: "#3B82F6" }}>
          L {dist.L}%
        </span>
        <span className="text-[10px] font-mono" style={{ color: "#A78BFA" }}>
          C {dist.C}%
        </span>
        <span className="text-[10px] font-mono" style={{ color: "#EF4444" }}>
          R {dist.R}%
        </span>
      </div>
    </div>
  );
}

/* Blindspot-style badge (Ground News signature element) */
export function BlindspotBadge({ sourceName }: { sourceName: string | null }) {
  const bias = getSourceBiasKey(sourceName);
  
  let blindspot: { side: string; color: string; bg: string } | null = null;
  
  if (bias === "left" || bias === "lean-left") {
    blindspot = { side: "the Right", color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
  } else if (bias === "right" || bias === "lean-right") {
    blindspot = { side: "the Left", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" };
  }
  
  if (!blindspot) return null;
  
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ color: blindspot.color, background: blindspot.bg, border: `1px solid ${blindspot.color}20` }}
    >
      Blindspot for {blindspot.side}
    </span>
  );
}
