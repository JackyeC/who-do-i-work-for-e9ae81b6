import { useEvaluation } from "@/contexts/EvaluationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface Props {
  companyName: string;
  hasLayoffs: boolean;
  hasPoliticalSpending: boolean;
  hasEEOC: boolean;
  civicScore: number;
  employeeCount?: string | null;
}

/**
 * Translates company signals into candidate-specific guidance.
 * Answers: "What does this actually mean for ME?"
 */
export function WhatThisMeansForYou({
  companyName,
  hasLayoffs,
  hasPoliticalSpending,
  hasEEOC,
  civicScore,
  employeeCount,
}: Props) {
  const { userPriorities } = useEvaluation();

  const insights: { question: string; answer: string }[] = [];

  // Stability-focused
  if (userPriorities.safety >= 60) {
    if (hasLayoffs) {
      insights.push({
        question: "If I need stability, what should I notice?",
        answer: `${companyName} has WARN filings on record. That doesn't mean they'll cut your role — but it means they've done it before. Ask about the team's headcount history in your interview. If they dodge, that's your answer.`,
      });
    } else {
      insights.push({
        question: "If I need stability, what should I notice?",
        answer: `No WARN filings found for ${companyName}. That's a decent sign — but WARN only covers cuts of 50+ employees. Ask how long the team has been in its current form. Tenure tells you more than a job posting.`,
      });
    }
  }

  // Toxic environment exit
  if (userPriorities.values >= 60) {
    if (hasEEOC) {
      insights.push({
        question: "If I'm leaving a toxic employer, what red flags matter here?",
        answer: `There are EEOC filings on record. That's not a conviction — but it's a pattern worth understanding. Look at who's in HR leadership and how long they've been there. High turnover in People roles is its own signal.`,
      });
    } else if (civicScore < 40) {
      insights.push({
        question: "If I'm leaving a toxic employer, what red flags matter here?",
        answer: `Low transparency score. They're not necessarily hiding something — but they're not showing much either. When a company is proud of its culture, you can usually find the receipts. The absence of evidence isn't evidence of absence, but it's worth noticing.`,
      });
    } else {
      insights.push({
        question: "If I'm leaving a toxic employer, what red flags matter here?",
        answer: `No major enforcement red flags on file. That's better than average. Still — ask about manager tenure and how they handle internal complaints. The best workplaces aren't the ones with zero problems. They're the ones that fix them.`,
      });
    }
  }

  // Growth and money
  if (userPriorities.pay >= 60 || userPriorities.growth >= 60) {
    if (hasPoliticalSpending) {
      insights.push({
        question: "If I want money and growth, what tradeoffs am I making?",
        answer: `${companyName} spends on political influence. That's not unusual for their size — but it tells you where their priorities sit. The question isn't whether they lobby. It's whether the policies they lobby for align with how they treat the people who work there.`,
      });
    } else {
      insights.push({
        question: "If I want money and growth, what tradeoffs am I making?",
        answer: `No significant political spending on record. That usually means a smaller influence footprint — which can mean fewer conflicts between what they say and what they fund. Focus your diligence on comp transparency and promotion velocity instead.`,
      });
    }
  }

  // Always include a general insight
  if (insights.length === 0) {
    insights.push({
      question: "What should I pay attention to here?",
      answer: `Look at the gap between what ${companyName} says publicly and what the records show. Every company markets itself — the question is whether the receipts match the brochure. That's what this page is for.`,
    });
  }

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          What this means for you
        </h2>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <Card key={i} className="border-primary/10">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-primary mb-1.5">
                {insight.question}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.answer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
