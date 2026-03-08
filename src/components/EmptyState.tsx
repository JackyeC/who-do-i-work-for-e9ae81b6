import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className
    )}>
      <div className={cn(
        "rounded-2xl bg-muted/60 flex items-center justify-center mb-5",
        compact ? "w-14 h-14" : "w-18 h-18"
      )}>
        <Icon className={cn(
          "text-muted-foreground/60",
          compact ? "w-6 h-6" : "w-8 h-8"
        )} />
      </div>
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        compact ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-muted-foreground max-w-sm leading-relaxed",
        compact ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      {action && (
        <Button
          variant={action.variant || "outline"}
          size="sm"
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
