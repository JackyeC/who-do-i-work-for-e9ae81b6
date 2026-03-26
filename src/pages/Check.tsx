import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { AuditRequestForm } from "@/components/AuditRequestForm";
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
  ClipboardCheck, Users, Upload, ExternalLink, Briefcase,
  MapPin, Globe, Clock,
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
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const SCAN_STEPS = [
  "Finding careers page…",
  "Scanning hiring signals…",
  "Pulling open roles…",
];

function AddCompanyCard({ companyName, onDiscovered }: { companyName: string; onDiscovered: (id: string, slug: string, name: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanFailed, setScanFailed] = useState(false);
  const { containerRef, getToken, resetToken } = useTurnstile();

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [scanning]);

  const handleScan = async () => {
    setScanning(true);
    setScanStep(0);
    setScanFailed(false);

    const token = await getToken();
    const verified = token ? await verifyTurnstileToken(token) : false;
    resetToken();

    if (!verified) {
      setScanFailed(true);
      setScanning(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("company-discover", {
        body: { companyName, searchQuery: companyName },
      });
      if (error) throw error;
      if (data?.companyId && data?.slug) {
        toast.success("Company discovered! Loading intelligence…");
        onDiscovered(data.companyId, data.slug, data.identity?.name || companyName);
      } else {
        setScanFailed(true);
      }
    } catch {
      setScanFailed(true);
    } finally {
      setScanning(false);
    }
  };

  if (scanFailed) {
    return (
      <div className="p-2">
        <AuditRequestForm companyName={companyName} onClose={() => setScanFailed(false)} />
      </div>
    );
  }

  return (
    <div className="p-4 text-center space-y-3">
      <div ref={containerRef} />
      <p className="text-sm text-muted-foreground">
        Can't find <span className="font-semibold text-foreground">{companyName}</span>?
      </p>
      <p className="text-xs text-muted-foreground">If we don't have it, we'll build it.</p>
      {scanning && (
        <div className="space-y-2 py-2">
          {SCAN_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 justify-center">
              {i < scanStep ? (
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              ) : i === scanStep ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
              )}
              <span className={`text-xs ${i <= scanStep ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
      <Button onClick={handleScan} disabled={scanning} size="sm" className="gap-2">
        {scanning ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Live Scan in Progress…
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5" />
            + Add {companyName}
          </>
        )}
      </Button>
    </div>
  );
}

const WORK_MODE_COLORS: Record<string, string> = {
  remote: "bg-civic-green/10 text-civic-green border-civic-green/20",
  hybrid: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20",
  onsite: "bg-sky-500/10 text-sky-700 border-sky-500/20",
};

function OpenRolesSection({ companyId, companyName }: { companyId: string; companyName: string }) {
  const pollingCountRef = useRef(0);
  const [shouldPoll, setShouldPoll] = useState(true);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["check-open-roles", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, department, salary_range, url, posted_at, source_url")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Array<{
        id: string; title: string; location: string | null; work_mode: string | null;
        department: string | null; salary_range: string | null; url: string | null;
        posted_at: string | null; source_url: string | null;
      }>;
    },
    enabled: !!companyId,
    refetchInterval: shouldPoll ? 5000 : false,
  });

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setShouldPoll(false);
    } else {
      pollingCountRef.current += 1;
      if (pollingCountRef.current >= 12) {
        setShouldPoll(false);
      }
    }
  }, [jobs]);

  // Reset polling when companyId changes
  useEffect(() => {
    pollingCountRef.current = 0;
    setShouldPoll(true);
  }, [companyId]);

  if (isLoading && (!jobs || (jobs as any[]).length === 0)) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-display text-foreground">Open Roles</h3>
          </div>
          <div className="space-y-2 py-2">
            {SCAN_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i === 0 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
                )}
                <span className={`text-xs ${i === 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobs || jobs.length === 0) {
    if (shouldPoll) {
      return (
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold font-display text-foreground">Open Roles</h3>
            </div>
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Scanning {companyName} careers page…</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-display text-foreground">Open Roles</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Still scanning careers page — check back soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-display text-foreground">Open Roles</h3>
            <Badge variant="secondary" className="text-xs">{jobs.length}</Badge>
          </div>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={job.url || job.source_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {job.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </div>
                  )}
                  {job.department && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{job.department}</span>
                    </>
                  )}
                  {job.salary_range && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-foreground font-medium">{job.salary_range}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {job.work_mode && (
                  <Badge variant="outline" className={`text-xs py-0 ${WORK_MODE_COLORS[job.work_mode] || ''}`}>
                    {job.work_mode}
                  </Badge>
                )}
                {job.posted_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
      const [stancesRes, linkagesRes, darkRes, tradeRes, lobbyRes, signalsRes, companyRes, candidatesRes] = await Promise.all([
        supabase.from("company_public_stances").select("*").eq("company_id", selectedCompanyId!),
        (supabase as any).from("entity_linkages").select("*").eq("company_id", selectedCompanyId!).limit(100),
        supabase.from("company_dark_money").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_trade_associations").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_state_lobbying").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("company_signal_scans").select("*").eq("company_id", selectedCompanyId!),
        supabase.from("companies").select("last_audited_at, last_reviewed").eq("id", selectedCompanyId!).maybeSingle(),
        supabase.from("company_candidates").select("*").eq("company_id", selectedCompanyId!),
      ]);
      return {
        stances: stancesRes.data || [],
        linkages: linkagesRes.data || [],
        darkMoney: darkRes.data || [],
        tradeAssociations: tradeRes.data || [],
        lobbyingRecords: lobbyRes.data || [],
        signalScans: signalsRes.data || [],
        candidates: candidatesRes.data || [],
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
              {!selectedCompanyId && searchTerm.length >= 2 && (
                <Card className="absolute z-10 w-full mt-1 shadow-lg">
                  <CardContent className="p-1">
                    {searchResults && searchResults.length > 0 ? (
                      searchResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCompany(c.id, c.name, c.slug)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.industry}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <AddCompanyCard
                        companyName={searchTerm}
                        onDiscovered={(id, slug, name) => {
                          selectCompany(id, name, slug);
                        }}
                      />
                    )}
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
                candidates={policyData.candidates}
              />

              {/* 6. Open Roles */}
              <OpenRolesSection companyId={selectedCompanyId} companyName={selectedCompanyName} />

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
              <p className="text-sm">Select your priorities above, then search for any company to begin.</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Don't see a company? Just type the name — we'll research it for you.</p>
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
                  <p className="text-xs text-muted-foreground">Score and review a job offer</p>
                </div>
              </button>
              <button
                onClick={() => navigate("/voter-lookup")}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 transition-colors text-left"
              >
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">What Am I Supporting?</p>
                  <p className="text-xs text-muted-foreground">Explore political funding links</p>
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
