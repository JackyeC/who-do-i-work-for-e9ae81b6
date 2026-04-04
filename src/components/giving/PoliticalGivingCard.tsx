import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CauseTag, getCauseTag } from "./CauseTag";
import { GivingShareRow } from "./GivingShareRow";
import { ExternalLink, ChevronDown, Building2, Link2, ShieldAlert, ArrowRight, User, DollarSign, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface PoliticalGivingCardProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

/* ─── Types ─── */
interface Candidate {
  id: string;
  name: string;
  party: string;
  amount: number;
  donation_type: string;
  state: string;
  district: string | null;
  flagged: boolean;
  flag_reason: string | null;
}

/* ─── Institutional Links Panel ─── */
function InstitutionalLinksPanel({ links, causes }: { links: any[]; causes: Record<string, string> }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-border/40 bg-card p-5">
      <h4 className="text-sm font-semibold text-foreground mb-3">Institutional Links</h4>
      <div className="space-y-2">
        {links.slice(0, 6).map((link: any, i: number) => {
          const causeLabel = causes[link.institution_name];
          const isExpanded = expandedIdx === i;
          const hasDetail = link.link_description || link.evidence_url || causeLabel;

          return (
            <div key={i}>
              {hasDetail ? (
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className={cn(
                    "w-full flex items-start gap-3 py-2.5 px-3 rounded-lg text-left transition-colors cursor-pointer border",
                    isExpanded
                      ? "bg-primary/10 border-primary/20"
                      : "bg-transparent border-border/20 hover:bg-primary/5 hover:border-primary/15"
                  )}
                >
                  <Building2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{link.institution_name}</span>
                      {causeLabel && <CauseTag {...getCauseTag(causeLabel)} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {link.institution_category || link.link_type || "Affiliated organization"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-primary">{isExpanded ? "Hide" : "Details"}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-primary transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </button>
              ) : (
                <div className="flex items-start gap-3 py-2.5 px-3 border-b border-border/10 last:border-0">
                  <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{link.institution_name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.institution_category || "Affiliated"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">Summary only</span>
                </div>
              )}

              {isExpanded && hasDetail && (
                <div className="ml-5 border-l border-border/30 pl-4 py-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {link.link_description && (
                    <div className="flex items-start gap-2 p-2.5 rounded bg-muted/30 border border-border/20">
                      <Link2 className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Relationship</p>
                        <p className="text-xs text-muted-foreground">{link.link_description}</p>
                      </div>
                    </div>
                  )}
                  {causeLabel && (
                    <div className="flex items-start gap-2 p-2.5 rounded bg-muted/30 border border-border/20">
                      <ShieldAlert className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Associated Cause</p>
                        <p className="text-xs text-muted-foreground">{causeLabel}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {link.evidence_source || "Public Filing"} · {link.confidence === "high" ? "Verified ✓" : "Cross-Referenced"}
                    </span>
                    {link.evidence_url && (
                      <a
                        href={link.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
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

/* ─── Interpretation logic ─── */
function getContributionInterpretation(candidates: Candidate[], totalPac: number): string {
  if (candidates.length === 0 && totalPac === 0) {
    return "No political contributions found in public records. This could mean the company doesn't have a PAC, contributions are below the $200 federal disclosure threshold, or giving happens through channels we haven't indexed yet.";
  }
  if (candidates.length === 1) {
    const c = candidates[0];
    const amount = c.amount;
    if (amount < 1000) {
      return "This appears to be an isolated, small contribution. There is not enough data to determine a consistent political pattern. One data point is not a strategy — but it's still on the record.";
    }
    return `A single contribution of this size to a specific ${c.party} recipient is notable but not conclusive. It may reflect personal alignment of a PAC manager or a one-time decision. Watch for additional filings.`;
  }

  const parties = new Set(candidates.map(c => c.party));
  const totalAmount = candidates.reduce((s, c) => s + c.amount, 0);
  const flaggedCount = candidates.filter(c => c.flagged).length;

  if (parties.size === 1) {
    return `All ${candidates.length} contributions went to ${[...parties][0]} recipients, totaling ${formatCurrency(totalAmount)}. This suggests a clear partisan pattern in PAC giving. If political alignment matters to you, this is a strong signal.`;
  }
  if (flaggedCount > 0) {
    return `${candidates.length} contributions across ${parties.size} parties, with ${flaggedCount} flagged record${flaggedCount > 1 ? "s" : ""}. The flagged contributions may involve recipients with controversial voting records or policy positions. Worth a closer look.`;
  }
  return `${candidates.length} contributions across ${parties.size} parties totaling ${formatCurrency(totalAmount)}. This suggests a hedging strategy — giving to both sides — which is common in corporate PACs. The question is who gets more and why.`;
}

const PARTY_COLORS: Record<string, string> = {
  Democrat: "#378ADD",
  Republican: "#E24B4A",
  democratic: "#378ADD",
  republican: "#E24B4A",
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function PoliticalGivingCard({ companyId, companyName, companySlug }: PoliticalGivingCardProps) {
  const { data } = useQuery({
    queryKey: ["political-giving-company", companyId],
    queryFn: async () => {
      const [partyRes, companyRes, instRes, candidateRes] = await Promise.all([
        supabase.from("company_party_breakdown").select("party, amount, color").eq("company_id", companyId),
        supabase.from("companies").select("total_pac_spending, lobbying_spend").eq("id", companyId).single(),
        (supabase as any).from("institutional_alignment_signals").select("institution_name, institution_category, link_description, evidence_source, evidence_url, confidence").eq("company_id", companyId),
        supabase.from("company_candidates").select("*").eq("company_id", companyId).order("amount", { ascending: false }),
      ]);
      return {
        partyBreakdown: partyRes.data || [],
        company: companyRes.data,
        institutionalLinks: instRes.data || [],
        candidates: (candidateRes.data || []) as Candidate[],
      };
    },
    enabled: !!companyId,
  });

  if (!data) return null;

  const { partyBreakdown, company, institutionalLinks, candidates } = data;
  const totalPac = company?.total_pac_spending || 0;
  const lobbyingSpend = company?.lobbying_spend || 0;

  // Calculate party percentages
  const demAmount = partyBreakdown.filter((p: any) => p.party?.toLowerCase().includes("democrat")).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const repAmount = partyBreakdown.filter((p: any) => p.party?.toLowerCase().includes("republican")).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const otherAmount = Math.max(0, totalPac - demAmount - repAmount);
  const total = demAmount + repAmount + otherAmount || 1;
  const demPct = (demAmount / total) * 100;
  const repPct = (repAmount / total) * 100;
  const otherPct = (otherAmount / total) * 100;

  const INSTITUTION_CAUSES: Record<string, string> = {
    "Heritage Foundation": "Project 2025",
    "Alliance Defending Freedom": "Anti-LGBTQ+",
    "Federalist Society": "Project 2025",
    "Center for American Progress": "Labor / pro-worker",
    "Human Rights Campaign": "Voting rights — supportive",
    "Sierra Club": "Climate / clean energy",
    "Chamber of Commerce": "Labor / anti-union",
    "ALEC": "Voting restrictions",
  };

  const plainText = `${companyName} Political Giving\nPAC spend: ${formatCurrency(totalPac)} (${Math.round(repPct)}% R · ${Math.round(demPct)}% D)\nLobbying spend: ${formatCurrency(lobbyingSpend)}\nInstitutional links: ${institutionalLinks.slice(0, 3).map((l: any) => l.institution_name).join(" · ")}\nSource: FEC, LDA.gov, OpenSecrets · wdiwf.jackyeclayton.com`;

  const displayCandidates = candidates.slice(0, candidates.length === 1 ? 1 : 3);
  const interpretation = getContributionInterpretation(candidates, totalPac);

  return (
    <div className="space-y-6" id={`giving-${companySlug}`}>
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Political Giving & Influence</h3>
        <p className="text-xs text-muted-foreground">
          Sourced from FEC filings, Senate LDA disclosures, and OpenSecrets. All figures represent publicly disclosed activity.
        </p>
      </div>

      {/* ═══ INDIVIDUAL CONTRIBUTIONS — DATA FIRST ═══ */}
      <div className="rounded-xl border border-border/40 bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">Political Contributions</h4>
          <Badge variant="outline" className="text-[10px] font-mono">
            {candidates.length} record{candidates.length !== 1 ? "s" : ""} found
          </Badge>
        </div>

        {displayCandidates.length > 0 ? (
          <div className="space-y-2 mb-4">
            {displayCandidates.map((c) => {
              const partyColor = PARTY_COLORS[c.party] ?? PARTY_COLORS[c.party.toLowerCase()] ?? "hsl(var(--muted-foreground))";
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    c.flagged
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border/30 bg-muted/10"
                  )}
                >
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: partyColor, backgroundColor: `${partyColor}15` }}
                      >
                        {c.party}
                      </span>
                      {c.flagged && (
                        <span className="text-[10px] text-destructive flex items-center gap-0.5">
                          <Flag className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-foreground font-medium">{formatCurrency(c.amount)}</span>
                      </span>
                      <span>{c.state}{c.district ? `, District ${c.district}` : ""}</span>
                      <span className="capitalize">{c.donation_type.replace(/_/g, " ")}</span>
                    </div>
                    {c.flagged && c.flag_reason && (
                      <p className="text-[10px] text-destructive/80 mt-1">{c.flag_reason}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {candidates.length > 3 && (
              <a
                href={`https://www.fec.gov/data/receipts/?data_type=processed&committee_name=${encodeURIComponent(companyName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex items-center gap-1 pt-1"
              >
                View all {candidates.length} contributions on FEC.gov <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-4">
            No individual contribution records found in public filings. This may mean contributions are below the $200 federal disclosure threshold or routed through other channels.
          </p>
        )}

        {/* Interpretation — AFTER the data */}
        <div className="border-l-2 border-primary/40 pl-3 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-1">What this suggests</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{interpretation}</p>
        </div>
      </div>

      {/* ═══ PAC SPENDING AGGREGATE ═══ */}
      <a
        href={`https://www.fec.gov/data/receipts/?data_type=processed&committee_name=${encodeURIComponent(companyName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl border border-border/40 bg-card p-5 hover:border-primary/30 hover:bg-primary/[0.03] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">PAC Spending</h4>
          <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            View on FEC.gov <ExternalLink className="w-3 h-3" />
          </span>
        </div>
        {totalPac > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Total PAC spend: <span className="text-foreground font-medium">{formatCurrency(totalPac)}</span>
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
              {demPct > 0 && <div style={{ width: `${demPct}%`, background: "#378ADD" }} />}
              {repPct > 0 && <div style={{ width: `${repPct}%`, background: "#E24B4A" }} />}
              {otherPct > 0 && <div style={{ width: `${otherPct}%`, background: "#888780" }} />}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              {demAmount > 0 && <span style={{ color: "#378ADD" }}>Democratic: {formatCurrency(demAmount)}</span>}
              {repAmount > 0 && <span style={{ color: "#E24B4A" }}>Republican: {formatCurrency(repAmount)}</span>}
              {otherAmount > 0 && <span style={{ color: "#888780" }}>Non-partisan: {formatCurrency(otherAmount)}</span>}
            </div>
            <p className="text-[10px] text-primary mt-3 flex items-center gap-1 font-medium group-hover:underline">
              Show me the receipts <ArrowRight className="w-3 h-3" />
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No PAC spending on record.</p>
        )}
      </a>

      {/* ═══ LOBBYING ═══ */}
      <a
        href={`https://lda.senate.gov/filings/public/filing/search/?registrant=${encodeURIComponent(companyName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl border border-border/40 bg-card p-5 hover:border-primary/30 hover:bg-primary/[0.03] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">Lobbying Spend</h4>
          <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            View on LDA.gov <ExternalLink className="w-3 h-3" />
          </span>
        </div>
        {lobbyingSpend > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-1">
              Annual lobbying: <span className="text-foreground font-medium">{formatCurrency(lobbyingSpend)}</span>
            </p>
            <p className="text-[10px] text-primary mt-3 flex items-center gap-1 font-medium group-hover:underline">
              See the full pattern <ArrowRight className="w-3 h-3" />
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No lobbying spend on record.</p>
        )}
      </a>

      {/* ═══ INSTITUTIONAL LINKS ═══ */}
      {institutionalLinks.length > 0 && (
        <InstitutionalLinksPanel links={institutionalLinks} causes={INSTITUTION_CAUSES} />
      )}

      <GivingShareRow
        permalink={`https://wdiwf.jackyeclayton.com/dossier/${companySlug}#giving-${companySlug}`}
        plainText={plainText}
        tweetText={`${companyName} PAC spend: ${formatCurrency(totalPac)} (${Math.round(repPct)}% R · ${Math.round(demPct)}% D). Public FEC record. via @wdiwf`}
        companySlug={companySlug}
      />

      {/* Legal footer */}
      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/20">
        Individual donation data sourced from FEC public records pursuant to 52 U.S.C. §30104. Contributions over $200 are required by law to be publicly disclosed. Cause classifications are based on publicly available voting records, congressional scorecards, and watchdog organization ratings (HRC, LCV, Brennan Center, AFL-CIO). This data reflects personal giving and does not represent company policy. Who Do I Work For does not make character assessments or political endorsements. We connect the dots — you make the call.
      </p>
    </div>
  );
}
