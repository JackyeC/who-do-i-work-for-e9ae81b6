import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingState({ message, className, fullPage }: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4",
      fullPage ? "min-h-[60vh]" : "py-20",
      className
    )}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-muted" />
        <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse-subtle">{message}</p>
      )}
    </div>
  );
}
