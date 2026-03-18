import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Shield, Search, Loader2, Building2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SituationSelector } from "@/components/policy-intelligence/SituationSelector";
import { MismatchEngine } from "@/components/policy-intelligence/MismatchEngine";
import { PolicyReceiptsPanel } from "@/components/policy-intelligence/PolicyReceiptsPanel";
import { PolicyIntelligenceSummary } from "@/components/policy-intelligence/PolicyIntelligenceSummary";
import { LeadershipSnapshot } from "@/components/policy-intelligence/LeadershipSnapshot";
import { CompensationInsight } from "@/components/policy-intelligence/CompensationInsight";
import { IssueBreakdownGrid } from "@/components/policy-intelligence/IssueBreakdownGrid";
import { LastAuditedStamp } from "@/components/company/LastAuditedStamp";
import { computePolicyScore, getSituationsFromStorage, type Situation } from "@/lib/policyScoreEngine";

export default function PolicyIntelligence() {
  const [searchParams] = useSearchParams();
  const initialCompany = searchParams.get("company") || "";
  const [searchTerm, setSearchTerm] = useState(initialCompany);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [situations, setSituations] = useState<Situation[]>(getSituationsFromStorage());

  // Company search
  const { data: searchResults } = useQuery({
    queryKey: ["pi-search", searchTerm],
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

  // Auto-select if query param matches
  useQuery({
    queryKey: ["pi-auto", initialCompany],
    queryFn: async () => {
      if (!initialCompany) return null;
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", `%${initialCompany}%`)
        .limit(1)
        .maybeSingle();
      if (data) {
        setSelectedCompanyId(data.id);
        setSelectedCompanyName(data.name);
        setSearchTerm(data.name);
      }
      return data;
    },
    enabled: !!initialCompany && !selectedCompanyId,
  });

  // Fetch all policy data for selected company
  const { data: policyData, isLoading } = useQuery({
    queryKey: ["pi-data", selectedCompanyId],
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

  const selectCompany = (id: string, name: string) => {
    setSelectedCompanyId(id);
    setSelectedCompanyName(name);
    setSearchTerm(name);
  };

  return (
    <>
      <Helmet>
        <title>Policy Intelligence | Who Do I Work For</title>
        <meta name="description" content="Situation-aware policy intelligence and governance analysis for career decisions." />
      </Helmet>
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Policy Intelligence</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Understand how a company's governance, spending, and public positions align — weighted to what matters most in your situation.
          </p>
        </div>

        {/* Situation Selector */}
        <Card>
          <CardContent className="p-5">
            <SituationSelector value={situations} onChange={setSituations} />
          </CardContent>
        </Card>

        {/* Company Search */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedCompanyId) {
                    setSelectedCompanyId(null);
                    setSelectedCompanyName("");
                  }
                }}
                placeholder="Search for a company..."
                className="pl-9"
              />
            </div>
            {selectedCompanyId && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedCompanyId(null); setSelectedCompanyName(""); setSearchTerm(""); }}>
                Clear
              </Button>
            )}
          </div>

          {searchResults && searchResults.length > 0 && !selectedCompanyId && (
            <Card className="absolute z-10 w-full mt-1 shadow-lg">
              <CardContent className="p-1">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCompany(c.id, c.name)}
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

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing policy data...</span>
          </div>
        )}

        {/* Results */}
        {scoreResult && policyData && (
          <div className="space-y-8">
            {/* Last Verified */}
            <div className="flex justify-center">
              <LastAuditedStamp lastAuditedAt={policyData.lastAuditedAt} lastReviewed={policyData.lastReviewed} />
            </div>

            <PolicyIntelligenceSummary
              result={scoreResult}
              companyName={selectedCompanyName}
              situations={situations}
            />

            {/* Issue-by-Issue Breakdown */}
            <IssueBreakdownGrid stances={policyData.stances} />

            <MismatchEngine
              stances={policyData.stances}
              darkMoney={policyData.darkMoney}
              tradeAssociations={policyData.tradeAssociations}
            />

            {/* Leadership Snapshot */}
            {selectedCompanyId && (
              <LeadershipSnapshot companyId={selectedCompanyId} companyName={selectedCompanyName} />
            )}

            {/* Compensation Insight */}
            {selectedCompanyId && (
              <CompensationInsight companyId={selectedCompanyId} companyName={selectedCompanyName} situations={situations} />
            )}

            <PolicyReceiptsPanel
              stances={policyData.stances}
              linkages={policyData.linkages}
              lobbyingRecords={policyData.lobbyingRecords}
              tradeAssociations={policyData.tradeAssociations}
              darkMoney={policyData.darkMoney}
            />

            {/* Transparency Disclaimer */}
            <div className="p-4 rounded-lg border border-border/30 bg-muted/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">About this analysis:</strong> Policy scores reflect publicly available governance, spending, and disclosure records.
                Signals do not imply wrongdoing. Data may be incomplete. Alignment analysis is based on observable patterns, not internal company intent.
                This tool is designed to inform your decisions — not to make them for you.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedCompanyId && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select your priorities above, then search for a company to begin.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
