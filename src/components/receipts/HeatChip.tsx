import { Flame } from "lucide-react";
import { HEAT_LABELS } from "./heat-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HeatChipProps {
  level: number;
  className?: string;
}

export function HeatChip({ level, className }: HeatChipProps) {
  const heat = HEAT_LABELS[level] || HEAT_LABELS[1];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border rounded-full transition-colors relative cursor-default",
        "text-xs px-3 py-1.5 md:text-[11px] md:px-2.5 md:py-1",
        heat.bg,
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Flame className="w-3.5 h-3.5 md:w-3 md:h-3 shrink-0" fill="currentColor" />
      <span className="md:hidden">{heat.mobile}</span>
      <span className="hidden md:inline">{heat.full}</span>

      {/* Easter Egg Tooltip */}
      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap z-50 pointer-events-none animate-fade-in"
          style={{
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
            fontStyle: "italic",
          }}
        >
          {heat.tooltip}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid hsl(var(--foreground))",
            }}
          />
        </span>
      )}
    </span>
  );
}
