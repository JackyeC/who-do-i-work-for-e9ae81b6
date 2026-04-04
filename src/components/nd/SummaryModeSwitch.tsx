import { cn } from "@/lib/utils";

export type NDViewMode = "detailed" | "summary" | "checklist" | "script";

interface SummaryModeSwitchProps {
  mode: NDViewMode;
  onChange: (mode: NDViewMode) => void;
}

const modes: { value: NDViewMode; label: string }[] = [
  { value: "detailed", label: "Detailed" },
  { value: "summary", label: "Summary" },
  { value: "checklist", label: "Checklist" },
  { value: "script", label: "Script" },
];

export function SummaryModeSwitch({ mode, onChange }: SummaryModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-muted/30 border border-border/40 w-fit" role="tablist">
      {modes.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={mode === m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            mode === m.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
