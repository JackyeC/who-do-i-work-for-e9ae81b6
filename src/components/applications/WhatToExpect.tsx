import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageCircle, ShieldAlert, Eye, Ghost } from "lucide-react";
import { differenceInDays } from "date-fns";

interface WhatToExpectProps {
  status: string;
  appliedAt: string | null;
}

const EXPECTATIONS: Record<string, { icon: typeof Clock; title: string; items: string[] }> = {
  Draft: {
    icon: Clock,
    title: "Before you hit send",
    items: [
      "Check the resume. Check the letter. Check the dossier.",
      "Speed doesn't win offers. Fit does.",
      "When it's ready, mark it Submitted.",
    ],
  },
  Submitted: {
    icon: Eye,
    title: "Now you wait",
    items: [
      "Most companies take 5–14 business days. Some take longer. Some never reply at all.",
      "No confirmation email doesn't mean no. It means their ATS is doing ATS things.",
      "Posting disappeared? They're reviewing. That's not a rejection.",
      "Silence in week one is normal. Silence in week four is an answer.",
    ],
  },
  Interviewing: {
    icon: MessageCircle,
    title: "You're in the room",
    items: [
      "Some processes take three days. Some take three months. Neither is about you.",
      "Read the dossier before each round. Ask about what you find.",
      "No word after five business days? One follow-up. One.",
      "Rescheduling is logistics. Don't read into it.",
    ],
  },
  Offered: {
    icon: ShieldAlert,
    title: "They want you. Use that.",
    items: [
      "You don't have to answer today. Take the weekend.",
      "Run it through Offer Clarity before you respond.",
      "Re-read the dossier. Anything you overlooked while you were excited?",
      "If something feels off, it is. Ask before you sign.",
    ],
  },
  Rejected: {
    icon: Ghost,
    title: "Not a verdict",
    items: [
      "Most rejections are budget, timing, or an internal hire they already picked.",
      "It's information about their process. Not your worth.",
      "Companies change. You can circle back in 6–12 months.",
      "Redirect energy to the companies where your values actually lined up.",
    ],
  },
  Withdrawn: {
    icon: ShieldAlert,
    title: "Good call",
    items: [
      "Pulling out is a power move when the data supports it.",
      "If the dossier raised flags, you saved yourself a bad year.",
      "They're still in your tracker. Things change. People leave. New leadership shows up.",
    ],
  },
  Ghosted: {
    icon: Ghost,
    title: "Their silence says plenty",
    items: [
      "Ghosting is an employer behavior pattern. Not a reflection of your application.",
      "Some companies never send rejections. Industry-wide problem. Not personal.",
      "Spend your time on employers who act like they have a process.",
      "We track this. Companies that ghost consistently? It shows up in the dossier.",
    ],
  },
};

export function WhatToExpect({ status, appliedAt }: WhatToExpectProps) {
  const config = EXPECTATIONS[status] || EXPECTATIONS.Submitted;
  const Icon = config.icon;

  const daysSinceApplied = appliedAt
    ? differenceInDays(new Date(), new Date(appliedAt))
    : null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {daysSinceApplied !== null && daysSinceApplied > 0 && status === "Submitted" && (
          <p className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
            {daysSinceApplied} {daysSinceApplied === 1 ? "day" : "days"} since you applied
            {daysSinceApplied > 14 && " — consider following up or moving on"}
          </p>
        )}

        <ul className="space-y-2.5">
          {config.items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
              <span className="text-primary mt-1.5 shrink-0">·</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
