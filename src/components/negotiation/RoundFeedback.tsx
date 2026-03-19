import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowUp, MessageCircle, Gauge, Lightbulb, Target, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface FeedbackData {
  tactic_used?: string;
  what_worked: string;
  missed_opportunity?: string;
  suggested_response?: string;
  power_move?: string;
  tone: "too_soft" | "balanced" | "too_aggressive";
  effectiveness?: number;
  // Legacy fields (backward compat)
  improvement?: string;
  better_version?: string;
  shorter_version?: string;
}

const TONE_CONFIG = {
  too_soft: { label: "Too Soft", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10" },
  balanced: { label: "Balanced", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10" },
  too_aggressive: { label: "Too Aggressive", color: "text-destructive", bg: "bg-destructive/10" },
};

interface Props {
  feedback: FeedbackData;
  round: number;
}

function EffectivenessBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-4 rounded-full transition-colors ${
            i <= score ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{score}/5</span>
    </div>
  );
}

export function RoundFeedback({ feedback, round }: Props) {
  const tone = TONE_CONFIG[feedback.tone];
  const effectiveness = feedback.effectiveness ?? 3;
  const missedOpp = feedback.missed_opportunity || feedback.improvement;
  const suggestion = feedback.suggested_response || feedback.better_version;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full">
        <Card className="rounded-lg border-primary/20 bg-primary/[0.02] hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-primary flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Round {round} Coaching
            </span>
            <div className="flex items-center gap-2">
              {feedback.tactic_used && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {feedback.tactic_used}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] ${tone.color} ${tone.bg} border-transparent`}>
                {tone.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2.5 pl-2 border-l-2 border-primary/20">
          {/* Effectiveness */}
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">Effectiveness</span>
              <EffectivenessBar score={effectiveness} />
            </div>
          </div>

          {/* What worked */}
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))] mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">What worked:</span> {feedback.what_worked}</p>
          </div>

          {/* Missed opportunity */}
          {missedOpp && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))] mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Missed opportunity:</span> {missedOpp}</p>
            </div>
          )}

          {/* Suggested response */}
          {suggestion && (
            <div className="flex items-start gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Try this instead:</span> "{suggestion}"</p>
            </div>
          )}

          {/* Power move */}
          {feedback.power_move && (
            <div className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Power move:</span> "{feedback.power_move}"</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
