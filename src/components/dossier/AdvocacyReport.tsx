import { useMemo, useState } from "react";
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
import type { SpendingMetric, DonorProfile } from "@/types/ReportSchema";

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

/* ─── CEO Memo Decoder ─── */
const DECODER_MAP: Record<string, string> = {
  "strategic reallocation": "Budget is being redirected. Some teams will feel it.",
  "modernization": "Often means automation is replacing certain roles.",
  "restructuring": "Organizational changes. Could mean layoffs, reorgs, or both.",
  "right-sizing": "Headcount reduction, described differently.",
  "operational efficiency": "Doing more with fewer people.",
  "people first": "Worth watching what follows this phrase.",
  "organizational simplification": "Management layers are being removed.",
  "workforce optimization": "Headcount reduction by another name.",
  "transformation": "Large-scale change. Details tend to emerge slowly.",
  "synergies": "Post-merger consolidation. Usually includes job cuts.",
  "realignment": "Team structures may change significantly.",
};

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

/* ─── Main Component ─── */
export function AdvocacyReport({ company, executives = [], contracts = [], issueSignals = [], publicStances = [], eeocCases = [] }: AdvocacyReportProps) {
  const [decoderOpen, setDecoderOpen] = useState(false);
  

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
            />
          )}

          {/* Active signals by category with View Receipt buttons */}
          {Object.keys(signalsByCategory).length > 0 && (
            <div className="mt-5 pt-5 border-t border-border/30">
              <p className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase mb-3">Active Signals</p>
              <div className="space-y-2">
                {Object.entries(signalsByCategory).slice(0, 6).map(([cat, signals]) => {
                  const firstSourceUrl = (signals.find((sig: any) => sig.source_url) as any)?.source_url ?? (signals[0] as any).source_url;
                  return (
                    <div key={cat} className={cn(
                      "flex items-start gap-3 p-3 border-l-2",
                      signals.length > 3 ? "border-destructive/50 bg-destructive/5" : "border-civic-yellow/50 bg-civic-yellow/5"
                    )}>
                      <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", signals.length > 3 ? "text-destructive" : "text-civic-yellow")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{cat}</p>
                        <p className="text-xs text-muted-foreground">{signals.length} signal{signals.length > 1 ? "s" : ""} — {signals[0].description?.slice(0, 120)}</p>
                      </div>
                      {firstSourceUrl && (
                        <a href={firstSourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                            <ExternalLink className="w-3 h-3" /> View Receipt
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
            <div>
              <p className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase mb-2">Top Political Donors in Leadership</p>
              <div className="space-y-2">
                {dedupedDonors.slice(0, 5).map((donor, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/10 border border-border/20">
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
                      <a href={donor.raw_fec_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                          <ExternalLink className="w-3 h-3" /> View Receipt
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

      {/* ═══ 12. CEO MEMO DECODER (collapsed) ═══ */}
      <div className="border border-border/30">
        <button
          onClick={() => setDecoderOpen(!decoderOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">CEO Memo Decoder</p>
              <p className="text-xs text-muted-foreground">What corporate language actually means</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", decoderOpen && "rotate-180")} />
        </button>
        {decoderOpen && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(DECODER_MAP).map(([phrase, meaning]) => (
                <div key={phrase} className="flex items-start gap-2 p-2.5 bg-muted/10 border border-border/15">
                  <MinusCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground capitalize">"{phrase}"</p>
                    <p className="text-xs text-muted-foreground leading-snug">{meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
