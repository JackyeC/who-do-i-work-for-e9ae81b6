import { Flame } from "lucide-react";
import { HEAT_LABELS } from "./heat-config";
import { cn } from "@/lib/utils";

interface HeatChipProps {
  level: number;
  className?: string;
}

export function HeatChip({ level, className }: HeatChipProps) {
  const heat = HEAT_LABELS[level] || HEAT_LABELS[1];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border rounded-full transition-colors",
        // Mobile: large tap targets, bold pills
        "text-xs px-3 py-1.5 md:text-[11px] md:px-2.5 md:py-1",
        heat.bg,
        className
      )}
    >
      <Flame className="w-3.5 h-3.5 md:w-3 md:h-3 shrink-0" fill="currentColor" />
      <span className="md:hidden">{heat.mobile}</span>
      <span className="hidden md:inline">{heat.full}</span>
    </span>
  );
}
