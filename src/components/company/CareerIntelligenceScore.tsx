interface CareerIntelligenceScoreProps {
  score: number | null;
}

export function CareerIntelligenceScore({ score }: CareerIntelligenceScoreProps) {
  const value = score ?? 0;
  const pct = (value / 10) * 100;

  const getColor = () => {
    if (value >= 7) return "text-primary";
    if (value >= 4) return "text-amber-500";
    return "text-destructive";
  };

  const getBg = () => {
    if (value >= 7) return "bg-primary";
    if (value >= 4) return "bg-amber-500";
    return "bg-destructive";
  };

  const getLabel = () => {
    if (value >= 8) return "Excellent";
    if (value >= 6) return "Good";
    if (value >= 4) return "Moderate";
    if (value >= 2) return "Limited";
    return "Insufficient";
  };

  return (
    <div className="bg-card border border-border p-5">
      <div className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">
        Career Intelligence Score
      </div>
      <div className="flex items-end gap-3 mb-3">
        <span className={`font-data text-3xl font-bold tabular-nums ${getColor()}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground mb-1">/10</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className={`h-full ${getBg()} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`font-mono text-xs ${getColor()}`}>{getLabel()}</div>
    </div>
  );
}
