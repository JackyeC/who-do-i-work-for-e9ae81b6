import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, ArrowRight, Copy, CheckCircle2, Shield, Zap, MapPin } from "lucide-react";
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
  gentle: { label: "The Gentle Ask", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: MessageSquare },
  hard: { label: "The Hard Pivot", color: "text-civic-yellow", bg: "bg-civic-yellow/5", border: "border-civic-yellow/20", icon: Zap },
  mobility: { label: "The Mobility Edit", color: "text-civic-green", bg: "bg-civic-green/5", border: "border-civic-green/20", icon: MapPin },
};

function generateScripts(flags: LegalFlag[], salary: number, baseline: number, company: string, role: string): NegotiationScript[] {
  const scripts: NegotiationScript[] = [];

  // Gentle Ask — always generate for job duties
  scripts.push({
    level: "gentle",
    title: "Clarify Job Duties & Classification",
    context: "Vague job descriptions can lead to misclassification, making you do work outside your pay grade.",
    script: `"I'm excited about this opportunity at ${company}. To make sure we're aligned, could we clarify the core responsibilities for the ${role} position? I want to ensure the role description accurately reflects the day-to-day work, as I've seen situations where vague descriptions lead to scope creep. Would you be open to defining 3-5 primary deliverables?"`,
    icon: MessageSquare,
  });

  // Hard Pivot — if salary is low
  if (salary < baseline * 1.15) {
    scripts.push({
      level: "hard",
      title: "Pivot to Total Compensation",
      context: "When base salary is below or near your walk-away number, pivot the conversation to total value.",
      script: `"I appreciate the offer for ${role}. The base salary of $${salary.toLocaleString()} is ${salary < baseline ? 'below' : 'close to'} my target range. Rather than focusing solely on base, could we explore a performance bonus structure — say, a ${Math.round((baseline * 1.2 - salary) / salary * 100)}% annual target bonus tied to clear KPIs? Alternatively, I'd value additional PTO (25 days vs. the standard) or a flexible work arrangement that offsets commuting costs."`,
      icon: Zap,
    });
  }

  // Hard Pivot — repayment clause
  const repaymentFlag = flags.find(f => f.category === "Stay-or-Pay");
  if (repaymentFlag) {
    scripts.push({
      level: "hard",
      title: "Challenge the Repayment Clause",
      context: "Under CA AB 692 (2026), repayment clauses must be prorated and capped at 2 years.",
      script: `"I noticed the offer includes a repayment clause for the signing/relocation bonus. Under current regulations, these should be prorated — meaning if I leave after 18 months on a 2-year agreement, I'd only owe 25% back. Can we confirm the clause follows the prorated model? I'm also happy to discuss extending the commitment period if the bonus amount is adjusted upward."`,
      icon: Zap,
    });
  }

  // Mobility Edit — non-compete
  const nonCompeteFlag = flags.find(f => f.category === "Non-Compete" || f.title.toLowerCase().includes("non-compete"));
  scripts.push({
    level: "mobility",
    title: "Narrow the Non-Compete",
    context: "Broad non-competes can trap you. Most are negotiable — especially geographic scope and duration.",
    script: `"I'd like to discuss the non-compete provision. While I understand ${company}'s interest in protecting trade secrets, the current scope feels broad. Could we narrow it to: (1) only direct competitors in the same product category, (2) within a 50-mile radius of my primary work location, and (3) for a duration of 6 months rather than 12? This protects ${company}'s interests while preserving my career mobility."`,
    icon: MapPin,
  });

  // Arbitration push-back
  const arbFlag = flags.find(f => f.category === "Arbitration");
  if (arbFlag) {
    scripts.push({
      level: "hard",
      title: "Address the Arbitration Clause",
      context: "Mandatory arbitration waives your constitutional right to a jury trial. This is a civic concession worth discussing.",
      script: `"I want to flag the mandatory arbitration clause. I understand this is standard in many offers, but I'd prefer to negotiate a carve-out for claims involving discrimination, harassment, or wage theft — issues where public accountability matters. At minimum, could we add a provision that the arbitrator selection is mutually agreed upon and that ${company} covers the arbitration costs?"`,
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
          Strategic Negotiation Scripts
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Based on the flags we found, here are ready-to-use scripts at three escalation levels. You have leverage here — use it.
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
                      <Badge variant="outline" className={cn("text-[9px]", config.color)}>
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-civic-green" />
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
