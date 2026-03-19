import { useMemo } from "react";
import { MessageCircleQuestion, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

interface InterviewQuestion {
  question: string;
  context: string;
  category: string;
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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const questions = useMemo<InterviewQuestion[]>(() => {
    const qs: InterviewQuestion[] = [];

    if (hasLayoffSignals || hasWarnNotices) {
      qs.push({
        question: `"Can you walk me through how ${companyName} has supported affected teams during recent workforce changes?"`,
        context: "Workforce reduction signals detected",
        category: "Stability",
      });
    }

    if (!hasPayEquity) {
      qs.push({
        question: `"Does ${companyName} conduct regular pay equity audits, and are the results shared internally?"`,
        context: "No public pay equity disclosures found",
        category: "Compensation",
      });
    }

    if (hasAiHrSignals) {
      qs.push({
        question: `"How does ${companyName} ensure fairness in its AI-assisted hiring tools? Has a bias audit been published?"`,
        context: "AI hiring technology detected",
        category: "Hiring",
      });
    }

    if (revolvingDoorCount > 0) {
      qs.push({
        question: `"How does ${companyName} manage potential conflicts of interest when hiring from government roles?"`,
        context: `${revolvingDoorCount} revolving-door connections identified`,
        category: "Governance",
      });
    }

    if (totalPacSpending > 100000) {
      qs.push({
        question: `"How does ${companyName}'s political engagement reflect the values communicated to employees?"`,
        context: "Significant political spending detected",
        category: "Values",
      });
    }

    if (lobbyingSpend > 500000) {
      qs.push({
        question: `"What policy areas is ${companyName} actively lobbying on, and how do those relate to workforce priorities?"`,
        context: "Active lobbying presence detected",
        category: "Influence",
      });
    }

    if (!hasSentimentData) {
      qs.push({
        question: `"How does ${companyName} measure and act on employee satisfaction feedback?"`,
        context: "Limited employee sentiment data available",
        category: "Culture",
      });
    }

    // Default questions if none triggered
    if (qs.length === 0) {
      qs.push({
        question: `"What does ${companyName}'s leadership team prioritize for the next 12 months?"`,
        context: "General leadership clarity question",
        category: "Leadership",
      });
      qs.push({
        question: `"How does ${companyName} handle internal mobility and career progression?"`,
        context: "Career growth assessment",
        category: "Growth",
      });
    }

    return qs.slice(0, 3);
  }, [
    companyName, hasLayoffSignals, hasWarnNotices, hasPayEquity,
    hasBenefitsData, hasAiHrSignals, hasSentimentData, executiveCount,
    revolvingDoorCount, totalPacSpending, lobbyingSpend, darkMoneyCount,
  ]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <section className="mb-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted px-2 py-0.5">
              08
            </div>
            <MessageCircleQuestion className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-mono text-sm tracking-wider uppercase text-foreground font-semibold">
              What to Ask
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Signal-driven interview questions tailored to {companyName}'s intelligence profile.
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div
                key={i}
                className="bg-muted/30 border border-border p-4 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-foreground font-medium leading-relaxed italic">
                    {q.question}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(q.question, i)}
                  >
                    {copiedIdx === i ? (
                      <Check className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-primary bg-primary/8 px-1.5 py-0.5">
                    {q.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {q.context}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            These questions are generated from publicly available signals — not opinions.
            Use them to probe specific areas during your interview or evaluation.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
