import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, Calendar, MapPin, Target, Zap,
  ChevronDown, ChevronRight, ExternalLink, Flag, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceRecord } from "@/components/dossier/EmployerReportDrawer";

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
  name: string;
  title: string;
  total_donations: number;
  previous_company?: string | null;
}

interface PartyRow {
  party: string;
  amount: number;
}

interface Props {
  companyName: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  candidates: Candidate[];
  executives: Executive[];
  partyBreakdown: PartyRow[];
  evidenceRecords: EvidenceRecord[];
  eeocCount: number;
  issueSignalCount: number;
  clarityScore: number;
}

/* ─── Helpers ─── */
function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function deduplicateCandidates(candidates: Candidate[]): Array<Candidate & { totalAmount: number; count: number }> {
  const map = new Map<string, { base: Candidate; totalAmount: number; count: number }>();
  for (const c of candidates) {
    // Normalize name: strip suffixes, uppercase, trim
    const key = c.name
      .toUpperCase()
      .replace(/\s+(JR|SR|III|II|IV)\.?$/i, "")
      .replace(/,/g, "")
      .trim();
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

/* ─── Pattern detection ─── */
function detectPatterns(
  candidates: Candidate[],
  executives: Executive[],
  partyBreakdown: PartyRow[],
  totalPac: number,
  lobbyingSpend: number,
): string[] {
  const flags: string[] = [];

  // Executive participation
  const donatingExecs = executives.filter(e => e.total_donations > 0);
  if (donatingExecs.length >= 3) flags.push("High executive participation");
  else if (donatingExecs.length >= 1) flags.push("Executive-level giving detected");

  // Concentration
  if (candidates.length > 0) {
    const top = candidates[0].amount;
    const total = candidates.reduce((s, c) => s + c.amount, 0);
    if (total > 0 && top / total > 0.5) flags.push("Concentrated giving among leadership");
    else if (candidates.length >= 3) flags.push("Distributed influence across multiple actors");
  }

  // Party alignment
  const dem = partyBreakdown.filter(p => p.party?.toLowerCase().includes("democrat")).reduce((s, p) => s + (p.amount || 0), 0);
  const rep = partyBreakdown.filter(p => p.party?.toLowerCase().includes("republican")).reduce((s, p) => s + (p.amount || 0), 0);
  const partyTotal = dem + rep || 1;
  if (dem / partyTotal > 0.7) flags.push("Strong Democratic alignment");
  else if (rep / partyTotal > 0.7) flags.push("Strong Republican alignment");
  else if (dem > 0 && rep > 0) flags.push("Mixed political alignment");

  // Scale
  if (totalPac + lobbyingSpend > 5_000_000) flags.push("Financially significant political engagement");
  else if (totalPac + lobbyingSpend > 1_000_000) flags.push("Active political engagement");

  // Flagged
  const flaggedCount = candidates.filter(c => c.flagged).length;
  if (flaggedCount > 0) flags.push(`${flaggedCount} flagged contribution${flaggedCount > 1 ? "s" : ""}`);

  if (flags.length === 0) flags.push("Low transparency / incomplete data");

  return flags;
}

/* ─── Impact statement ─── */
function generateImpact(
  patterns: string[],
  totalSpend: number,
  execCount: number,
  candidateCount: number,
): string {
  if (totalSpend === 0 && candidateCount === 0) {
    return "No political spending signals detected. This could indicate a genuinely apolitical company, or spending below federal disclosure thresholds. If corporate influence matters to you, look for other signals — lobbying, board connections, institutional links.";
  }

  const isConcentrated = patterns.includes("Concentrated giving among leadership");
  const isActive = totalSpend > 1_000_000;
  const hasExecParticipation = patterns.some(p => p.includes("executive"));

  if (isActive && hasExecParticipation) {
    return `This level of coordinated political spending suggests active engagement in policy influence. Leadership is personally invested — not just the corporate PAC. If political alignment or corporate influence matters to you, this is a meaningful signal, not a one-off.`;
  }
  if (isActive) {
    return `${fmt(totalSpend)} in political spending is financially significant. The question isn't whether they're engaged in politics — it's whether their positions align with yours. Check the recipients.`;
  }
  if (isConcentrated) {
    return `Political activity is concentrated among a small number of leaders rather than broadly distributed. This means individual executives are driving the company's political footprint. Their priorities may shape your workplace.`;
  }
  return `Political activity exists but at a moderate level. Not every company with contributions has a political agenda — but the pattern of who gives, to whom, and how much tells you something about priorities at the top.`;
}

/* ─── Takeaway ─── */
function generateTakeaway(
  patterns: string[],
  candidates: Candidate[],
  executives: Executive[],
  totalSpend: number,
): string {
  const donatingExecs = executives.filter(e => e.total_donations > 0);
  if (donatingExecs.length >= 3 && candidates.length >= 5) {
    return `Leadership-level political activity is active and financially significant, with contributions distributed across ${donatingExecs.length} executives rather than centralized in a single actor.`;
  }
  if (totalSpend > 1_000_000) {
    return `${fmt(totalSpend)} in combined political spending with ${candidates.length > 0 ? `${candidates.length} identified recipients` : "aggregate-only data"}. This is an employer that engages in the political process — the question is whether their engagement aligns with yours.`;
  }
  if (candidates.length === 1) {
    return `One contribution on record. A single data point — not a pattern. But it's still a receipt, and receipts matter.`;
  }
  if (totalSpend === 0) {
    return `No political spending signals on file. That's either genuine neutrality or activity below federal disclosure thresholds. Other signal categories may tell a fuller story.`;
  }
  return `Moderate political engagement detected. Not headline-level, but enough to show where leadership attention goes when no one's watching.`;
}

/* ═══ COMPONENT ═══ */
export function SignalIntelligenceBreakdown({
  companyName,
  totalPacSpending,
  lobbyingSpend,
  candidates,
  executives,
  partyBreakdown,
  evidenceRecords,
  eeocCount,
  issueSignalCount,
  clarityScore,
}: Props) {
  const [showAllRecords, setShowAllRecords] = useState(false);

  const deduped = useMemo(() => deduplicateCandidates(candidates), [candidates]);
  const donatingExecs = useMemo(() => executives.filter(e => e.total_donations > 0), [executives]);
  const totalSpend = totalPacSpending + lobbyingSpend;
  const patterns = useMemo(
    () => detectPatterns(candidates, executives, partyBreakdown, totalPacSpending, lobbyingSpend),
    [candidates, executives, partyBreakdown, totalPacSpending, lobbyingSpend]
  );
  const impact = useMemo(
    () => generateImpact(patterns, totalSpend, donatingExecs.length, candidates.length),
    [patterns, totalSpend, donatingExecs.length, candidates.length]
  );
  const takeaway = useMemo(
    () => generateTakeaway(patterns, candidates, executives, totalSpend),
    [patterns, candidates, executives, totalSpend]
  );

  // Party distribution
  const demAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("democrat")).reduce((s, p) => s + (p.amount || 0), 0);
  const repAmount = partyBreakdown.filter(p => p.party?.toLowerCase().includes("republican")).reduce((s, p) => s + (p.amount || 0), 0);
  const otherAmount = Math.max(0, totalPacSpending - demAmount - repAmount);
  const barTotal = demAmount + repAmount + otherAmount || 1;

  const topRecords = deduped.slice(0, showAllRecords ? undefined : 5);

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Signal Intelligence</h2>

      {/* ═══ STRUCTURED BREAKDOWN ═══ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Takeaway banner */}
        <div className="px-5 py-4 border-b border-border bg-primary/[0.03]">
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {takeaway}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ── WHO ── */}
          <Section icon={Users} label="WHO">
            {donatingExecs.length > 0 ? (
              <div className="space-y-1.5">
                {donatingExecs.slice(0, 3).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      <span className="font-medium">{e.name}</span>
                      <span className="text-muted-foreground ml-1">({e.title})</span>
                    </span>
                    <span className="text-foreground font-medium tabular-nums">{fmt(e.total_donations)}</span>
                  </div>
                ))}
                {donatingExecs.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    + {donatingExecs.length - 3} more executive{donatingExecs.length - 3 > 1 ? "s" : ""} with political donations
                  </p>
                )}
              </div>
            ) : totalPacSpending > 0 ? (
              <p className="text-xs text-muted-foreground">
                PAC activity detected but individual executive contributions are not yet itemized. Corporate PAC managed centrally.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No identified political actors on record.</p>
            )}
          </Section>

          {/* ── WHAT ── */}
          <Section icon={DollarSign} label="WHAT">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="PAC Spending" value={totalPacSpending > 0 ? fmt(totalPacSpending) : "None"} />
                <Stat label="Lobbying" value={lobbyingSpend > 0 ? fmt(lobbyingSpend) : "None"} />
              </div>
              {candidates.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Individual Contributions" value={`${deduped.length} recipient${deduped.length !== 1 ? "s" : ""}`} />
                  <Stat label="Exec Donations" value={donatingExecs.length > 0 ? `${donatingExecs.length} executive${donatingExecs.length !== 1 ? "s" : ""}` : "None"} />
                </div>
              )}
            </div>
          </Section>

          {/* ── WHERE (Party Distribution) ── */}
          {totalPacSpending > 0 && (
            <Section icon={MapPin} label="WHERE">
              <div className="space-y-2">
                {/* Bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {demAmount > 0 && <div style={{ width: `${(demAmount / barTotal) * 100}%`, background: "#378ADD" }} />}
                  {repAmount > 0 && <div style={{ width: `${(repAmount / barTotal) * 100}%`, background: "#E24B4A" }} />}
                  {otherAmount > 0 && <div style={{ width: `${(otherAmount / barTotal) * 100}%`, background: "#888780" }} />}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {demAmount > 0 && <span style={{ color: "#378ADD" }}>Democratic: {fmt(demAmount)} ({Math.round((demAmount / barTotal) * 100)}%)</span>}
                  {repAmount > 0 && <span style={{ color: "#E24B4A" }}>Republican: {fmt(repAmount)} ({Math.round((repAmount / barTotal) * 100)}%)</span>}
                  {otherAmount > 0 && (
                    <span style={{ color: "#888780" }}>
                      Other: {fmt(otherAmount)} ({Math.round((otherAmount / barTotal) * 100)}%)
                      <span className="text-muted-foreground ml-1">
                        — includes non-party PACs, ballot measures, and unclassified recipients
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ── WHY (Patterns) ── */}
          <Section icon={Target} label="PATTERN">
            <div className="flex flex-wrap gap-2">
              {patterns.map((flag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={cn(
                    "text-xs px-2.5 py-0.5",
                    flag.includes("High") || flag.includes("Concentrated") || flag.includes("flagged")
                      ? "border-destructive/30 text-destructive bg-destructive/5"
                      : flag.includes("Low") || flag.includes("incomplete")
                      ? "border-muted-foreground/30 text-muted-foreground"
                      : "border-primary/30 text-primary bg-primary/5"
                  )}
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </Section>

          {/* ── IMPACT ── */}
          <div className="border-l-2 border-primary/40 pl-4 py-2">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-1">IMPACT — What this means for you</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{impact}</p>
          </div>
        </div>

        {/* ═══ TOP RECORDS — collapsible ═══ */}
        {deduped.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowAllRecords(!showAllRecords)}
              className="w-full flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllRecords ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="font-mono uppercase tracking-wider text-[10px]">
                {showAllRecords ? "Collapse" : "View"} all {deduped.length} records
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
                    {topRecords.map((c, i) => {
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
