import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, DollarSign, Users, Eye, MessageSquare,
  CheckCircle2, MinusCircle, ArrowRight, Shield, ShieldAlert, Zap,
  Building2, Scale, Megaphone, FileText, Heart, ChevronDown, ExternalLink,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecommendationCard } from "./RecommendationCard";
import { ValuesAlignmentSection } from "./ValuesAlignmentSection";
import { EarlyInvestigationCard, EARLY_INVESTIGATION_THRESHOLD } from "./EarlyInvestigationCard";
import { PoliticalGivingCard } from "@/components/giving/PoliticalGivingCard";
import { ExecutiveGivingSection } from "@/components/giving/ExecutiveGivingCard";
import { InstitutionalDNACard } from "./InstitutionalDNACard";
import { PolicyScoreCard } from "@/components/policy-intelligence/PolicyScoreCard";
import { HighRiskConnectionCard } from "@/components/company/HighRiskConnectionCard";
import { WorkforceDemographicsLayer } from "./WorkforceDemographicsLayer";
import { EEOCCaseAlert } from "@/components/EEOCCaseAlert";
import { SpendingRecordTable } from "./SpendingRecordTable";
import { useEmployerReport } from "@/hooks/use-employer-report";
import type { DonorProfile } from "@/types/ReportSchema";

/* ─── Types ─── */
interface AdvocacyReportProps {
  company: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    state: string;
    employee_count?: string | null;
    description?: string | null;
    lobbying_spend?: number | null;
    total_pac_spending?: number;
    jackye_insight?: string | null;
    civic_footprint_score?: number;
    employer_clarity_score?: number | null;
    career_intelligence_score?: number | null;
    is_publicly_traded?: boolean | null;
    effective_tax_rate?: string | null;
    government_contracts?: number | null;
    subsidies_received?: number | null;
  };
  executives?: Array<{
    name: string;
    title: string;
    total_donations: number;
    previous_company?: string | null;
    source?: string | null;
  }>;
  contracts?: Array<{
    agency_name: string;
    contract_value?: number | null;
    contract_description?: string | null;
    controversy_flag?: boolean;
  }>;
  issueSignals?: Array<{
    issue_category: string;
    signal_type: string;
    description: string;
    amount?: number | null;
    confidence_score?: number;
  }>;
  publicStances?: Array<{
    issue_category?: string;
    public_position?: string;
    evidence_type?: string;
    reality_check?: string;
    gap_severity?: string;
  }>;
  eeocCases?: Array<{
    case_name?: string;
    filing_date?: string;
    basis?: string;
    issue?: string;
  }>;
}

/* ─── Verdict logic ─── */
function computeVerdict(company: AdvocacyReportProps["company"], signalCount: number, eeocCount: number) {
  const lobbyingHigh = (company.lobbying_spend ?? 0) > 1_000_000;
  const pacHigh = (company.total_pac_spending ?? 0) > 500_000;
  const clarityLow = (company.employer_clarity_score ?? 50) < 30;
  const hasEeoc = eeocCount > 0;
  const redFlags = [lobbyingHigh, pacHigh, clarityLow, hasEeoc, signalCount > 5].filter(Boolean).length;

  if (redFlags >= 4) return { text: "MULTIPLE SIGNALS PRESENT", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", redFlagCount: redFlags };
  if (redFlags >= 2) return { text: "PATTERN WORTH WATCHING", color: "text-civic-yellow", bg: "bg-civic-yellow/10 border-civic-yellow/30", redFlagCount: redFlags };
  if (redFlags >= 1) return { text: "MIXED SIGNALS", color: "text-civic-blue", bg: "bg-civic-blue/10 border-civic-blue/30", redFlagCount: redFlags };
  return { text: "LIMITED SIGNALS ON RECORD", color: "text-civic-green", bg: "bg-civic-green/10 border-civic-green/30", redFlagCount: 0 };
}

function fmtMoney(n?: number | null): string {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}


/* ─── Section divider ─── */
function SectionDivider({ number, title, subtitle, icon: Icon }: { number: number; title: string; subtitle: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-4 mb-5 pt-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-full border border-primary/30 bg-primary/5 shrink-0">
        <span className="text-[10px] font-mono font-bold text-primary">{number}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-black tracking-tight text-foreground uppercase">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Active Signals Panel ─── */
function ActiveSignalsPanel({ signalsByCategory }: { signalsByCategory: Record<string, Array<{ issue_category: string; signal_type: string; description: string; amount?: number | null; confidence_score?: number; source_url?: string }>> }) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <div className="mt-5 pt-5 border-t border-border/30">
      <p className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase mb-3">Active Signals</p>
      <div className="space-y-2">
        {Object.entries(signalsByCategory).slice(0, 8).map(([cat, signals]) => {
          const isExpanded = expandedCat === cat;
          const isHot = signals.length > 3;
          const _firstSource = signals.find(s => (s as any).source_url);
          const firstSourceUrl = _firstSource ? (_firstSource as any).source_url : undefined;

          return (
            <div key={cat}>
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 border-l-2 rounded-r-lg text-left transition-colors cursor-pointer",
                  isHot ? "border-destructive/50" : "border-[hsl(var(--civic-yellow))]/50",
                  isExpanded
                    ? (isHot ? "bg-destructive/10" : "bg-[hsl(var(--civic-yellow))]/10")
                    : (isHot ? "bg-destructive/5 hover:bg-destructive/10" : "bg-[hsl(var(--civic-yellow))]/5 hover:bg-[hsl(var(--civic-yellow))]/10"),
                )}
              >
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", isHot ? "text-destructive" : "text-[hsl(var(--civic-yellow))]")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{cat}</p>
                  <p className="text-xs text-muted-foreground">{signals.length} signal{signals.length > 1 ? "s" : ""} — {signals[0].description?.slice(0, 100)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-primary">{isExpanded ? "Hide" : "See signals"}</span>
                  <ChevronDown className={cn("w-4 h-4 text-primary transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>

              {isExpanded && (
                <div className="ml-5 border-l border-border/30 pl-4 py-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {signals.map((sig, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded bg-muted/30 border border-border/20">
                      <Zap className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{sig.signal_type?.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{sig.description}</p>
                        {sig.amount != null && sig.amount > 0 && (
                          <Badge variant="outline" className="mt-1 text-[10px]">{fmtMoney(sig.amount)}</Badge>
                        )}
                      </div>
                      {(sig as any).source_url && (
                        <a
                          href={(sig as any).source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            Receipt <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Donor Signals Panel ─── */
function DonorSignalsPanel({ donors }: { donors: DonorProfile[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      <p className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase mb-2">Top Political Donors in Leadership</p>
      <div className="space-y-2">
        {donors.slice(0, 5).map((donor, i) => {
          const isExpanded = expandedIdx === i;
          return (
            <div key={i}>
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer border",
                  isExpanded
                    ? "bg-primary/10 border-primary/20"
                    : "bg-muted/10 border-border/20 hover:bg-primary/5 hover:border-primary/15"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{donor.name}</p>
                  {donor.aliases.length > 1 && (
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      aka {donor.aliases.filter(a => a !== donor.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{fmtMoney(donor.total_donated)} donated</Badge>
                  <span className="text-[10px] font-mono text-primary">{isExpanded ? "Hide" : "Details"}</span>
                  <ChevronDown className={cn("w-4 h-4 text-primary transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>

              {isExpanded && (
                <div className="ml-4 border-l border-border/30 pl-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2 p-2.5 rounded bg-muted/30 border border-border/20">
                    <DollarSign className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Total Disclosed Giving</p>
                      <p className="text-xs text-muted-foreground">{fmtMoney(donor.total_donated)} in FEC-reported individual contributions</p>
                    </div>
                  </div>
                  {donor.top_recipient && (
                    <div className="flex items-start gap-2 p-2.5 rounded bg-muted/30 border border-border/20">
                      <Users className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">Top Recipient</p>
                        <p className="text-xs text-muted-foreground">{donor.top_recipient}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={donor.raw_fec_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      Full FEC record <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function AdvocacyReport({ company, executives = [], contracts = [], issueSignals = [], publicStances = [], eeocCases = [] }: AdvocacyReportProps) {
  
  

  const report = useEmployerReport(company as any, executives as any, contracts as any, issueSignals as any);

  const isEarlyInvestigation = issueSignals.length < EARLY_INVESTIGATION_THRESHOLD;
  const verdict = useMemo(() => computeVerdict(company, issueSignals.length, eeocCases.length), [company, issueSignals.length, eeocCases.length]);
  const totalContractValue = useMemo(() => contracts.reduce((s, c) => s + (c.contract_value ?? 0), 0), [contracts]);
  const controversialContracts = useMemo(() => contracts.filter(c => c.controversy_flag), [contracts]);
  const gapStances = useMemo(() => publicStances.filter(s => s.gap_severity === "Large" || s.gap_severity === "Medium").slice(0, 8), [publicStances]);
  const signalsByCategory = useMemo(() => {
    const map: Record<string, typeof issueSignals> = {};
    for (const s of issueSignals) {
      const cat = s.issue_category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return map;
  }, [issueSignals]);

  // THE CALL banner color from integrity_score
  const callColor = report
    ? report.integrity_score < 40
      ? { bg: "bg-destructive/10 border-destructive/40", text: "text-destructive", label: "CRITICAL" }
      : report.integrity_score <= 70
      ? { bg: "bg-civic-yellow/10 border-civic-yellow/40", text: "text-civic-yellow", label: "WATCH" }
      : { bg: "bg-civic-green/10 border-civic-green/40", text: "text-civic-green", label: "FAIR" }
    : null;

  // Deduplicated donors from report
  const dedupedDonors = report?.political_donors ?? [];

  return (
    <div className="space-y-8">
      

      {/* ═══ 1. THE VERDICT (or Early Investigation) ═══ */}
      {isEarlyInvestigation ? (
        <EarlyInvestigationCard
          companyName={company.name}
          signalCount={issueSignals.length}
          hasExecutives={executives.length > 0}
          hasContracts={contracts.length > 0}
          hasPublicStances={publicStances.length > 0}
          hasEeocCases={eeocCases.length > 0}
        />
      ) : callColor && (
        <div className={cn("border-l-4 p-6 md:p-8", callColor.bg)}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-muted-foreground">THE CALL</p>
            <Badge className={cn("font-mono text-xs font-black tracking-wider", callColor.text, callColor.bg)}>
              {callColor.label}
            </Badge>
          </div>
          <h2 className={cn("text-xl md:text-2xl font-black tracking-tight", callColor.text)}>{verdict.text}</h2>
          {report && (
            <p className="mt-2 text-xs text-muted-foreground font-mono">
              Integrity Score: {report.integrity_score}/100
            </p>
          )}
          {company.jackye_insight && (
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed italic">"{company.jackye_insight}"</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Based on {issueSignals.length} signal{issueSignals.length !== 1 ? "s" : ""}, {eeocCases.length} enforcement action{eeocCases.length !== 1 ? "s" : ""}, and public spending records.
          </p>
        </div>
      )}

      {/* ═══ 2. COMPANY SUMMARY ═══ */}
      <section>
        <SectionDivider number={1} icon={Building2} title="Company Summary" subtitle="What is visible in the public record" />
        <div className="pl-11">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="text-xs font-mono">{company.industry}</Badge>
            <Badge variant="outline" className="text-xs font-mono">{company.state}</Badge>
            {company.employee_count && <Badge variant="outline" className="text-xs font-mono">{company.employee_count} employees</Badge>}
            {company.is_publicly_traded && <Badge variant="outline" className="text-xs font-mono">Publicly Traded</Badge>}
          </div>
          {company.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
          )}
        </div>
      </section>

      {/* ═══ 3. WHAT THEY SAY ═══ */}
      {publicStances.length > 0 && (
        <section>
          <SectionDivider number={2} icon={Megaphone} title="Public Positioning" subtitle="What they have stated publicly" />
          <div className="pl-11 space-y-2">
            {publicStances.slice(0, 8).map((s, i) => (
              <div key={i} className="p-3 border-l-2 border-muted-foreground/20 bg-muted/5">
                <div className="flex items-center gap-2 mb-1">
                  {s.issue_category && <Badge variant="outline" className="text-xs">{s.issue_category}</Badge>}
                </div>
                {s.public_position && (
                  <p className="text-sm text-foreground italic">"{s.public_position}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 4. WHAT THEY DO ═══ */}
      <section>
        <SectionDivider number={3} icon={DollarSign} title="Spending Record" subtitle="Where the money goes, based on public filings" />
        <div className="pl-11">
          {report && (
            <SpendingRecordTable
              metrics={report.spending_record}
              effectiveTaxRate={company.effective_tax_rate}
              companyName={company.name}
              companySlug={company.slug}
            />
          )}

          {/* Active signals by category — interactive expandable list */}
          {Object.keys(signalsByCategory).length > 0 && (
            <ActiveSignalsPanel signalsByCategory={signalsByCategory} />
          )}
        </div>
      </section>

      {/* ═══ 5. INTEGRITY GAP ═══ */}
      {gapStances.length > 0 && (
        <section>
          <SectionDivider number={4} icon={Eye} title="Stance-Record Gap" subtitle="Where public positioning and documented activity diverge" />
          <div className="pl-11 space-y-3">
            {gapStances.map((s, i) => (
              <div key={i} className={cn(
                "p-3 border-l-2",
                s.gap_severity === "Large" ? "border-destructive/50 bg-destructive/5" : "border-civic-yellow/50 bg-civic-yellow/5"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn(
                    "text-xs font-mono",
                    s.gap_severity === "Large" ? "border-destructive/50 text-destructive" : "border-civic-yellow/50 text-civic-yellow"
                  )}>
                    {s.gap_severity} Gap
                  </Badge>
                  <span className="text-xs text-muted-foreground">{s.issue_category}</span>
                </div>
                {s.public_position && <p className="text-sm text-foreground mb-1"><span className="font-medium">They say:</span> "{s.public_position}"</p>}
                {s.reality_check && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Records show:</span> {s.reality_check}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 6. LABOR IMPACT ═══ */}
      {eeocCases.length > 0 && (
        <section>
          <SectionDivider number={5} icon={Scale} title="Enforcement Record" subtitle="Formal actions and complaints documented in public records" />
          <div className="pl-11">
            <EEOCCaseAlert cases={eeocCases as any} />
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed italic">
              An enforcement action means a formal complaint was investigated. A pattern across multiple filings is more meaningful than a single filing.
            </p>
          </div>
        </section>
      )}

      {/* ═══ 7. SAFETY & WORKFORCE RISK ═══ */}
      <section>
        <SectionDivider number={6} icon={Users} title="Workforce Signals" subtitle="Demographics, stability, and hiring patterns" />
        <div className="pl-11">
          <WorkforceDemographicsLayer companyId={company.id} companyName={company.name} />
        </div>
      </section>

      {/* ═══ 8. POLITICAL & POLICY ALIGNMENT ═══ */}
      <section>
        <SectionDivider number={7} icon={Megaphone} title="Political Activity" subtitle="PAC spending, lobbying, and executive contributions" />
        <div className="pl-11 space-y-4">
          {dedupedDonors.length > 0 && (
            <DonorSignalsPanel donors={dedupedDonors} />
          )}
          <PoliticalGivingCard companyId={company.id} companyName={company.name} companySlug={company.slug} />
        </div>
      </section>

      {/* ═══ 9. WHAT THEY FUND & SUPPORT ═══ */}
      <section>
        <SectionDivider number={8} icon={Heart} title="Institutional Affiliations" subtitle="What they fund, support, and are connected to" />
        <div className="pl-11 space-y-4">
          <ExecutiveGivingSection companyId={company.id} companyName={company.name} companySlug={company.slug} />
          <InstitutionalDNACard companyId={company.id} companyName={company.name} />
          <PolicyScoreCard companyId={company.id} companyName={company.name} />
          <HighRiskConnectionCard companyId={company.id} companyName={company.name} />
        </div>
      </section>

      {/* ═══ 10. WHAT THIS MEANS FOR YOU ═══ */}
      <section>
        <SectionDivider number={9} icon={Shield} title="What This Means for You" subtitle="How these patterns relate to what you care about" />
        <div className="pl-11 space-y-4">
          <ValuesAlignmentSection
            companyName={company.name}
            issueSignals={issueSignals}
            publicStances={publicStances}
            eeocCount={eeocCases.length}
            lobbyingSpend={company.lobbying_spend ?? 0}
            pacSpending={company.total_pac_spending ?? 0}
          />
          <Link
            to={`/alignment/${company.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <ShieldAlert className="w-4 h-4" />
            View Full Alignment Report
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══ 11. THE CALL (hidden during early investigation) ═══ */}
      {!isEarlyInvestigation && (
        <RecommendationCard
          redFlagCount={verdict.redFlagCount}
          gapCount={gapStances.length}
          eeocCount={eeocCases.length}
          signalCount={issueSignals.length}
          hasValuesConflicts={false}
          companyName={company.name}
        />
      )}


      {/* Interview questions moved to HardInterviewQuestions — rendered outside paywall */}

      {/* ── AI ANALYSIS NOTICE ── */}
      <p className="text-[10px] text-muted-foreground/60 text-center font-mono tracking-wider uppercase pt-4">
        Based on public records · Not legal or career advice · Review the evidence and decide what matters to you
      </p>
    </div>
  );
}

/* ─── Action items ─── */
function ActionItem({ type, text }: { type: "watch" | "check" | "ask"; text: string }) {
  const config = {
    watch: { icon: Eye, label: "WATCH", color: "text-civic-yellow" },
    check: { icon: CheckCircle2, label: "CHECK", color: "text-civic-blue" },
    ask: { icon: MessageSquare, label: "ASK", color: "text-civic-green" },
  };
  const { icon: Icon, label, color } = config[type];
  return (
    <div className="flex items-start gap-3 p-3 bg-background/40 border border-border/20">
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className={cn("font-mono text-[10px] font-bold tracking-wider", color)}>{label}</span>
      </div>
      <p className="text-sm text-foreground leading-snug">{text}</p>
    </div>
  );
}
