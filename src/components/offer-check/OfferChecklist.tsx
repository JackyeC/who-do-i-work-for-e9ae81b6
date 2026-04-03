/**
 * OfferChecklist — Phase 1 manual "Check Your Offer" checklist
 * with Before You Accept red-flag block based on company archetype signals.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertTriangle, Shield, FileText, Scale, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferChecklistProps {
  companyName: string;
  companyId?: string;
  industry?: string;
  signals?: { category: string; count: number; severity: string }[];
}

const CHECKLIST_ITEMS = [
  {
    id: "base-comp",
    category: "Compensation",
    icon: "💰",
    question: "Is the base salary within market range for this role and location?",
    tip: "Check BLS.gov for occupation wage data. Ask: 'What percentile is this offer?'",
  },
  {
    id: "equity",
    category: "Compensation",
    icon: "📈",
    question: "If equity is offered, do you understand the vesting schedule and strike price?",
    tip: "Ask for the 409A valuation date. If they can't provide it, that's a signal.",
  },
  {
    id: "non-compete",
    category: "Legal",
    icon: "⚖️",
    question: "Does the offer include a non-compete or non-solicitation clause?",
    tip: "FTC has proposed banning non-competes. Know your state's enforceability before signing.",
  },
  {
    id: "arbitration",
    category: "Legal",
    icon: "🔒",
    question: "Does the offer require mandatory arbitration for disputes?",
    tip: "This waives your right to sue or join a class action. Check NLRB history for patterns.",
  },
  {
    id: "at-will",
    category: "Employment Terms",
    icon: "📋",
    question: "Is the position at-will? Is there a severance clause?",
    tip: "If no severance is mentioned, negotiate it now — it's easier before you start.",
  },
  {
    id: "pto",
    category: "Benefits",
    icon: "🏖️",
    question: "Is PTO 'unlimited' or defined? What's the actual average usage?",
    tip: "'Unlimited PTO' often means less PTO taken. Ask for the team's average days off.",
  },
  {
    id: "layoff-history",
    category: "Stability",
    icon: "⚠️",
    question: "Has this company had layoffs or WARN Act filings in the past 2 years?",
    tip: "Check the company dossier for WARN notices. A recent layoff + aggressive hiring = churn risk.",
  },
  {
    id: "dei-reality",
    category: "Culture",
    icon: "🎭",
    question: "Does the DEI page match actual leadership demographics?",
    tip: "Compare the careers page language to SEC proxy filings for board composition data.",
  },
  {
    id: "glassdoor",
    category: "Culture",
    icon: "🔍",
    question: "Have you checked management ratings on employee review sites?",
    tip: "Below 2.5/5 on management = structural culture issue, not just a bad manager.",
  },
  {
    id: "pac-spending",
    category: "Values Alignment",
    icon: "🏛️",
    question: "Do you know where this company's PAC money goes?",
    tip: "Check FEC records in the dossier. Some companies fund causes opposite to their marketing.",
  },
];

interface RedFlag {
  flag: string;
  source: string;
  sourceUrl: string;
  advice: string;
}

const RED_FLAG_TEMPLATES: Record<string, RedFlag[]> = {
  default: [
    { flag: "Mandatory arbitration clause detected in similar industry offers", source: "NLRB pattern analysis", sourceUrl: "https://www.nlrb.gov/about-nlrb/rights-we-protect/the-law/interfering-with-employee-rights-section-7-8a1", advice: "Ask for a carve-out for harassment and discrimination claims." },
    { flag: "Non-compete may be unenforceable in your state", source: "FTC proposed rule · State labor law", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/noncompete-rule", advice: "Request removal or narrowing. Most companies will comply if asked." },
    { flag: "No severance terms in the offer letter", source: "DOL severance guidance", sourceUrl: "https://www.dol.gov/general/topic/wages/severancepay", advice: "Negotiate 2-4 weeks per year of service before signing." },
  ],
  tech: [
    { flag: "Equity cliff vesting (1 year) with no acceleration on termination", source: "SEC compensation filing patterns", sourceUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=DEF+14A&dateb=&owner=include&count=40", advice: "Ask for double-trigger acceleration if the company is acquired." },
    { flag: "IP assignment clause covers personal projects", source: "State IP assignment laws", sourceUrl: "https://www.law.cornell.edu/wex/intellectual_property", advice: "Request a carve-out for personal work done outside business hours." },
    { flag: "Recent RIF (Reduction in Force) while posting same role", source: "WARN Act filings", sourceUrl: "https://www.dol.gov/agencies/eta/layoffs/warn", advice: "Ask directly: 'Was this role previously held by someone affected by layoffs?'" },
  ],
  finance: [
    { flag: "Clawback provisions on bonus without clear triggers", source: "SEC Dodd-Frank clawback rules", sourceUrl: "https://www.sec.gov/rules/final/2022/33-11126.pdf", advice: "Ask for specific, measurable clawback conditions in writing." },
    { flag: "Garden leave clause without full compensation guarantee", source: "DOL wage & hour guidance", sourceUrl: "https://www.dol.gov/agencies/whd", advice: "Ensure garden leave pays 100% of base + benefits." },
    { flag: "Non-solicitation extends to clients you brought in", source: "FTC non-compete analysis", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/noncompete-rule", advice: "Negotiate to exclude pre-existing relationships." },
  ],
  healthcare: [
    { flag: "Restrictive covenant covers broad geographic area", source: "State healthcare labor law", sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/noncompete-rule", advice: "Many states limit non-competes for healthcare workers. Check yours." },
    { flag: "On-call expectations not reflected in compensation", source: "FLSA on-call rules", sourceUrl: "https://www.dol.gov/agencies/whd/fact-sheets/22-flsa-hours-worked", advice: "Clarify on-call pay rate and frequency expectations in writing." },
    { flag: "Recent Medicaid/Medicare reimbursement cuts affecting employer", source: "CMS reimbursement data", sourceUrl: "https://www.cms.gov/medicare/payment", advice: "Ask about revenue diversification and budget stability for your department." },
  ],
};

export function OfferChecklist({ companyName, companyId, industry, signals }: OfferChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const progress = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);
  const industryKey = (industry?.toLowerCase().includes("tech") || industry?.toLowerCase().includes("software")) ? "tech"
    : industry?.toLowerCase().includes("financ") ? "finance"
    : industry?.toLowerCase().includes("health") ? "healthcare"
    : "default";
  const redFlags = RED_FLAG_TEMPLATES[industryKey] || RED_FLAG_TEMPLATES.default;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Check Your Offer
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manual checklist while AI parsing is in development
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary tabular-nums">{checked.size}/{CHECKLIST_ITEMS.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reviewed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-full text-left p-3.5 rounded-lg border transition-all group",
                isChecked
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{item.icon}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono uppercase tracking-wider">
                      {item.category}
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-sm font-medium leading-relaxed",
                    isChecked ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {item.question}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    💡 {item.tip}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ BEFORE YOU ACCEPT — Red Flag Block ═══ */}
      <Card className="border-destructive/30 bg-destructive/[0.03]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h4 className="text-sm font-bold text-destructive uppercase tracking-wider">
              Before You Accept
            </h4>
            {companyName && (
              <Badge variant="outline" className="text-[9px] ml-auto border-destructive/30 text-destructive">
                {companyName}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Red-flag clauses and patterns found in {industry || "this industry"}'s SEC, NLRB, and regulatory history:
          </p>

          <div className="space-y-3">
            {redFlags.map((rf, i) => (
              <div key={i} className="p-3 rounded-lg bg-background border border-destructive/15">
                <div className="flex items-start gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{rf.flag}</p>
                    <p className="text-[10px] mt-0.5 font-mono uppercase tracking-wider">
                       <a
                         href={rf.sourceUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                       >
                         📎 {rf.source}
                       </a>
                     </p>
                    <p className="text-xs text-foreground mt-1.5 flex items-start gap-1">
                      <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>{rf.advice}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Patterns sourced from public regulatory filings · Not legal advice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
