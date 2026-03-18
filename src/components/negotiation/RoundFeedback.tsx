import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowUp, MessageCircle, Gauge } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface FeedbackData {
  what_worked: string;
  improvement: string;
  better_version: string;
  shorter_version: string;
  tone: "too_soft" | "balanced" | "too_aggressive";
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

export function RoundFeedback({ feedback, round }: Props) {
  const tone = TONE_CONFIG[feedback.tone];

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full">
        <Card className="rounded-lg border-primary/20 bg-primary/[0.02] hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-primary flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Round {round} Feedback
            </span>
            <Badge variant="outline" className={`text-[10px] ${tone.color} ${tone.bg} border-transparent`}>
              {tone.label}
            </Badge>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))] mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">What worked:</span> {feedback.what_worked}</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Could be stronger:</span> {feedback.improvement}</p>
          </div>
          <div className="flex items-start gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Better version:</span> "{feedback.better_version}"</p>
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Shorter version:</span> "{feedback.shorter_version}"</p>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
