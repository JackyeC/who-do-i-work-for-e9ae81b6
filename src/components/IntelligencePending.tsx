import { FileSearch } from "lucide-react";

interface IntelligencePendingProps {
  category?: string;
  className?: string;
}

export function IntelligencePending({ category, className }: IntelligencePendingProps) {
  return (
    <div className={`flex items-center gap-2.5 p-4 rounded-lg border border-dashed border-border/50 bg-muted/20 ${className || ""}`}>
      <FileSearch className="w-4 h-4 text-muted-foreground shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        Intelligence pending. No public receipts found{category ? ` for ${category}` : ""} yet.
      </p>
    </div>
  );
}
