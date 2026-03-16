import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ArrowRight, Users, Eye, DollarSign, Landmark, HeartHandshake,
  Twitter, Linkedin, Link2, Check, MessageCircle, CircleHelp, Target,
  Briefcase, BarChart3, ChevronRight, AlertTriangle, ShieldCheck
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  computeVerdict,
  getVerdictColors,
  type SignalInput,
  type RedFlags,
  type VerdictOutput,
} from "@/lib/jackyeVerdictEngine";

/* ── Score helpers ── */
function clarityBand(score: number) {
  if (score >= 80) return { label: "High Clarity", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" };
  if (score >= 60) return { label: "Moderate Clarity", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" };
  if (score >= 40) return { label: "Low Clarity", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
  return { label: "Opaque / High Risk", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
}

/* ── Demo Data ── */
const DEMO_COMPANY = "Koch Industries";

const DEMO_SIGNALS: (SignalInput & { icon: typeof Users; explanation: string })[] = [
  { key: "workforce", label: "Workforce Stability", icon: Users, weight: 25, subscore: 72, status: "Stable", explanation: "No WARN Act layoff notices filed in the past 12 months. Headcount trend appears steady based on public filings." },
  { key: "hiring", label: "Hiring Transparency", icon: Eye, weight: 20, subscore: 38, status: "Low", explanation: "AI screening tools detected in the hiring process. No published bias audit or candidate disclosure found." },
  { key: "compensation", label: "Compensation Clarity", icon: DollarSign, weight: 20, subscore: 55, status: "Partial", explanation: "Some salary ranges posted on job listings. No public pay equity report available. Median offer sits below BLS benchmark for this industry." },
  { key: "influence", label: "Influence Exposure", icon: Landmark, weight: 15, subscore: 28, status: "Significant", explanation: "$5.2M in lobbying spend. Corporate PAC active across 14 congressional districts. Multiple dark money channels flagged." },
  { key: "leadership", label: "Leadership & Culture Trust", icon: HeartHandshake, weight: 20, subscore: 50, status: "Mixed", explanation: "Executive team publicly visible. Glassdoor sentiment is polarized. No published DEI accountability metrics." },
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

const AUDIENCE_USES = [
  { role: "Candidates", icon: Target, desc: "Evaluate an employer before accepting an offer or attending an interview." },
  { role: "HR / Recruiters", icon: Briefcase, desc: "Benchmark your employer brand against what candidates can already see." },
  { role: "Sales / Strategy", icon: BarChart3, desc: "Understand a prospect's workforce stability and influence risk before outreach." },
];

/* ── Share Buttons ── */
function ShareButtons() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = "Would you work here? Check the employer intelligence before you sign.";
  const copyLink = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[0.7rem] uppercase text-muted-foreground tracking-widest">Share</span>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Share on X/Twitter"><Twitter className="w-4 h-4" /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Share on LinkedIn"><Linkedin className="w-4 h-4" /></a>
      <button onClick={copyLink} className="p-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Copy link">
        {copied ? <Check className="w-4 h-4 text-civic-green" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const band = clarityBand(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="butt" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground leading-none">{score}</span>
          <span className="text-[0.65rem] font-mono uppercase text-muted-foreground tracking-widest mt-1">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground mb-1">Employer Clarity Score</div>
        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider ${band.color} ${band.bg} border ${band.border}`}>
          {band.label}
        </span>
      </div>
    </div>
  );
}

/* ── Signal Card ── */
function SignalCard({ signal }: { signal: typeof DEMO_SIGNALS[0] }) {
  const band = clarityBand(signal.subscore);
  return (
    <div className="bg-card border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <signal.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">{signal.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${band.color}`}>{signal.subscore}</span>
          <span className="text-[0.6rem] text-muted-foreground font-mono">/ 100</span>
        </div>
      </div>
      <div className={`w-fit px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${band.color} ${band.bg} border ${band.border}`}>
        {signal.status}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{signal.explanation}</p>
      <div className="h-1.5 bg-border/50 w-full">
        <div className="h-full bg-primary/70 transition-all duration-700" style={{ width: `${signal.subscore}%` }} />
      </div>
    </div>
  );
}

/* ── Verdict Display ── */
function VerdictSection({ result }: { result: VerdictOutput }) {
  const vc = getVerdictColors(result.verdict);
  const confColor = result.verdictConfidence === "High" ? "text-civic-green" : result.verdictConfidence === "Medium" ? "text-civic-yellow" : "text-civic-red";

  return (
    <>
      {/* Verdict + Confidence */}
      <div className="mx-6 mb-4 p-5 border-l-2 border-primary bg-primary/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[0.65rem] tracking-widest uppercase text-primary">Intelligence Assessment</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`inline-block px-3 py-1.5 text-sm font-bold uppercase tracking-wider ${vc.color} ${vc.bg} border ${vc.border}`}>
            {result.verdict}
          </span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`w-3.5 h-3.5 ${confColor}`} strokeWidth={1.5} />
            <span className={`font-mono text-[0.6rem] uppercase tracking-widest ${confColor}`}>
              {result.verdictConfidence} Confidence
            </span>
          </div>
        </div>

        {/* Red flags */}
        {result.redFlagCount > 0 && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-civic-red/5 border border-civic-red/20">
            <AlertTriangle className="w-3.5 h-3.5 text-civic-red shrink-0" strokeWidth={1.5} />
            <span className="text-xs text-civic-red font-semibold">
              {result.redFlagCount} red flag{result.redFlagCount > 1 ? "s" : ""} detected
            </span>
            <span className="text-[0.65rem] text-muted-foreground">— verdict adjusted accordingly</span>
          </div>
        )}

        {/* Jackye's Take */}
        <p className="text-sm text-foreground leading-relaxed mb-3">
          {result.jackyeTake}
        </p>
        <div className="font-mono text-[0.6rem] tracking-wider uppercase text-muted-foreground italic">
          — Run the chain first. Always.
        </div>
      </div>

      {/* Questions to Ask */}
      {result.questionsToAsk.length > 0 && (
        <div className="mx-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CircleHelp className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[0.65rem] tracking-widest uppercase text-muted-foreground">Questions to Ask Before You Move Forward</span>
          </div>
          <ul className="space-y-2">
            {result.questionsToAsk.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  {q.text}
                  <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">({q.triggeredBy})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ── Main Page ── */
export default function WouldYouWorkHere() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Run verdict engine
  const verdictResult = computeVerdict({
    signals: DEMO_SIGNALS,
    coveragePercent: DEMO_COVERAGE,
    redFlags: DEMO_RED_FLAGS,
    layoffTiming: { daysSinceLastLayoff: null },
  });

  const covColor = verdictResult.dataCoverage === "High" ? "text-civic-green" : verdictResult.dataCoverage === "Medium" ? "text-civic-yellow" : "text-civic-red";

  usePageSEO({
    title: "Would You Work Here? — Free Employer Intelligence Check",
    description: "Check any employer's clarity score, hiring transparency, workforce stability, compensation data, and influence exposure. Workforce Transparency Standard.",
    path: "/would-you-work-here",
    jsonLd: {
      "@type": "WebPage",
      name: "Would You Work Here?",
      description: "Free employer intelligence check. See what the data says about any company before you accept an offer.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
    },
  });

  const handleSearch = () => {
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="px-6 lg:px-16 pt-20 pb-12 lg:pt-28 lg:pb-16 text-center max-w-[800px] mx-auto">
        <div className="font-mono text-[0.7rem] uppercase text-primary tracking-[0.2em] mb-4">Employer Intelligence Check</div>
        <h1 className="text-3xl lg:text-[clamp(2.4rem,5vw,3.6rem)] font-bold leading-[1.15] tracking-tight mb-4 text-foreground">
          Would You Work Here?
        </h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-[560px] mx-auto leading-relaxed">
          A simple question. A much smarter answer.
        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-[520px] mx-auto leading-relaxed">
          This page summarizes the most important employer signals in plain English so you can quickly understand whether a company looks stable, transparent, and worth deeper consideration.
        </p>
        <div className="flex justify-center mb-10"><ShareButtons /></div>
        <div className="flex max-w-[500px] mx-auto border border-border bg-card">
          <div className="flex items-center px-4 text-muted-foreground"><Search className="w-4 h-4" /></div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Enter a company name..." className="flex-1 bg-transparent border-none outline-none py-3.5 text-foreground font-sans text-[15px] placeholder:text-muted-foreground" />
          <button onClick={handleSearch} className="bg-primary text-primary-foreground px-5 font-mono text-[0.7rem] tracking-wider uppercase font-semibold hover:brightness-110 transition-all">Scan</button>
        </div>
      </section>

      {/* ── Sample Report ── */}
      <section className="px-6 lg:px-16 pb-8 max-w-[840px] mx-auto w-full">
        <div className="bg-card border border-border relative">
          <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-[0.6rem] uppercase text-primary tracking-[0.2em]">
            Sample Report · {DEMO_COMPANY}
          </div>

          {/* Score + Coverage */}
          <div className="p-8 pb-6 flex flex-col sm:flex-row items-center gap-8 border-b border-border">
            <ScoreRing score={verdictResult.clarityScore} />
            <div className="flex-1 text-center sm:text-left">
              <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-1.5">Data Coverage</div>
              <div className={`text-2xl font-bold ${covColor} mb-1`}>{verdictResult.dataCoverage}</div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[340px]">{verdictResult.dataCoverageDesc}</p>
              <p className="text-xs text-muted-foreground/70 mt-2 italic">
                The score reflects how much verified public evidence is available. Low coverage means the score may understate real risk.
              </p>
            </div>
          </div>

          {/* Signal Cards */}
          <div className="p-6">
            <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-4">Signal Breakdown</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEMO_SIGNALS.map(s => <SignalCard key={s.key} signal={s} />)}
            </div>
          </div>

          {/* Verdict Engine Output */}
          <VerdictSection result={verdictResult} />
        </div>
      </section>

      {/* ── Audience ── */}
      <section className="px-6 lg:px-16 py-12 max-w-[840px] mx-auto w-full">
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-5 text-center">Who This Is For</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AUDIENCE_USES.map(a => (
            <div key={a.role} className="bg-card border border-border p-5 text-center">
              <a.icon className="w-5 h-5 text-primary mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-sm font-semibold text-foreground mb-1">{a.role}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border px-6 lg:px-16 py-16 text-center">
        <h2 className="text-xl font-bold mb-3 text-foreground">Get the full picture.</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-[440px] mx-auto leading-relaxed">
          Run a full employer intelligence scan, upload an offer letter, or ask the Advisor directly.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate("/browse")} className="bg-primary text-primary-foreground px-7 py-3 font-mono text-[0.7rem] font-semibold tracking-wider uppercase hover:brightness-110 transition-all flex items-center gap-2">
            Run Employer Scan <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/check")} className="border border-border text-muted-foreground px-7 py-3 font-mono text-[0.7rem] tracking-wider uppercase hover:border-primary hover:text-primary transition-all">
            Upload an Offer
          </button>
          <button onClick={() => navigate("/ask-jackye")} className="border border-border text-muted-foreground px-7 py-3 font-mono text-[0.7rem] tracking-wider uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" /> Ask the Advisor
          </button>
        </div>
      </section>
    </div>
  );
}
