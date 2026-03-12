import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield, DollarSign, Scale, AlertTriangle, Users,
  Sparkles, ExternalLink, FileText, BookOpen, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BoardGovernanceTabProps {
  companyId: string;
  companyName: string;
  ticker?: string | null;
  secCik?: string | null;
}

const COMMITTEE_INFO: Record<string, { icon: any; description: string; jackye: string }> = {
  "Audit": {
    icon: Scale,
    description: "Reviews financial statements, oversees internal controls, manages external auditor relationships.",
    jackye: "If there are accounting irregularities or SEC investigations, this committee either caught it — or failed to.",
  },
  "Compensation": {
    icon: DollarSign,
    description: "Sets executive pay, approves bonuses and equity grants, designs incentive programs.",
    jackye: "If the CEO's bonus is tied to headcount reduction, that affects you. Always check what behaviors are rewarded.",
  },
  "Governance": {
    icon: Shield,
    description: "Manages board composition, director nominations, and corporate governance policies.",
    jackye: "This committee controls who gets a seat at the table. Check whether independent directors outnumber insiders.",
  },
  "Nominating": {
    icon: Users,
    description: "Identifies and evaluates potential board candidates, manages director succession.",
    jackye: "Who gets nominated tells you what kind of perspectives the board values — or ignores.",
  },
  "Risk": {
    icon: AlertTriangle,
    description: "Identifies enterprise risks including cybersecurity, regulatory, and reputational threats.",
    jackye: "A strong risk committee spots trouble early. Sudden layoffs or security breaches often mean this committee wasn't doing its job.",
  },
};

function normalizeCommittee(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (lower.includes("audit")) return "Audit";
  if (lower.includes("compens")) return "Compensation";
  if (lower.includes("governance")) return "Governance";
  if (lower.includes("nominat")) return "Nominating";
  if (lower.includes("risk")) return "Risk";
  return null;
}

export function BoardGovernanceTab({ companyId, companyName, ticker, secCik }: BoardGovernanceTabProps) {
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);

  const { data: boardMembers } = useQuery({
    queryKey: ["board-gov-members", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("board_members").select("*").eq("company_id", companyId).order("name");
      return data || [];
    },
    enabled: !!companyId,
  });

  // Derive committees from board member data
  const committeeMap = new Map<string, any[]>();
  boardMembers?.forEach((m: any) => {
    (m.committees || []).forEach((c: string) => {
      const norm = normalizeCommittee(c);
      const key = norm || c;
      if (!committeeMap.has(key)) committeeMap.set(key, []);
      committeeMap.get(key)!.push(m);
    });
  });

  const independentCount = boardMembers?.filter((m: any) => m.is_independent).length || 0;
  const totalCount = boardMembers?.length || 0;
  const independenceRatio = totalCount > 0 ? Math.round((independentCount / totalCount) * 100) : 0;

  const secEdgarUrl = secCik
    ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${secCik}&type=DEF%2014A&dateb=&owner=include&count=10`
    : ticker
    ? `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&CIK=&type=DEF+14A&dateb=&owner=include&count=10&search_text=&action=getcompany`
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Board Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{independentCount}</p>
            <p className="text-xs text-muted-foreground">Independent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={cn("text-2xl font-bold", independenceRatio >= 67 ? "text-[hsl(var(--civic-green))]" : independenceRatio >= 50 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive")}>
              {independenceRatio}%
            </p>
            <p className="text-xs text-muted-foreground">Independence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{committeeMap.size}</p>
            <p className="text-xs text-muted-foreground">Committees</p>
          </CardContent>
        </Card>
      </div>

      {/* Jackye's Take on Board */}
      <Card className="bg-primary/[0.03] border-primary/15">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {totalCount === 0
              ? `No board data available yet for ${companyName}. Board governance information is typically sourced from SEC proxy statements (DEF 14A).`
              : independenceRatio >= 67
              ? `${companyName}'s board has strong independence at ${independenceRatio}%. That's a positive governance signal — independent directors are more likely to challenge management on behalf of shareholders and employees.`
              : independenceRatio >= 50
              ? `${companyName}'s board has moderate independence at ${independenceRatio}%. There's room for concern — boards with fewer independent voices are more susceptible to management influence.`
              : `${companyName}'s board independence is low at ${independenceRatio}%. This is a governance risk — boards dominated by insiders may prioritize management interests over shareholder and employee protections.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Committee Breakdown */}
      {committeeMap.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Committee Structure
            </CardTitle>
            <p className="text-xs text-muted-foreground">How oversight is organized across {companyName}'s board.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from(committeeMap.entries()).map(([name, members]) => {
              const info = COMMITTEE_INFO[name];
              const Icon = info?.icon || Shield;
              const isExpanded = expandedCommittee === name;
              return (
                <div key={name} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedCommittee(isExpanded ? null : name)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-primary/70" />
                      <span className="text-sm font-semibold text-foreground">{name} Committee</span>
                      <Badge variant="secondary" className="text-[10px]">{members.length} members</Badge>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                  </button>
                  {isExpanded && (
                    <div className="p-3 border-t border-border bg-muted/20 space-y-3">
                      {info?.description && <p className="text-xs text-muted-foreground">{info.description}</p>}
                      <div className="space-y-1.5">
                        {members.map((m: any) => (
                          <Link key={m.id} to={`/leader/${m.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/60 transition-colors">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm text-foreground">{m.name}</span>
                              {m.is_independent && <Badge variant="outline" className="text-[10px]">Independent</Badge>}
                            </div>
                          </Link>
                        ))}
                      </div>
                      {info?.jackye && (
                        <div className="bg-primary/[0.04] rounded-md p-2.5 border border-primary/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Jackye Explains</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{info.jackye}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Board Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Board Documents
          </CardTitle>
          <p className="text-xs text-muted-foreground">Key governance filings for {companyName}.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Proxy Statement (DEF 14A)", desc: "Executive compensation, board composition, shareholder proposals.", jackye: "The single most important document for understanding who runs the company and how they're incentivized.", url: secEdgarUrl },
            { title: "Annual Report (10-K)", desc: "Business operations, financials, risk factors, legal proceedings.", jackye: "The Risk Factors section is gold — companies must disclose what could hurt them.", url: ticker ? `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&type=10-K&action=getcompany` : null },
          ].map((doc) => (
            <div key={doc.title} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground">{doc.desc}</p>
                </div>
                {doc.url && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /> SEC</a>
                  </Button>
                )}
              </div>
              <div className="bg-primary/[0.04] rounded-md p-2.5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Jackye Explains</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{doc.jackye}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Learn More */}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/board-intelligence"><BookOpen className="w-4 h-4" /> Learn How Corporate Boards Work</Link>
        </Button>
      </div>
    </div>
  );
}
