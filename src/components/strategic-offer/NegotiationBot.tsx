import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap, MapPin, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { LegalFlag } from "./CivicLegalAudit";

interface NegotiationScript {
  level: "gentle" | "hard" | "mobility";
  title: string;
  context: string;
  script: string;
  icon: typeof MessageSquare;
}

interface Props {
  flags: LegalFlag[];
  offerSalary: number;
  annualBaseline: number;
  companyName: string;
  roleTitle: string;
}

const LEVEL_CONFIG = {
  gentle: { label: "Conversation Starter", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: MessageSquare },
  hard: { label: "Deeper Conversation", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/5", border: "border-[hsl(var(--civic-yellow))]/20", icon: Zap },
  mobility: { label: "Career Protection", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/5", border: "border-[hsl(var(--civic-green))]/20", icon: MapPin },
};

function generateScripts(flags: LegalFlag[], salary: number, baseline: number, company: string, role: string): NegotiationScript[] {
  const scripts: NegotiationScript[] = [];

  scripts.push({
    level: "gentle",
    title: "Have you thought about clarifying the role scope?",
    context: "Vague job descriptions sometimes lead to scope creep. Getting clarity upfront can help set expectations.",
    script: `"I'm really excited about this opportunity at ${company}. Before I finalize, would it be possible to walk through the core responsibilities for the ${role} position? I'd love to make sure we're aligned on the day-to-day scope — maybe we could outline 3-5 primary deliverables together?"`,
    icon: MessageSquare,
  });

  if (salary < baseline * 1.15) {
    scripts.push({
      level: "hard",
      title: "Have you considered exploring total compensation?",
      context: "When base salary feels tight, there may be room to discuss the total package — bonus, PTO, flexibility.",
      script: `"Thank you for the offer for ${role}. The base of $${salary.toLocaleString()} is ${salary < baseline ? 'a bit below' : 'close to'} what I had in mind. I'm curious — would it be possible to explore a performance bonus, additional PTO, or a flexible arrangement that could round out the total compensation? I'm open to creative solutions."`,
      icon: Zap,
    });
  }

  const repaymentFlag = flags.find(f => f.category === "Stay-or-Pay");
  if (repaymentFlag) {
    scripts.push({
      level: "hard",
      title: "Have you asked about the repayment structure?",
      context: "Under recent regulations, repayment clauses should be prorated. It's worth confirming the terms.",
      script: `"I noticed the offer includes a repayment clause for the signing bonus. Could we confirm whether repayment is prorated — so if I stayed 18 months on a 2-year agreement, the remaining obligation would reflect that? I'm happy to discuss the commitment period if we can make sure the structure is fair on both sides."`,
      icon: Zap,
    });
  }

  scripts.push({
    level: "mobility",
    title: "Have you explored narrowing the non-compete?",
    context: "Broad non-competes can limit your future options. Many employers are open to reasonable scope adjustments.",
    script: `"I'd like to discuss the non-compete provision. I completely understand ${company}'s interest in protecting its business — would it be possible to narrow it to direct competitors in the same product category, within a reasonable geographic area, and for a shorter duration like 6 months? That way, both sides are protected."`,
    icon: MapPin,
  });

  const arbFlag = flags.find(f => f.category === "Arbitration");
  if (arbFlag) {
    scripts.push({
      level: "hard",
      title: "Have you thought about the arbitration clause?",
      context: "Mandatory arbitration waives your right to a jury trial. Some employers will agree to carve-outs for key claims.",
      script: `"I wanted to flag the mandatory arbitration clause. Would it be possible to add a carve-out for claims involving discrimination, harassment, or wage issues? I'd also appreciate if we could agree on mutual arbitrator selection and have ${company} cover the arbitration costs. I think that makes it fair for both of us."`,
      icon: Zap,
    });
  }

  return scripts;
}

export function NegotiationBot({ flags, offerSalary, annualBaseline, companyName, roleTitle }: Props) {
  const { toast } = useToast();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const scripts = generateScripts(flags, offerSalary, annualBaseline, companyName, roleTitle);

  const copyScript = (script: string, idx: number) => {
    navigator.clipboard.writeText(script);
    setCopiedIdx(idx);
    toast({ title: "Copied to clipboard", description: "Paste this into your email or notes." });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">
          Negotiation Conversation Starters
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Optional talking points framed as questions — use what feels right for your situation.
        </p>
      </div>

      <div className="space-y-4">
        {scripts.map((script, idx) => {
          const config = LEVEL_CONFIG[script.level];
          const Icon = config.icon;
          return (
            <Card key={idx} className={cn("rounded-xl border", config.border)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{script.title}</span>
                      <Badge variant="outline" className={cn("text-xs", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-normal mt-0.5">{script.context}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-sm text-foreground leading-relaxed italic pr-8">{script.script}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={() => copyScript(script.script, idx)}
                  >
                    {copiedIdx === idx ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
