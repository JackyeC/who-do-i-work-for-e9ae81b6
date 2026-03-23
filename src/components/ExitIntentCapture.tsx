import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ExitIntentCapture() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 5 && !dismissed && !user) {
      const shown = sessionStorage.getItem("exit-intent-shown");
      if (!shown) {
        setShow(true);
        sessionStorage.setItem("exit-intent-shown", "1");
      }
    }
  }, [dismissed, user]);

  useEffect(() => {
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave]);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  if (user) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-card border border-border p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>

            <h3 className="text-lg font-bold text-foreground text-center mb-2 font-display">
              Don't sign blind.
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Run a free employer scan before you accept. See the political footprint, compensation reality, and culture signals behind any company.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { dismiss(); navigate("/check?tab=company"); }}
                className="w-full gap-1.5 font-mono text-xs tracking-wider uppercase"
              >
                Run My Free Scan
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => { dismiss(); navigate("/login"); }}
                className="w-full font-mono text-xs tracking-wider uppercase"
              >
                Create Free Account
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              No credit card required. 3 free intelligence scans included.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
