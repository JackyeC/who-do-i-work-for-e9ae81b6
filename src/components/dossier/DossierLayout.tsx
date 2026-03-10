import { ReactNode, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/hooks/use-premium";
import { useViewMode } from "@/contexts/ViewModeContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DossierLayerProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  layerNumber: number;
  children: ReactNode;
  defaultOpen?: boolean;
  requiresPro?: boolean;
  recruiterOnly?: boolean;
  className?: string;
}

export function DossierLayer({
  title, subtitle, icon: Icon, layerNumber, children,
  defaultOpen = false, requiresPro = false, recruiterOnly = false, className,
}: DossierLayerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { isPremium } = usePremium();
  const { isRecruiterMode } = useViewMode();
  const navigate = useNavigate();

  // Hide recruiter-only layers in candidate mode
  if (recruiterOnly && !isRecruiterMode) return null;

  const locked = requiresPro && !isPremium;

  return (
    <div className={cn("border border-border/40 rounded-2xl bg-card overflow-hidden", className)}>
      <button
        onClick={() => !locked && setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-4 px-6 py-5 text-left transition-colors",
          locked ? "cursor-not-allowed opacity-70" : "hover:bg-accent/30 cursor-pointer"
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/8 shrink-0">
          {locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Icon className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-micro text-muted-foreground font-mono">LAYER {layerNumber}</span>
            {recruiterOnly && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Pro</span>
            )}
          </div>
          <h3 className="text-body-lg font-semibold text-foreground leading-tight mt-0.5">{title}</h3>
          {subtitle && <p className="text-caption text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {locked ? (
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={(e) => { e.stopPropagation(); navigate("/login"); }}>
            Unlock
          </Button>
        ) : (
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0", open && "rotate-180")} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && !locked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TransparencyDisclaimer() {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/30 px-5 py-4 text-caption text-muted-foreground leading-relaxed">
      <p>
        This platform surfaces signals from public records, documented disclosures, and clearly labeled enrichment sources. 
        It does not assign moral or legal judgments. Interpretation is left to the user.
      </p>
    </div>
  );
}
