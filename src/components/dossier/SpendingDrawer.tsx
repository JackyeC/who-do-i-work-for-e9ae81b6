import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Search, AlertTriangle, ArrowRight } from "lucide-react";
import type { SpendingMetric } from "@/types/ReportSchema";

interface SpendingDrawerProps {
  metric: SpendingMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
  companySlug?: string;
  /** Special mode for Eff. Tax Rate */
  taxRate?: string | null;
}

const trendConfig = {
  up: { icon: TrendingUp, label: "Increasing", className: "text-destructive" },
  down: { icon: TrendingDown, label: "Decreasing", className: "text-civic-green" },
  neutral: { icon: Minus, label: "Stable", className: "text-muted-foreground" },
};

/* ── Receipts + Jackye's Take per metric ── */
const METRIC_RECEIPT: Record<string, { receipt: string; take: string; source: string; sourceUrl: string }> = {
  Lobbying: {
    receipt: "Lobbying disclosures filed under the Lobbying Disclosure Act show payments to firms and individuals hired to influence federal legislation, rulemaking, and executive branch decisions. Amounts reflect total reported spending across all registered lobbying activities.",
    take: "If a company is spending millions to talk to lawmakers, they're not doing it for fun. The question is: are they lobbying for things that help you, or things that help their margins? Check the bills they're targeting — that's the real résumé.",
    source: "OpenSecrets / LDA Filings",
    sourceUrl: "https://www.opensecrets.org/federal-lobbying",
  },
  "PAC Spending": {
    receipt: "Political Action Committee contributions are pooled funds from corporate employees and executives, directed to candidates, parties, and ballot measures. FEC filings show exactly who received money and how much.",
    take: "PAC money is the clearest signal of whose agenda a company is bankrolling. A company that says 'we support all workers' but funds candidates who vote against labor protections? That's a gap you can measure in dollars.",
    source: "FEC.gov",
    sourceUrl: "https://www.fec.gov/data/",
  },
  "Gov Contracts": {
    receipt: "Federal contract awards are documented through USASpending.gov, tracking taxpayer-funded agreements between government agencies and private companies. Data includes agency, amount, and contract description.",
    take: "Government contracts mean your tax dollars are the customer. If the company depends on federal revenue, their hiring, layoffs, and strategy shift with every administration. That's not instability — it's a feature of the business model.",
    source: "USASpending.gov",
    sourceUrl: "https://www.usaspending.gov/",
  },
  Subsidies: {
    receipt: "Public subsidies include state and local tax incentives, grants, and abatements tracked by Good Jobs First. These represent public investments in private companies, often tied to job creation or retention commitments.",
    take: "Communities gave this company money in exchange for promises — jobs, investment, infrastructure. The receipt question is: did they deliver? If they took the subsidy and then laid people off, that's a receipt the community should see.",
    source: "Good Jobs First Subsidy Tracker",
    sourceUrl: "https://subsidytracker.goodjobsfirst.org/",
  },
};

/* ── Itemized breakdown examples per metric type ── */
const METRIC_ITEMIZED: Record<string, { columns: string[]; note: string }> = {
  Lobbying: {
    columns: ["Year", "Amount", "Lobbying Firm", "Issue Area"],
    note: "Itemized by reporting period from LDA quarterly filings.",
  },
  "PAC Spending": {
    columns: ["Cycle", "Recipient", "Party", "Amount"],
    note: "Itemized by election cycle from FEC individual disbursement records.",
  },
  "Gov Contracts": {
    columns: ["Year", "Agency", "Description", "Amount"],
    note: "Itemized by fiscal year from USASpending federal award data.",
  },
  Subsidies: {
    columns: ["Year", "Program", "State/Local", "Amount"],
    note: "Itemized from Good Jobs First Subsidy Tracker records.",
  },
};

export function SpendingDrawer({ metric, open, onOpenChange, companyName, companySlug, taxRate }: SpendingDrawerProps) {
  // Tax Rate special mode
  if (taxRate && !metric) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-black tracking-tight text-foreground">
              Effective Tax Rate
            </SheetTitle>
            <SheetDescription className="sr-only">
              Effective tax rate details{companyName ? ` for ${companyName}` : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Amount */}
            <div className="p-4 border border-border/30 bg-muted/10">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Effective Tax Rate</p>
              <p className="text-3xl font-black text-foreground tracking-tight">{taxRate}</p>
              {companyName && <p className="text-xs text-muted-foreground mt-1">{companyName}</p>}
            </div>

            {/* 🧾 The Receipt */}
            <div className="p-4 border border-primary/20 bg-primary/[0.04]">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-2">🧾 The Receipt</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                The effective tax rate represents what {companyName || "this company"} actually paid in taxes as a percentage of pre-tax income,
                compared to the statutory corporate rate of 21%. A rate of {taxRate} may indicate the use of deductions, credits,
                offshore structures, or other tax strategies that reduce the total tax burden.
              </p>
            </div>

            {/* 💬 Jackye's Take */}
            <div className="border-l-[3px] border-primary pl-4">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-2">💬 Jackye's Take</p>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "A company's tax rate tells you how they play the system. If they're paying significantly less than 21%,
                they've got accountants doing what accountants do. The question for workers is: are the savings going into
                payroll, benefits, and growth — or buybacks and executive comp?"
              </p>
            </div>

            {/* Itemization status */}
            <div className="p-3 border border-border/20 bg-muted/5 flex items-start gap-2">
              <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full itemization coming soon</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Year-over-year tax rate breakdowns, deduction categories, and comparisons to industry peers
                  will be available in a future update.
                </p>
              </div>
            </div>

            {/* Footer links */}
            <FooterLinks companySlug={companySlug} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!metric) return null;

  const trend = trendConfig[metric.trend];
  const TrendIcon = trend.icon;
  const receiptData = METRIC_RECEIPT[metric.label];
  const itemizedData = METRIC_ITEMIZED[metric.label];
  const amt = metric.amount.replace(/[^0-9.]/g, "");
  const hasData = parseFloat(amt) > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-black tracking-tight text-foreground">
            {metric.label}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details about {metric.label} spending metric{companyName ? ` for ${companyName}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Amount */}
          <div className="p-4 border border-border/30 bg-muted/10">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Amount</p>
            <p className="text-3xl font-black text-foreground tracking-tight">{metric.amount}</p>
            {companyName && <p className="text-xs text-muted-foreground mt-1">{companyName}</p>}
          </div>

          {/* Trend */}
          <div className="flex items-center gap-3 p-3 border border-border/20">
            <TrendIcon className={`w-5 h-5 ${trend.className}`} />
            <div>
              <p className="text-sm font-semibold text-foreground">Trend: {trend.label}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${trend.className}`}>
                {metric.trend.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Plain-English description */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">What This Is</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {metric.description}
            </p>
          </div>

          {/* 🧾 The Receipt */}
          {receiptData && (
            <div className="p-4 border border-primary/20 bg-primary/[0.04]">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-2">🧾 The Receipt</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {receiptData.receipt}
              </p>
            </div>
          )}

          {/* Itemized Table */}
          {hasData && itemizedData && (
            <div className="border border-border/30">
              <div className="px-3 py-2 bg-muted/20 border-b border-border/20">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Itemized Breakdown
                </p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/20">
                    {itemizedData.columns.map((col) => (
                      <th key={col} className="text-left py-2 px-3 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/10">
                    <td colSpan={itemizedData.columns.length} className="py-4 px-3 text-center text-muted-foreground/60 italic text-xs">
                      Detailed line items available at source →
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground/50 px-3 py-2 font-mono">
                {itemizedData.note}
              </p>
            </div>
          )}

          {/* 💬 Jackye's Take */}
          {receiptData && (
            <div className="border-l-[3px] border-primary pl-4">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-primary mb-2">💬 Jackye's Take</p>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "{receiptData.take}"
              </p>
            </div>
          )}

          {/* See the receipts → source */}
          {receiptData && (
            <a
              href={metric.drill_down_url || receiptData.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-border/30 text-primary font-semibold text-sm hover:bg-primary/5 hover:border-primary/40 transition-all no-underline"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              See the receipts → {receiptData.source}
            </a>
          )}

          {!receiptData && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(metric.drill_down_url, "_blank", "noopener")}
            >
              <ExternalLink className="w-4 h-4" />
              View Source Data
            </Button>
          )}

          {/* Footer links */}
          <FooterLinks companySlug={companySlug} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Shared footer links ── */
function FooterLinks({ companySlug }: { companySlug?: string }) {
  const dossierBase = companySlug ? `/dossier/${companySlug}` : "/search";

  return (
    <div className="space-y-2 pt-2 border-t border-border/20">
      <Link
        to={`${dossierBase}#political-influence`}
        className="flex items-center gap-2 p-3 border border-border/30 text-sm font-semibold text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all no-underline"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        See all political influence →
        <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
      </Link>
      <Link
        to={`${dossierBase}#follow-the-money`}
        className="flex items-center gap-2 p-3 border border-border/30 text-sm font-semibold text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all no-underline"
      >
        💸 Follow the Money trail →
        <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
      </Link>
      <p className="text-[10px] text-muted-foreground/50 font-mono text-center uppercase tracking-wider">
        Public records · Verify at source
      </p>
    </div>
  );
}
