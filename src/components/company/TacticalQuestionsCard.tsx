import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning } from "lucide-react";

interface RiskSignal {
  type: string;
  severity: "red" | "yellow";
  label?: string;
}

interface Props {
  signals: RiskSignal[];
  companyName: string;
}

const QUESTION_MAP: Record<string, { question: string; context: string }> = {
  workforce_restructuring: {
    question: "What's the company's current headcount trajectory compared to last year?",
    context: "WARN notices or layoff signals detected",
  },
  executive_turnover: {
    question: "Can you walk me through leadership changes in the last 18 months and how that's affected team stability?",
    context: "Executive leadership changes detected",
  },
  hiring_mismatch: {
    question: "I noticed the careers page promotes open roles — are those positions actively being filled right now?",
    context: "Career page vs. ATS discrepancy detected",
  },
  low_sentiment: {
    question: "How does the company gather and act on employee feedback?",
    context: "Negative or mixed worker sentiment detected",
  },
  policy_alignment: {
    question: "How does the company's political activity reflect its stated values around workforce issues?",
    context: "Policy alignment signals detected",
  },
  ai_hiring: {
    question: "Does the company use AI tools in hiring, and if so, has a bias audit been conducted?",
    context: "AI hiring technology concerns detected",
  },
  dark_money: {
    question: "Can you share how the company approaches transparency around political spending and advocacy?",
    context: "Undisclosed political spending connections found",
  },
  values_conflict: {
    question: "I've seen some public signals about shifts in company values — can you speak to the current direction?",
    context: "Values conflict signals detected",
  },
};

function deriveQuestions(signals: RiskSignal[]): { question: string; context: string; severity: "red" | "yellow" }[] {
  const results: { question: string; context: string; severity: "red" | "yellow" }[] = [];
  const seen = new Set<string>();

  for (const signal of signals) {
    const entry = QUESTION_MAP[signal.type];
    if (entry && !seen.has(signal.type)) {
      seen.add(signal.type);
      results.push({ ...entry, severity: signal.severity });
    }
  }

  return results;
}

export function TacticalQuestionsCard({ signals, companyName }: Props) {
  const questions = deriveQuestions(signals);

  if (questions.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareWarning className="w-4 h-4 text-primary" />
          Tactical Questions for {companyName}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask these during your interview — each is tied to a specific risk signal detected in our research.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                className={
                  q.severity === "red"
                     ? "bg-destructive/10 text-destructive border-destructive/30 text-xs"
                    : "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 text-xs"
                }
              >
                {q.severity === "red" ? "High" : "Medium"}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{q.context}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">"{q.question}"</p>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground text-center pt-1 italic">
          Questions are generated from detected risk signals — not assumptions. Use your judgment.
        </p>
      </CardContent>
    </Card>
  );
}
