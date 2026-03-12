import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, Eye, Landmark, AlertTriangle, MessageCircle,
  ChevronRight, ShieldCheck, CircleHelp, Linkedin, Download, Link2, Check,
  TrendingDown, FileText
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  computeVerdict,
  getVerdictColors,
  type SignalInput,
  type RedFlags,
  type VerdictOutput,
} from "@/lib/jackyeVerdictEngine";

/* ── Demo Data ── */
const DEMO_COMPANY = "Koch Industries";
const DEMO_DATE = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const DEMO_SIGNALS: (SignalInput & { icon: typeof Users; explanation: string; supporting: string[] })[] = [
  {
    key: "workforce", label: "Workforce Stability", icon: Users, weight: 25, subscore: 72, status: "Stable",
    explanation: "No WARN Act layoff notices filed in the past 12 months. Headcount trend appears steady.",
    supporting: ["No WARN filings detected (12 mo)", "SEC headcount trend: flat", "Glassdoor reports: stable teams"],
  },
  {
    key: "compensation", label: "Compensation Clarity", icon: DollarSign, weight: 20, subscore: 55, status: "Partial",
    explanation: "Some salary ranges posted. No public pay equity report available.",
    supporting: ["42% of listings include pay range", "No published pay equity audit", "Median offer below BLS benchmark"],
  },
  {
    key: "hiring", label: "Hiring Technology Transparency", icon: Eye, weight: 20, subscore: 38, status: "Low",
    explanation: "AI screening tools detected. No published bias audit or candidate disclosure found.",
    supporting: ["AI resume screening detected", "No bias audit published", "No candidate disclosure on AI usage"],
  },
  {
    key: "influence", label: "Influence Exposure", icon: Landmark, weight: 15, subscore: 28, status: "Significant",
    explanation: "$5.2M in lobbying spend. Corporate PAC active across 14 congressional districts.",
    supporting: ["$5.2M lobbying (FY 2025)", "PAC active in 14 districts", "Dark money channels flagged"],
  },
  {
    key: "layoffs", label: "Layoff Signals", icon: TrendingDown, weight: 20, subscore: 68, status: "Monitoring",
    explanation: "No active WARN notices. Industry peers have reported cuts — monitoring.",
    supporting: ["No active WARN filings", "3 industry peers had layoffs (6 mo)", "Job posting volume steady"],
  },
];

const DEMO_RED_FLAGS: RedFlags = {
  activeLayoffsWithin90Days: false,
  warnWithoutTransitionSupport: false,
  compensationTransparencyGaps: true,
  opaqueHiringTechnology: true,
  leadershipInstability: false,
  highInfluenceExposure: true,
};

const DEMO_COVERAGE = 58;

/* ── Helpers ── */
function clarityBand(score: number) {
  if (score >= 80) return { label: "High Clarity", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" };
  if (score >= 60) return { label: "Moderate Clarity", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" };
  if (score >= 40) return { label: "Low Clarity", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
  return { label: "Opaque", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
}

/* ── Share Bar ── */
function ShareBar() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = `Employer Receipt: ${DEMO_COMPANY} — See the intelligence before you sign.`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    // Placeholder — real PDF generation can use html2canvas + jspdf
    window.print();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors font-mono text-[0.65rem] uppercase tracking-wider"
      >
        <Linkedin className="w-3.5 h-3.5" /> Share on LinkedIn
      </a>
      <button
        onClick={handleDownloadPdf}
        className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors font-mono text-[0.65rem] uppercase tracking-wider"
      >
        <Download className="w-3.5 h-3.5" /> Download PDF
      </button>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors font-mono text-[0.65rem] uppercase tracking-wider"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-civic-green" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy Public Link"}
      </button>
    </div>
  );
}

/* ── Score Display ── */
function ClarityScore({ score }: { score: number }) {
  const band = clarityBand(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="butt" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground leading-none">{score}</span>
          <span className="text-[0.6rem] font-mono uppercase text-muted-foreground tracking-widest mt-0.5">/ 100</span>
        </div>
      </div>
      <div>
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-1">Employer Clarity Score</div>
        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider ${band.color} ${band.bg} border ${band.border}`}>
          {band.label}
        </span>
      </div>
    </div>
  );
}

/* ── Signal Row ── */
function SignalRow({ signal }: { signal: typeof DEMO_SIGNALS[0] }) {
  const band = clarityBand(signal.subscore);
  return (
    <div className="border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <signal.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{signal.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${band.color} ${band.bg} border ${band.border}`}>
            {signal.status}
          </span>
          <span className={`text-sm font-bold ${band.color}`}>{signal.subscore}</span>
        </div>
      </div>
      {/* Explanation */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{signal.explanation}</p>
      {/* Supporting signals */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {signal.supporting.map((s, i) => (
          <span key={i} className="text-[0.65rem] text-muted-foreground/70 flex items-center gap-1">
            <span className="w-1 h-1 bg-primary/40 rounded-full shrink-0" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function EmployerReceipt() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  const verdictResult = computeVerdict({
    signals: DEMO_SIGNALS,
    coveragePercent: DEMO_COVERAGE,
    redFlags: DEMO_RED_FLAGS,
    layoffTiming: { daysSinceLastLayoff: null },
  });

  const vc = getVerdictColors(verdictResult.verdict);
  const covColor = verdictResult.dataCoverage === "High" ? "text-civic-green" : verdictResult.dataCoverage === "Medium" ? "text-civic-yellow" : "text-civic-red";
  const confColor = verdictResult.verdictConfidence === "High" ? "text-civic-green" : verdictResult.verdictConfidence === "Medium" ? "text-civic-yellow" : "text-civic-red";

  usePageSEO({
    title: `Employer Receipt: ${DEMO_COMPANY} — Employer Intelligence Summary`,
    description: `Employer intelligence receipt for ${DEMO_COMPANY}. Clarity score, workforce stability, compensation transparency, influence exposure, and Jackye's verdict.`,
    path: "/employer-receipt",
    jsonLd: {
      "@type": "WebPage",
      name: `Employer Receipt: ${DEMO_COMPANY}`,
      description: "A shareable employer intelligence summary — like a credit report for companies.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-6 py-10 lg:py-16">

        {/* Receipt Container */}
        <div ref={receiptRef} className="bg-card border border-border">

          {/* ── Receipt Header ── */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary font-semibold">Employer Receipt</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{DEMO_COMPANY}</h1>
              </div>
              <div className="text-right">
                <div className="text-[0.65rem] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">{DEMO_DATE}</div>
                <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground/60">Who Do I Work For</div>
              </div>
            </div>
          </div>

          {/* ── Main Score + Coverage ── */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <ClarityScore score={verdictResult.clarityScore} />
              <div className="sm:text-right">
                <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1">Data Coverage</div>
                <div className={`text-xl font-bold ${covColor} mb-0.5`}>{verdictResult.dataCoverage}</div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">{verdictResult.dataCoverageDesc}</p>
              </div>
            </div>
          </div>

          {/* ── Signal Sections ── */}
          <div className="p-6 border-b border-border">
            <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-4">Signal Summary</div>
            <div className="space-y-3">
              {DEMO_SIGNALS.map(s => <SignalRow key={s.key} signal={s} />)}
            </div>
          </div>

          {/* ── Jackye's Verdict ── */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-[0.65rem] tracking-widest uppercase text-primary font-semibold">Jackye's Verdict</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`inline-block px-3 py-1.5 text-sm font-bold uppercase tracking-wider ${vc.color} ${vc.bg} border ${vc.border}`}>
                {verdictResult.verdict}
              </span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${confColor}`} strokeWidth={1.5} />
                <span className={`font-mono text-[0.6rem] uppercase tracking-widest ${confColor}`}>
                  {verdictResult.verdictConfidence} Confidence
                </span>
              </div>
            </div>

            {verdictResult.redFlagCount > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-civic-red/5 border border-civic-red/20">
                <AlertTriangle className="w-3.5 h-3.5 text-civic-red shrink-0" strokeWidth={1.5} />
                <span className="text-xs text-civic-red font-semibold">
                  {verdictResult.redFlagCount} red flag{verdictResult.redFlagCount > 1 ? "s" : ""} detected
                </span>
                <span className="text-[0.65rem] text-muted-foreground">— verdict adjusted</span>
              </div>
            )}

            <p className="text-sm text-foreground leading-relaxed">{verdictResult.jackyeTake}</p>
          </div>

          {/* ── Questions to Ask ── */}
          {verdictResult.questionsToAsk.length > 0 && (
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <CircleHelp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[0.65rem] tracking-widest uppercase text-muted-foreground">Questions to Ask</span>
              </div>
              <ul className="space-y-2.5">
                {verdictResult.questionsToAsk.slice(0, 5).map((q, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      {q.text}
                      <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/50">({q.triggeredBy})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="p-6 bg-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary font-semibold mb-0.5">
                  Run the chain first. Always.
                </div>
                <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground">
                  Who Do I Work For — Employer Intelligence by Jackye Clayton
                </div>
              </div>
              <ShareBar />
            </div>
          </div>
        </div>

        {/* ── CTAs below receipt ── */}
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate("/browse")}
            className="bg-primary text-primary-foreground px-6 py-3 font-mono text-[0.7rem] font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
          >
            Run Employer Scan
          </button>
          <button
            onClick={() => navigate("/check")}
            className="border border-border text-muted-foreground px-6 py-3 font-mono text-[0.7rem] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
          >
            Upload an Offer
          </button>
          <button
            onClick={() => navigate("/ask-jackye")}
            className="border border-border text-muted-foreground px-6 py-3 font-mono text-[0.7rem] tracking-wider uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Ask Jackye
          </button>
        </div>
      </div>
    </div>
  );
}
