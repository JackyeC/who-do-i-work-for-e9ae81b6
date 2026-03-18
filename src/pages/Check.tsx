import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search, ArrowRight, Building2, Loader2, ShieldCheck,
  ClipboardCheck, Users, Upload, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SituationSelector } from "@/components/policy-intelligence/SituationSelector";
import { SituationContextBanner } from "@/components/policy-intelligence/SituationContextBanner";
import { PolicyIntelligenceSummary } from "@/components/policy-intelligence/PolicyIntelligenceSummary";
import { CompensationInsight } from "@/components/policy-intelligence/CompensationInsight";
import { LeadershipSnapshot } from "@/components/policy-intelligence/LeadershipSnapshot";
import { MismatchEngine } from "@/components/policy-intelligence/MismatchEngine";
import { PolicyReceiptsPanel } from "@/components/policy-intelligence/PolicyReceiptsPanel";
import { LastAuditedStamp } from "@/components/company/LastAuditedStamp";
import {
  computePolicyScore,
  getSituationsFromStorage,
  type Situation,
} from "@/lib/policyScoreEngine";

export default function Check() {
  const navigate = useNavigate();
  const [situations, setSituations] = useState<Situation[]>(getSituationsFromStorage());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [selectedCompanySlug, setSelectedCompanySlug] = useState("");

  // Live search
  const { data: searchResults } = useQuery({
    queryKey: ["check-search", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name, industry, slug")
        .ilike("name", `%${searchTerm}%`)
        .limit(8);
      return data || [];
    },
    enabled: searchTerm.length >= 2 && !selectedCompanyId,
  });

  // Policy data fetch
  const { data: policyData, isLoading } = useQuery({
    queryKey: ["check-policy", selectedCompanyId],
    queryFn: async () => {
      const [stancesRes, linkagesRes, darkRes, tradeRes, lobbyRes, signalsRes, companyRes] = await Promise.all([
        supabase.from("company_public_stances").select("*").eq("company_id", selectedCompanyId!),
        (supabase as any).from("entity_linkages").select("*").eq("company_id", selectedCompanyId!).limit(100),
        supabase.from("company_dark_money").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_trade_associations").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_state_lobbying").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_signal_scans").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("companies").select("last_audited_at, last_reviewed").eq("id", selectedCompanyId!).maybeSingle(),
      ]);
      return {
        stances: stancesRes.data || [],
        linkages: linkagesRes.data || [],
        darkMoney: darkRes.data || [],
        tradeAssociations: tradeRes.data || [],
        lobbyingRecords: lobbyRes.data || [],
        signalScans: signalsRes.data || [],
        lastAuditedAt: companyRes.data?.last_audited_at,
        lastReviewed: companyRes.data?.last_reviewed,
      };
    },
    enabled: !!selectedCompanyId,
  });

  const scoreResult = useMemo(() => {
    if (!policyData) return null;
    return computePolicyScore(policyData, situations);
  }, [policyData, situations]);

  const selectCompany = (id: string, name: string, slug: string) => {
    setSelectedCompanyId(id);
    setSelectedCompanyName(name);
    setSelectedCompanySlug(slug);
    setSearchTerm(name);
  };

  const clearSelection = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName("");
    setSelectedCompanySlug("");
    setSearchTerm("");
  };

  return (
    <>
      <Helmet>
        <title>Check a Company | Who Do I Work For</title>
        <meta name="description" content="Situation-aware company check — understand if a company is right for you based on what matters most." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl space-y-8">

          {/* ─── SECTION 1: SITUATION SELECTOR ─── */}
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                Before we check the company… what matters most to you?
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                The same company can be a great fit or a bad decision depending on your situation.
                Choose what matters so we can show you what to actually watch for.
              </p>
            </div>

            <Card className="border-border/40">
              <CardContent className="p-5">
                <SituationSelector value={situations} onChange={setSituations} maxSelections={3} />
              </CardContent>
            </Card>
          </section>

          {/* ─── SECTION 2: COMPANY SEARCH ─── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold font-display text-foreground text-center">
              Now let's check this company for you
            </h2>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (selectedCompanyId) clearSelection();
                    }}
                    placeholder="Enter a company name"
                    className="pl-9"
                  />
                </div>
                {selectedCompanyId && (
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Search dropdown */}
              {searchResults && searchResults.length > 0 && !selectedCompanyId && (
                <Card className="absolute z-10 w-full mt-1 shadow-lg">
                  <CardContent className="p-1">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCompany(c.id, c.name, c.slug)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.industry}</p>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* ─── LOADING ─── */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing {selectedCompanyName}...</span>
            </div>
          )}

          {/* ─── SECTION 3: INLINE RESULTS ─── */}
          {scoreResult && policyData && selectedCompanyId && (
            <section className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

              {/* Situation context */}
              {situations.length > 0 && (
                <SituationContextBanner companyName={selectedCompanyName} />
              )}

              {/* Last verified */}
              <div className="flex justify-center">
                <LastAuditedStamp lastAuditedAt={policyData.lastAuditedAt} lastReviewed={policyData.lastReviewed} />
              </div>

              {/* 1. What This Means For You + Risks/Strengths */}
              <PolicyIntelligenceSummary
                result={scoreResult}
                companyName={selectedCompanyName}
                situations={situations}
              />

              {/* 2. Compensation Context */}
              <CompensationInsight
                companyId={selectedCompanyId}
                companyName={selectedCompanyName}
                situations={situations}
              />

              {/* 3. Leadership & Influence */}
              <LeadershipSnapshot
                companyId={selectedCompanyId}
                companyName={selectedCompanyName}
              />

              {/* 4. Contradictions */}
              <MismatchEngine
                stances={policyData.stances}
                darkMoney={policyData.darkMoney}
                tradeAssociations={policyData.tradeAssociations}
              />

              {/* 5. Evidence / Sources */}
              <PolicyReceiptsPanel
                stances={policyData.stances}
                linkages={policyData.linkages}
                lobbyingRecords={policyData.lobbyingRecords}
                tradeAssociations={policyData.tradeAssociations}
                darkMoney={policyData.darkMoney}
              />

              {/* View Full Dossier CTA */}
              {selectedCompanySlug && (
                <div className="text-center">
                  <Button onClick={() => navigate(`/company/${selectedCompanySlug}`)} className="gap-2">
                    View Full Dossier <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Transparency disclaimer */}
              <div className="p-4 rounded-lg border border-border/30 bg-muted/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">About this analysis:</strong> Scores reflect publicly available governance, spending, and disclosure records.
                  Signals do not imply wrongdoing. Data may be incomplete. This tool helps inform your decisions — not make them for you.
                </p>
              </div>
            </section>
          )}

          {/* ─── EMPTY STATE ─── */}
          {!selectedCompanyId && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select your priorities above, then search for a company to begin.</p>
            </div>
          )}

          {/* ─── OTHER TOOLS ─── */}
          <section className="pt-4 border-t border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground text-center">Other tools</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/strategic-offer-review")}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 transition-colors text-left"
              >
                <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Offer Check</p>
                  <p className="text-[11px] text-muted-foreground">Score and review a job offer</p>
                </div>
              </button>
              <button
                onClick={() => navigate("/voter-lookup")}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 transition-colors text-left"
              >
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">What Am I Supporting?</p>
                  <p className="text-[11px] text-muted-foreground">Explore political funding links</p>
                </div>
              </button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
