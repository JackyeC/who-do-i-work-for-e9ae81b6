import { useDemoSafeMode } from "@/contexts/DemoSafeModeContext";
import { PremiumTier } from "@/hooks/use-premium";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const TIERS: { value: PremiumTier | null; label: string; color: string }[] = [
  { value: null, label: "REAL", color: "bg-muted text-muted-foreground" },
  { value: "free", label: "FREE", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "candidate", label: "PRO", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "professional", label: "ENT", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

export function PreviewTierToolbar() {
  const { canToggle, previewTier, setPreviewTier } = useDemoSafeMode();
  const [expanded, setExpanded] = useState(false);

  if (!canToggle) return null;

  const activeTier = TIERS.find((t) => t.value === previewTier) ?? TIERS[0];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-1 bg-card border border-border rounded-lg p-2 shadow-xl"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 pb-1 border-b border-border mb-1">
              Preview As
            </span>
            {TIERS.map((tier) => (
              <button
                key={tier.label}
                onClick={() => {
                  setPreviewTier(tier.value);
                  setExpanded(false);
                }}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider border transition-all text-left",
                  previewTier === tier.value
                    ? cn(tier.color, "border-current")
                    : "border-transparent hover:bg-muted/50 text-muted-foreground"
                )}
              >
                {tier.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg font-mono text-xs uppercase tracking-wider transition-all",
          previewTier
            ? cn(activeTier.color, "border-current")
            : "bg-card border-border text-muted-foreground hover:text-foreground"
        )}
      >
        {previewTier ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        {previewTier ? `Viewing as ${activeTier.label}` : "Preview"}
      </button>
    </div>
  );
}
