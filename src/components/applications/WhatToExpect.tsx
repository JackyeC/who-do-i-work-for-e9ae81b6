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
    title: "Before you submit",
    items: [
      "Review your tailored resume and cover letter below.",
      "Check the employer dossier — values alignment matters more than speed.",
      "When you're ready, mark this application as Submitted.",
    ],
  },
  Submitted: {
    icon: Eye,
    title: "What happens now",
    items: [
      "If they're interested, you may hear back within 5–14 business days.",
      "Some employers never confirm receipt — that's normal, not personal.",
      "Many companies batch-review applications weekly. Silence in the first two weeks is not a signal.",
      "If the posting disappears, it usually means they're reviewing, not that you were rejected.",
    ],
  },
  Interviewing: {
    icon: MessageCircle,
    title: "During the process",
    items: [
      "Interview timelines vary: some companies move in days, others take weeks between rounds.",
      "Prepare by reviewing the employer dossier — ask about what you find.",
      "Silence between rounds is common. Follow up once after 5 business days if you haven't heard.",
      "If they reschedule, it's usually logistics, not a signal about your candidacy.",
    ],
  },
  Offered: {
    icon: ShieldAlert,
    title: "You have leverage now",
    items: [
      "You are not required to respond immediately. Take 2–5 business days.",
      "Review the offer with our Offer Clarity tool before responding.",
      "Check the employer dossier for any red flags you missed during interviews.",
      "If something feels off, it probably is. Ask questions before signing.",
    ],
  },
  Rejected: {
    icon: Ghost,
    title: "What this means",
    items: [
      "A rejection is information about them, not a verdict on you.",
      "Most rejections have nothing to do with your qualifications — timing, internal candidates, and budget freezes are the usual causes.",
      "You can re-apply in 6–12 months. Companies change.",
      "Focus on the applications where your values aligned strongest.",
    ],
  },
  Withdrawn: {
    icon: ShieldAlert,
    title: "You chose wisely",
    items: [
      "Withdrawing is a sign of clarity, not weakness.",
      "If something in the dossier concerned you, trust that instinct.",
      "This company is still in your tracker — you can re-engage later if things change.",
    ],
  },
  Ghosted: {
    icon: Ghost,
    title: "The silence is their answer",
    items: [
      "You didn't do anything wrong. Ghosting is an employer behavior problem, not a candidate one.",
      "Some employers never send rejections. This is industry-wide, not personal.",
      "Move your energy to employers who respect the process.",
      "We track this pattern — employers who ghost consistently will show it in their dossier.",
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
