import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PostPurchaseUpsellProps {
  onDismiss: () => void;
}

export function PostPurchaseUpsell({ onDismiss }: PostPurchaseUpsellProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="relative rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 mb-6"
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider mb-2">
              Credits Added
            </Badge>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Love what you see? Ready for the real deal?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Stop buying one report at a time. Get <strong className="text-foreground">unlimited access</strong> to
              full intelligence dossiers, offer checks, and Ask Jackye — starting at just $29/mo.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate("/pricing")}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                See Plans
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Not yet — I'll keep buying credits
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
