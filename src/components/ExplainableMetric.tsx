import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricExplanation {
  title: string;
  what: string;
  why: string;
  source?: string;
  sourceUrl?: string;
  context?: string;
}

const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  "civic-footprint": {
    title: "Civic Footprint Score",
    what: "A 0–100 composite score measuring how much political activity we've detected for this company — PAC spending, lobbying, executive donations, government contracts, and organizational ties.",
    why: "Higher doesn't mean worse. It means this company is more politically active. A score of 0 means we found no political spending. A score of 80+ means significant political engagement across multiple channels.",
    source: "FEC, Senate LDA, USASpending.gov",
  },
  "pac-spending": {
    title: "PAC Spending",
    what: "Total money donated by this company's Political Action Committee (PAC) to candidates, parties, and other committees during the current election cycle.",
    why: "Corporate PACs pool voluntary contributions from employees and shareholders. This money goes directly to political candidates. It's legal and disclosed, but shows who the company is financially backing.",
    source: "Federal Election Commission (OpenFEC)",
    sourceUrl: "https://www.fec.gov",
  },
  "lobbying": {
    title: "Lobbying Spend",
    what: "How much this company spends annually on registered federal lobbyists who advocate for specific policies or legislation in Congress and federal agencies.",
    why: "Lobbying is legal, but the amount and issues lobbied on reveal what policies a company is trying to influence. High lobbying spend on specific bills can signal where the company's interests diverge from public interest.",
    source: "Senate Lobbying Disclosure Act filings",
    sourceUrl: "https://lda.senate.gov",
  },
  "gov-contracts": {
    title: "Government Contracts",
    what: "Total value of federal contracts awarded to this company. Includes procurement contracts, grants, and other financial assistance from U.S. government agencies.",
    why: "When a company that spends heavily on lobbying and PAC donations also receives large government contracts, it raises questions about whether political spending influences contract awards.",
    source: "USASpending.gov",
    sourceUrl: "https://www.usaspending.gov",
  },
  "subsidies": {
    title: "Subsidies & Tax Breaks",
    what: "Estimated total of government subsidies, tax incentives, and financial assistance received from federal and state governments.",
    why: "Subsidies represent taxpayer money flowing to corporations. Understanding the ratio of political spending to subsidies received helps evaluate a company's return on political investment.",
    source: "Good Jobs First, USASpending.gov",
  },
  "effective-tax-rate": {
    title: "Effective Tax Rate",
    what: "The actual percentage of income this company pays in taxes after all deductions, credits, and loopholes — as opposed to the statutory rate (currently 21% federal for corporations).",
    why: "The gap between the statutory rate and a company's effective rate reveals how much they benefit from tax breaks and loopholes. A rate well below 21% suggests aggressive tax strategies or substantial government incentives.",
    source: "SEC EDGAR filings, annual reports",
    context: "The U.S. corporate statutory tax rate is 21%. Many large companies pay significantly less through deductions, credits, offshore structures, and industry-specific incentives.",
  },
  "indirect-influence": {
    title: "Indirect Influence",
    what: "Total estimated money flowing through Super PACs and dark money organizations connected to this company — channels where the company's influence is harder to trace.",
    why: "Unlike direct PAC donations, Super PACs can accept unlimited amounts and dark money groups don't have to disclose donors. These channels can magnify a company's political influence while obscuring its involvement.",
    source: "FEC, IRS 990 filings, OpenSecrets",
  },
  "risk-signals": {
    title: "Risk Signals",
    what: "Count of flagged connections to controversial organizations, candidates with extreme records, and dark money channels associated with this company.",
    why: "Not all political spending is equal. Connections to organizations designated as extremist, candidates with unusual voting patterns, or untraceable dark money channels represent elevated risk for stakeholders.",
    source: "Multiple (FEC, SPLC, ADL, lobbying disclosures)",
  },
};

interface ExplainableMetricProps {
  metricKey: string;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export function ExplainableMetric({ metricKey, children, className, align = "center" }: ExplainableMetricProps) {
  const [open, setOpen] = useState(false);
  const explanation = METRIC_EXPLANATIONS[metricKey];

  if (!explanation) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group relative text-left cursor-pointer transition-all rounded-lg",
            "hover:ring-2 hover:ring-primary/20 hover:bg-primary/[0.02]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          {children}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-0" sideOffset={8}>
        <div className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">{explanation.title}</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">What is this?</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{explanation.what}</p>
            </div>
            
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it matters</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{explanation.why}</p>
            </div>

            {explanation.context && (
              <div className="p-2.5 bg-muted/60 rounded-md">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Context</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{explanation.context}</p>
              </div>
            )}

            {explanation.source && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                <span className="text-[10px] text-muted-foreground">Source:</span>
                {explanation.sourceUrl ? (
                  <a
                    href={explanation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {explanation.source}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{explanation.source}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
