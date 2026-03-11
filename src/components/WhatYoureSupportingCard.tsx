import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HandCoins, Users, Scale, HelpCircle, ExternalLink, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { PartyBadge } from "@/components/PartyBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LobbyingDetail {
  target: string;
  description: string;
  amount?: number;
}

interface PublicStance {
  topic: string;
  public_position: string;
  spending_reality: string;
}

interface IssueSignal {
  issue_category: string;
  signal_type: string;
  description: string;
  amount: number | null;
  confidence_score: string;
  source_url: string | null;
}

interface Props {
  companyName: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  topCandidates?: { name: string; party: string; amount: number; state?: string; committees?: string[] }[];
  topIssuesLobbied?: string[];
  lobbyingDetails?: LobbyingDetail[];
  publicStances?: PublicStance[];
  darkMoneyConnections?: number;
  flaggedOrgCount?: number;
  issueSignals?: IssueSignal[];
}

const PARTY_FULL: Record<string, string> = {
  Republican: "Republican",
  Democrat: "Democrat",
  Independent: "Independent",
  R: "Republican",
  D: "Democrat",
  I: "Independent",
};

export function WhatYoureSupportingCard({
  companyName,
  totalPacSpending,
  lobbyingSpend,
  topCandidates = [],
  topIssuesLobbied = [],
  lobbyingDetails = [],
  publicStances = [],
  darkMoneyConnections = 0,
  flaggedOrgCount = 0,
  issueSignals = [],
}: Props) {
  const hasActivity = totalPacSpending > 0 || lobbyingSpend > 0 || topCandidates.length > 0 || issueSignals.length > 0;

  // Aggregate issue signals by category
  const issueBreakdown = issueSignals.reduce<Record<string, { count: number; totalAmount: number }>>((acc, s) => {
    const cat = s.issue_category || 'general';
    if (!acc[cat]) acc[cat] = { count: 0, totalAmount: 0 };
    acc[cat].count++;
    acc[cat].totalAmount += s.amount || 0;
    return acc;
  }, {});

  const sortedIssues = Object.entries(issueBreakdown)
    .sort((a, b) => b[1].count - a[1].count);

  if (!hasActivity) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            What You're Supporting
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                try { await navigator.share({ title: `${companyName} — What You're Supporting`, url }); } catch {}
              } else {
                await navigator.clipboard.writeText(url);
              }
            }}
          >
            <Share2 className="w-3 h-3" /> Share
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When you work at <strong className="text-foreground">{companyName}</strong>, your labor generates revenue that funds the following political activities. This isn't a judgment — it's a map of where the money goes.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Money flows — with plain explainers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {totalPacSpending > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Donations to Politicians
                <HelpCircle className="w-3 h-3" />
              </div>
              <div className="text-lg font-bold font-data text-foreground">{formatCurrency(totalPacSpending)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Money from the company's political fund (PAC) given directly to politicians' campaigns.
              </p>
            </div>
          )}
          {lobbyingSpend > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Paid Lobbyists
                <HelpCircle className="w-3 h-3" />
              </div>
              <div className="text-lg font-bold font-data text-foreground">{formatCurrency(lobbyingSpend)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Money spent hiring people to talk to lawmakers and try to change laws in the company's favor.
              </p>
            </div>
          )}
        </div>

        {/* Lobbying details — what they actually lobbied on */}
        {lobbyingDetails.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">What They're Trying to Influence</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              These are the specific laws, agencies, or topics {companyName} paid lobbyists to work on.
              This comes from reports they're legally required to file.
            </p>
            <div className="space-y-1.5">
              {lobbyingDetails.slice(0, 8).map((d, i) => (
                <div key={i} className="py-2 px-3 rounded bg-muted/30 border border-border/50">
                  <p className="text-sm text-foreground">{d.target}</p>
                  {d.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                  )}
                  {d.amount && d.amount > 0 && (
                    <span className="text-[10px] font-medium text-foreground mt-0.5 inline-block">{formatCurrency(d.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public stances — what they actually lobby on (fallback when no bill-level data) */}
        {lobbyingDetails.length === 0 && publicStances.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">What They're Lobbying For</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Based on {companyName}'s lobbying filings and public statements, here's what they're spending that money on:
            </p>
            <div className="space-y-2">
              {publicStances.slice(0, 5).map((stance, i) => (
                <div key={i} className="py-2.5 px-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm font-medium text-foreground">{stance.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stance.public_position}</p>
                  {stance.spending_reality && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      Evidence: {stance.spending_reality}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issue Signal Breakdown — evidence-based categorization */}
        {sortedIssues.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Policy Areas Influenced</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Based on {issueSignals.length} signals mapped from PAC donations, lobbying filings, and legislative connections.
            </p>
            <div className="space-y-1.5">
              {sortedIssues.slice(0, 8).map(([category, data]) => {
                const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const maxCount = sortedIssues[0][1].count;
                const pct = (data.count / maxCount) * 100;
                return (
                  <Link key={category} to={`/values-search?issue=${encodeURIComponent(category)}`} className="block">
                    <div className="py-2 px-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{data.count} signal{data.count > 1 ? 's' : ''}</span>
                          {data.totalAmount > 0 && (
                            <span className="font-medium text-foreground">{formatCurrency(data.totalAmount)}</span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Issue tags if no detail records and no stances and no issue signals */}
        {sortedIssues.length === 0 && lobbyingDetails.length === 0 && publicStances.length === 0 && topIssuesLobbied.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Topics They Lobby On</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              These are the issues {companyName} reported lobbying on in their government filings.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topIssuesLobbied.slice(0, 8).map((issue, i) => (
                <Link key={i} to={`/values-search?issue=${encodeURIComponent(issue.toLowerCase().replace(/\s+/g, '_'))}`}>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors">{issue}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top candidates — with party name and context */}
        {topCandidates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Politicians Who Got the Money</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              These politicians received money from {companyName}'s political fund or executives.
              Tap any party badge to learn what that party generally supports.
            </p>
            <div className="space-y-1.5">
              {topCandidates.slice(0, 5).map((c, i) => (
                <a
                  key={i}
                  href={`https://www.fec.gov/data/receipts/?contributor_name=${encodeURIComponent(c.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 px-3 rounded bg-muted/30 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PartyBadge party={c.party} size="sm" />
                    <div className="min-w-0">
                      <span className="text-sm text-foreground block truncate group-hover:text-primary transition-colors">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {PARTY_FULL[c.party] || c.party}
                        {c.state ? ` — ${c.state}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-data font-medium text-foreground">{formatCurrency(c.amount)}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Risk flags */}
        {(darkMoneyConnections > 0 || flaggedOrgCount > 0) && (
          <div className="p-3 rounded-lg bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
              <span className="text-sm font-semibold text-foreground">Worth Knowing</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              {darkMoneyConnections > 0 && (
                <li>
                  <strong className="text-foreground">{darkMoneyConnections} hidden money connection{darkMoneyConnections > 1 ? "s" : ""}</strong> — money sent through groups that don't have to say who gave it. This makes it harder to see the full picture.
                </li>
              )}
              {flaggedOrgCount > 0 && (
                <li>
                  <strong className="text-foreground">{flaggedOrgCount} connection{flaggedOrgCount > 1 ? "s" : ""} to watchlist groups</strong> — organizations flagged by civil rights groups (SPLC/ADL) for extremist ties.
                </li>
              )}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          All of this is public record. Campaign donations come from <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">FEC filings <ExternalLink className="w-2.5 h-2.5" /></a> and lobbying reports come from the <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Senate disclosure database <ExternalLink className="w-2.5 h-2.5" /></a>. We just organized it so you can understand it.
        </p>
      </CardContent>
    </Card>
  );
}
