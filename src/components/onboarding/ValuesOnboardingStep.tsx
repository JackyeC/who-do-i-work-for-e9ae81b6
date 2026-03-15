import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { VALUES_GROUPS, VALUES_LENSES } from "@/lib/valuesLenses";

interface ValuesOnboardingStepProps {
  onComplete: (selectedValues: string[]) => void;
  onSkip: () => void;
}

// Pick top values from each group for a quick-select experience
const QUICK_VALUES = VALUES_LENSES.filter((_, i) => i % 2 === 0).slice(0, 12);

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
          <h3 className="text-lg font-bold text-foreground font-display">What matters to you?</h3>
          <p className="text-sm text-muted-foreground">Pick the values you care about most. This powers your Career DNA.</p>
        </div>
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
          {selected.size} value{selected.size !== 1 ? "s" : ""} selected — you can fine-tune weights later in your dashboard.
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
