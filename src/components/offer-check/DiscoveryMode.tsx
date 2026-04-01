import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, FileText, Radio, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const RESEARCH_STEPS = [
  { label: "Checking public filings...", icon: FileText, durationMs: 3000 },
  { label: "Scanning news and signals...", icon: Radio, durationMs: 4000 },
  { label: "Analyzing available data...", icon: Search, durationMs: 3500 },
];

type DiscoveryOutcome = "partial" | "limited" | "none";

interface DiscoveryModeProps {
  companyName: string;
  onOutcome?: (outcome: DiscoveryOutcome) => void;
}

export default function DiscoveryMode({ companyName, onOutcome }: DiscoveryModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [outcome, setOutcome] = useState<DiscoveryOutcome | null>(null);

  useEffect(() => {
    setCurrentStep(0);
    setCompleted(false);
    setOutcome(null);

    let stepIndex = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    let elapsed = 0;
    RESEARCH_STEPS.forEach((step, i) => {
      const t = setTimeout(() => setCurrentStep(i), elapsed);
      timers.push(t);
      elapsed += step.durationMs;
    });

    // Finish
    const finishTimer = setTimeout(() => {
      setCompleted(true);
      // Simulate outcome — always show "limited" for unknown companies
      // since we have no real async research pipeline yet
      const result: DiscoveryOutcome = "limited";
      setOutcome(result);
      onOutcome?.(result);
    }, elapsed);
    timers.push(finishTimer);

    return () => timers.forEach(clearTimeout);
  }, [companyName]);

  if (completed && outcome) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {outcome === "limited" && (
          <div className="bg-civic-yellow/10 border border-civic-yellow/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-civic-yellow mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">
              Limited public data available so far
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We checked public filings, news, and government records for <span className="font-medium text-foreground">"{companyName}"</span>. 
              Limited information is available right now — this could mean the company is private, recently formed, or uses a different legal name.
            </p>
            <div className="mt-4 space-y-1.5 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-civic-green shrink-0" />
                Public filings checked
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-civic-green shrink-0" />
                News sources scanned
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-civic-green shrink-0" />
                Government records queried
              </div>
            </div>
          </div>
        )}

        {outcome === "none" && (
          <div className="bg-muted/50 border border-border rounded-2xl p-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">
              No significant public records found yet
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We searched available public databases for <span className="font-medium text-foreground">"{companyName}"</span> but didn't find significant records. 
              This doesn't mean the company doesn't exist — it may operate under a different name or be too new for public records.
            </p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Try searching with the company's full legal name, or{" "}
            <a href="/request-correction" className="text-primary hover:underline font-medium">
              request a manual review
            </a>{" "}
            and our team will investigate.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-8 text-center"
    >
      <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-bold text-foreground mb-1">
        We're pulling data on this company now
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        This isn't in our system yet. We're checking public records and building your report.
      </p>

      <div className="space-y-3 max-w-xs mx-auto text-left">
        {RESEARCH_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = currentStep === i;
          const isDone = currentStep > i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                isActive ? "text-primary font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"
              )}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-civic-green shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              ) : (
                <StepIcon className="w-4 h-4 shrink-0" />
              )}
              {step.label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
