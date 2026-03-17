import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = ["Draft", "Submitted", "Interviewing", "Offered"] as const;
const TERMINAL = ["Rejected", "Withdrawn"] as const;

type StepperStatus = typeof STEPS[number] | typeof TERMINAL[number];

interface ApplicationStepperProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  compact?: boolean;
}

export function ApplicationStepper({ currentStatus, onStatusChange, compact }: ApplicationStepperProps) {
  const isTerminal = (TERMINAL as readonly string[]).includes(currentStatus);
  const currentIndex = STEPS.indexOf(currentStatus as typeof STEPS[number]);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isActive = step === currentStatus && !isTerminal;
        const isPast = !isTerminal && currentIndex > i;
        const isClickable = !isTerminal || step === currentStatus;

        return (
          <div key={step} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 transition-colors",
                  compact ? "w-4" : "w-6",
                  isPast ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <button
              onClick={() => isClickable && onStatusChange(step)}
              className={cn(
                "flex items-center justify-center rounded-full transition-all shrink-0",
                compact ? "w-5 h-5" : "w-7 h-7",
                isPast && "bg-primary text-primary-foreground",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                !isPast && !isActive && "bg-muted text-muted-foreground",
                isTerminal && "opacity-40",
                isClickable && "cursor-pointer hover:ring-2 hover:ring-primary/20"
              )}
              title={step}
            >
              {isPast ? (
                <Check className={cn(compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5")} />
              ) : (
                <span className={cn("font-medium", compact ? "text-[8px]" : "text-[10px]")}>
                  {i + 1}
                </span>
              )}
            </button>
          </div>
        );
      })}

      {/* Terminal states */}
      <div className={cn("ml-2 flex gap-1", compact ? "ml-1" : "ml-2")}>
        {TERMINAL.map((t) => (
          <button
            key={t}
            onClick={() => onStatusChange(t)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-all border",
              currentStatus === t
                ? t === "Rejected"
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-muted text-muted-foreground border-border"
                : "bg-transparent text-muted-foreground/60 border-transparent hover:border-border hover:text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
