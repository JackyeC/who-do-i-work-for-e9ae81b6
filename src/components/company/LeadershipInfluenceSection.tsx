import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, User, Briefcase, DollarSign, ArrowRightLeft,
  EyeOff, Shield, ChevronRight, Vote
} from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { PartyBadge } from "@/components/PartyBadge";

interface Executive {
  id: string;
  name: string;
  title: string;
  total_donations: number;
  photo_url?: string | null;
  verification_status?: string | null;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  state: string;
  district?: string | null;
  amount: number;
  donation_type: string;
  flagged: boolean;
  flag_reason?: string | null;
}

interface PartyBreakdown {
  party: string;
  amount: number;
  color: string;
}

interface RevolvingDoor {
  id: string;
  person: string;
  prior_role: string;
  new_role: string;
  relevance?: string | null;
}

interface DarkMoney {
  id: string;
  name: string;
  org_type: string;
  relationship: string;
  estimated_amount?: number | null;
}

interface BoardMember {
  id: string;
  is_independent?: boolean | null;
}

interface LeadershipInfluenceSectionProps {
  executives: Executive[];
  candidates: Candidate[];
  partyBreakdown: PartyBreakdown[];
  revolvingDoor: RevolvingDoor[];
  darkMoney: DarkMoney[];
  boardMembers: BoardMember[];
  companyName: string;
  totalPacSpending: number;
  lobbyingSpend: number;
  onExecutiveClick: (exec: Executive) => void;
  onCandidateClick: (candidate: Candidate) => void;
  onPacClick: () => void;
  onLobbyingClick: () => void;
  onContractsClick: () => void;
}

export function LeadershipInfluenceSection({
  executives,
  candidates,
  partyBreakdown,
  revolvingDoor,
  darkMoney,
  boardMembers,
  companyName,
  totalPacSpending,
  lobbyingSpend,
  onExecutiveClick,
  onCandidateClick,
  onPacClick,
  onLobbyingClick,
  onContractsClick,
}: LeadershipInfluenceSectionProps) {
  const hasAnyData = executives.length > 0 || candidates.length > 0 || revolvingDoor.length > 0 || darkMoney.length > 0;
  if (!hasAnyData) return null;

  const totalParty = partyBreakdown.reduce((s, p) => s + p.amount, 0);

  return (
    <section className="mb-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Leadership & Influence</h2>
      </div>

      {/* ── Executive Leadership ── */}
      {executives.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="w-4 h-4 text-primary" />
              Executive Leadership
              <Badge variant="secondary" className="text-xs ml-auto">{executives.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {executives.map((exec) => (
                <button
                  key={exec.id}
                  onClick={() => onExecutiveClick(exec)}
                  className="flex items-center justify-between w-full py-3 px-1 text-left hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {exec.photo_url ? (
                      <img src={exec.photo_url} alt={exec.name} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{exec.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{exec.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {exec.total_donations > 0 && (
                      <Badge variant="outline" className="text-xs text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30">
                        {formatCurrency(exec.total_donations)}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── PAC & Party Breakdown ── */}
      {(totalPacSpending > 0 || partyBreakdown.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-4 h-4 text-primary" />
              PAC & Political Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {totalPacSpending > 0 && (
              <button onClick={onPacClick} className="flex items-center justify-between w-full py-2 px-1 hover:bg-muted/50 rounded-md transition-colors group">
                <span className="text-sm text-foreground">Total PAC Spending</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-foreground">{formatCurrency(totalPacSpending)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </button>
            )}
            {lobbyingSpend > 0 && (
              <button onClick={onLobbyingClick} className="flex items-center justify-between w-full py-2 px-1 hover:bg-muted/50 rounded-md transition-colors group">
                <span className="text-sm text-foreground">Lobbying Expenditures</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-foreground">{formatCurrency(lobbyingSpend)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </button>
            )}

            {/* Party bar */}
            {partyBreakdown.length > 0 && totalParty > 0 && (
              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-2">Party Split</p>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {partyBreakdown.map((p) => (
                    <div
                      key={p.party}
                      className="h-full transition-all"
                      style={{
                        width: `${(p.amount / totalParty) * 100}%`,
                        backgroundColor: p.color,
                      }}
                      title={`${p.party}: ${formatCurrency(p.amount)}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {partyBreakdown.map((p) => (
                    <div key={p.party} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-xs text-muted-foreground">{p.party}</span>
                      <span className="text-xs font-mono font-medium text-foreground">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Top Candidates Funded ── */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="w-4 h-4 text-primary" />
              Top Candidates Funded
              <Badge variant="secondary" className="text-xs ml-auto">{candidates.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {candidates.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCandidateClick(c)}
                  className="flex items-center justify-between w-full py-2.5 px-1 text-left hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                    <PartyBadge party={c.party} entityType="politician" size="sm" />
                    <span className="text-xs text-muted-foreground">{c.state}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-medium text-foreground">{formatCurrency(c.amount)}</span>
                    {c.flagged && (
                      <Badge variant="destructive" className="text-xs">Flagged</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </button>
              ))}
            </div>
            {candidates.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                + {candidates.length - 10} more candidates
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Revolving Door ── */}
      {revolvingDoor.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              Revolving Door
              <Badge variant="secondary" className="text-xs ml-auto">{revolvingDoor.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {revolvingDoor.map((rd) => (
                <div key={rd.id} className="py-3 px-1">
                  <p className="text-sm font-semibold text-foreground">{rd.person}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span>{rd.prior_role}</span>
                    <ArrowRightLeft className="w-3 h-3 text-primary" />
                    <span>{rd.new_role}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dark Money ── */}
      {darkMoney.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <EyeOff className="w-4 h-4 text-primary" />
              Dark Money Connections
              <Badge variant="secondary" className="text-xs ml-auto">{darkMoney.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {darkMoney.map((dm) => (
                <div key={dm.id} className="py-3 px-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dm.name}</p>
                      <p className="text-xs text-muted-foreground">{dm.org_type} · {dm.relationship}</p>
                    </div>
                    {dm.estimated_amount && dm.estimated_amount > 0 && (
                      <span className="text-sm font-mono font-medium text-foreground">{formatCurrency(dm.estimated_amount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Board Members (summary) ── */}
      {boardMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              Board of Directors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">{boardMembers.length} board member{boardMembers.length !== 1 ? "s" : ""} identified</span>
              {boardMembers.filter(b => b.is_independent).length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {boardMembers.filter(b => b.is_independent).length} independent
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
