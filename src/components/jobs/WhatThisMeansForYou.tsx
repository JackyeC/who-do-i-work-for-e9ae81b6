import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatThisMeansForYouProps {
  matchCount: number;
  matchedCategories: string[];
  civicScore: number;
  salaryRange?: string | null;
  jobAgeDays: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  progress_policy: "Reform & Progress",
  traditional_policy: "Heritage & Tradition",
  labor_policy: "Worker Protections",
  climate_policy: "Climate Action",
  equity_policy: "Equity & Inclusion",
};

export function WhatThisMeansForYou({ matchCount, matchedCategories, civicScore, salaryRange, jobAgeDays }: WhatThisMeansForYouProps) {
  const insights: { type: "positive" | "warning" | "neutral"; text: string }[] = [];

  // Values alignment
  if (matchCount >= 3) {
    insights.push({ type: "positive", text: "Strong alignment with your stated priorities — this employer's track record matches what you care about." });
  } else if (matchCount >= 2) {
    insights.push({ type: "positive", text: "Good alignment with your priorities — some overlap with your values." });
  } else if (matchCount === 1) {
    insights.push({ type: "neutral", text: "Partial alignment — one of your priority areas overlaps with this employer." });
  }

  // Transparency
  if (civicScore >= 70) {
    insights.push({ type: "positive", text: "High employer transparency — governance, lobbying, and workforce data are well-documented." });
  } else if (civicScore < 40) {
    insights.push({ type: "warning", text: "Limited transparency — do independent research before committing." });
  }

  // Pay transparency
  if (salaryRange) {
    insights.push({ type: "positive", text: "Salary range is disclosed — you can assess fit before investing time." });
  } else {
    insights.push({ type: "warning", text: "No salary posted — ask about compensation early in the process." });
  }

  // Freshness
  if (jobAgeDays > 60) {
    insights.push({ type: "warning", text: `This listing is ${jobAgeDays} days old. Confirm it's still active before applying.` });
  }

  if (insights.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-primary/15 bg-primary/[0.03] space-y-3">
      <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> What This Means for You
      </p>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            {insight.type === "positive" && <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))] mt-0.5 shrink-0" />}
            {insight.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))] mt-0.5 shrink-0" />}
            {insight.type === "neutral" && <Sparkles className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
            <span className="text-muted-foreground leading-relaxed">{insight.text}</span>
          </div>
        ))}
      </div>
      {matchedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {matchedCategories.map((c) => (
            <Badge key={c} variant="outline" className="text-[10px] py-0 bg-primary/5 border-primary/15 text-primary">
              {CATEGORY_LABELS[c] || c.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
