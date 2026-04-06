import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceLabel, classifyClaim, type SourceTier } from "@/components/ui/source-label";
import DiscoveryMode from "@/components/offer-check/DiscoveryMode";
import { OfferChecklist } from "@/components/offer-check/OfferChecklist";
import CompanyIntelligenceSection from "@/components/offer-check/CompanyIntelligenceSection";
import CareerIntelligenceSection from "@/components/offer-check/CareerIntelligenceSection";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShieldCheck, AlertTriangle, XCircle, Lock,
  ExternalLink, ArrowRight, CheckCircle, Loader2,
  Upload, FileText, Mail, Zap, CircleAlert, CircleMinus,
  Handshake, ThumbsUp,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
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
  if (score === 0 || score == null) return { label: "Under Review", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border", icon: Search };
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

/* ─── Offer Analysis Types ─── */
interface OfferAnalysis {
  company: string;
  role: string;
  summary: string;
  red_flags: { flag: string; detail: string }[];
  missing_terms: string[];
  negotiate_these: { item: string; why: string }[];
  green_flags: string[];
  power_move: string;
}

/* ─── Offer Upload Card (wired to edge function) ─── */
function OfferUploadCard() {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<OfferAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-offer-letter`;

  const callAnalyze = async (body: FormData) => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      } else {
        // Use anon key when not authenticated
        headers["apikey"] = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      }
      const res = await fetch(EDGE_URL, { method: "POST", headers, body });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (errBody.error === "pdf_extraction_failed") {
          setError(errBody.message || "PDF text couldn't be extracted. Paste your offer text below:");
          setShowPasteFallback(true);
          return;
        }
        throw new Error(errBody.error || errBody.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.analysis) throw new Error("Unexpected response format");
      setAnalysis(json.analysis as OfferAnalysis);
    } catch (e: any) {
      console.error("[OfferUpload] Analysis error:", e);
      setError("We couldn't analyze this offer. Try pasting the text directly below instead.");
      setShowPasteFallback(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowPasteFallback(false);
    setError(null);
    setAnalysis(null);
  };

  const handleAnalyzeFile = () => {
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("file", selectedFile);
    callAnalyze(fd);
  };

  const handleAnalyzePasted = () => {
    if (pastedText.trim().length < 50) {
      setError("That doesn't look like a full offer letter. Paste the complete text for the best results.");
      return;
    }
    const fd = new FormData();
    fd.append("text", pastedText.trim());
    callAnalyze(fd);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowPasteFallback(false);
    setError(null);
    setAnalysis(null);
  };

  const reset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
    setShowPasteFallback(false);
    setPastedText("");
  };

  // ── Loading state ──
  if (analyzing) {
    return (
      <div className="mt-auto space-y-3 py-4">
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Reading the fine print on your offer...
        </p>
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    );
  }

  // ── Results state ──
  if (analysis) {
    return <OfferResults analysis={analysis} onReset={reset} />;
  }

  // ── Upload / paste input state ──
  return (
    <div className="mt-auto space-y-3">
      {/* Drop zone */}
      <div
        className="border border-dashed border-border/60 rounded-lg p-5 text-center cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground truncate max-w-[180px]">{selectedFile.name}</span>
            <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-muted-foreground hover:text-foreground">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Drag & drop or <span className="text-primary font-medium">click to upload</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">.pdf, .docx, .txt</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {selectedFile && !showPasteFallback && (
        <Button
          onClick={handleAnalyzeFile}
          className="w-full h-10 text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ShieldCheck className="w-4 h-4" /> Analyze My Offer
        </Button>
      )}

      {error && (
        <p className="text-xs text-amber-400 text-center">{error}</p>
      )}

      {showPasteFallback && (
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your offer letter text here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={6}
            className="text-xs bg-background border-border"
          />
          <Button
            onClick={handleAnalyzePasted}
            className="w-full h-10 text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShieldCheck className="w-4 h-4" /> Analyze Pasted Text
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Offer Results Display ─── */
function OfferResults({ analysis, onReset }: { analysis: OfferAnalysis; onReset: () => void }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary mb-2">Offer Intelligence Brief</p>
        <p className="text-sm font-semibold text-foreground">{analysis.company} — {analysis.role}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Red Flags */}
      {analysis.red_flags?.length > 0 && (
        <div className="bg-card border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-amber-400">Red Flags</p>
          </div>
          <div className="space-y-2">
            {analysis.red_flags.map((f, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-foreground">{f.flag}</p>
                <p className="text-[11px] text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Terms */}
      {analysis.missing_terms?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CircleMinus className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">What's Missing</p>
          </div>
          <ul className="space-y-1">
            {analysis.missing_terms.map((t, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-muted-foreground mt-0.5">•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negotiate These */}
      {analysis.negotiate_these?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Handshake className="w-3.5 h-3.5 text-primary" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary">Negotiate These</p>
          </div>
          <div className="space-y-2">
            {analysis.negotiate_these.map((n, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-foreground">{n.item}</p>
                <p className="text-[11px] text-muted-foreground">{n.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Green Flags */}
      {analysis.green_flags?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-emerald-400">What They Got Right</p>
          </div>
          <ul className="space-y-1">
            {analysis.green_flags.map((g, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Power Move */}
      {analysis.power_move && (
        <div className="bg-card border-2 border-primary/40 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-bold">Your Power Move</p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{analysis.power_move}</p>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onReset} className="w-full text-xs">
        Analyze Another Offer
      </Button>
    </div>
  );
}


export default function OfferCheckEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("q")?.trim() || searchParams.get("company")?.trim();
    if (q) setCompanyName(q);
  }, [searchParams]);

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
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">

        {/* ═══ HERO HEADLINE ═══ */}
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

        {/* ═══ TWO-CARD ENTRY ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

          {/* PATH A — Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-card border border-border rounded-xl p-6 flex flex-col"
          >
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-semibold mb-2">
              Know before you apply
            </p>
            <h2 className="text-lg font-bold text-foreground mb-1">Search any employer</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              See what the public record says before you waste time interviewing.
            </p>
            <form onSubmit={handleSubmit} className="mt-auto space-y-3">
              <Input
                placeholder="Company name..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11 text-sm bg-background border-border"
                required
              />
              <Button
                type="submit"
                className="w-full h-10 text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!companyName.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Run My Scan
              </Button>
            </form>
          </motion.div>

          {/* PATH B — Upload offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-card border border-primary/30 rounded-xl p-6 flex flex-col relative overflow-hidden"
          >
            <Badge
              variant="outline"
              className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-wider border-primary/40 text-primary bg-primary/5"
            >
              Most valuable step candidates skip
            </Badge>

            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-semibold mb-2">
              Know before you sign
            </p>
            <h2 className="text-lg font-bold text-foreground mb-1">Upload your offer letter</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              We'll tell you exactly what's missing, what's red-flagged, and what to negotiate.
            </p>

            <OfferUploadCard />
          </motion.div>
        </div>

        {/* ═══ RESULTS ═══ */}
        <div className="max-w-2xl mx-auto">
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
                  <p className="text-sm text-muted-foreground text-center animate-pulse mt-2">
                    Pulling public records for {searchTerm}…
                  </p>
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
                    <p className="text-xs text-muted-foreground mb-3 max-w-[42ch] mx-auto leading-relaxed">
                      Risk band from public-record signals — not a moral judgment on the company. Use it to decide whether to move forward or pause and read the receipts.
                    </p>
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
                    <p className="text-xs text-muted-foreground mb-1">What you&apos;re looking at</p>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                      Public-record signals
                    </h3>
                    {signals.length === 0 ? (
                      <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-sm text-muted-foreground italic">No public evidence found for this company yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {signals.slice(0, 3).map((signal, i) => {
                          const isClickable = !!signal.link;

                          if (isClickable) {
                            return (
                              <a
                                key={i}
                                href={signal.link!}
                                onClick={(e) => { e.preventDefault(); navigate(signal.link!); }}
                                className="bg-card border border-border rounded-xl p-4 block cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] transition-all group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {signal.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{signal.explanation}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <SourceLabel tier={signal.tier} url={signal.sourceUrl} className="mt-0.5" />
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                                      View record <ArrowRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              </a>
                            );
                          }

                          return (
                            <div
                              key={i}
                              className="bg-card border border-border/60 rounded-xl p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-muted-foreground">{signal.title}</p>
                                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{signal.explanation}</p>
                                </div>
                                <SourceLabel tier={signal.tier} url={signal.sourceUrl} className="shrink-0 mt-0.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ═══ SECTION 4: SUMMARY ═══ */}
                  {summary && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why this might matter to you</p>
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

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What to do next</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Open the full dossier for sources and depth, bookmark the company, or come back when you have an offer in hand.
                    </p>
                  </div>

                  {/* ═══ OFFER CHECKLIST — Phase 1 ═══ */}
                  <OfferChecklist
                    companyName={company.name}
                    companyId={company.id}
                    industry={company.industry}
                  />

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
    </div>
  );
}
