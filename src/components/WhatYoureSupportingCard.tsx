import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HandCoins, Users, Scale, HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { PartyBadge } from "@/components/PartyBadge";

interface LobbyingDetail {
  target: string;
  description: string;
  amount?: number;
}

interface Props {
  companyName: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  topCandidates?: { name: string; party: string; amount: number; state?: string; committees?: string[] }[];
  topIssuesLobbied?: string[];
  lobbyingDetails?: LobbyingDetail[];
  darkMoneyConnections?: number;
  flaggedOrgCount?: number;
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
  darkMoneyConnections = 0,
  flaggedOrgCount = 0,
}: Props) {
  const hasActivity = totalPacSpending > 0 || lobbyingSpend > 0 || topCandidates.length > 0;

  if (!hasActivity) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" />
          What You're Supporting
        </CardTitle>
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

        {/* Issue tags if no detail records */}
        {lobbyingDetails.length === 0 && topIssuesLobbied.length > 0 && (
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
                <Badge key={i} variant="outline" className="text-xs">{issue}</Badge>
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
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <PartyBadge party={c.party} size="sm" />
                    <div className="min-w-0">
                      <span className="text-sm text-foreground block truncate">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {PARTY_FULL[c.party] || c.party}
                        {c.state ? ` — ${c.state}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-data font-medium text-foreground shrink-0">{formatCurrency(c.amount)}</span>
                </div>
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
