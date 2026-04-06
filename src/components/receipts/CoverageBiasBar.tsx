/**
 * Ground News-style full-width coverage bias bar.
 * Uses REAL source counts from topic grouping when available.
 */

import { getSourceBiasKey } from "./BiasBar";
import type { CoverageStats } from "@/hooks/use-receipts-feed";

interface CoverageBiasBarProps {
  sourceName: string | null;
  coverage?: CoverageStats;
  className?: string;
}

export function CoverageBiasBar({ sourceName, coverage, className }: CoverageBiasBarProps) {
  const total = coverage?.total || 1;
  const left = coverage?.left || 0;
  const center = coverage?.center || (coverage ? 0 : 1);
  const right = coverage?.right || 0;
  const pctL = total > 0 ? Math.round((left / total) * 100) : 0;
  const pctR = total > 0 ? Math.round((right / total) * 100) : 0;
  const pctC = 100 - pctL - pctR;

  return (
    <div className={className}>
      {/* Source count */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-bold text-foreground/70 font-mono">
          {total} {total === 1 ? "source" : "sources"}
        </span>
        {coverage && coverage.sources.length > 1 && (
          <span className="text-[9px] text-muted-foreground/50 font-mono truncate">
            {coverage.sources.slice(0, 3).join(" · ")}{coverage.sources.length > 3 ? ` +${coverage.sources.length - 3}` : ""}
          </span>
        )}
      </div>
      {/* Percentage bar */}
      <div className="flex h-[6px] rounded-full overflow-hidden w-full">
        {pctL > 0 && <div className="transition-all" style={{ width: `${pctL}%`, background: "#3B82F6" }} />}
        {pctC > 0 && <div className="transition-all" style={{ width: `${pctC}%`, background: "#A78BFA" }} />}
        {pctR > 0 && <div className="transition-all" style={{ width: `${pctR}%`, background: "#EF4444" }} />}
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono" style={{ color: "#3B82F6" }}>L {pctL}%</span>
        <span className="text-[9px] font-mono" style={{ color: "#A78BFA" }}>C {pctC}%</span>
        <span className="text-[9px] font-mono" style={{ color: "#EF4444" }}>R {pctR}%</span>
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
