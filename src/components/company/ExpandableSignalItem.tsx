import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { safeSignalSummary } from "@/utils/signalTextSanitizer";
import { motion, AnimatePresence } from "framer-motion";

interface Signal {
  summary: string;
  confidence: "Low" | "Medium" | "High";
  recency: string;
  uiStatement?: string;
  direction?: string;
  /** Extra detail shown when expanded */
  detail?: string;
  /** Deep-link routes to show in expanded state */
  deepLinks?: { label: string; to: string }[];
}

const CONFIDENCE_COLOR: Record<string, string> = {
  Low: "border-destructive/30 text-destructive",
  Medium: "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]",
  High: "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]",
};

const RECENCY_DOT: Record<string, string> = {
  "Last 30 days": "bg-[hsl(var(--civic-green))]",
  "Last 30–60 days": "bg-[hsl(var(--civic-yellow))]",
  "Last 6 months": "bg-destructive/60",
  "6+ months ago": "bg-muted-foreground/40",
  "Unknown": "bg-muted-foreground/20",
};

const DIRECTION_ICON: Record<string, typeof TrendingUp> = {
  increase: TrendingUp,
  decrease: TrendingDown,
  stable: Minus,
};

const DIRECTION_COLOR: Record<string, string> = {
  increase: "text-[hsl(var(--civic-green))]",
  decrease: "text-destructive",
  stable: "text-muted-foreground",
};

export function ExpandableSignalItem({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false);
  const DirIcon = signal.direction ? DIRECTION_ICON[signal.direction] : null;
  const dirColor = signal.direction ? DIRECTION_COLOR[signal.direction] : "";
  const hasExpandable = signal.detail || (signal.deepLinks && signal.deepLinks.length > 0);

  return (
    <div
      className={cn(
        "space-y-1 rounded-md transition-colors",
        hasExpandable && "cursor-pointer hover:bg-muted/30"
      )}
      onClick={() => hasExpandable && setOpen(!open)}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        {DirIcon && <DirIcon className={cn("w-3.5 h-3.5", dirColor)} />}
        {signal.uiStatement && (
          <span className="text-sm font-medium text-foreground flex-1">
            {safeSignalSummary(signal.uiStatement, "Signal observed")}
          </span>
        )}
        {hasExpandable && (
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        )}
      </div>

      {/* Summary + badges */}
      <div className="flex items-start gap-3 text-sm">
        <div className="flex-1 text-foreground/85 leading-relaxed">
          {safeSignalSummary(signal.summary)}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", RECENCY_DOT[signal.recency] || RECENCY_DOT["Unknown"])} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{signal.recency}</span>
          </div>
          <Badge variant="outline" className={cn("text-xs px-1.5 py-0", CONFIDENCE_COLOR[signal.confidence])}>
            {signal.confidence}
          </Badge>
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && hasExpandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 pb-1 pl-5 border-l-2 border-primary/20 ml-1 space-y-2">
              {signal.detail && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {signal.detail}
                </p>
              )}
              {signal.deepLinks && signal.deepLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {signal.deepLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
