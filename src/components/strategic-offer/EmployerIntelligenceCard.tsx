import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Building2, DollarSign, Megaphone, Users, Flag, AlertTriangle,
  ExternalLink, Scale, ArrowRight, ShieldAlert, Heart, TrendingUp,
  Landmark, Eye, CheckCircle2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function EmployerIntelligenceCard({ companyId, companyName }: Props) {
  // Fetch company basics
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["offer-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, civic_footprint_score, total_pac_spending, lobbying_spend, corporate_pac_exists, industry, state, description")
        .eq("id", companyId!)
        .single();
      return data;
    },
  });

  // Fetch party breakdown
  const { data: partyBreakdown } = useQuery({
    queryKey: ["offer-party", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_party_breakdown")
        .select("party, amount")
        .eq("company_id", companyId!);
      return data || [];
    },
  });

  // Fetch top candidates
  const { data: topCandidates } = useQuery({
    queryKey: ["offer-candidates", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_candidates")
        .select("name, party, amount, flagged, flag_reason")
        .eq("company_id", companyId!)
        .order("amount", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch hypocrisy index
  const { data: hypocrisy } = useQuery({
    queryKey: ["offer-hypocrisy", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_hypocrisy_index")
        .select("chi_score, chi_grade, direct_conflicts, aligned_stances, total_stances")
        .eq("company_id", companyId!)
        .maybeSingle();
      return data;
    },
  });

  // Fetch lobbying linkages
  const { data: lobbyingLinks } = useQuery({
    queryKey: ["offer-lobbying", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_lobbying_linkages" as any)
        .select("lobby_firm, amount, issues_lobbied")
        .eq("company_id", companyId!)
        .order("amount", { ascending: false })
        .limit(3);
      return (data as any[]) || [];
    },
  });

  // Fetch public stances
  const { data: stances } = useQuery({
    queryKey: ["offer-stances", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("topic, public_position, spending_reality, gap")
        .eq("company_id", companyId!)
        .limit(5);
      return data || [];
    },
  });

  // Fetch ideology flags
  const { data: ideologyFlags } = useQuery({
    queryKey: ["offer-ideology", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_ideology_flags")
        .select("category, org_name, severity, description")
        .eq("company_id", companyId!)
        .limit(5);
      return data || [];
    },
  });

  if (!companyId) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-8 text-center space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-foreground">Company Not Matched</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The company "{companyName}" wasn't matched to our database. Try selecting from the autocomplete suggestions during offer entry, or{" "}
            <Link to="/add-company" className="text-primary hover:underline">add it to our database</Link> first.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (companyLoading) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Company data not found.</p>
        </CardContent>
      </Card>
    );
  }

  const totalPolitical = (company.total_pac_spending || 0) + (company.lobbying_spend || 0);
  const partyMap: Record<string, string> = {
    D: "text-blue-600 dark:text-blue-400",
    R: "text-red-600 dark:text-red-400",
    I: "text-muted-foreground",
  };

  const gapColors: Record<string, string> = {
    none: "text-civic-green",
    minor: "text-civic-yellow",
    moderate: "text-civic-yellow",
    major: "text-destructive",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="rounded-2xl border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Who Will You Work For?
            </CardTitle>
            <Link to={`/company/${company.slug}`}>
              <Badge variant="outline" className="text-xs gap-1 cursor-pointer hover:bg-accent">
                Full Profile <ExternalLink className="w-2.5 h-2.5" />
              </Badge>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Before you sign, consider the civic footprint of <span className="font-medium text-foreground">{company.name}</span>. This isn't about whether the offer is "good" — it's about what you'll be supporting.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{company.civic_footprint_score}</p>
              <p className="text-xs text-muted-foreground">Civic Score</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{formatCurrency(company.total_pac_spending || 0)}</p>
              <p className="text-xs text-muted-foreground">PAC Spending</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{formatCurrency(company.lobbying_spend || 0)}</p>
              <p className="text-xs text-muted-foreground">Lobbying</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Political Giving */}
      {topCandidates && topCandidates.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="w-4 h-4 text-primary" />
              Where the Political Money Goes
            </CardTitle>
            <p className="text-xs text-muted-foreground">Top recipients of PAC and executive donations.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Party split */}
            {partyBreakdown && partyBreakdown.length > 0 && (
              <div className="flex gap-2 mb-3">
                {partyBreakdown.map(pb => (
                  <Badge key={pb.party} variant="outline" className={cn("text-xs", partyMap[pb.party] || "")}>
                    {pb.party === "D" ? "Democrat" : pb.party === "R" ? "Republican" : pb.party}: {formatCurrency(pb.amount)}
                  </Badge>
                ))}
              </div>
            )}
            {topCandidates.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold w-5 text-center", partyMap[c.party] || "")}>{c.party}</span>
                  <span className="text-sm text-foreground">{c.name}</span>
                  {c.flagged && (
                    <Badge variant="destructive" className="text-xs">{c.flag_reason || "Flagged"}</Badge>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Say vs. Do */}
      {stances && stances.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              What They Say vs. What They Fund
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {hypocrisy ? `Hypocrisy Index: ${hypocrisy.chi_grade} (${hypocrisy.direct_conflicts} conflicts out of ${hypocrisy.total_stances} stances)` : "Comparing public positions to spending patterns."}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {stances.map((s, i) => (
              <div key={i} className="p-3 bg-muted/20 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{s.topic}</span>
                  <Badge variant="outline" className={cn("text-xs", gapColors[s.gap?.toLowerCase() || "none"] || "")}>
                    {s.gap || "Aligned"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium">Says:</span> {s.public_position}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium">Funds:</span> {s.spending_reality}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ideology Flags */}
      {ideologyFlags && ideologyFlags.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-civic-yellow" />
              Value & Ideology Signals
            </CardTitle>
            <p className="text-xs text-muted-foreground">Connections to organizations with documented ideological positions.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {ideologyFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-muted/20 rounded-lg">
                <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5",
                  f.severity === "critical" ? "text-destructive" :
                  f.severity === "high" ? "text-civic-yellow" : "text-muted-foreground"
                )} />
                <div>
                  <p className="text-xs font-medium text-foreground">{f.org_name}</p>
                  <p className="text-xs text-muted-foreground">{f.category} · {f.description?.substring(0, 120)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Things to Consider */}
      <Card className="rounded-2xl border-civic-yellow/20 bg-civic-yellow/[0.03]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-civic-yellow shrink-0" />
            <p className="text-xs font-semibold text-foreground">Things to Consider</p>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1.5 ml-6 list-disc">
            {totalPolitical > 0 && (
              <li>Your employer spends <span className="font-medium text-foreground">{formatCurrency(totalPolitical)}</span> on political influence. When you work here, your labor indirectly supports these activities.</li>
            )}
            {topCandidates && topCandidates.some(c => c.flagged) && (
              <li>Some donation recipients have been flagged for positions that may conflict with common employee values. Research their voting records.</li>
            )}
            {stances && stances.some(s => s.gap?.toLowerCase() === "major") && (
              <li>This company has <span className="font-medium text-foreground">major gaps</span> between what it publicly advocates and what it funds. This is a common pitfall — the brand may not match the spending.</li>
            )}
            {ideologyFlags && ideologyFlags.length > 0 && (
              <li>There are {ideologyFlags.length} ideology-related signals. These aren't inherently negative, but you should know about them before committing.</li>
            )}
            <li>This data comes from public filings (FEC, LDA, USAspending) — not opinions. <Link to={`/company/${company.slug}`} className="text-primary hover:underline">Explore the full evidence →</Link></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
