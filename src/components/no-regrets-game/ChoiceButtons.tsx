import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Choice } from "@/types/no-regrets-game";

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
  /** Optional overlay message shown briefly after choosing */
  postChoiceOverlay?: string;
}

export function ChoiceButtons({ choices, onChoose, disabled, postChoiceOverlay }: ChoiceButtonsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (choice: Choice) => {
    if (selectedId) return;
    setSelectedId(choice.id);

    if (postChoiceOverlay) {
      // Show overlay briefly, then fire callback
      setTimeout(() => onChoose(choice), 1800);
    } else {
      // Small "selected" beat before navigating
      setTimeout(() => onChoose(choice), 350);
    }
  };

  return (
    <div className="space-y-3 relative">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60 mb-1">
        What do you do?
      </p>
      {choices.map((choice, idx) => {
        const isSelected = selectedId === choice.id;
        return (
          <motion.button
            key={choice.id}
            onClick={() => handleClick(choice)}
            disabled={disabled || !!selectedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: selectedId && !isSelected ? 0.3 : 1,
              y: 0,
              scale: isSelected ? 0.98 : 1,
            }}
            transition={{ delay: selectedId ? 0 : 0.15 * idx, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={!selectedId ? {
              scale: 1.01,
              boxShadow: "0 4px 24px -4px hsl(var(--primary) / 0.18)",
              borderColor: "hsl(var(--primary) / 0.4)",
            } : undefined}
            whileTap={!selectedId ? { scale: 0.985 } : undefined}
            className={`group w-full text-left rounded-xl border bg-card/60 transition-all duration-200 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:transform-none ${
              isSelected
                ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)]"
                : "border-border/40 hover:bg-card hover:border-primary/30"
            } ${selectedId && !isSelected ? "opacity-30" : ""}`}
          >
            <div className="flex items-start gap-4 p-4 md:p-5">
              <span className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                isSelected
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted/40 border-border/30 text-muted-foreground group-hover:text-primary group-hover:border-primary/30"
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-sm md:text-[15px] text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                {choice.label}
              </span>
            </div>
          </motion.button>
        );
      })}

      {/* Post-choice insight overlay */}
      <AnimatePresence>
        {selectedId && postChoiceOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center z-10 motion-reduce:transition-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-xl px-6 py-4 max-w-sm mx-4 shadow-lg motion-reduce:transition-none"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/60 mb-1.5">Intel</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">{postChoiceOverlay}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
