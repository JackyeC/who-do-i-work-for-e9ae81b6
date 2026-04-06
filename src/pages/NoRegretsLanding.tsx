import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SectionReveal } from "@/components/landing/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Search,
  FileSearch,
  Target,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────── types ─────────────────────────── */

type Verdict = "strong-fit" | "mixed-signals" | "proceed-with-caution" | "high-risk";

interface SignalTranslation {
  signal: string;
  pattern: string;
  consequence: string;
  severity: "positive" | "neutral" | "warning" | "critical";
}

interface FitProfile {
  worksFor: string[];
  doesntWorkFor: string[];
}

/* ─────────────────────────── verdict engine ─────────────────────────── */

const VERDICT_META: Record<Verdict, { label: string; color: string; icon: typeof ShieldCheck; description: string }> = {
  "strong-fit": {
    label: "Strong Fit",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    icon: ShieldCheck,
    description: "Signals are broadly positive. Public record shows transparency, stable workforce practices, and alignment with stated values.",
  },
  "mixed-signals": {
    label: "Mixed Signals",
    color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    icon: ShieldAlert,
    description: "Some signals are encouraging, others warrant closer review. Worth investigating further before committing.",
  },
  "proceed-with-caution": {
    label: "Proceed With Caution",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    icon: AlertTriangle,
    description: "Multiple flags in the public record. The data doesn't say don't apply — it says know exactly what you're walking into.",
  },
  "high-risk": {
    label: "High Risk",
    color: "text-red-400 border-red-500/30 bg-red-500/10",
    icon: XCircle,
    description: "Significant concerns across multiple categories. Enforcement actions, concentrated influence, or transparency gaps suggest elevated career risk.",
  },
};

function computeVerdict(company: any, claims: any[], signals: any[]): Verdict {
  const score = company?.civic_footprint_score ?? 50;
  const claimCount = claims.length;
  const highSeverity = signals.filter((s: any) => s.severity === "critical" || s.severity === "high").length;

  if (score >= 65 && highSeverity === 0 && claimCount >= 3) return "strong-fit";
  if (score >= 45 && highSeverity <= 2) return "mixed-signals";
  if (score >= 30 || highSeverity <= 4) return "proceed-with-caution";
  return "high-risk";
}

function buildTranslations(company: any, claims: any[], signals: any[]): SignalTranslation[] {
  const translations: SignalTranslation[] = [];

  // Political spending concentration
  const pacSpending = company?.total_pac_spending ?? 0;
  if (pacSpending > 100000) {
    translations.push({
      signal: `$${(pacSpending / 1000000).toFixed(1)}M in PAC spending`,
      pattern: "Concentrated political investment suggests active policy influence.",
      consequence: "Company direction may shift with political cycles. Policies on labor, benefits, or remote work could change based on who's in office.",
      severity: pacSpending > 1000000 ? "critical" : "warning",
    });
  }

  // Lobbying spend
  const lobbySpend = company?.lobbying_spend ?? 0;
  if (lobbySpend > 500000) {
    translations.push({
      signal: `$${(lobbySpend / 1000000).toFixed(1)}M in lobbying expenditures`,
      pattern: "Significant resources directed at shaping regulation.",
      consequence: "The company actively works to influence rules that affect workers, consumers, or the environment. Your workplace conditions may be shaped by these priorities.",
      severity: "warning",
    });
  }

  // High-severity accountability signals
  const criticalSignals = signals.filter((s: any) => s.severity === "critical" || s.severity === "high");
  if (criticalSignals.length > 0) {
    const topSignal = criticalSignals[0];
    translations.push({
      signal: topSignal.headline || "Enforcement or accountability flag detected",
      pattern: `${criticalSignals.length} high-severity signal${criticalSignals.length > 1 ? "s" : ""} in the public record.`,
      consequence: "Active enforcement actions or unresolved accountability issues can affect team stability, company reputation, and your professional trajectory.",
      severity: "critical",
    });
  }

  // Positive: transparency
  if (company?.civic_footprint_score >= 60) {
    translations.push({
      signal: `Civic footprint score: ${company.civic_footprint_score}/100`,
      pattern: "Above-average transparency in political spending and corporate governance.",
      consequence: "Companies that disclose voluntarily tend to have stronger internal accountability. Fewer surprises after you join.",
      severity: "positive",
    });
  }

  // Claims-based insight
  const positiveClaims = claims.filter((c: any) => c.claim_type === "positive" || c.evidence_type === "verified");
  if (positiveClaims.length >= 3) {
    translations.push({
      signal: `${positiveClaims.length} verified positive claims on record`,
      pattern: "Consistent public evidence of stated commitments being honored.",
      consequence: "When a company's public claims hold up under scrutiny, the offer you get is more likely to match the reality you experience.",
      severity: "positive",
    });
  }

  // If very few signals
  if (translations.length === 0) {
    translations.push({
      signal: "Limited public data available",
      pattern: "This company has a thin public record — not enough signals to form strong conclusions.",
      consequence: "Ask more questions during the interview. Request specifics on retention, comp equity, and decision-making structure. Absence of data isn't safety.",
      severity: "neutral",
    });
  }

  return translations.slice(0, 3);
}

function buildFitProfile(company: any, claims: any[], signals: any[]): FitProfile {
  const score = company?.civic_footprint_score ?? 50;
  const pacHigh = (company?.total_pac_spending ?? 0) > 500000;
  const hasEnforcement = signals.some((s: any) => s.signal_category === "enforcement" || s.severity === "critical");

  const worksFor: string[] = [];
  const doesntWorkFor: string[] = [];

  if (score >= 55) {
    worksFor.push("People who value employer transparency and public accountability");
  } else {
    doesntWorkFor.push("People who need clear visibility into how leadership makes decisions");
  }

  if (!pacHigh) {
    worksFor.push("People who prefer employers with limited political exposure");
  } else {
    doesntWorkFor.push("People who want their employer to stay out of political spending");
  }

  if (!hasEnforcement) {
    worksFor.push("People who prioritize stable, low-risk work environments");
  } else {
    doesntWorkFor.push("People who need confidence that workplace protections are consistently enforced");
  }

  if (company?.employee_count && parseInt(company.employee_count) > 10000) {
    worksFor.push("People seeking structure, benefits, and established career ladders");
  }

  if (company?.is_startup) {
    worksFor.push("People energized by growth-stage environments and willing to accept ambiguity");
    doesntWorkFor.push("People who need predictable comp progression and long-term stability");
  }

  return {
    worksFor: worksFor.slice(0, 3),
    doesntWorkFor: doesntWorkFor.slice(0, 3),
  };
}

/* ─────────────────────────── component ─────────────────────────── */

export default function NoRegretsLanding() {
  const [searchParams] = useSearchParams();
  const companySlug = searchParams.get("company");

  // Fetch company
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["checkpoint-company", companySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, total_pac_spending, lobbying_spend, employee_count, is_startup, is_publicly_traded, confidence_rating, corporate_pac_exists, description")
        .eq("slug", companySlug!)
        .maybeSingle();
      return data;
    },
    enabled: !!companySlug,
  });

  // Fetch claims
  const { data: claims = [] } = useQuery({
    queryKey: ["checkpoint-claims", company?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_claims")
        .select("claim_text, claim_type, evidence_type, confidence_score, source_label")
        .eq("company_id", company!.id)
        .eq("is_active", true)
        .order("confidence_score", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Fetch accountability signals
  const { data: signals = [] } = useQuery({
    queryKey: ["checkpoint-signals", company?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("accountability_signals")
        .select("headline, severity, signal_category, signal_type, source_type")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!company?.id,
  });

  const verdict = useMemo(() => company ? computeVerdict(company, claims, signals) : null, [company, claims, signals]);
  const translations = useMemo(() => company ? buildTranslations(company, claims, signals) : [], [company, claims, signals]);
  const fitProfile = useMemo(() => company ? buildFitProfile(company, claims, signals) : null, [company, claims, signals]);
  const verdictMeta = verdict ? VERDICT_META[verdict] : null;

  // No company selected — show entry point
  if (!companySlug) {
    return (
      <>
        <Helmet>
          <title>No-Regrets Decision Checkpoint | WDIWF</title>
          <meta name="description" content="Before you sign, accept, or commit — run the decision checkpoint. Know exactly what you're walking into." />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <SectionReveal>
              <div className="w-12 h-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FileSearch className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">No-Regrets Checkpoint</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                This page synthesizes everything we know about a company into one decision:
                should you move forward, or pause?
              </p>
              <p className="text-xs text-muted-foreground/60 mb-6">
                Search a company first, then return here from their dossier.
              </p>
              <Button asChild>
                <Link to="/check" className="gap-2">
                  <Search className="w-4 h-4" /> Search a company
                </Link>
              </Button>
            </SectionReveal>
          </div>
        </div>
      </>
    );
  }

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Company not found.</p>
          <Button asChild variant="outline">
            <Link to="/check">Search again</Link>
          </Button>
        </div>
      </div>
    );
  }

  const VerdictIcon = verdictMeta?.icon ?? ShieldAlert;

  return (
    <>
      <Helmet>
        <title>Decision Checkpoint: {company.name} | WDIWF</title>
        <meta name="description" content={`No-Regrets Decision Checkpoint for ${company.name}. Verdict, signal analysis, and fit assessment.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ── Header context ── */}
        <div className="border-b border-border/30 bg-card/40">
          <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60">
                Decision Checkpoint
              </p>
              <h1 className="text-lg font-bold text-foreground">{company.name}</h1>
              <p className="text-xs text-muted-foreground">
                {company.industry} · {company.state}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/dossier/${company.slug}`} className="gap-1.5 text-xs">
                Full dossier <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ── 1. VERDICT ── */}
        <section className="border-b border-border/20">
          <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-6">
                Decision Signal
              </p>

              <div className={cn(
                "border rounded-lg p-6 md:p-8",
                verdictMeta?.color
              )}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    <VerdictIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{verdictMeta?.label}</h2>
                    <p className="text-sm opacity-80 leading-relaxed">
                      {verdictMeta?.description}
                    </p>
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                      <Badge variant="outline" className="text-xs border-current/20">
                        Civic score: {company.civic_footprint_score}/100
                      </Badge>
                      <Badge variant="outline" className="text-xs border-current/20">
                        {signals.length} signals analyzed
                      </Badge>
                      <Badge variant="outline" className="text-xs border-current/20">
                        {claims.length} claims on record
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ── 2. WHAT THIS ACTUALLY MEANS ── */}
        <section className="border-b border-border/20 bg-card/30">
          <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
            <SectionReveal>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-2">
                What This Actually Means
              </p>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Top signals, translated.
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Signal → Pattern → What happens to you.
              </p>
            </SectionReveal>

            <div className="space-y-4">
              {translations.map((t, i) => {
                const borderColor =
                  t.severity === "critical" ? "border-red-500/40" :
                  t.severity === "warning" ? "border-orange-400/40" :
                  t.severity === "positive" ? "border-emerald-500/40" :
                  "border-border/40";
                return (
                  <SectionReveal key={i} delay={i * 0.08}>
                    <div className={cn("border-l-2 pl-4 py-3 space-y-2", borderColor)}>
                      <p className="text-sm font-semibold text-foreground">{t.signal}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-mono text-primary/60 text-[10px] uppercase tracking-wider mr-1.5">Pattern:</span>
                        {t.pattern}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-mono text-primary/60 text-[10px] uppercase tracking-wider mr-1.5">What happens to you:</span>
                        {t.consequence}
                      </p>
                    </div>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. WHO THIS WORKS FOR ── */}
        {fitProfile && (
          <section className="border-b border-border/20">
            <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
              <SectionReveal>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-2">
                  Fit Assessment
                </p>
                <h2 className="text-xl font-bold text-foreground mb-8">
                  Who this works for — and who it doesn't.
                </h2>
              </SectionReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionReveal delay={0.05}>
                  <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-foreground">This could work for you if…</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {fitProfile.worksFor.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionReveal>

                <SectionReveal delay={0.1}>
                  <div className="border border-orange-500/20 bg-orange-500/5 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <h3 className="text-sm font-bold text-foreground">This probably isn't for you if…</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {fitProfile.doesntWorkFor.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionReveal>
              </div>
            </div>
          </section>
        )}

        {/* ── 4. NO REGRETS CHECK ── */}
        <section>
          <div className="max-w-2xl mx-auto px-5 py-16 md:py-24 text-center">
            <SectionReveal>
              <div className="border border-primary/20 bg-primary/5 rounded-lg p-8 md:p-10">
                <Target className="w-6 h-6 text-primary mx-auto mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/70 mb-3">
                  No-Regrets Check
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 max-w-md mx-auto leading-snug">
                  If you knew all of this on day one — would you still say yes?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-8">
                  That's the only question that matters. Everything above is public record.
                  The company already knows it. Now you do too.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link to={`/dossier/${company.slug}`} className="gap-2">
                      Review full dossier <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/check">Check another company</Link>
                  </Button>
                </div>
              </div>
            </SectionReveal>

            {/* Attribution */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-primary/20" />
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                Facts over feelings · Public record · No spin
              </p>
              <div className="h-px w-8 bg-primary/20" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
