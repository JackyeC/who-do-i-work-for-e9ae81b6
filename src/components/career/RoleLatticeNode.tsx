import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface RoleLatticeNodeProps {
  targetRole: string;
  skillsMatchPct: number;
  valuesScore: number;
  missingSkills: string[];
  completedSkills: string[];
  status: string;
  moveType: string;
  MoveIcon: LucideIcon;
  gapAnalysis: any;
}

export function RoleLatticeNode({
  targetRole,
  skillsMatchPct,
  valuesScore,
  missingSkills,
  completedSkills,
  status,
  moveType,
  MoveIcon,
  gapAnalysis,
}: RoleLatticeNodeProps) {
  const [open, setOpen] = useState(false);

  const matchColor = skillsMatchPct >= 75
    ? "text-[hsl(var(--civic-green))]"
    : skillsMatchPct >= 50
    ? "text-[hsl(var(--civic-yellow))]"
    : "text-[hsl(var(--civic-red))]";

  const matchBg = skillsMatchPct >= 75
    ? "bg-[hsl(var(--civic-green))]/10"
    : skillsMatchPct >= 50
    ? "bg-[hsl(var(--civic-yellow))]/10"
    : "bg-[hsl(var(--civic-red))]/10";

  const valuesLabel = valuesScore >= 70
    ? "Strong Alignment"
    : valuesScore >= 40
    ? "Moderate"
    : valuesScore > 0
    ? "Low Alignment"
    : "Not Scored";

  const valuesVariant = valuesScore >= 70 ? "success" : valuesScore >= 40 ? "warning" : "secondary";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
        {/* Move type badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <MoveIcon className="w-3 h-3" /> {moveType} Move
          </span>
          <Badge variant="outline" className="text-[10px] capitalize">{status}</Badge>
        </div>

        {/* Role title */}
        <p className="font-semibold text-sm text-foreground mb-3">{targetRole}</p>

        {/* Skills Match */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Skills Match</span>
            <span className={`text-xs font-semibold ${matchColor}`}>{skillsMatchPct}%</span>
          </div>
          <Progress value={skillsMatchPct} className="h-1.5" />
        </div>

        {/* Values Alignment */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Values:</span>
          <Badge variant={valuesVariant} className="text-[10px]">{valuesLabel}</Badge>
        </div>

        {/* Estimated timeline */}
        {gapAnalysis?.estimated_months && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            ~{gapAnalysis.estimated_months} months
            {gapAnalysis?.difficulty && (
              <span className="ml-auto text-[10px] opacity-70">Difficulty: {gapAnalysis.difficulty}/10</span>
            )}
          </div>
        )}

        {/* Expand for details */}
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-[hsl(var(--civic-blue))] hover:underline cursor-pointer w-full">
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Hide details" : "View gap analysis"}
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Missing skills */}
          {missingSkills.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Missing Skills</p>
              <div className="flex flex-wrap gap-1">
                {missingSkills.map((s, i) => (
                  <span key={i} className="text-[10px] bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))] rounded px-1.5 py-0.5 flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Completed skills */}
          {completedSkills.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Your Matching Skills</p>
              <div className="flex flex-wrap gap-1">
                {completedSkills.slice(0, 6).map((s, i) => (
                  <span key={i} className="text-[10px] bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] rounded px-1.5 py-0.5 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested actions */}
          {gapAnalysis?.suggested_next && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommended Next Steps</p>
              <ul className="space-y-1">
                {(gapAnalysis.suggested_next as string[]).map((step: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Circle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
