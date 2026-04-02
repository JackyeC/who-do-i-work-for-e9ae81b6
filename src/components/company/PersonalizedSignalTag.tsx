import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import type { PersonalizedMatch } from "@/hooks/use-personalized-signals";

interface PersonalizedSignalTagProps {
  match: PersonalizedMatch;
  className?: string;
  compact?: boolean;
}

/**
 * Inline badge that shows when a signal matches the user's values.
 * Renders nothing if the signal doesn't match.
 */
export function PersonalizedSignalTag({ match, className, compact = false }: PersonalizedSignalTagProps) {
  if (!match.isImportant) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        compact
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-xs",
        "bg-destructive/10 text-destructive border border-destructive/20",
        className
      )}
      title={`You rated "${match.label}" as important in your values profile`}
    >
      <Heart className={cn("fill-current", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
      {compact ? "Matters to you" : `Matters to you · ${match.label}`}
    </span>
  );
}
