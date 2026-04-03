import { motion } from "framer-motion";
import type { Choice } from "@/types/no-regrets-game";

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onChoose, disabled }: ChoiceButtonsProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60 mb-1">
        What do you do?
      </p>
      {choices.map((choice, idx) => (
        <motion.button
          key={choice.id}
          onClick={() => onChoose(choice)}
          disabled={disabled}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * idx, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ scale: 1.01, boxShadow: "0 4px 20px -4px hsl(var(--primary) / 0.15)" }}
          whileTap={{ scale: 0.99 }}
          className="group w-full text-left rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-primary/30 transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex items-start gap-4 p-4 md:p-5">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-center text-xs font-mono font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-sm md:text-[15px] text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
              {choice.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
