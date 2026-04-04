import { cn } from "@/lib/utils";

interface StepProgressRailProps {
  steps: string[];
  activeStep: number;
  onStepClick?: (index: number) => void;
}

export function StepProgressRail({ steps, activeStep, onStepClick }: StepProgressRailProps) {
  return (
    <nav
      className="sticky top-[var(--nav-offset)] z-30 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-3 mb-6"
      aria-label="Page sections"
    >
      <ol className="flex flex-wrap gap-x-1 gap-y-1.5 text-xs">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-1">
            <button
              onClick={() => onStepClick?.(i)}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors font-medium",
                i === activeStep
                  ? "bg-primary text-primary-foreground"
                  : i < activeStep
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              )}
            >
              {i + 1}. {step}
            </button>
            {i < steps.length - 1 && (
              <span className="text-muted-foreground/40 mx-0.5">|</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
