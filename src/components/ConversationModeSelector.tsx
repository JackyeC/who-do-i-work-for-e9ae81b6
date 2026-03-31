import { useState } from "react";
import { CONVERSATION_MODES, MODE_ANCHOR_LINE, type ConversationMode } from "@/lib/responseTemplates";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ConversationModeSelectorProps {
  selectedMode: ConversationMode;
  onSelect: (mode: ConversationMode) => void;
  /** If true, shows the compact inline version (for chat header) */
  compact?: boolean;
}

export function ConversationModeSelector({
  selectedMode,
  onSelect,
  compact = false,
}: ConversationModeSelectorProps) {
  const [justSelected, setJustSelected] = useState(false);

  const handleSelect = (mode: ConversationMode) => {
    onSelect(mode);
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 3000);
  };

  if (compact) {
    return (
      <div className="flex gap-1">
        {CONVERSATION_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleSelect(mode.id)}
            className={cn(
              "px-2 py-1 text-micro font-mono uppercase tracking-wider rounded transition-all",
              selectedMode === mode.id
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
            title={mode.description}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-border">
      <p className="text-xs text-muted-foreground mb-2.5 font-medium">
        How do you want me to walk through this with you?
      </p>

      <div className="space-y-1.5">
        {CONVERSATION_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                isSelected
                  ? mode.color + " border-current"
                  : "border-border/50 bg-surface-2 hover:border-primary/30 hover:bg-primary/[0.02]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{mode.icon}</span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isSelected ? "text-foreground" : "text-foreground/80"
                  )}
                >
                  {mode.label}
                </span>
                {isSelected && <Check className="w-3 h-3 text-primary ml-auto" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 pl-6 leading-relaxed">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Anchor line */}
      {justSelected && (
        <p className="text-xs text-primary/80 mt-2.5 italic text-center animate-in fade-in duration-300">
          {MODE_ANCHOR_LINE}
        </p>
      )}
    </div>
  );
}
