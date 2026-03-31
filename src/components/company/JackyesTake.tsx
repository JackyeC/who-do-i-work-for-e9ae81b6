import { MessageSquareWarning, AlertTriangle, Eye, Lightbulb } from "lucide-react";
import { getJackyeTakeHeader } from "@/lib/responseTemplates";
import { cn } from "@/lib/utils";

interface JackyesTakeProps {
  /** The insight text */
  text: string;
  /** Optional gap score to determine which header/style to show */
  gapScore?: number;
  /** Whether this is a decision moment (offer stage, etc.) */
  isDecisionPoint?: boolean;
  /** Optional className override */
  className?: string;
}

function getIcon(gapScore: number, isDecisionPoint: boolean) {
  if (isDecisionPoint) return Lightbulb;
  if (gapScore >= 70) return AlertTriangle;
  if (gapScore >= 40) return Eye;
  return MessageSquareWarning;
}

function getStyles(gapScore: number) {
  if (gapScore >= 70) {
    return {
      border: "border-destructive/20",
      bg: "bg-destructive/[0.03]",
      iconColor: "text-destructive",
      headerColor: "text-destructive",
    };
  }
  if (gapScore >= 40) {
    return {
      border: "border-[hsl(var(--civic-yellow))]/20",
      bg: "bg-[hsl(var(--civic-yellow))]/[0.03]",
      iconColor: "text-[hsl(var(--civic-yellow))]",
      headerColor: "text-[hsl(var(--civic-yellow))]",
    };
  }
  return {
    border: "border-primary/20",
    bg: "bg-primary/[0.03]",
    iconColor: "text-primary",
    headerColor: "text-primary",
  };
}

export function JackyesTake({
  text,
  gapScore = 0,
  isDecisionPoint = false,
  className,
}: JackyesTakeProps) {
  if (!text) return null;

  const header = getJackyeTakeHeader(gapScore, isDecisionPoint);
  const Icon = getIcon(gapScore, isDecisionPoint);
  const styles = getStyles(gapScore);

  return (
    <div className={cn("px-5 py-4 border-t", styles.border, styles.bg, className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", styles.iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", styles.headerColor)}>
            {header}
          </h4>
          <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
