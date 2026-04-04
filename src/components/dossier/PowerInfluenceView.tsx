import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, Target, Zap, Crown,
  ChevronDown, ChevronRight, Flag, User, Briefcase,
  Shield, GitMerge,
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
      id: e.id,
      name: e.name,
      title: e.title,
      donations: e.total_donations || 0,
      source: "executive",
      photo_url: e.photo_url,
      verification_status: e.verification_status,
      departed_at: e.departed_at,
    });
  }

  for (const b of board) {
    records.push({
      id: b.id,
      name: b.name,
      title: b.title,
      donations: 0,
      source: "board",
      is_independent: !!b.is_independent,
      committees: b.committees || undefined,
      verification_status: b.verification_status,
      departed_at: b.departed_at,
    });
  }

  return records;
}

/* ─── Pattern Detection ─── */
type PowerPattern = "centralized" | "distributed" | "passive";

function detectPowerPattern(entities: ResolvedEntity[], totalSpend: number): {
  pattern: PowerPattern;
  flags: string[];
  narrative: string;
  insight: string;
} {
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

  // Count merged entities
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

  return { pattern, flags, narrative, insight };
}

/* ═══ COMPONENT ═══ */
export function PowerInfluenceView({
  companyName,
  companyId,
  totalPacSpending,
  lobbyingSpend,
  candidates,
  executives,
  boardMembers,
  partyBreakdown,
  evidenceRecords,
}: Props) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [showAllLeaders, setShowAllLeaders] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [expandedMerge, setExpandedMerge] = useState<string | null>(null);

  const deduped = useMemo(() => deduplicateCandidates(candidates), [candidates]);

  // Entity resolution: merge execs + board into resolved entities
  const inputRecords = useMemo(() => buildInputRecords(executives, boardMembers), [executives, boardMembers]);
  const entities = useMemo(() => resolveEntities(inputRecords), [inputRecords]);

  // Attach influence tags
  const taggedEntities = useMemo(() =>
    entities.map(e => ({ ...e, tag: getLeaderTag(e) })),
    [entities]
  );

  const totalSpend = totalPacSpending + lobbyingSpend;

  const { flags, narrative, insight } = useMemo(
    () => detectPowerPattern(entities, totalSpend),
    [entities, totalSpend]
  );

  const topInfluencers = useMemo(() => {
    const withDonations = taggedEntities.filter(e => e.totalDonations > 0);
    if (withDonations.length >= 3) return withDonations.slice(0, 5);
    return taggedEntities.slice(0, 5);
  }, [taggedEntities]);

  // Party distribution
  const demAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("democrat")).reduce((s, p) => s + (p.amount || 0), 0);
  const repAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("republican")).reduce((s, p) => s + (p.amount || 0), 0);
  const otherAmount = Math.max(0, totalPacSpending - demAmount - repAmount);
  const barTotal = demAmount + repAmount + otherAmount || 1;

  const displayLeaders = showAllLeaders ? taggedEntities : taggedEntities.slice(0, 8);

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
              <StatBlock label="PAC Spending" value={totalPacSpending > 0 ? fmt(totalPacSpending) : "None"} />
              <StatBlock label="Lobbying" value={lobbyingSpend > 0 ? fmt(lobbyingSpend) : "None"} />
            </div>
            {totalPacSpending > 0 && (
              <div className="mt-3 space-y-2">
                <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {demAmount > 0 && <div style={{ width: `${(demAmount / barTotal) * 100}%`, background: "#378ADD" }} />}
                  {repAmount > 0 && <div style={{ width: `${(repAmount / barTotal) * 100}%`, background: "#E24B4A" }} />}
                  {otherAmount > 0 && <div style={{ width: `${(otherAmount / barTotal) * 100}%`, background: "#888780" }} />}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {demAmount > 0 && <span style={{ color: "#378ADD" }}>Dem: {fmt(demAmount)} ({Math.round((demAmount / barTotal) * 100)}%)</span>}
                  {repAmount > 0 && <span style={{ color: "#E24B4A" }}>Rep: {fmt(repAmount)} ({Math.round((repAmount / barTotal) * 100)}%)</span>}
                  {otherAmount > 0 && (
                    <span style={{ color: "#888780" }}>
                      Other: {fmt(otherAmount)} — PACs, ballot measures, unclassified
                    </span>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* ═══ TOP INFLUENCERS ═══ */}
          <Section icon={Crown} label="TOP INFLUENCERS">
            <div className="space-y-1">
              {topInfluencers.map((entity) => (
                <div key={entity.primaryId}>
                  <button
                    onClick={() => setSelectedLeader(selectedLeader === entity.primaryId ? null : entity.primaryId)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
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
                        <span className="text-sm font-medium text-foreground truncate">{entity.displayName}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TAG_STYLES[entity.tag])}>
                          {entity.tag}
                        </Badge>
                        {entity.mergedRecords.length > 1 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-primary/20 text-primary/70">
                            <GitMerge className="w-2.5 h-2.5" />
                            {entity.mergedRecords.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{entity.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entity.totalDonations > 0 && (
                        <span className="text-xs font-medium text-foreground tabular-nums">{fmt(entity.totalDonations)}</span>
                      )}
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", selectedLeader === entity.primaryId && "rotate-90")} />
                    </div>
                  </button>

                  {/* DRILL-DOWN */}
                  <AnimatePresence>
                    {selectedLeader === entity.primaryId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-12 rounded-lg border border-primary/20 bg-primary/[0.02] p-4 mb-2 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <StatBlock label="Role" value={entity.source === "executive" ? "Executive" : "Board Member"} />
                            <StatBlock label="Total Contributions" value={entity.totalDonations > 0 ? fmt(entity.totalDonations) : "None on record"} />
                          </div>
                          {entity.contributionCount > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {entity.contributionCount} contribution record{entity.contributionCount !== 1 ? "s" : ""} aggregated
                            </p>
                          )}
                          {entity.committees.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {entity.committees.map(c => (
                                <Badge key={c} variant="secondary" className="text-xs gap-1">
                                  <Shield className="w-2.5 h-2.5" /> {c}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Merged records transparency */}
                          {entity.mergedRecords.length > 1 && (
                            <div className="border-t border-border/30 pt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedMerge(expandedMerge === entity.primaryId ? null : entity.primaryId); }}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
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
                                            {rec.donations > 0 && (
                                              <span className="text-foreground font-medium tabular-nums">{fmt(rec.donations)}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {entity.primaryId.length > 10 && (
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                              <Link to={`/leader/${entity.primaryId}`}><User className="w-3 h-3" /> Full Profile</Link>
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ FULL LEADERSHIP ROSTER ═══ */}
          {taggedEntities.length > 5 && (
            <Section icon={Users} label={`ALL LEADERSHIP (${taggedEntities.length})`}>
              <div className="space-y-1">
                {displayLeaders.map((entity) => (
                  <div key={entity.primaryId} className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">{entity.source === "executive" ? "E" : "B"}</span>
                      <span className="text-xs text-foreground truncate">{entity.displayName}</span>
                      {entity.mergedRecords.length > 1 && (
                        <span className="text-[9px] text-primary/60 shrink-0">
                          <GitMerge className="w-2.5 h-2.5 inline" /> {entity.mergedRecords.length}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{entity.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", TAG_STYLES[entity.tag])}>
                        {entity.tag}
                      </Badge>
                      {entity.totalDonations > 0 && (
                        <span className="text-[10px] font-medium text-foreground tabular-nums">{fmt(entity.totalDonations)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {taggedEntities.length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllLeaders(!showAllLeaders)}
                  className="w-full text-xs mt-2 gap-1 text-muted-foreground"
                >
                  {showAllLeaders ? "Show fewer" : `View all ${taggedEntities.length} leaders`}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAllLeaders && "rotate-180")} />
                </Button>
              )}
            </Section>
          )}

          {/* ═══ PATTERN FLAGS ═══ */}
          <Section icon={Target} label="PATTERN">
            <div className="flex flex-wrap gap-2">
              {flags.map((flag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={cn(
                    "text-xs px-2.5 py-0.5",
                    flag.includes("High") || flag.includes("Concentrated") || flag.includes("flagged")
                      ? "border-destructive/30 text-destructive bg-destructive/5"
                      : flag.includes("No public") || flag.includes("incomplete")
                      ? "border-muted-foreground/30 text-muted-foreground"
                      : flag.includes("resolved")
                      ? "border-primary/30 text-primary bg-primary/5"
                      : "border-primary/30 text-primary bg-primary/5"
                  )}
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </Section>

          {/* ═══ HOW DECISIONS MAY BE SHAPED ═══ */}
          <div className="border-l-2 border-primary/40 pl-4 py-2">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-1">HOW DECISIONS MAY BE SHAPED</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{insight}</p>
          </div>
        </div>

        {/* ═══ CONTRIBUTION RECORDS — collapsible ═══ */}
        {deduped.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowAllRecords(!showAllRecords)}
              className="w-full flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllRecords ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="font-mono uppercase tracking-wider text-[10px]">
                {showAllRecords ? "Collapse" : "View"} all {deduped.length} contribution records
              </span>
            </button>

            <AnimatePresence>
              {showAllRecords && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-1.5 max-h-80 overflow-y-auto">
                    {deduped.map((c, i) => {
                      const partyColor = c.party?.toLowerCase().includes("democrat") ? "#378ADD"
                        : c.party?.toLowerCase().includes("republican") ? "#E24B4A" : "#888780";
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ color: partyColor, backgroundColor: `${partyColor}15` }}
                            >
                              {c.party?.charAt(0) || "?"}
                            </span>
                            <span className="text-xs text-foreground truncate">{c.name}</span>
                            {c.count > 1 && (
                              <span className="text-[10px] text-muted-foreground shrink-0">×{c.count}</span>
                            )}
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
            {entities.some(e => e.mergedRecords.length > 1) && (
              <> Entity resolution applied to merge duplicate identities. </>
            )}
            <Link to="/request-correction" className="underline hover:text-primary transition-colors">
              Found an error? Report it →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */
function Section({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: React.ReactNode }) {
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

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
