import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceLabel, classifyClaim, type SourceTier } from "@/components/ui/source-label";
import DiscoveryMode from "@/components/offer-check/DiscoveryMode";
import CompanyIntelligenceSection from "@/components/offer-check/CompanyIntelligenceSection";
import CareerIntelligenceSection from "@/components/offer-check/CareerIntelligenceSection";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShieldCheck, AlertTriangle, XCircle, Lock,
  ExternalLink, ArrowRight, CheckCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface Signal {
  title: string;
  explanation: string;
  tier: SourceTier;
  sourceUrl?: string | null;
  /** Internal link for drill-down (e.g. dossier spending tab) */
  link?: string | null;
}

interface CompanyResult {
  id: string;
  name: string;
  slug: string;
  industry: string;
  description: string | null;
  civic_footprint_score: number;
  employer_clarity_score: number | null;
  website_url: string | null;
  record_status: string | null;
}

/* ─── Verdict logic ─── */
function deriveVerdict(score: number): { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck } {
  if (score >= 60) return { label: "Low Risk", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30", icon: ShieldCheck };
  if (score >= 35) return { label: "Medium Risk", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30", icon: AlertTriangle };
  return { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: XCircle };
}

/* ─── Build signals from real data ─── */
function buildSignals(company: CompanyResult, extras: {
  hasLobbyingData: boolean;
  lobbyingSpend: number;
  hasPacData: boolean;
  pacSpending: number;
  claimsCount: number;
  verifiedClaimsCount: number;
  signalCount: number;
  hasLayoffs: boolean;
  hasDiversity: boolean;
}): Signal[] {
  const signals: Signal[] = [];

  // Political spending
  if (extras.hasPacData) {
    signals.push({
      title: "Political Spending Detected",
      explanation: `This company has $${extras.pacSpending.toLocaleString()} in PAC spending on record.`,
      tier: "verified",
      sourceUrl: null,
      link: `/dossier/${company.slug}#political-influence`,
    });
  }

  // Lobbying
  if (extras.hasLobbyingData) {
    signals.push({
      title: "Lobbying Activity",
      explanation: `Reported lobbying spend: $${extras.lobbyingSpend.toLocaleString()}.`,
      tier: "verified",
      sourceUrl: null,
      link: `/dossier/${company.slug}#lobbying`,
    });
  }

  // Corporate claims alignment
  if (extras.claimsCount > 0) {
    const pct = extras.verifiedClaimsCount > 0
      ? Math.round((extras.verifiedClaimsCount / extras.claimsCount) * 100)
      : 0;
    signals.push({
      title: "Corporate Claims Tracked",
      explanation: `${extras.claimsCount} public claims found. ${pct}% have verified sources.`,
      tier: extras.verifiedClaimsCount > 0 ? "multi_source" : "inferred",
    });
  }

  // Layoff history
  if (extras.hasLayoffs) {
    signals.push({
      title: "Layoff History",
      explanation: "WARN Act notices or layoff events found in public records.",
      tier: "verified",
      link: `/dossier/${company.slug}#workforce`,
    });
  } else {
    signals.push({
      title: "Layoff History",
      explanation: "No public evidence found for this signal yet.",
      tier: "no_evidence",
    });
  }

  // Diversity disclosures
  if (extras.hasDiversity) {
    signals.push({
      title: "Diversity Disclosure",
      explanation: "This company has published diversity or EEO-1 data.",
      tier: "verified",
    });
  }

  // Employer clarity
  if (company.employer_clarity_score != null && company.employer_clarity_score > 0) {
    signals.push({
      title: "Employer Transparency Score",
      explanation: `Scored ${company.employer_clarity_score}/100 based on available evidence depth.`,
      tier: "multi_source",
    });
  }

  return signals.slice(0, 5);
}

/* ─── Summary generator ─── */
function buildSummary(company: CompanyResult, signals: Signal[]): string {
  const hasRisk = signals.some(s => s.title.includes("Political") || s.title.includes("Lobbying") || s.title.includes("Layoff"));
  const hasPositive = signals.some(s => s.title.includes("Diversity") || s.title.includes("Transparency"));

  if (!hasRisk && !hasPositive) {
    return `Limited public data is available for ${company.name}. We recommend requesting a full report for deeper analysis.`;
  }
  if (hasRisk && hasPositive) {
    return `${company.name} shows transparency in some areas, but political spending and workforce signals warrant closer review before accepting an offer.`;
  }
  if (hasRisk) {
    return `${company.name} has political spending or workforce signals on record that may be worth reviewing before making a decision.`;
  }
  return `${company.name} shows positive transparency signals. A full report would confirm whether this extends across all categories.`;
}

/* ════════════════════════════════════════════ */
/*                  PAGE                       */
/* ════════════════════════════════════════════ */

export default function OfferCheckEntry() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

  usePageSEO({
    title: "Check a Company — Should You Take This Job?",
    description: "Enter any company name and instantly see risk signals, political spending, layoff history, and source verification. Free employer check before you apply or accept.",
    path: "/offer-check",
  });

  // ─── Company lookup ───
  const { data: company, isLoading, isFetched } = useQuery({
    queryKey: ["offer-check-lookup", searchTerm, resolvedCompanyId],
    queryFn: async () => {
      if (!searchTerm) return null;

      if (resolvedCompanyId) {
        const { data } = await supabase
          .from("companies")
          .select("id, name, slug, industry, description, civic_footprint_score, employer_clarity_score, website_url, record_status")
          .eq("id", resolvedCompanyId)
          .maybeSingle();

        return (data ?? null) as CompanyResult | null;
      }

      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, description, civic_footprint_score, employer_clarity_score, website_url, record_status")
        .ilike("name", `%${searchTerm}%`)
        .order("civic_footprint_score", { ascending: false })
        .limit(1);

      return (data && data.length > 0 ? data[0] : null) as CompanyResult | null;
    },
    enabled: !!searchTerm,
  });

  // ─── Extra signals data ───
  const { data: extras, isLoading: extrasLoading } = useQuery({
    queryKey: ["offer-check-extras", company?.id],
    queryFn: async () => {
      const cid = company!.id;
      const [claims, verifiedClaims, signals, layoffs, diversity] = await Promise.all([
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).eq("company_id", cid),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).eq("company_id", cid).not("claim_source_url", "is", null),
        supabase.from("company_signal_scans" as any).select("id", { count: "exact", head: true }).eq("company_id", cid),
        supabase.from("company_warn_notices" as any).select("id", { count: "exact", head: true }).eq("company_id", cid),
        supabase.from("company_diversity_disclosures").select("id", { count: "exact", head: true }).eq("company_id", cid),
      ]);
      return {
        hasLobbyingData: (company!.civic_footprint_score ?? 0) > 0,
        lobbyingSpend: 0,
        hasPacData: false,
        pacSpending: 0,
        claimsCount: claims.count ?? 0,
        verifiedClaimsCount: verifiedClaims.count ?? 0,
        signalCount: signals.count ?? 0,
        hasLayoffs: (layoffs.count ?? 0) > 0,
        hasDiversity: (diversity.count ?? 0) > 0,
      };
    },
    enabled: !!company?.id,
  });

  // ─── Enriched company data ───
  const { data: companyFinancial } = useQuery({
    queryKey: ["offer-check-financial", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("lobbying_spend, total_pac_spending")
        .eq("id", company!.id)
        .single();
      return data;
    },
    enabled: !!company?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      setResolvedCompanyId(null);
      setSearchTerm(companyName.trim());
    }
  };

  const enrichedExtras = extras && companyFinancial ? {
    ...extras,
    lobbyingSpend: companyFinancial.lobbying_spend ?? 0,
    hasLobbyingData: (companyFinancial.lobbying_spend ?? 0) > 0,
    hasPacData: (companyFinancial.total_pac_spending ?? 0) > 0,
    pacSpending: companyFinancial.total_pac_spending ?? 0,
  } : extras;

  const signals = company && enrichedExtras ? buildSignals(company, enrichedExtras) : [];
  const verdict = company ? deriveVerdict(company.civic_footprint_score) : null;
  const summary = company && signals.length > 0 ? buildSummary(company, signals) : null;
  const firstSource = signals.find(s => s.tier === "verified" && s.sourceUrl);

  const showResult = isFetched && searchTerm;
  const isResultLoading = isLoading || extrasLoading;
  const showDiscoveryMode = !company || (
    !resolvedCompanyId &&
    (company.record_status === "discovered" || company.record_status === "research_in_progress")
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">

        {/* ═══ SECTION 1: HERO ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
            Check who you're really working for
            <br />
            <span className="text-primary">before you say yes.</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            Real signals. Real data. No opinions.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-3 mb-12">
          <Input
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-12 text-base bg-card border-border"
            required
          />
          <Input
            placeholder="Role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-12 text-base bg-card border-border"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!companyName.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check this company
          </Button>
        </form>

        {/* ═══ RESULTS ═══ */}
        <AnimatePresence mode="wait">
          {showResult && (
            <motion.div
              key={searchTerm}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {isResultLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-40 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                </div>
              ) : showDiscoveryMode ? (
                <DiscoveryMode companyName={searchTerm!} onResolved={setResolvedCompanyId} />
              ) : (
                <>
                  {/* ═══ SECTION 2: VERDICT ═══ */}
                  <div className={cn(
                    "rounded-2xl border p-6 text-center",
                    verdict!.bg, verdict!.border
                  )}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {(() => { const VIcon = verdict!.icon; return <VIcon className={cn("w-5 h-5", verdict!.color)} />; })()}
                      <Badge variant="outline" className={cn("text-sm font-semibold px-3 py-0.5", verdict!.color, verdict!.border)}>
                        {verdict!.label}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>
                    {role && <p className="text-xs text-muted-foreground mt-0.5">Role: {role}</p>}
                  </div>

                  {/* ═══ SECTION 3: TOP SIGNALS (free: max 3) ═══ */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                      Top Signals
                    </h3>
                    {signals.length === 0 ? (
                      <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-sm text-muted-foreground italic">No public evidence found for this company yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {signals.slice(0, 3).map((signal, i) => {
                          const Wrapper = signal.link ? "a" : "div";
                          const wrapperProps = signal.link
                            ? { href: signal.link, onClick: (e: React.MouseEvent) => { e.preventDefault(); navigate(signal.link!); } }
                            : {};
                          return (
                            <Wrapper
                              key={i}
                              {...(wrapperProps as any)}
                              className={cn(
                                "bg-card border border-border rounded-xl p-4 block",
                                signal.link && "cursor-pointer hover:border-primary/40 transition-colors group"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={cn("text-sm font-medium text-foreground", signal.link && "group-hover:text-primary transition-colors")}>
                                    {signal.title}
                                    {signal.link && <ArrowRight className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{signal.explanation}</p>
                                </div>
                                <SourceLabel tier={signal.tier} url={signal.sourceUrl} className="shrink-0 mt-0.5" />
                              </div>
                            </Wrapper>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ═══ SECTION 4: SUMMARY ═══ */}
                  {summary && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-sm text-foreground leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {/* ═══ COMPANY INTELLIGENCE ═══ */}
                  <CompanyIntelligenceSection companyId={company.id} companyName={company.name} />

                  {/* ═══ CAREER INTELLIGENCE ═══ */}
                  <CareerIntelligenceSection
                    companyId={company.id}
                    companyName={company.name}
                    role={role || undefined}
                    civicScore={company.civic_footprint_score}
                    employerClarityScore={company.employer_clarity_score}
                  />

                  {/* ═══ UPGRADE MOMENT ═══ */}
                  <div className="relative">
                    {/* Fade-out teaser of locked signals */}
                    {signals.length > 3 && (
                      <div className="space-y-2 mb-4">
                        {signals.slice(3, 5).map((signal, i) => (
                          <div key={i} className="bg-card border border-border rounded-xl p-4 opacity-40 pointer-events-none select-none blur-[2px]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{signal.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{signal.explanation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                      <Lock className="w-6 h-6 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        Unlock the full breakdown before you decide
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                        The free check gives you a snapshot. The full report gives you leverage.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 my-4">
                        {[
                          "Leadership & Influence",
                          "Layoff History",
                          "Compensation Signals",
                          "Worker Sentiment Patterns",
                        ].map((item) => (
                          <Badge key={item} variant="outline" className="text-xs text-muted-foreground border-border/50 gap-1">
                            <Lock className="w-2.5 h-2.5" /> {item}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        size="lg"
                        className="w-full max-w-xs h-11 text-base gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => navigate(`/dossier/${company.slug}`)}
                      >
                        Unlock Full Report <ArrowRight className="w-4 h-4" />
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-3">
                        Full reports include verified sources, evidence chains, and decision-ready analysis.
                      </p>
                    </div>
                  </div>

                  {/* ═══ TRUST LAYER ═══ */}
                  <div className="bg-muted/30 border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">We show our work.</p>
                    {company.website_url ? (
                      <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> {company.website_url}
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No public sources available yet.</p>
                    )}
                    {signals.some(s => s.tier === "verified") && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Signals marked "Verified Source" are backed by public filings, government records, or official disclosures.
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
