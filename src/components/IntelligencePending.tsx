import { FileSearch, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntelligencePendingProps {
  category?: string;
  className?: string;
  checkedSources?: string[];
  lastChecked?: string;
  suggestedAction?: string;
}

export function IntelligencePending({ category, className, checkedSources, lastChecked, suggestedAction }: IntelligencePendingProps) {
  const hasContext = checkedSources?.length || lastChecked;

  return (
    <div className={cn(
      "rounded-lg border border-dashed border-border/50 bg-muted/20 overflow-hidden",
      className
    )}>
      <div className="flex items-center gap-2.5 p-4">
        <FileSearch className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            No public receipts found{category ? ` for ${category}` : ""} yet.
          </p>
        </div>
      </div>

      {(hasContext || suggestedAction) && (
        <div className="px-4 py-2 bg-muted/30 border-t border-border/30 flex items-center justify-between gap-3">
          {hasContext && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {checkedSources?.length ? `Checked: ${checkedSources.join(" · ")}` : ""}
                {lastChecked && `${checkedSources?.length ? " · " : ""}Last scan: ${new Date(lastChecked).toLocaleDateString()}`}
              </span>
            </div>
          )}
          {suggestedAction && (
            <span className="text-xs text-primary font-medium whitespace-nowrap flex items-center gap-1 shrink-0">
              <ExternalLink className="w-3 h-3" />
              {suggestedAction}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
