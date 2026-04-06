import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DontSignBlindBannerProps {
  /** Delay in ms before the banner can appear (linger threshold) */
  lingerMs?: number;
}

export function DontSignBlindBanner({ lingerMs = 15000 }: DontSignBlindBannerProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed this session
    if (sessionStorage.getItem("dsb_dismissed")) {
      setDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, lingerMs);

    return () => clearTimeout(timer);
  }, [lingerMs]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("dsb_dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
        >
          <div className="max-w-[600px] mx-auto pointer-events-auto bg-card/95 backdrop-blur-md border border-primary/20 px-5 py-4 flex items-start gap-4 shadow-2xl">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-foreground">
                Don't sign blind.
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                Check your offer privately — paste only the terms you want reviewed. Nothing is saved. Red-flag clauses, compensation benchmarks, and negotiation angles in 30 seconds.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
