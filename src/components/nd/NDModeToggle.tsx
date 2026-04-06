import { useNDMode } from "@/contexts/NDModeContext";
import { Switch } from "@/components/ui/switch";
import { Brain } from "lucide-react";

interface NDModeToggleProps {
  compact?: boolean;
}

export function NDModeToggle({ compact }: NDModeToggleProps) {
  const { isNDMode, toggleNDMode } = useNDMode();

  return (
    <div
      role="group"
      className="flex items-center gap-2 px-3 py-1.5 border border-border/50 bg-card hover:bg-muted/30 transition-colors text-sm cursor-pointer"
      onClick={toggleNDMode}
      aria-label={`ND Mode: ${isNDMode ? "On" : "Off"}`}
    >
      <Brain className="w-4 h-4 text-primary" />
      {!compact && <span className="text-xs font-medium text-foreground">ND Mode</span>}
      <Switch
        checked={isNDMode}
        onCheckedChange={toggleNDMode}
        className="scale-75"
        aria-label="Toggle ND Mode"
      />
    </div>
  );
}
