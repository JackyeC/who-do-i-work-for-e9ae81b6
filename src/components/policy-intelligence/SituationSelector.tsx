import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type Situation,
  SITUATION_LABELS,
  SITUATION_ICONS,
  getSituationsFromStorage,
  saveSituationsToStorage,
} from "@/lib/policyScoreEngine";

const ALL_SITUATIONS: Situation[] = [
  "compensation", "stability", "caregiver", "early-career",
  "career-switcher", "values-first", "risk-aware", "leadership", "culture-safety",
];

interface Props {
  value?: Situation[];
  onChange?: (situations: Situation[]) => void;
  maxSelections?: number;
}

export function SituationSelector({ value, onChange, maxSelections = 3 }: Props) {
  const [selected, setSelected] = useState<Situation[]>(value ?? getSituationsFromStorage());

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const toggle = (s: Situation) => {
    let next: Situation[];
    if (selected.includes(s)) {
      next = selected.filter(x => x !== s);
    } else {
      if (selected.length >= maxSelections) return;
      next = [...selected, s];
    }
    setSelected(next);
    saveSituationsToStorage(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">What matters most to you right now?</p>
        <span className="text-xs text-muted-foreground">{selected.length}/{maxSelections} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_SITUATIONS.map((s) => {
          const isActive = selected.includes(s);
          const isDisabled = !isActive && selected.length >= maxSelections;
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              disabled={isDisabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                isActive
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : isDisabled
                    ? "bg-muted/30 border-border/30 text-muted-foreground/40 cursor-not-allowed"
                    : "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <span>{SITUATION_ICONS[s]}</span>
              {SITUATION_LABELS[s]}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Policy scores are weighted toward {selected.map(s => SITUATION_LABELS[s].toLowerCase()).join(", ")} priorities.
        </p>
      )}
    </div>
  );
}
