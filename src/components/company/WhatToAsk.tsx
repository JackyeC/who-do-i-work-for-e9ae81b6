import { HelpCircle } from "lucide-react";

interface WhatToAskProps {
  companyName: string;
  hasLayoffSignals: boolean;
  hasWarnNotices: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasAiHrSignals: boolean;
  hasSentimentData: boolean;
  executiveCount: number;
  revolvingDoorCount: number;
  totalPacSpending: number;
  lobbyingSpend: number;
  darkMoneyCount: number;
}

interface AskItem {
  question: string;
  context: string;
}

export function WhatToAsk({
  companyName,
  hasLayoffSignals,
  hasWarnNotices,
  hasPayEquity,
  hasBenefitsData,
  hasAiHrSignals,
  hasSentimentData,
  executiveCount,
  revolvingDoorCount,
  totalPacSpending,
  lobbyingSpend,
  darkMoneyCount,
}: WhatToAskProps) {
  const questions: AskItem[] = [];

  if (hasLayoffSignals || hasWarnNotices) {
    questions.push({
      question: "What is the current headcount trajectory for this team?",
      context: "Layoff or WARN Act signals detected — clarify stability before joining.",
    });
  }

  if (totalPacSpending > 100000 || lobbyingSpend > 500000) {
    questions.push({
      question: "How does the company decide which political causes to fund?",
      context: "Significant political spending on record. Understand governance of those decisions.",
    });
  }

  if (darkMoneyCount > 0) {
    questions.push({
      question: "Can you walk me through the company's political transparency commitments?",
      context: "Opaque funding connections flagged — test willingness to discuss.",
    });
  }

  if (hasAiHrSignals) {
    questions.push({
      question: "Does the company use AI tools in hiring, performance review, or workforce planning?",
      context: "AI/HR automation signals detected — ask about bias audits and human oversight.",
    });
  }

  if (revolvingDoorCount > 1) {
    questions.push({
      question: "How does leadership's government background shape company strategy or contracts?",
      context: `${revolvingDoorCount} revolving-door connections identified.`,
    });
  }

  if (!hasPayEquity) {
    questions.push({
      question: "Does the company publish pay equity data or conduct regular pay audits?",
      context: "No public pay equity disclosures found in our scan.",
    });
  }

  if (!hasBenefitsData) {
    questions.push({
      question: "Can you share the full benefits summary — including parental leave, PTO, and retirement match?",
      context: "Benefits data not publicly available. Get it in writing before signing.",
    });
  }

  // Always include a baseline question
  questions.push({
    question: "What does the company do when public values conflict with business decisions?",
    context: "Tests integrity gap — the core of what WDIWF measures.",
  });

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-xs text-primary tracking-wider uppercase mb-1">
          What to Ask
        </p>
        <h2 className="font-sans text-xl font-bold text-foreground">
          Interview questions backed by {companyName}'s record
        </h2>
      </div>

      <div className="grid gap-3">
        {questions.slice(0, 5).map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-md border border-border bg-card"
          >
            <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-sans text-sm font-semibold text-foreground">
                {item.question}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                {item.context}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
