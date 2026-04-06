interface CoverageBiasBarProps {
  left: number;
  center: number;
  right: number;
  total: number;
}

export function CoverageBiasBar({ left, center, right, total }: CoverageBiasBarProps) {
  if (total <= 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic px-1 py-2">
        Source analysis pending
      </p>
    );
  }

  const pctL = Math.round((left / total) * 100) || 0;
  const pctR = Math.round((right / total) * 100) || 0;
  const pctC = 100 - pctL - pctR; // ensure they sum to 100

  const minW = 36; // px minimum per segment

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="flex w-full h-[26px] rounded-[6px] overflow-hidden">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            backgroundColor: "#4a90d9",
            flex: pctL,
            minWidth: left > 0 ? `${minW}px` : 0,
          }}
        >
          {left > 0 && `L ${pctL}%`}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            backgroundColor: "#6b6b7b",
            flex: pctC,
            minWidth: center > 0 ? `${minW}px` : 0,
          }}
        >
          {center > 0 && `C ${pctC}%`}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            backgroundColor: "#d94a4a",
            flex: pctR,
            minWidth: right > 0 ? `${minW}px` : 0,
          }}
        >
          {right > 0 && `R ${pctR}%`}
        </div>
      </div>

      {/* Source count summary */}
      <p className="text-[11px] text-muted-foreground">
        <span className="text-foreground/70">{total}</span> source{total !== 1 ? "s" : ""} covering this story
        {left > 0 && (
          <> · <span style={{ color: "#4a90d9" }}>{left} left</span></>
        )}
        {center > 0 && (
          <> · <span style={{ color: "#6b6b7b" }}>{center} center</span></>
        )}
        {right > 0 && (
          <> · <span style={{ color: "#d94a4a" }}>{right} right</span></>
        )}
      </p>
    </div>
  );
}
