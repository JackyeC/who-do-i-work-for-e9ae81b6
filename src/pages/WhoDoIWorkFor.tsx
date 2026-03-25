import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { formatCurrency } from "@/data/sampleData";
import {
  Building2, Search, Loader2, User, DollarSign, AlertTriangle,
  ExternalLink, LogOut, Flag, Users, Briefcase, ArrowRight,
  UserCheck, Scale, Megaphone, X, ChevronRight
} from "lucide-react";
import { WorkforceEquityModule } from "@/components/workforce-equity/WorkforceEquityModule";
import { FlightRiskModule } from "@/components/flight-risk/FlightRiskModule";
import { EntityDetailDrawer, type DarkMoneyEntity } from "@/components/company/EntityDetailDrawer";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  industry: string;
  state: string;
  civic_footprint_score: number;
  total_pac_spending: number;
  lobbying_spend: number | null;
}

const partyColors: Record<string, string> = {
  D: "bg-civic-blue/10 text-civic-blue border-civic-blue/30",
  R: "bg-civic-red/10 text-civic-red border-civic-red/30",
  I: "bg-muted text-muted-foreground",
};

export default function WhoDoIWorkFor() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDarkEntity, setSelectedDarkEntity] = useState<DarkMoneyEntity | null>(null);

  // Get user profile with employer
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, employer_company:companies(*)")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Search companies
  const { data: searchResults } = useQuery({
    queryKey: ["company-search", searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend")
        .ilike("name", `%${searchQuery}%`)
        .order("name")
        .limit(10);
      return (data || []) as CompanyOption[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Set employer mutation
  const setEmployer = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ employer_company_id: companyId })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setShowSearch(false);
      setSearchQuery("");
      toast({ title: "Employer set!", description: "Your political spending dashboard is ready." });
    },
  });

  const employerCompany = (profile as any)?.employer_company;
  const companyId = employerCompany?.id;

  // PAC candidates funded by employer
  const { data: candidates } = useQuery({
    queryKey: ["employer-candidates", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_candidates")
        .select("*")
        .eq("company_id", companyId!)
        .order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Executives and their donations
  const { data: executives } = useQuery({
    queryKey: ["employer-executives", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("*, executive_recipients(*)")
        .eq("company_id", companyId!)
        .order("total_donations", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Board affiliations
  const { data: boardAffs } = useQuery({
    queryKey: ["employer-board", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_board_affiliations")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Dark money
  const { data: darkMoney } = useQuery({
    queryKey: ["employer-dark-money", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_dark_money")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Party breakdown
  const { data: partyBreakdown } = useQuery({
    queryKey: ["employer-party", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_party_breakdown")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalPacToReps = (candidates || []).reduce((s, c) => s + (c.amount || 0), 0);
  const totalExecDonations = (executives || []).reduce((s, e) => s + (e.total_donations || 0), 0);
  const flaggedCandidates = (candidates || []).filter((c) => c.flagged);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* User bar */}
        <div className="flex items-center justify-between mb-8">
          <div />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">
              Who Do I Work For?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See which politicians your employer's PAC, executives, and board members are funding — and what they're buying.
            </p>
          </div>

          {/* Employer Selection */}
          {!employerCompany || showSearch ? (
            <Card className="mb-10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {employerCompany ? "Change Your Employer" : "Set Your Employer"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for your employer (e.g. Amazon, Boeing, JPMorgan)..."
                    className="pl-10"
                    autoFocus
                  />
                  {showSearch && (
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowSearch(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {searchResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setEmployer.mutate(company.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{company.name}</span>
                            <p className="text-xs text-muted-foreground">{company.industry} · {company.state}</p>
                          </div>
                        </div>
                        <CivicFootprintBadge score={company.civic_footprint_score} size="sm" />
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">No companies found matching "{searchQuery}"</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Employer Header */}
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">You work for</p>
                        <h2 className="text-2xl font-bold text-foreground">{employerCompany.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{employerCompany.industry} · {employerCompany.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CivicFootprintBadge score={employerCompany.civic_footprint_score} />
                      <Button variant="outline" size="sm" onClick={() => setShowSearch(true)}>Change</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      PAC → Politicians
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(totalPacToReps)}</div>
                    <p className="text-xs text-muted-foreground">{(candidates || []).length} recipients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Executive Giving
                    </div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(totalExecDonations)}</div>
                    <p className="text-xs text-muted-foreground">{(executives || []).length} executives</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Megaphone className="w-3.5 h-3.5" />
                      Lobbying
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {employerCompany.lobbying_spend ? formatCurrency(employerCompany.lobbying_spend) : "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Flagged
                    </div>
                    <div className="text-xl font-bold text-foreground">{flaggedCandidates.length}</div>
                    <p className="text-xs text-muted-foreground">flagged donations</p>
                  </CardContent>
                </Card>
              </div>

              {/* PAC-Funded Politicians */}
              {(candidates || []).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Flag className="w-5 h-5" />
                      Politicians Funded by Your Employer's PAC
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Amounts shown are aggregate totals from public filings. Individual contributions are not itemized below unless broken out by type.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(candidates || []).map((c) => (
                        <div key={c.id} className="rounded-lg border border-border overflow-hidden">
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium text-foreground">{c.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{c.state}{c.district ? `-${c.district}` : ""}</span>
                                  <span>·</span>
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                                    {c.donation_type.replace(/-/g, " ")}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {c.flagged && (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  {c.flag_reason || "Flagged"}
                                </Badge>
                              )}
                              <Badge variant="outline" className={partyColors[c.party] || partyColors.I}>
                                {c.party}
                              </Badge>
                              <div className="text-right">
                                <span className="font-semibold text-foreground">{formatCurrency(c.amount)}</span>
                                <p className="text-xs text-muted-foreground">aggregate est.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Executive Donations */}
              {(executives || []).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Executive Personal Donations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(executives || []).map((exec: any) => (
                        <div key={exec.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-foreground">{exec.name}</span>
                              <p className="text-xs text-muted-foreground">{exec.title}</p>
                            </div>
                            <span className="font-bold text-foreground">{formatCurrency(exec.total_donations)}</span>
                          </div>
                          {exec.executive_recipients && exec.executive_recipients.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {exec.executive_recipients.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between text-sm pl-4 py-1">
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{r.name}</span>
                                    <Badge variant="outline" className={`text-xs ${partyColors[r.party] || partyColors.I}`}>{r.party}</Badge>
                                  </div>
                                  <span className="text-foreground">{formatCurrency(r.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Board Affiliations */}
              {(boardAffs || []).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      Board & Political Affiliations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(boardAffs || []).map((b) => (
                        <Badge key={b.id} variant="secondary">{b.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dark Money */}
              {(darkMoney || []).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Dark Money Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(darkMoney || []).map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDarkEntity(d)}
                          className="flex items-center justify-between w-full p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-left hover:bg-destructive/10 transition-colors group"
                        >
                          <div>
                            <span className="font-medium text-foreground">{d.name}</span>
                            <p className="text-xs text-muted-foreground">{d.org_type} · {d.relationship}</p>
                            {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {d.estimated_amount && (
                              <span className="font-semibold text-foreground">{formatCurrency(d.estimated_amount)}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No data state */}
              {(candidates || []).length === 0 && (executives || []).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground mb-1">No political spending data tracked yet for {employerCompany.name}.</p>
                    <p className="text-xs text-muted-foreground">Run scans on the <Link to={`/company/${employerCompany.slug}`} className="text-primary hover:underline">company profile</Link> to populate data.</p>
                  </CardContent>
                </Card>
              )}

              {/* Workforce Equity & Advancement Module */}
              <div className="mt-10 pt-8 border-t border-border">
                <WorkforceEquityModule
                  companyName={employerCompany.name}
                  companyId={employerCompany.id}
                />
              </div>

              {/* Employee Flight Risk Map */}
              <div className="mt-10 pt-8 border-t border-border">
                <FlightRiskModule
                  companyName={employerCompany.name}
                  companyId={employerCompany.id}
                />
              </div>

              {/* CTA to full profile */}
              <div className="text-center mt-8">
                <Link to={`/company/${employerCompany.slug}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Full {employerCompany.name} Profile
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <EntityDetailDrawer
        entity={selectedDarkEntity}
        companyName={employerCompany?.name}
        open={!!selectedDarkEntity}
        onOpenChange={(open) => { if (!open) setSelectedDarkEntity(null); }}
      />
      <Footer />
    </div>
  );
}
