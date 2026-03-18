import { Badge } from "@/components/ui/badge";
import { evaluateJobFit, type FitResult } from "@/lib/jobFitEngine";
import { useJobPreferences } from "@/hooks/use-job-preferences";
import { CircleCheck, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobFitPanelProps {
  job: {
    work_mode?: string | null;
    location?: string | null;
    salary_range?: string | null;
    seniority_level?: string | null;
    department?: string | null;
    employment_type?: string | null;
  };
}

export function JobFitPanel({ job }: JobFitPanelProps) {
  const { preferences } = useJobPreferences();
  const fit = evaluateJobFit(job, preferences);

  const scoreColor = fit.fitScore >= 75
    ? "text-[hsl(var(--civic-green))]"
    : fit.fitScore >= 50
    ? "text-[hsl(var(--civic-yellow))]"
    : "text-[hsl(var(--civic-red))]";

  const ringColor = fit.fitScore >= 75
    ? "border-[hsl(var(--civic-green))]/30"
    : fit.fitScore >= 50
    ? "border-[hsl(var(--civic-yellow))]/30"
    : "border-[hsl(var(--civic-red))]/30";

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-start gap-4">
        {/* Score circle */}
        <div className={cn("flex-shrink-0 w-16 h-16 rounded-full border-[3px] flex items-center justify-center", ringColor)}>
          <div className="text-center">
            <p className={cn("text-lg font-bold leading-none", scoreColor)}>{fit.fitScore}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">fit</p>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" /> Personal Fit Score
            </p>
            {fit.fitBadges.map((badge) => (
              <Badge key={badge} variant="outline" className={cn(
                "text-[9px] gap-0.5",
                badge === "Strong Fit" && "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
                badge === "Flexible Work Fit" && "bg-primary/5 text-primary border-primary/20",
                (badge === "Location Mismatch" || badge === "Compensation Mismatch" || badge === "Relocation Required") && "bg-destructive/10 text-destructive border-destructive/20",
              )}>
                {badge}
              </Badge>
            ))}
          </div>

          {fit.strengths.length > 0 && (
            <div className="space-y-0.5">
              {fit.strengths.map((s, i) => (
                <p key={i} className="text-xs text-[hsl(var(--civic-green))] flex items-start gap-1">
                  <CircleCheck className="w-3 h-3 mt-0.5 flex-shrink-0" /> {s}
                </p>
              ))}
            </div>
          )}

          {fit.mismatches.length > 0 && (
            <div className="space-y-0.5">
              {fit.mismatches.map((m, i) => (
                <p key={i} className="text-xs text-[hsl(var(--civic-yellow))] flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {m}
                </p>
              ))}
            </div>
          )}

          {fit.strengths.length === 0 && fit.mismatches.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Set your job preferences to see personalized fit analysis</p>
          )}
        </div>
      </div>
    </div>
  );
}
