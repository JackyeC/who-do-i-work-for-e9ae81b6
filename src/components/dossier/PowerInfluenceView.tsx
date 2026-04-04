import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, Zap, Crown,
  ChevronDown, ChevronRight, Flag, User, Briefcase,
  Shield, GitMerge, ExternalLink, Search,
  Megaphone, BarChart3, Eye, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceRecord } from "@/components/dossier/EmployerReportDrawer";
import {
  resolveEntities,
  type RawPersonRecord,
  type ResolvedEntity,
  type MergeConfidence,
} from "@/lib/entity-resolution";

/* ─── Types ─── */
interface Candidate {
  name: string;
  party: string;
  amount: number;
  donation_type: string;
  state: string;
  district: string | null;
  flagged: boolean;
  flag_reason: string | null;
}

interface Executive {
  id?: string;
  name: string;
  title: string;
  total_donations: number;
  photo_url?: string | null;
  verification_status?: string | null;
  departed_at?: string | null;
}

interface BoardMember {
  id?: string;
  name: string;
  title: string;
  is_independent?: boolean | null;
  departed_at?: string | null;
  verification_status?: string | null;
  committees?: string[] | null;
  previous_company?: string | null;
  start_year?: number | null;
}

interface PartyRow {
  party: string;
  amount: number;
}

interface Props {
  companyName: string;
  companyId: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  candidates: Candidate[];
  executives: Executive[];
  boardMembers: BoardMember[];
  partyBreakdown: PartyRow[];
  evidenceRecords: EvidenceRecord[];
}

/* ─── Helpers ─── */
function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

type InfluenceTag = "Active Contributor" | "High Influence" | "No public activity" | "Independent";

function getLeaderTag(entity: ResolvedEntity): InfluenceTag {
  if (entity.totalDonations >= 10_000) return "High Influence";
  if (entity.totalDonations > 0) return "Active Contributor";
  if (entity.source === "board" && entity.is_independent) return "Independent";
  return "No public activity";
}

const TAG_STYLES: Record<InfluenceTag, string> = {
  "High Influence": "border-destructive/30 text-destructive bg-destructive/5",
  "Active Contributor": "border-primary/30 text-primary bg-primary/5",
  "Independent": "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]",
  "No public activity": "border-muted-foreground/30 text-muted-foreground",
};

const CONFIDENCE_STYLES: Record<MergeConfidence, { label: string; className: string }> = {
  high: { label: "High confidence match", className: "text-[hsl(var(--civic-green))]" },
  medium: { label: "Medium confidence match", className: "text-[hsl(var(--civic-yellow))]" },
  low: { label: "Low confidence — review manually", className: "text-destructive" },
};

/* ─── Candidate dedup ─── */
function deduplicateCandidates(candidates: Candidate[]) {
  const map = new Map<string, { base: Candidate; totalAmount: number; count: number }>();
  for (const c of candidates) {
    const key = c.name.toUpperCase().replace(/\s+(JR|SR|III|II|IV)\.?$/i, "").replace(/,/g, "").trim();
    const existing = map.get(key);
    if (existing) {
      existing.totalAmount += c.amount;
      existing.count++;
      if (c.flagged) existing.base.flagged = true;
    } else {
      map.set(key, { base: { ...c }, totalAmount: c.amount, count: 1 });
    }
  }
  return [...map.values()]
    .map(({ base, totalAmount, count }) => ({ ...base, totalAmount, count }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/* ─── Build input records for resolver ─── */
function buildInputRecords(execs: Executive[], board: BoardMember[]): RawPersonRecord[] {
  const records: RawPersonRecord[] = [];
  for (const e of execs) {
    records.push({
      id: e.id, name: e.name, title: e.title, donations: e.total_donations || 0,
      source: "executive", photo_url: e.photo_url, verification_status: e.verification_status, departed_at: e.departed_at,
    });
  }
  for (const b of board) {
    records.push({
      id: b.id, name: b.name, title: b.title, donations: 0, source: "board",
      is_independent: !!b.is_independent, committees: b.committees || undefined,
      verification_status: b.verification_status, departed_at: b.departed_at,
    });
  }
  return records;
}

/* ─── Pattern Detection ─── */
type PowerPattern = "centralized" | "distributed" | "passive";

function detectPowerPattern(entities: ResolvedEntity[], totalSpend: number) {
  const activeContributors = entities.filter(e => e.totalDonations > 0);
  const totalLeaderDonations = activeContributors.reduce((s, e) => s + e.totalDonations, 0);
  const topDonor = activeContributors[0];
  const topShare = totalLeaderDonations > 0 && topDonor ? topDonor.totalDonations / totalLeaderDonations : 0;

  const flags: string[] = [];
  let pattern: PowerPattern = "passive";
  if (activeContributors.length >= 3) {
    pattern = topShare > 0.5 ? "centralized" : "distributed";
  } else if (activeContributors.length >= 1) {
    pattern = "centralized";
  }

  if (activeContributors.length >= 3) flags.push("High executive participation");
  else if (activeContributors.length >= 1) flags.push("Executive-level giving detected");

  if (pattern === "centralized" && topDonor) {
    flags.push(`Concentrated giving — ${topDonor.displayName} accounts for ${Math.round(topShare * 100)}%`);
  } else if (pattern === "distributed") {
    flags.push("Distributed influence across multiple actors");
  }

  if (totalSpend > 5_000_000) flags.push("Financially significant political engagement");
  else if (totalSpend > 1_000_000) flags.push("Active political engagement");

  if (activeContributors.length === 0 && totalSpend === 0) {
    flags.push("No public political activity detected");
  }

  const mergedCount = entities.filter(e => e.mergedRecords.length > 1).length;
  if (mergedCount > 0) {
    flags.push(`${mergedCount} duplicate identit${mergedCount === 1 ? "y" : "ies"} resolved`);
  }

  let narrative = "";
  if (pattern === "distributed") {
    narrative = `Political activity is distributed across ${activeContributors.length} executives and board members, rather than centralized in a single leader. This suggests influence is embedded across leadership, not driven by one voice.`;
  } else if (pattern === "centralized" && topDonor) {
    narrative = `Political influence is concentrated around ${topDonor.displayName} (${topDonor.title}), who accounts for the majority of individual contributions. This means one person's priorities may disproportionately shape the company's political footprint.`;
  } else {
    narrative = `Leadership shows little to no individual political activity on public record. The company's political footprint — if any — is likely driven through corporate PAC channels rather than personal engagement by executives.`;
  }

  let insight = "";
  if (pattern === "distributed" && totalSpend > 1_000_000) {
    insight = "Because multiple senior leaders are financially engaged in political activity, decision-making may reflect a broader leadership alignment rather than a single executive agenda. If political alignment matters to you, this is a systemic signal — not a one-off.";
  } else if (pattern === "centralized") {
    insight = "Political engagement appears concentrated in one or two individuals. Their priorities may not reflect the broader leadership team. Look at who specifically is giving, and to whom, before drawing conclusions about the company's values.";
  } else if (totalSpend > 0) {
    insight = "Corporate-level spending exists, but individual leaders aren't driving it personally. This is common — but it also means the company's political activity may not reflect any one leader's personal convictions.";
  } else {
    insight = "No political spending signals detected. This could indicate genuine neutrality, or spending below federal disclosure thresholds. If corporate influence matters to you, look for other signals — lobbying, board connections, institutional links.";
  }

  return { pattern, flags, narrative, insight, topDonor, topShare, activeContributors };
}

/* ═══ COMPONENT ═══ */
export function PowerInfluenceView({
  companyName, companyId, totalPacSpending, lobbyingSpend,
  candidates, executives, boardMembers, partyBreakdown, evidenceRecords,
}: Props) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [showAllLeaders, setShowAllLeaders] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [expandedMerge, setExpandedMerge] = useState<string | null>(null);
  const [expandedSpending, setExpandedSpending] = useState<string | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);
  const [expandedParty, setExpandedParty] = useState(false);

  const deduped = useMemo(() => deduplicateCandidates(candidates), [candidates]);
  const inputRecords = useMemo(() => buildInputRecords(executives, boardMembers), [executives, boardMembers]);
  const entities = useMemo(() => resolveEntities(inputRecords), [inputRecords]);
  const taggedEntities = useMemo(() => entities.map(e => ({ ...e, tag: getLeaderTag(e) })), [entities]);
  const totalSpend = totalPacSpending + lobbyingSpend;

  const { flags, narrative, insight, pattern, topDonor, activeContributors } = useMemo(
    () => detectPowerPattern(entities, totalSpend), [entities, totalSpend]
  );

  const topInfluencers = useMemo(() => {
    const withDonations = taggedEntities.filter(e => e.totalDonations > 0);
    return (withDonations.length >= 3 ? withDonations : taggedEntities).slice(0, 5);
  }, [taggedEntities]);

  // Party distribution
  const demAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("democrat")).reduce((s, p) => s + (p.amount || 0), 0);
  const repAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("republican")).reduce((s, p) => s + (p.amount || 0), 0);
  const otherAmount = Math.max(0, totalPacSpending - demAmount - repAmount);
  const barTotal = demAmount + repAmount + otherAmount || 1;

  // Candidate breakdowns by party
  const demCandidates = deduped.filter(c => c.party?.toLowerCase().includes("democrat"));
  const repCandidates = deduped.filter(c => c.party?.toLowerCase().includes("republican"));

  const displayLeaders = showAllLeaders ? taggedEntities : taggedEntities.slice(0, 8);

  const impactKey = pattern === "centralized" ? "concentrated" : pattern === "distributed" ? "distributed" : "passive";

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Power & Influence</h2>
        <Badge variant="secondary" className="text-xs ml-auto">{entities.length} leaders identified</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* ═══ TAKEAWAY BANNER ═══ */}
        <div className="px-5 py-4 border-b border-border bg-primary/[0.03]">
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed font-medium">{narrative}</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* ═══ SPENDING OVERVIEW ═══ */}
          <Section icon={DollarSign} label="SPENDING OVERVIEW">
            <div className="grid grid-cols-2 gap-3">
              <ClickableStatBlock
                label="PAC Spending"
                value={totalPacSpending > 0 ? fmt(totalPacSpending) : "None"}
                isActive={expandedSpending === "pac"}
                hasDetail={totalPacSpending > 0}
                onClick={() => totalPacSpending > 0 && setExpandedSpending(expandedSpending === "pac" ? null : "pac")}
              />
              <ClickableStatBlock
                label="Lobbying"
                value={lobbyingSpend > 0 ? fmt(lobbyingSpend) : "None"}
                isActive={expandedSpending === "lobby"}
                hasDetail={lobbyingSpend > 0}
                onClick={() => lobbyingSpend > 0 && setExpandedSpending(expandedSpending === "lobby" ? null : "lobby")}
              />
            </div>

            {/* PAC drill-down — structured */}
            <AnimatePresence>
              {expandedSpending === "pac" && (
                <DrillPanel>
                  <DrillHeader title="PAC Spending Breakdown" sourceLabel="FEC.gov" sourceUrl="https://www.fec.gov/data/" sourceDescription="Federal Election Commission — official record of all federal campaign contributions and PAC activity." />

                  <DrillSection label="What we found">
                    <ul className="space-y-1">
                      <DrillBullet>{companyName}'s PAC has distributed {fmt(totalPacSpending)} across {deduped.length} recipient{deduped.length !== 1 ? "s" : ""} on record.</DrillBullet>
                      {demAmount > 0 && repAmount > 0 && (
                        <DrillBullet>Contributions span both parties: {Math.round((demAmount / barTotal) * 100)}% Democrat, {Math.round((repAmount / barTotal) * 100)}% Republican.</DrillBullet>
                      )}
                      {deduped.length > 0 && (
                        <DrillBullet>Top recipient: {deduped[0].name} ({fmt(deduped[0].totalAmount)}).</DrillBullet>
                      )}
                    </ul>
                  </DrillSection>

                  {deduped.length > 0 && (
                    <DrillSection label="Breakdown">
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {deduped.slice(0, 8).map((c, i) => {
                          const partyColor = c.party?.toLowerCase().includes("democrat") ? "#378ADD"
                            : c.party?.toLowerCase().includes("republican") ? "#E24B4A" : "hsl(var(--muted-foreground))";
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 py-1 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                                  style={{ color: partyColor, backgroundColor: `${partyColor}15` }}>
                                  {c.party?.charAt(0) || "?"}
                                </span>
                                <span className="text-foreground truncate">{c.name}</span>
                              </div>
                              <span className="font-medium text-foreground tabular-nums shrink-0">{fmt(c.totalAmount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </DrillSection>
                  )}

                  <DrillSection label="Pattern">
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {totalPacSpending > 1_000_000
                        ? `PAC spending at this level places ${companyName} among politically active companies. The distribution across recipients reveals which policy agendas leadership supports with real dollars.`
                        : `PAC activity is present but moderate. This suggests political engagement exists but isn't a primary channel of influence for ${companyName}.`}
                    </p>
                  </DrillSection>

                  <ImpactBlock
                    world="PAC contributions fund candidates and committees that shape labor law, tax policy, and industry regulation. The recipients and amounts reveal what leadership prioritizes when it puts money behind policy."
                    you="If your employer's PAC is funding candidates whose positions conflict with your values — on labor, healthcare, or regulation — that's worth knowing before you sign."
                  />

                  <Link to="/follow-the-money" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1 group/cta cursor-pointer">
                    <BarChart3 className="w-3 h-3" /> View full records <ChevronRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" />
                  </Link>
                </DrillPanel>
              )}
            </AnimatePresence>

            {/* Lobbying drill-down — structured */}
            <AnimatePresence>
              {expandedSpending === "lobby" && (
                <DrillPanel>
                  <DrillHeader title="Lobbying Activity" sourceLabel="OpenSecrets / LDA" sourceUrl="https://www.opensecrets.org/federal-lobbying" sourceDescription="Lobbying Disclosure Act filings — tracks payments to firms hired to influence federal legislation and rulemaking." />

                  <DrillSection label="What we found">
                    <ul className="space-y-1">
                      <DrillBullet>{companyName} has spent {fmt(lobbyingSpend)} on lobbying activity.</DrillBullet>
                      <DrillBullet>Status: {lobbyingSpend > 5_000_000 ? "Significant — top-tier political engagement" : lobbyingSpend > 1_000_000 ? "Active — meaningful policy influence" : "Moderate — present but not dominant"}.</DrillBullet>
                    </ul>
                  </DrillSection>

                  <DrillSection label="Pattern">
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {lobbyingSpend > 5_000_000
                        ? `Lobbying at this scale means ${companyName} is actively shaping the regulatory environment it operates in. Bills they support or oppose can directly affect working conditions, compensation, and industry standards.`
                        : `${companyName} engages in lobbying but at a level that suggests targeted rather than broad influence. They're likely focused on specific regulatory issues rather than sweeping policy agendas.`}
                    </p>
                  </DrillSection>

                  <ImpactBlock
                    world="Lobbying directly shapes the regulatory environment your employer operates in. Bills they support or oppose can affect working conditions, benefits, and industry standards."
                    you="If your employer is lobbying on labor, healthcare, or tax policy, those positions may directly affect your compensation and protections."
                  />
                </DrillPanel>
              )}
            </AnimatePresence>

            {/* Party bar — clickable */}
            {totalPacSpending > 0 && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setExpandedParty(!expandedParty)}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Party Allocation</span>
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Explore breakdown</span>
                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground ml-auto transition-transform", expandedParty && "rotate-180")} />
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {demAmount > 0 && <div style={{ width: `${(demAmount / barTotal) * 100}%`, background: "#378ADD" }} />}
                    {repAmount > 0 && <div style={{ width: `${(repAmount / barTotal) * 100}%`, background: "#E24B4A" }} />}
                    {otherAmount > 0 && <div style={{ width: `${(otherAmount / barTotal) * 100}%`, background: "hsl(var(--muted-foreground))" }} />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
                    {demAmount > 0 && <span style={{ color: "#378ADD" }}>Dem: {fmt(demAmount)} ({Math.round((demAmount / barTotal) * 100)}%)</span>}
                    {repAmount > 0 && <span style={{ color: "#E24B4A" }}>Rep: {fmt(repAmount)} ({Math.round((repAmount / barTotal) * 100)}%)</span>}
                    {otherAmount > 0 && <span className="text-muted-foreground">Other: {fmt(otherAmount)}</span>}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedParty && (
                    <DrillPanel>
                      <DrillHeader title="Party Distribution Detail" sourceLabel="FEC Individual Contributions" sourceUrl="https://www.fec.gov/data/receipts/individual-contributions/" sourceDescription="Federal Election Commission — individual contribution records filed by campaigns and committees." />

                      <DrillSection label="What we found">
                        <ul className="space-y-1">
                          {demAmount > 0 && <DrillBullet>{Math.round((demAmount / barTotal) * 100)}% of contributions ({fmt(demAmount)}) directed to {demCandidates.length} Democratic recipient{demCandidates.length !== 1 ? "s" : ""}.</DrillBullet>}
                          {repAmount > 0 && <DrillBullet>{Math.round((repAmount / barTotal) * 100)}% of contributions ({fmt(repAmount)}) directed to {repCandidates.length} Republican recipient{repCandidates.length !== 1 ? "s" : ""}.</DrillBullet>}
                        </ul>
                      </DrillSection>

                      <DrillSection label="Breakdown">
                        {demCandidates.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "#378ADD" }}>Democrat Recipients ({demCandidates.length})</p>
                            <div className="space-y-0.5 max-h-28 overflow-y-auto">
                              {demCandidates.slice(0, 5).map((c, i) => (
                                <div key={i} className="flex justify-between text-xs py-0.5">
                                  <span className="text-foreground/80 truncate">{c.name}</span>
                                  <span className="font-medium tabular-nums shrink-0">{fmt(c.totalAmount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {repCandidates.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "#E24B4A" }}>Republican Recipients ({repCandidates.length})</p>
                            <div className="space-y-0.5 max-h-28 overflow-y-auto">
                              {repCandidates.slice(0, 5).map((c, i) => (
                                <div key={i} className="flex justify-between text-xs py-0.5">
                                  <span className="text-foreground/80 truncate">{c.name}</span>
                                  <span className="font-medium tabular-nums shrink-0">{fmt(c.totalAmount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </DrillSection>

                      <ImpactBlock
                        world="Party allocation reveals which policy agendas leadership supports with real dollars. This can shape workplace policies, benefits, and industry regulation."
                        you="Look at party-level patterns: are contributions aligned with candidates who support worker protections, or candidates who prioritize deregulation?"
                      />
                    </DrillPanel>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Spending impact */}
            {totalSpend > 0 && (
              <ImpactBlock
                world="This level of political engagement can influence labor policies, regulation, and industry standards. That can shape job stability, worker protections, and how the company operates long-term."
                you="If you value transparency in how your employer engages with politics, look at the size and direction of this spending relative to the company's public values."
                className="mt-3"
              />
            )}
          </Section>

          {/* ═══ TOP INFLUENCERS — clickable profiles ═══ */}
          <Section icon={Crown} label="TOP INFLUENCERS">
            <div className="space-y-1">
              {topInfluencers.map((entity) => (
                <div key={entity.primaryId}>
                  <button
                    onClick={() => setSelectedLeader(selectedLeader === entity.primaryId ? null : entity.primaryId)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-all text-left group cursor-pointer border border-transparent hover:border-primary/10"
                  >
                    {entity.photo_url ? (
                      <img src={entity.photo_url} alt={entity.displayName} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {entity.source === "executive" ? <Briefcase className="w-4 h-4 text-muted-foreground" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{entity.displayName}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TAG_STYLES[entity.tag])}>{entity.tag}</Badge>
                        {entity.mergedRecords.length > 1 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-primary/20 text-primary/70">
                            <GitMerge className="w-2.5 h-2.5" />{entity.mergedRecords.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{entity.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entity.totalDonations > 0 && (
                        <span className="text-xs font-medium text-foreground tabular-nums">{fmt(entity.totalDonations)}</span>
                      )}
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">See full profile</span>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", selectedLeader === entity.primaryId && "rotate-90")} />
                    </div>
                  </button>

                  {/* ── Full profile drill-down (structured) ── */}
                  <AnimatePresence>
                    {selectedLeader === entity.primaryId && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="ml-12 rounded-lg border border-primary/20 bg-primary/[0.02] p-4 mb-2 space-y-4">
                          {/* Profile summary */}
                          <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Role" value={entity.source === "executive" ? "Executive" : "Board Member"} />
                            <MiniStat label="Total Contributions" value={entity.totalDonations > 0 ? fmt(entity.totalDonations) : "None on record"} />
                          </div>

                          {/* Where influence shows up */}
                          <DrillSection label="Where influence shows up">
                            <div className="space-y-2">
                              {entity.totalDonations > 0 && (
                                <div>
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Political Contributions</p>
                                  {entity.contributionCount > 1 && (
                                    <p className="text-xs text-muted-foreground mb-1">{entity.contributionCount} contribution records aggregated</p>
                                  )}
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {deduped.slice(0, 5).map((c, i) => {
                                      const partyColor = c.party?.toLowerCase().includes("democrat") ? "#378ADD"
                                        : c.party?.toLowerCase().includes("republican") ? "#E24B4A" : "hsl(var(--muted-foreground))";
                                      return (
                                        <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                                              style={{ color: partyColor, backgroundColor: `${partyColor}15` }}>
                                              {c.party?.charAt(0) || "?"}
                                            </span>
                                            <span className="text-foreground/80 truncate">{c.name}</span>
                                          </div>
                                          <span className="font-medium tabular-nums shrink-0">{fmt(c.totalAmount)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Related signals */}
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Related Signals</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className={cn("text-[10px]", TAG_STYLES[entity.tag])}>{entity.tag}</Badge>
                                  {entity.totalDonations > 20_000 && (
                                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Concentrated giving</Badge>
                                  )}
                                  {entity.mergedRecords.length > 1 && (
                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Multiple identities merged</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Committees */}
                              {entity.committees.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Committee Roles</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {entity.committees.map(c => (
                                      <Badge key={c} variant="secondary" className="text-xs gap-1"><Shield className="w-2.5 h-2.5" /> {c}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DrillSection>

                          {/* Influence pattern */}
                          <DrillSection label="Influence pattern">
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {entity.totalDonations >= 10_000
                                ? `${entity.displayName} is a significant individual contributor. At this level, their political priorities carry weight in shaping ${companyName}'s external influence.`
                                : entity.totalDonations > 0
                                ? `${entity.displayName} has made political contributions, though at a moderate level. Their engagement is notable but not dominant.`
                                : `${entity.displayName} has no political contributions on public record. Their influence operates through operational leadership rather than political spending.`}
                            </p>
                          </DrillSection>

                          <ImpactBlock
                            world={entity.totalDonations >= 10_000
                              ? "When a senior leader is a significant political contributor, their priorities can shape company lobbying positions, regulatory engagement, and institutional relationships."
                              : "Leadership decisions affect workplace culture, policy positions, and institutional direction regardless of personal political spending."}
                            you={entity.totalDonations >= 10_000
                              ? "If this leader's political priorities conflict with your values, consider how that might affect company direction, culture, and the regulatory environment you'd work in."
                              : "Consider how this person's operational role and influence might shape your day-to-day experience and the company's strategic direction."}
                          />

                          {/* Merged records transparency */}
                          {entity.mergedRecords.length > 1 && (
                            <div className="border-t border-border/30 pt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedMerge(expandedMerge === entity.primaryId ? null : entity.primaryId); }}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <GitMerge className="w-3 h-3" />
                                <span>View {entity.mergedRecords.length} merged records</span>
                                <span className={cn("text-[10px]", CONFIDENCE_STYLES[entity.mergeConfidence].className)}>
                                  ({CONFIDENCE_STYLES[entity.mergeConfidence].label})
                                </span>
                                <ChevronDown className={cn("w-3 h-3 transition-transform", expandedMerge === entity.primaryId && "rotate-180")} />
                              </button>
                              <AnimatePresence>
                                {expandedMerge === entity.primaryId && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                    <div className="mt-2 space-y-1.5 pl-5 border-l border-primary/10">
                                      {entity.mergedRecords.map((rec, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs py-1">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                              {rec.source === "executive" ? "Exec" : rec.source === "board" ? "Board" : "FEC"}
                                            </Badge>
                                            <span className="text-muted-foreground truncate">{rec.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{rec.title}</span>
                                            {rec.donations > 0 && <span className="text-foreground font-medium tabular-nums">{fmt(rec.donations)}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* CTAs */}
                          <div className="flex items-center gap-2 pt-1">
                            {entity.primaryId.length > 10 && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                                <Link to={`/leader/${entity.primaryId}`}><User className="w-3 h-3" /> Full Profile</Link>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                              <Link to="/follow-the-money"><BarChart3 className="w-3 h-3" /> See related signals</Link>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Influencer impact */}
            {activeContributors.length > 0 && (
              <ImpactBlock
                world={pattern === "centralized"
                  ? "When decision-making power and external influence are concentrated in one leader, company direction may reflect individual priorities more than collective leadership alignment."
                  : pattern === "distributed"
                  ? "Distributed political engagement across leadership suggests systemic alignment rather than individual initiative. Policy positions may reflect shared leadership consensus."
                  : "Minimal political activity may indicate genuine neutrality, or spending below disclosure thresholds. Other signals — lobbying, board connections — may reveal more."}
                you={pattern === "centralized"
                  ? "If you value shared leadership accountability, this concentration is something to look at closely before joining."
                  : pattern === "distributed"
                  ? "This pattern suggests the political stance is built into the culture, not just one person's preference. Consider whether that alignment matches yours."
                  : "Neutral political posture can be a positive signal if you prefer employers that stay out of politics. But verify through other lenses."}
                className="mt-3"
              />
            )}
          </Section>

          {/* ═══ FULL LEADERSHIP ROSTER ═══ */}
          {taggedEntities.length > 5 && (
            <Section icon={Users} label={`ALL LEADERSHIP (${taggedEntities.length})`}>
              <div className="space-y-1">
                {displayLeaders.map((entity) => (
                  <div key={entity.primaryId} className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLeader(selectedLeader === entity.primaryId ? null : entity.primaryId)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">{entity.source === "executive" ? "E" : "B"}</span>
                      <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">{entity.displayName}</span>
                      {entity.mergedRecords.length > 1 && (
                        <span className="text-[9px] text-primary/60 shrink-0"><GitMerge className="w-2.5 h-2.5 inline" /> {entity.mergedRecords.length}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{entity.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", TAG_STYLES[entity.tag])}>{entity.tag}</Badge>
                      {entity.totalDonations > 0 && (
                        <span className="text-[10px] font-medium text-foreground tabular-nums">{fmt(entity.totalDonations)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {taggedEntities.length > 8 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllLeaders(!showAllLeaders)}
                  className="w-full text-xs mt-2 gap-1 text-muted-foreground">
                  {showAllLeaders ? "Show fewer" : `View all ${taggedEntities.length} leaders`}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAllLeaders && "rotate-180")} />
                </Button>
              )}
            </Section>
          )}

          {/* ═══ PATTERN FLAGS — clickable ═══ */}
          <Section icon={Search} label="PATTERNS">
            <div className="space-y-2">
              {flags.map((flag, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedPattern(expandedPattern === i ? null : i)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left rounded-lg px-3 py-2 transition-all cursor-pointer border group",
                      expandedPattern === i
                        ? "border-primary/20 bg-primary/[0.03]"
                        : "border-transparent hover:border-primary/10 hover:bg-muted/30"
                    )}
                  >
                    <Badge variant="outline" className={cn(
                      "text-xs px-2.5 py-0.5 shrink-0",
                      flag.includes("High") || flag.includes("Concentrated")
                        ? "border-destructive/30 text-destructive bg-destructive/5"
                        : flag.includes("No public") ? "border-muted-foreground/30 text-muted-foreground"
                        : flag.includes("resolved") ? "border-primary/30 text-primary bg-primary/5"
                        : "border-primary/30 text-primary bg-primary/5"
                    )}>
                      {flag}
                    </Badge>
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto">Explore details</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", expandedPattern === i && "rotate-90")} />
                  </button>

                  <AnimatePresence>
                    {expandedPattern === i && (
                      <DrillPanel>
                        <DrillSection label="What's happening">
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {getPatternExplanation(flag, companyName, topDonor?.displayName)}
                          </p>
                        </DrillSection>

                        <ImpactBlock
                          world={getPatternWorldImpact(flag)}
                          you={getPatternPersonalImpact(flag)}
                        />

                        {(flag.includes("Concentrated") || flag.includes("High executive")) && (
                          <Link to="/follow-the-money" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline group/cta cursor-pointer">
                            <FileText className="w-3 h-3" /> View full records <ChevronRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </DrillPanel>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ HOW DECISIONS MAY BE SHAPED ═══ */}
          <div className="border-l-2 border-primary/40 pl-4 py-2">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-1">HOW DECISIONS MAY BE SHAPED</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{insight}</p>
          </div>

          {/* ═══ REFLECTION QUESTION ═══ */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-accent/50">
            <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              Does this change how you think about working here?
            </p>
          </div>
        </div>

        {/* ═══ CONTRIBUTION RECORDS — collapsible (Level 3) ═══ */}
        {deduped.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowAllRecords(!showAllRecords)}
              className="w-full flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
            >
              {showAllRecords ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="font-mono uppercase tracking-wider text-[10px]">
                {showAllRecords ? "Collapse" : "View"} all {deduped.length} contribution records
              </span>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto">Full data</span>
            </button>
            <AnimatePresence>
              {showAllRecords && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="px-5 pb-4 space-y-1.5 max-h-80 overflow-y-auto">
                    {deduped.map((c, i) => {
                      const partyColor = c.party?.toLowerCase().includes("democrat") ? "#378ADD"
                        : c.party?.toLowerCase().includes("republican") ? "#E24B4A" : "hsl(var(--muted-foreground))";
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ color: partyColor, backgroundColor: `${partyColor}15` }}>
                              {c.party?.charAt(0) || "?"}
                            </span>
                            <span className="text-xs text-foreground truncate">{c.name}</span>
                            {c.count > 1 && <span className="text-[10px] text-muted-foreground shrink-0">×{c.count}</span>}
                            {c.flagged && <Flag className="w-3 h-3 text-destructive shrink-0" />}
                          </div>
                          <span className="text-xs font-medium text-foreground tabular-nums shrink-0">{fmt(c.totalAmount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="px-5 py-3 border-t border-border/50 bg-muted/10">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Leadership data sourced from SEC proxy statements, public disclosures, and 8-K filings.
            Political contributions from FEC individual contribution records.
            Contributions shown are from individuals — not the company itself.
            {entities.some(e => e.mergedRecords.length > 1) && <> Entity resolution applied to merge duplicate identities. </>}
            <Link to="/request-correction" className="underline hover:text-primary transition-colors">Found an error? Report it →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */
function Section({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">{label}</span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

function ClickableStatBlock({ label, value, isActive, hasDetail, onClick }: {
  label: string; value: string; isActive: boolean; hasDetail: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-lg border text-left transition-all w-full",
        hasDetail ? "cursor-pointer hover:border-primary/30 hover:bg-primary/[0.03]" : "cursor-default opacity-70",
        isActive ? "border-primary/30 bg-primary/[0.03]" : "border-border/30 bg-muted/20"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {hasDetail && <span className="text-[9px] text-primary">{isActive ? "Close" : "View breakdown"}</span>}
      </div>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-muted/30 border border-border/20">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DrillPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
      <div className="mt-2 p-4 rounded-lg border border-primary/15 bg-primary/[0.02] space-y-3">
        {children}
      </div>
    </motion.div>
  );
}

function DrillHeader({ title, sourceLabel, sourceUrl, sourceDescription }: { title: string; sourceLabel: string; sourceUrl: string; sourceDescription?: string }) {
  const [showSourceInfo, setShowSourceInfo] = useState(false);
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); setShowSourceInfo(!showSourceInfo); }}
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
        >
          {sourceLabel} <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
      <AnimatePresence>
        {showSourceInfo && sourceDescription && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="mt-1.5 p-2 rounded bg-muted/40 border border-border/20 flex items-start gap-2">
              <Megaphone className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground leading-relaxed">{sourceDescription}</p>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer">
                  View source <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrillSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary/70 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function DrillBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
      <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0 mt-1.5" />
      <span>{children}</span>
    </li>
  );
}

function ImpactBlock({ world, you, className }: { world: string; you: string; className?: string }) {
  return (
    <div className={cn("space-y-2 border-l-2 border-primary/20 pl-3", className)}>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-primary/70 mb-0.5">What this means for the world of work</p>
        <p className="text-xs text-foreground/70 leading-relaxed">{world}</p>
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-primary/70 mb-0.5">What this means for you</p>
        <p className="text-xs text-foreground/70 leading-relaxed italic">{you}</p>
      </div>
    </div>
  );
}

/* ─── Pattern explanations ─── */
function getPatternExplanation(flag: string, companyName: string, topDonorName?: string): string {
  if (flag.includes("Concentrated giving") && topDonorName) {
    return `At ${companyName}, ${topDonorName} accounts for a dominant share of individual political contributions. This level of concentration means one leader's political priorities may carry outsized weight in how the company engages with policy and regulation.`;
  }
  if (flag.includes("High executive participation")) {
    return `Multiple executives at ${companyName} are actively making personal political contributions. This pattern suggests political engagement is embedded in leadership culture, not isolated to one individual.`;
  }
  if (flag.includes("Distributed influence")) {
    return `Political contributions are spread across multiple leaders at ${companyName}. This may reflect shared leadership alignment rather than a single agenda.`;
  }
  if (flag.includes("Financially significant")) {
    return `${companyName}'s combined political spending exceeds $5M, placing it among the more politically active companies in its industry. This level of engagement often correlates with active policy shaping.`;
  }
  if (flag.includes("Active political engagement")) {
    return `${companyName} has notable political spending, though not at the highest tier. This suggests meaningful engagement with policy without being among the top spenders.`;
  }
  if (flag.includes("resolved")) {
    return `Our entity resolution system identified and merged duplicate records for individuals who appeared under different name variations (e.g., middle initials, suffixes). This provides a more accurate picture of individual influence.`;
  }
  if (flag.includes("No public")) {
    return `No political contributions or activity were found in public records for ${companyName}'s leadership. This could indicate genuine neutrality or activity below federal disclosure thresholds.`;
  }
  return `This pattern was identified based on analysis of public records associated with ${companyName}.`;
}

function getPatternWorldImpact(flag: string): string {
  if (flag.includes("Concentrated")) return "Concentrated influence can mean company direction is shaped by one leader's priorities, affecting everything from policy lobbying to workplace culture.";
  if (flag.includes("High executive")) return "Broad executive political participation suggests the company's political posture is cultural, not incidental. This can influence industry regulation and labor policy.";
  if (flag.includes("Distributed")) return "Distributed giving suggests shared alignment across leadership. Policy positions are likely institutional, not personal.";
  if (flag.includes("Financially significant")) return "This level of spending can meaningfully influence legislative outcomes, regulatory decisions, and industry standards.";
  return "Patterns in political activity can signal how a company engages with regulation, labor policy, and industry standards.";
}

function getPatternPersonalImpact(flag: string): string {
  if (flag.includes("Concentrated")) return "If one person holds both operational and political influence, consider how that affects company culture, priorities, and stability if that leader departs.";
  if (flag.includes("High executive")) return "If political alignment matters to you, this is worth examining. The giving patterns reveal what leadership values beyond the company's public messaging.";
  if (flag.includes("Distributed")) return "This pattern means the political stance is built into the culture. Consider whether that alignment matches your own values.";
  if (flag.includes("Financially significant")) return "Companies with this level of political engagement are actively shaping their operating environment. That can be positive or negative depending on what they're supporting.";
  return "Consider how this pattern aligns with your values and what it might mean for your experience working here.";
}
