import { useState } from "react";
import {
  AlertTriangle, TrendingDown, DollarSign, Users, Shield, Scale,
  Eye, MessageCircleQuestion, Copy, Check, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  {
    num: "01",
    icon: Eye,
    title: "Company Snapshot",
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground">Integrity Gap:</span>
          <Badge variant="warning" className="font-mono text-[10px] tracking-wider uppercase">Moderate → High</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This company presents a strong public mission around values and culture, but several internal and structural signals suggest potential gaps between messaging and operational reality.
        </p>
      </div>
    ),
  },
  {
    num: "02",
    icon: AlertTriangle,
    title: "What to Watch",
    content: (
      <div className="space-y-2">
        {[
          { text: "Legal and HR functions consolidated under one executive", severity: "risk" as const },
          { text: "Recent discrimination-related settlements and complaints", severity: "risk" as const },
          { text: "CEO-to-median worker pay ratio significantly elevated", severity: "caution" as const },
          { text: "Role of corporate governance concentrated at board level", severity: "caution" as const },
        ].map((item, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-none border border-transparent ${
            item.severity === "risk" ? "bg-destructive/5" : "bg-[hsl(var(--civic-yellow))]/5"
          }`}>
            <TrendingDown className={`w-4 h-4 mt-0.5 shrink-0 ${
              item.severity === "risk" ? "text-destructive" : "text-[hsl(var(--civic-yellow))]"
            }`} strokeWidth={1.5} />
            <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "03",
    icon: Users,
    title: "Workforce vs Leadership",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/30 border border-border p-3">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Workforce</div>
            <p className="text-sm text-foreground">Store-level workforce skews younger and more diverse</p>
          </div>
          <div className="bg-muted/30 border border-border p-3">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Leadership</div>
            <p className="text-sm text-foreground">Executive and board leadership less representative</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This can create a disconnect between day-to-day employee experience and top-level decision-making.
        </p>
      </div>
    ),
  },
  {
    num: "04",
    icon: DollarSign,
    title: "Compensation Signals",
    content: (
      <div className="space-y-2">
        {[
          "CEO compensation significantly exceeds median employee pay",
          "Limited visibility into wage progression at store level",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-[hsl(var(--civic-yellow))]/5">
            <DollarSign className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--civic-yellow))]" strokeWidth={1.5} />
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "05",
    icon: Shield,
    title: "Policy & Influence",
    content: (
      <div className="space-y-2">
        {[
          "Corporate Political Action Committee (PAC) established",
          "Organizational participation in political funding activity",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-[hsl(var(--civic-blue))]/5">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--civic-blue))]" strokeWidth={1.5} />
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Indicates active involvement in shaping external policy environment.</p>
      </div>
    ),
  },
  {
    num: "06",
    icon: AlertTriangle,
    title: "Risk Signals",
    content: (
      <div className="space-y-2">
        {[
          "Documented EEOC-related cases and settlements",
          "Structural changes that may shift focus toward legal risk management",
          "Reputational sensitivity tied to workforce treatment",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-destructive/5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" strokeWidth={1.5} />
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "07",
    icon: Scale,
    title: "Integrity Gap",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-primary/5 border border-primary/20 p-3">
            <div className="font-mono text-[10px] tracking-wider uppercase text-primary mb-1">What They Say</div>
            <p className="text-sm text-foreground italic">"Cultivate a better world"</p>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 p-3">
            <div className="font-mono text-[10px] tracking-wider uppercase text-destructive mb-1">What We Found</div>
            <ul className="text-sm text-foreground space-y-1">
              <li>• Legal exposure</li>
              <li>• Compensation gap</li>
              <li>• Governance concentration</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The difference isn't necessarily contradiction — but it does raise questions about how values are operationalized.
        </p>
      </div>
    ),
  },
];

const QUESTIONS = [
  {
    question: "How are employee concerns escalated and addressed at the corporate level?",
    category: "Culture",
  },
  {
    question: "What led to combining Legal and HR leadership?",
    category: "Governance",
  },
  {
    question: "How does the company measure progress on workforce equity internally?",
    category: "Equity",
  },
];

export function DemoCompanyProfile() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Example Intelligence Report
          </div>
          <div className="font-serif text-lg text-foreground">Large National Restaurant Brand</div>
        </div>
        <Badge variant="warning" className="font-mono text-[10px] tracking-wider uppercase">
          Integrity Gap: Moderate → High
        </Badge>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <Card key={section.num} className="rounded-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted px-2 py-0.5">
                {section.num}
              </div>
              <section.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <h4 className="font-mono text-sm tracking-wider uppercase text-foreground font-semibold">
                {section.title}
              </h4>
            </div>
            {section.content}
          </CardContent>
        </Card>
      ))}

      {/* What to Ask */}
      <Card className="rounded-none">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted px-2 py-0.5">
              08
            </div>
            <MessageCircleQuestion className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h4 className="font-mono text-sm tracking-wider uppercase text-foreground font-semibold">
              What to Ask
            </h4>
          </div>
          <div className="space-y-2">
            {QUESTIONS.map((q, i) => (
              <div key={i} className="bg-muted/30 border border-border p-3 group">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <p className="text-sm text-foreground font-medium leading-relaxed italic">
                    "{q.question}"
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
                <span className="font-mono text-[10px] tracking-wider uppercase text-primary bg-primary/8 px-1.5 py-0.5">
                  {q.category}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center pt-1">
        Composite example based on real signal types. Not a specific company report.
      </p>
    </div>
  );
}
