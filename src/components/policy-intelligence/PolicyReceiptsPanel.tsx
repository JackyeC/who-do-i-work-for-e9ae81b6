import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Users, Landmark, Building2, Megaphone, AlertTriangle, DollarSign, ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { PartyBadge } from "@/components/PartyBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CandidateRecord {
  name: string;
  party: string;
  state: string;
  district?: string | null;
  amount: number;
  donation_type: string;
  flagged: boolean;
  flag_reason?: string | null;
}

interface Props {
  stances: Array<{ topic: string; public_position: string; gap: string }>;
  linkages: Array<{ link_type: string; amount: number | null; description: string | null; target_entity_name: string; metadata?: any; source_citation?: any }>;
  lobbyingRecords: Array<{ state: string; lobbying_spend?: number | null; year?: number }>;
  tradeAssociations: Array<{ name: string }>;
  darkMoney: Array<{ name: string; org_type: string; estimated_amount: number | null }>;
  candidates?: CandidateRecord[];
}

function ReceiptSection({ icon: Icon, title, count, children }: { icon: any; title: string; count: number; children: React.ReactNode }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <Badge variant="outline" className="text-xs">{count}</Badge>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-1.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function PartyBreakdownBar({ candidates }: { candidates: CandidateRecord[] }) {
  const totals: Record<string, number> = { R: 0, D: 0, Other: 0 };
  let grandTotal = 0;
  for (const c of candidates) {
    const p = c.party?.toLowerCase() || "";
    const amt = c.amount || 0;
    if (p.includes("republican") || p === "r") totals.R += amt;
    else if (p.includes("democrat") || p === "d") totals.D += amt;
    else totals.Other += amt;
    grandTotal += amt;
  }
  if (grandTotal === 0) return null;

  const rPct = Math.round((totals.R / grandTotal) * 100);
  const dPct = Math.round((totals.D / grandTotal) * 100);
  const oPct = 100 - rPct - dPct;

  return (
    <div className="px-3 py-2 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{candidates.length} recipients · ${grandTotal.toLocaleString()} total</span>
        <div className="flex items-center gap-3">
          {totals.R > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(0,65%,50%)]" />R {rPct}%</span>}
          {totals.D > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(218,55%,48%)]" />D {dPct}%</span>}
          {totals.Other > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" />Other {oPct}%</span>}
        </div>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {totals.R > 0 && <div className="bg-[hsl(0,65%,50%)]" style={{ width: `${rPct}%` }} />}
        {totals.D > 0 && <div className="bg-[hsl(218,55%,48%)]" style={{ width: `${dPct}%` }} />}
        {totals.Other > 0 && <div className="bg-muted-foreground/40" style={{ width: `${oPct}%` }} />}
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: CandidateRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`border-border/30 ${candidate.flagged ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full p-2.5 text-left hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            <PartyBadge party={candidate.party} size="xs" />
            <span className="text-xs font-medium text-foreground truncate">{candidate.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{candidate.state}{candidate.district ? `-${candidate.district}` : ""}</span>
            {candidate.flagged && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">{candidate.donation_type === "pac" ? "PAC" : candidate.donation_type === "direct" ? "Direct" : candidate.donation_type}</Badge>
            <span className="text-xs font-mono text-muted-foreground">${candidate.amount.toLocaleString()}</span>
          </div>
        </button>
        {expanded && (
          <div className="px-3 pb-2.5 pt-0 border-t border-border/20 space-y-1">
            {candidate.district && (
              <p className="text-xs text-muted-foreground">District: {candidate.state}-{candidate.district}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Donation type: {candidate.donation_type === "pac" ? "PAC contribution" : candidate.donation_type === "direct" ? "Direct contribution" : candidate.donation_type}
            </p>
            {candidate.flagged && candidate.flag_reason && (
              <div className="flex items-start gap-1.5 mt-1 p-1.5 rounded bg-destructive/10">
                <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{candidate.flag_reason}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Source: FEC filings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Lobbying helpers ── */

interface ParsedLobbyingFiling {
  registrant: string;
  amount: number;
  filingPeriod: string;
  filingYear: number;
  issues: string[];
  sourceUrl: string | null;
  description: string;
}

function parseLobbyingFilings(linkages: Props["linkages"]): ParsedLobbyingFiling[] {
  const lobbyLinks = linkages.filter(l =>
    l.link_type === "trade_association_lobbying" ||
    l.link_type === "lobbying_on_bill"
  );

  return lobbyLinks.map(l => {
    const meta = typeof l.metadata === "string" ? JSON.parse(l.metadata) : l.metadata;
    const citations = typeof l.source_citation === "string" ? JSON.parse(l.source_citation) : l.source_citation;
    const firstCitation = Array.isArray(citations) ? citations[0] : citations;

    return {
      registrant: meta?.registrant || l.target_entity_name || "Unknown firm",
      amount: l.amount || 0,
      filingPeriod: meta?.filing_type || "Annual",
      filingYear: meta?.filing_year || firstCitation?.year || 0,
      issues: meta?.issues || [],
      sourceUrl: firstCitation?.url || null,
      description: l.description || "",
    };
  });
}

function getLobbyingInsight(totalSpend: number, filingCount: number, topIssues: string[]): string {
  const laborIssues = topIssues.filter(i =>
    /labor|worker|workplace|employment|wage|union/i.test(i)
  );
  const taxIssues = topIssues.filter(i => /tax/i.test(i));

  const parts: string[] = [];

  if (totalSpend >= 5_000_000) {
    parts.push("This level of lobbying spend places the company among the most politically active employers in its sector.");
  } else if (totalSpend >= 1_000_000) {
    parts.push("This company invests significantly in shaping federal policy.");
  } else if (totalSpend >= 100_000) {
    parts.push("Moderate lobbying activity — the company engages selectively on policy issues.");
  }

  if (laborIssues.length > 0) {
    parts.push("Active lobbying on labor and workplace issues may signal efforts to influence regulations that directly affect employee rights, pay, or working conditions.");
  }

  if (taxIssues.length > 0 && laborIssues.length === 0) {
    parts.push("Primary lobbying focus on taxation and trade — less direct impact on day-to-day employee experience, but reflects corporate priorities.");
  }

  if (filingCount >= 10) {
    parts.push(`${filingCount} registered lobbying engagements suggest a sustained, organized influence operation — not one-off advocacy.`);
  }

  return parts.length > 0
    ? parts.join(" ")
    : "Lobbying activity detected. Review individual filings to understand what policies the company is trying to shape.";
}

function LobbyingItemizedSection({ linkages, lobbyingRecords }: { linkages: Props["linkages"]; lobbyingRecords: Props["lobbyingRecords"] }) {
  const [showAll, setShowAll] = useState(false);
  const filings = parseLobbyingFilings(linkages);

  const totalFederal = filings.reduce((s, f) => s + f.amount, 0);
  const totalState = lobbyingRecords.reduce((s, r) => s + (r.lobbying_spend || 0), 0);
  const grandTotal = totalFederal + totalState;

  // Aggregate issues across all filings
  const issueFreq: Record<string, number> = {};
  filings.forEach(f => f.issues.forEach(i => { issueFreq[i] = (issueFreq[i] || 0) + 1; }));
  const topIssues = Object.entries(issueFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Group by year
  const years = [...new Set(filings.map(f => f.filingYear).filter(Boolean))].sort((a, b) => b - a);

  const displayFilings = showAll ? filings : filings.slice(0, 8);
  const insight = getLobbyingInsight(grandTotal, filings.length, Object.keys(issueFreq));

  if (filings.length === 0 && lobbyingRecords.length === 0) {
    return <p className="text-xs text-muted-foreground px-3 py-2">No lobbying records found.</p>;
  }

  return (
    <div className="space-y-3 px-1">
      {/* Summary header */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Total Documented Lobbying</span>
          <span className="text-sm font-mono font-bold text-foreground">${grandTotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalFederal > 0 && (
            <span>Federal: <span className="font-mono font-medium text-foreground">${totalFederal.toLocaleString()}</span></span>
          )}
          {totalState > 0 && (
            <span>State: <span className="font-mono font-medium text-foreground">${totalState.toLocaleString()}</span></span>
          )}
          {years.length > 0 && (
            <span className="ml-auto">
              {years.length === 1 ? `${years[0]}` : `${years[years.length - 1]}–${years[0]}`}
              {filings.length > 0 && ` · ${filings.length} filings`}
            </span>
          )}
        </div>

        {/* Top lobbying issues */}
        {topIssues.length > 0 && (
          <div className="pt-1.5 border-t border-border/20">
            <p className="text-xs text-muted-foreground mb-1.5">Top issues lobbied on:</p>
            <div className="flex flex-wrap gap-1">
              {topIssues.map(([issue, count]) => (
                <Badge key={issue} variant="outline" className="text-xs gap-1">
                  {issue}
                  <span className="text-muted-foreground/60">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* What this means */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground mb-0.5">What this means for working here</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>

      {/* Itemized filings */}
      <div className="space-y-1.5">
        {displayFilings.map((f, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-2.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate">{f.registrant}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{f.filingPeriod}</Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.filingYear > 0 && <span className="text-xs text-muted-foreground">{f.filingYear}</span>}
                  <span className="text-xs font-mono font-medium text-foreground">${f.amount.toLocaleString()}</span>
                </div>
              </div>
              {f.issues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {f.issues.slice(0, 4).map((issue, j) => (
                    <span key={j} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{issue}</span>
                  ))}
                  {f.issues.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{f.issues.length - 4} more</span>
                  )}
                </div>
              )}
              {f.sourceUrl && (
                <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                  Senate LDA Filing <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}

        {/* State lobbying */}
        {lobbyingRecords.map((l, i) => (
          <Card key={`s-${i}`} className="border-border/30">
            <CardContent className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground">{l.state} — state lobbying</span>
                {l.year && <span className="text-xs text-muted-foreground">{l.year}</span>}
              </div>
              <div className="flex items-center gap-2">
                {l.lobbying_spend && <span className="text-xs font-mono text-foreground">${l.lobbying_spend.toLocaleString()}</span>}
                <Badge variant="outline" className="text-xs">State</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filings.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline px-1"
        >
          {showAll ? "Show fewer" : `Show all ${filings.length} filings`}
        </button>
      )}
    </div>
  );
}

export function PolicyReceiptsPanel({ stances, linkages, lobbyingRecords, tradeAssociations, darkMoney, candidates = [] }: Props) {
  const donations = linkages.filter(l => l.link_type === "donation_to_member" || l.link_type === "pac_contribution");
  const lobbyingFilings = parseLobbyingFilings(linkages);
  const policyStances = stances.filter(s => ["Climate", "Labor", "Civil Rights", "Healthcare", "ESG", "Data Privacy", "Workers Rights", "Environment"].some(
    cat => s.topic.toLowerCase().includes(cat.toLowerCase())
  ));

  const hasCandidates = candidates.length > 0;
  const spendingCount = hasCandidates ? candidates.length : donations.length;
  const lobbyingCount = lobbyingFilings.length + lobbyingRecords.length;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Policy & Governance Receipts</h3>
      <p className="text-xs text-muted-foreground">Documented records of corporate political activity and governance disclosures.</p>

      <div className="space-y-2">
        {/* Political Spending — intelligence-grade */}
        <ReceiptSection icon={DollarSign} title="Political Spending Disclosure" count={spendingCount}>
          {spendingCount === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No documented political spending records found.</p>
          ) : hasCandidates ? (
            <div className="space-y-1.5">
              <PartyBreakdownBar candidates={candidates} />
              {candidates.map((c, i) => (
                <CandidateRow key={i} candidate={c} />
              ))}
            </div>
          ) : (
            donations.slice(0, 10).map((d, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground">{d.target_entity_name}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {d.link_type === "pac_contribution" ? "PAC" : "Direct"}
                    </Badge>
                  </div>
                  {d.amount && <span className="text-xs font-mono text-muted-foreground">${d.amount.toLocaleString()}</span>}
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>

        <ReceiptSection icon={Users} title="Board Oversight Signals" count={linkages.filter(l => l.link_type === "revolving_door").length}>
          {linkages.filter(l => l.link_type === "revolving_door").length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No revolving door connections documented.</p>
          ) : (
            linkages.filter(l => l.link_type === "revolving_door").slice(0, 5).map((l, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5">
                  <p className="text-xs text-foreground">{l.description || `${l.target_entity_name} — revolving door connection`}</p>
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>

        {/* Lobbying — fully itemized */}
        <ReceiptSection icon={Landmark} title="Lobbying Disclosure" count={lobbyingCount}>
          <LobbyingItemizedSection linkages={linkages} lobbyingRecords={lobbyingRecords} />
        </ReceiptSection>

        <ReceiptSection icon={Building2} title="Trade Association Memberships" count={tradeAssociations.length}>
          {tradeAssociations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No trade association memberships documented.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 px-3 py-2">
              {tradeAssociations.map((ta, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  {ta.name}
                  <span className="text-muted-foreground">· Association</span>
                </Badge>
              ))}
            </div>
          )}
        </ReceiptSection>

        <ReceiptSection icon={Megaphone} title="Public Policy Positions" count={policyStances.length}>
          {policyStances.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No ESG/workforce/social policy positions on record.</p>
          ) : (
            policyStances.slice(0, 8).map((s, i) => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{s.topic}</span>
                      <Badge variant="outline" className="text-xs text-muted-foreground">Statement</Badge>
                    </div>
                    <Badge variant={s.gap === "aligned" ? "success" : s.gap === "direct-conflict" ? "destructive" : "outline"} className="text-xs">
                      {s.gap === "aligned" ? "Aligned" : s.gap === "direct-conflict" ? "Contradiction" : "Mixed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.public_position}</p>
                </CardContent>
              </Card>
            ))
          )}
        </ReceiptSection>
      </div>

      {darkMoney.length > 0 && (
        <div className="mt-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
          <p className="text-xs font-medium text-destructive mb-1">⚠️ Undisclosed Channels Detected</p>
          <p className="text-xs text-muted-foreground">
            {darkMoney.length} organization(s) linked to undisclosed spending — totaling ~${darkMoney.reduce((s, d) => s + (d.estimated_amount || 0), 0).toLocaleString()}.
          </p>
        </div>
      )}
    </div>
  );
}
