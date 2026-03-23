import { AlertTriangle, Shield, Users, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SignalExample {
  icon: React.ElementType;
  category: string;
  title: string;
  summary: string;
  confidence: "Strong Evidence" | "Likely Connection" | "Possible Connection";
  date: string;
  badgeVariant: "destructive" | "default" | "secondary";
}

const MARCH_2026_SIGNALS: SignalExample[] = [
  {
    icon: Shield,
    category: "Animal Welfare",
    title: "Farm Bill Vote Conflict Detected",
    summary:
      "Company PAC donated to 3 sponsors who voted YES on H.R. 7567 (the Bacon Act) on March 5, 2026. This legislation rolls back animal welfare protections in industrial farming.",
    confidence: "Strong Evidence",
    date: "March 5, 2026",
    badgeVariant: "destructive",
  },
  {
    icon: Bot,
    category: "HR Tech / AI Bias",
    title: "FTC Section 5 Lobbying — AI Bias Audit Block",
    summary:
      "Major ATS providers lobbied against FTC Section 5 enforcement requiring AI bias audits in hiring tools. Companies using these vendors inherit gatekeeper risk.",
    confidence: "Likely Connection",
    date: "March 2026",
    badgeVariant: "default",
  },
  {
    icon: Users,
    category: "Labor Rights",
    title: "WARN Notices — 'People First' Layoffs",
    summary:
      'Companies marketing "People First" employer brands while filing WARN Act notices for 500+ positions in Q1 2026. Talent Acquisition teams reduced by 40%+.',
    confidence: "Strong Evidence",
    date: "Q1 2026",
    badgeVariant: "destructive",
  },
];

export function SignalExamples() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-civic-yellow" />
        <h4 className="text-sm font-semibold text-foreground">Live Signal Examples — March 2026</h4>
      </div>
      {MARCH_2026_SIGNALS.map((signal, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/40 bg-card p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <signal.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-micro font-mono text-muted-foreground uppercase">
                  {signal.category}
                </span>
                <Badge variant={signal.badgeVariant} className="text-xs">
                  {signal.confidence}
                </Badge>
              </div>
              <h5 className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                {signal.title}
              </h5>
            </div>
            <span className="text-micro text-muted-foreground shrink-0">{signal.date}</span>
          </div>
          <p className="text-caption text-muted-foreground leading-relaxed">{signal.summary}</p>
        </div>
      ))}
    </div>
  );
}
