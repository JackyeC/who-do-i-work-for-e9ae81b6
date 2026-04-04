import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ND_ONBOARDING_KEY = "wdiwf-nd-onboarding-seen";

const steps = [
  {
    title: "Welcome to ND Mode",
    description:
      "This view translates employer signals into plain language. Every section answers three questions: what is this, why does it matter, and what can I do next.",
    highlight: "The page is designed to reduce cognitive load and make every action obvious.",
  },
  {
    title: "Quick Read",
    description:
      "Start here. Five simple ratings tell you how clear, fast, social, flexible, and safe this workplace may be.",
    highlight: "Each rating uses Low, Medium, or High with a one-line explanation. No jargon.",
  },
  {
    title: "Evidence and Feel",
    description:
      "We show what we found in public records, then translate it into what the job may actually feel like day-to-day.",
    highlight: "'Good fit if' and 'Be careful if' lines help you decide quickly without reading everything.",
  },
  {
    title: "Questions and Actions",
    description:
      "Ready-made interview questions with softer versions you can copy. Plus tailored suggestions for your resume, cover letter, and application.",
    highlight: "Every question includes a 'why ask this' note so you know what information you are gathering.",
  },
  {
    title: "Need help anytime?",
    description:
      "Use the help button in the bottom-right corner to see what any rating, icon, or section means. You can also replay this walkthrough from there.",
    highlight: "The progress bar at the top shows where you are on the page. Click any step to jump there.",
  },
];

interface NDOnboardingWalkthroughProps {
  onComplete: () => void;
}

export function NDOnboardingWalkthrough({ onComplete }: NDOnboardingWalkthroughProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ND_ONBOARDING_KEY);
      if (seen !== "true") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleComplete = () => {
    try { localStorage.setItem(ND_ONBOARDING_KEY, "true"); } catch {}
    setVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 border border-border/50 bg-card p-6 space-y-4 shadow-lg">
        {/* Progress bar */}
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-muted/40 transition-colors"
            aria-label="Close walkthrough"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-foreground">{current.title}</h3>
        <p className="text-sm text-foreground/75 leading-relaxed">{current.description}</p>
        <div className="border-l-2 border-primary/40 pl-3 py-1">
          <p className="text-xs text-foreground/60 leading-relaxed">{current.highlight}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Button>

          {isLast ? (
            <Button
              size="sm"
              className="text-xs gap-1"
              onClick={handleComplete}
            >
              Get started
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setStep(s => s + 1)}
            >
              Next <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Call this to reset the onboarding so it shows again */
export function resetNDOnboarding() {
  try { localStorage.removeItem(ND_ONBOARDING_KEY); } catch {}
}
