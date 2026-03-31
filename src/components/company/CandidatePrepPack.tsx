import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, Target, Shield, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidatePrepPackProps {
  companyName: string;
  industry: string;
  employeeCount?: string | null;
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
  jackye_insight?: string | null;
}

interface TalkTrack {
  type: "say" | "ask" | "avoid";
  text: string;
  context: string;
}

interface Flag {
  level: "red" | "yellow" | "green";
  label: string;
  detail: string;
}

function buildTalkTracks(p: CandidatePrepPackProps): TalkTrack[] {
  const tracks: TalkTrack[] = [];

  // SAY tracks
  tracks.push({
    type: "say",
    text: `"I've done my research on ${p.companyName} — I know the public record and I'm here because I'm genuinely interested in the reality behind it."`,
    context: "Opens with confidence and signals you're not naive",
  });

  if (p.totalPacSpending > 50000) {
    tracks.push({
      type: "say",
      text: `"I've seen ${p.companyName}'s political activity disclosures, and I'd love to understand how leadership thinks about values alignment internally."`,
      context: "Signals awareness without accusation",
    });
  }

  // ASK tracks
  if (p.hasLayoffSignals || p.hasWarnNotices) {
    tracks.push({
      type: "ask",
      text: `"Can you walk me through how ${p.companyName} supported affected teams during recent workforce changes?"`,
      context: "Workforce reduction signals detected",
    });
  }

  if (p.hasAiHrSignals) {
    tracks.push({
      type: "ask",
      text: `"Does ${p.companyName} use AI tools in hiring or performance evaluation? Has a bias audit been conducted?"`,
      context: "AI hiring technology detected",
    });
  }

  if (p.revolvingDoorCount > 0) {
    tracks.push({
      type: "ask",
      text: `"How does ${p.companyName} manage potential conflicts of interest with government-connected hires?"`,
      context: `${p.revolvingDoorCount} revolving-door connections found`,
    });
  }

  tracks.push({
    type: "ask",
    text: `"What does the first 90 days look like in this role — and what does success look like at 30, 60, and 90 days?"`,
    context: "Standard prep — reveals expectations and support structure",
  });

  if (!p.hasPayEquity) {
    tracks.push({
      type: "ask",
      text: `"Does ${p.companyName} conduct regular pay equity audits, and are results shared internally?"`,
      context: "No public pay equity disclosures found",
    });
  }

  // AVOID tracks
  tracks.push({
    type: "avoid",
    text: `"So is ${p.companyName} still dealing with [scandal/controversy]?"`,
    context: "Accusatory framing tanks rapport — use the 'ask' versions above instead",
  });

  if (p.darkMoneyCount > 0) {
    tracks.push({
      type: "avoid",
      text: `"I saw some dark money stuff — what's up with that?"`,
      context: "Vague and adversarial. Use the specific values alignment question instead",
    });
  }

  return tracks;
}

function buildFlags(p: CandidatePrepPackProps): Flag[] {
  const flags: Flag[] = [];

  // RED flags
  if (p.hasLayoffSignals && p.hasWarnNotices) {
    flags.push({ level: "red", label: "Active Layoffs", detail: "WARN notices and layoff signals both detected — ask about team stability directly" });
  }
  if (p.darkMoneyCount > 2) {
    flags.push({ level: "red", label: "Undisclosed Spending", detail: `${p.darkMoneyCount} dark money connections found — transparency is a concern` });
  }
  if (p.hasAiHrSignals && !p.hasPayEquity) {
    flags.push({ level: "red", label: "AI + No Equity Audit", detail: "AI hiring tools detected with no public pay equity disclosures — bias risk is elevated" });
  }

  // YELLOW flags
  if (p.totalPacSpending > 100000) {
    flags.push({ level: "yellow", label: "Heavy Political Spending", detail: `Significant PAC spending detected — check if it aligns with your values` });
  }
  if (p.revolvingDoorCount > 0) {
    flags.push({ level: "yellow", label: "Revolving Door", detail: `${p.revolvingDoorCount} government-connected hires — not inherently bad, but worth understanding` });
  }
  if (p.hasLayoffSignals && !p.hasWarnNotices) {
    flags.push({ level: "yellow", label: "Layoff Signals", detail: "Some workforce reduction indicators — probe for context" });
  }
  if (!p.hasSentimentData) {
    flags.push({ level: "yellow", label: "Limited Sentiment Data", detail: "Not enough employee feedback data to assess culture — ask directly" });
  }

  // GREEN flags
  if (p.hasPayEquity) {
    flags.push({ level: "green", label: "Pay Equity Disclosed", detail: "Public pay equity data available — a transparency positive" });
  }
  if (p.hasBenefitsData) {
    flags.push({ level: "green", label: "Benefits Benchmarked", detail: "Benefits data available for comparison — use it in negotiation" });
  }
  if (p.executiveCount > 3 && p.revolvingDoorCount === 0) {
    flags.push({ level: "green", label: "Stable Leadership", detail: "Leadership team appears stable with no revolving-door concerns" });
  }
  if (p.lobbyingSpend === 0 && p.totalPacSpending === 0) {
    flags.push({ level: "green", label: "No Political Activity", detail: "No PAC or lobbying spend detected — clean on political influence" });
  }

  return flags;
}

function build30SecBrief(p: CandidatePrepPackProps): string {
  const parts: string[] = [];
  parts.push(`${p.companyName} is a ${p.industry} company`);
  if (p.employeeCount) parts[0] += ` with roughly ${p.employeeCount} employees`;
  parts[0] += ".";

  const concerns: string[] = [];
  if (p.hasLayoffSignals || p.hasWarnNotices) concerns.push("workforce reduction signals");
  if (p.totalPacSpending > 50000) concerns.push("significant political spending");
  if (p.darkMoneyCount > 0) concerns.push("undisclosed political connections");
  if (p.hasAiHrSignals) concerns.push("AI hiring tools in use");
  if (p.revolvingDoorCount > 0) concerns.push("government revolving-door hires");

  const positives: string[] = [];
  if (p.hasPayEquity) positives.push("pay equity transparency");
  if (p.hasBenefitsData) positives.push("competitive benefits data");
  if (p.executiveCount > 3) positives.push("visible leadership team");

  if (concerns.length > 0) {
    parts.push(`Key signals to know: ${concerns.join(", ")}.`);
  }
  if (positives.length > 0) {
    parts.push(`Working in their favor: ${positives.join(", ")}.`);
  }
  if (concerns.length === 0 && positives.length === 0) {
    parts.push("We're still gathering intelligence on this company. Use the questions below to fill the gaps yourself.");
  }

  return parts.join(" ");
}

const TYPE_CONFIG = {
  say: { label: "SAY", icon: MessageSquare, className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  ask: { label: "ASK", icon: Target, className: "bg-primary/10 text-primary border-primary/30" },
  avoid: { label: "AVOID", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const FLAG_CONFIG = {
  red: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  yellow: { icon: Shield, className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30", dot: "bg-[hsl(var(--civic-yellow))]" },
  green: { icon: CheckCircle2, className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30", dot: "bg-[hsl(var(--civic-green))]" },
};

export function CandidatePrepPack(props: CandidatePrepPackProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const brief = build30SecBrief(props);
  const tracks = buildTalkTracks(props);
  const flags = buildFlags(props);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card className="mb-6 border-primary/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">🎯</div>
          <div>
            <h3 className="font-bold text-foreground text-base">Interview Prep Pack</h3>
            <p className="text-xs text-muted-foreground">Read this before your interview or meeting with {props.companyName}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <CardContent className="px-5 pb-5 pt-0 space-y-5">
          {/* 30-Second Brief */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary mb-2">
              ⏱ 30-Second Reality Check
            </p>
            <p className="text-sm text-foreground leading-relaxed">{brief}</p>
          </div>

          {/* Red / Yellow / Green Flags */}
          {flags.length > 0 && (
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                🚦 Signal Flags
              </p>
              <div className="grid gap-2">
                {flags.map((flag, i) => {
                  const config = FLAG_CONFIG[flag.level];
                  return (
                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", config.className)}>
                      <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", config.dot)} />
                      <div>
                        <p className="text-sm font-semibold">{flag.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{flag.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Say / Ask / Avoid */}
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
              💬 Talk Tracks
            </p>
            <div className="space-y-2">
              {tracks.map((track, i) => {
                const config = TYPE_CONFIG[track.type];
                return (
                  <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 group">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Badge className={cn("text-xs shrink-0", config.className)}>
                        {config.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(track.text, i)}
                      >
                        {copiedIdx === i ? <Check className="w-3 h-3 text-[hsl(var(--civic-green))]" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed italic">{track.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{track.context}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jackye's Insight */}
          {props.jackye_insight && (
            <div className="p-4 rounded-lg border border-primary/15 bg-primary/5">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary mb-2">
                👑 Jackye's Read
              </p>
              <p className="text-sm text-foreground leading-relaxed italic">"{props.jackye_insight}"</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pt-1 italic">
            Generated from public signals — not opinions. Use your judgment.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
