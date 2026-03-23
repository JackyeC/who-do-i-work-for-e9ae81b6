import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, MessageSquare, RotateCcw, Target, Lightbulb } from "lucide-react";
import type { FeedbackData } from "./RoundFeedback";

interface Props {
  feedbacks: FeedbackData[];
  totalRounds: number;
  onTryAgain?: () => void;
}

export function SessionSummary({ feedbacks, totalRounds, onTryAgain }: Props) {
  const balanced = feedbacks.filter((f) => f.tone === "balanced").length;
  const toneScore = totalRounds > 0 ? Math.round((balanced / totalRounds) * 100) : 0;

  const avgEffectiveness = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, f) => sum + (f.effectiveness ?? 3), 0) / feedbacks.length * 10) / 10
    : 0;

  const tactics = feedbacks.map(f => f.tactic_used).filter(Boolean);
  const uniqueTactics = [...new Set(tactics)];

  return (
    <Card className="rounded-xl border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Session Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold text-foreground">{totalRounds}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Rounds</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold text-foreground">{toneScore}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tone Score</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold text-foreground">{avgEffectiveness}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Effect.</p>
          </div>
        </div>

        {uniqueTactics.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" /> Tactics Used
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTactics.map((t, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {feedbacks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))]" /> Missed Opportunities
            </p>
            {feedbacks.slice(-3).map((f, i) => {
              const opp = f.missed_opportunity || f.improvement;
              if (!opp) return null;
              return (
                <div key={i} className="flex items-start gap-2">
                  <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{opp}</p>
                </div>
              );
            })}
          </div>
        )}

        {onTryAgain && (
          <Button onClick={onTryAgain} variant="outline" className="w-full gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again (Same Scenario)
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Practice makes progress. Each session helps you find your voice.
        </p>
      </CardContent>
    </Card>
  );
}
