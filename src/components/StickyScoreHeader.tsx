import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, ChevronDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface StickyScoreHeaderProps {
  companyName: string;
  score: number;
  ticker?: string | null;
  industry: string;
  scrollRef?: React.RefObject<HTMLElement>;
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-[hsl(var(--civic-green))]";
  if (score >= 45) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

function getOfferRisk(score: number) {
  if (score >= 65) return { level: "Low", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/30" };
  if (score >= 40) return { level: "Moderate", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30" };
  return { level: "Elevated", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "intelligence", label: "Intelligence" },
  { id: "leadership", label: "Leadership" },
  { id: "workforce", label: "Workforce" },
  { id: "compensation", label: "Pay" },
  { id: "stability", label: "Stability" },
  { id: "influence", label: "Influence" },
  { id: "values", label: "Values" },
];

export function StickyScoreHeader({ companyName, score, ticker, industry }: StickyScoreHeaderProps) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 320);
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${SECTIONS[i].id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const risk = getOfferRisk(score);
  const isElevated = risk.level === "Elevated";

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm"
        >
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Bloomberg-style status bar */}
            <div className="flex items-center justify-between h-12 gap-3">
              {/* Left: Company identity */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-foreground text-sm truncate">{companyName}</span>
                {ticker && (
                  <Badge variant="outline" className="font-mono text-xs shrink-0 tabular-nums">{ticker}</Badge>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline">{industry}</span>
              </div>

              {/* Right: Terminal-style scores */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Score in monospaced terminal style */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border/50 bg-muted/30">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground">CCS™</span>
                  <span className={cn("font-mono text-base font-black tabular-nums leading-none", getScoreColor(score))}>
                    {score}
                  </span>
                </div>

                {/* Risk badge with pulsing CAUTION for elevated */}
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold font-mono uppercase tracking-wider",
                  risk.bg, risk.color, risk.border,
                  isElevated && "animate-caution"
                )}>
                  {isElevated ? (
                    <Activity className="w-3 h-3 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {isElevated ? "CAUTION" : risk.level}
                </div>
              </div>
            </div>

            {/* Section nav tabs */}
            <div className="flex items-center gap-0.5 -mb-px overflow-x-auto scrollbar-none">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 font-mono",
                    activeSection === s.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
