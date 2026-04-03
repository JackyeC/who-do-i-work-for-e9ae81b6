import { motion } from "framer-motion";

interface PatternBreakToastProps {
  message: string;
}

/**
 * Inline "hope" affordance shown immediately after a healthy choice is made.
 * Appears in Episode 3 when the player picks an exit/boundary choice.
 */
export function PatternBreakToast({ message }: PatternBreakToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-lg border border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5 px-4 py-3 flex items-start gap-3"
    >
      <span className="text-sm shrink-0 mt-0.5">🔓</span>
      <p className="text-xs text-[hsl(var(--civic-green))] font-medium leading-relaxed">
        {message}
      </p>
    </motion.div>
  );
}
