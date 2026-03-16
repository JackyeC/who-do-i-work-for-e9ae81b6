import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EvidenceQualityBadgeProps {
  score: number;
  primarySourceCoverage: number;
  crossVerifiedCount: number;
  conflictsDetected: number;
  className?: string;
  showDetails?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/8";
  if (score >= 50) return "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/8";
  return "text-destructive border-destructive/30 bg-destructive/8";
}

export function EvidenceQualityBadge({
  score,
  primarySourceCoverage,
  crossVerifiedCount,
  conflictsDetected,
  className,
  showDetails = false,
}: EvidenceQualityBadgeProps) {
  const color = scoreColor(score);

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("text-[10px] gap-1 cursor-help", color, className)}>
            <ShieldCheck className="w-3 h-3" />
            Evidence Quality: {score}/100
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs space-y-1">
          <p className="font-semibold">Evidence Quality Breakdown</p>
          <p>Primary-source coverage: {primarySourceCoverage}%</p>
          <p>Cross-verified claims: {crossVerifiedCount}</p>
          {conflictsDetected > 0 && (
            <p className="text-destructive">Conflicts detected: {conflictsDetected}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("rounded-lg border p-3 text-xs space-y-2", color, className)}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span className="font-semibold text-sm">Evidence Quality: {score}/100</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>Primary-source coverage: <strong className="text-foreground">{primarySourceCoverage}%</strong></span>
        <span>Cross-verified claims: <strong className="text-foreground">{crossVerifiedCount}</strong></span>
        {conflictsDetected > 0 && (
          <span className="text-destructive">Conflicts detected: <strong>{conflictsDetected}</strong></span>
        )}
      </div>
    </div>
  );
}
