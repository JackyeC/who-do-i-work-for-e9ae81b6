import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, Info } from "lucide-react";
import { VALUES_GROUPS, VALUES_LENSES, type ValuesGroupKey } from "@/lib/valuesLenses";

interface ValuesOnboardingStepProps {
  onComplete: (selectedValues: string[]) => void;
  onSkip: () => void;
}

// Pick representative values from each group for quick selection
const QUICK_VALUES = VALUES_GROUPS.flatMap((group) => {
  const groupLenses = VALUES_LENSES.filter((l) => l.group === group.key);
  return groupLenses.slice(0, 2); // 2 per group = ~12 total
});

export function ValuesOnboardingStep({ onComplete, onSkip }: ValuesOnboardingStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground font-display">What matters to you at work?</h3>
          <p className="text-sm text-muted-foreground">Pick the workplace priorities you care about most. This powers your Career DNA.</p>
        </div>
      </div>

      {/* Neutral framing microcopy */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These aren't political positions. They're signals about how companies operate — so you can decide what matters to you.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_VALUES.map((v) => {
          const Icon = v.icon;
          const isSelected = selected.has(v.key);
          return (
            <button
              key={v.key}
              onClick={() => toggle(v.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                isSelected
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
              {isSelected && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-primary font-medium"
        >
          {selected.size} priorit{selected.size !== 1 ? "ies" : "y"} selected — you can adjust importance later in your dashboard.
        </motion.p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
        <Button
          onClick={() => onComplete(Array.from(selected))}
          disabled={selected.size === 0}
          className="gap-1.5"
        >
          Continue
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
