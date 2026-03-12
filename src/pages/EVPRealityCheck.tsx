import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, Users, TrendingDown, DollarSign, Eye, ArrowUpRight,
  ShieldCheck, AlertTriangle, CheckCircle2, MessageCircle, ChevronRight,
  Clipboard, X
} from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

/* ── Types ── */
interface SignalComparison {
  category: string;
  icon: typeof Users;
  claimExcerpt: string;
  signalReality: string;
  alignment: "aligned" | "gap" | "contradiction";
}

interface EvpResult {
  alignmentScore: number;
  band: string;
  holdsUp: SignalComparison[];
  breaks: SignalComparison[];
  jackyeRec: string;
}

/* ── Score helpers ── */
function scoreBand(score: number) {
  if (score >= 80) return { label: "Strong Alignment", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" };
  if (score >= 60) return { label: "Mostly Aligned", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" };
  if (score >= 40) return { label: "Significant Gaps", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
  return { label: "Messaging Contradicts Signals", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
}

/* ── Demo analysis engine ── */
function analyzeEvp(text: string): EvpResult {
  const lower = text.toLowerCase();

  const comparisons: SignalComparison[] = [];

  // Workforce stability
  if (lower.includes("stable") || lower.includes("grow") || lower.includes("long-term")) {
    comparisons.push({
      category: "Workforce Stability", icon: Users,
      claimExcerpt: "Claims workforce stability or long-term growth",
      signalReality: "No WARN filings in 12 months. Headcount trend is flat — not growing. Claim partially supported.",
      alignment: "gap",
    });
  } else {
    comparisons.push({
      category: "Workforce Stability", icon: Users,
      claimExcerpt: "No stability claims detected in EVP copy",
      signalReality: "Workforce appears stable. No WARN filings detected. Missing an opportunity to highlight this.",
      alignment: "aligned",
    });
  }

  // Layoff history
  if (lower.includes("security") || lower.includes("safe") || lower.includes("secure")) {
    comparisons.push({
      category: "Layoff History", icon: TrendingDown,
      claimExcerpt: "Promises job security or safe environment",
      signalReality: "3 industry peers had layoffs in the last 6 months. No internal layoffs detected, but the claim is risky given sector trends.",
      alignment: "gap",
    });
  }

  // Compensation
  if (lower.includes("competitive") || lower.includes("pay") || lower.includes("compens") || lower.includes("salary")) {
    comparisons.push({
      category: "Compensation Transparency", icon: DollarSign,
      claimExcerpt: "Claims competitive compensation",
      signalReality: "Only 42% of job listings include salary ranges. No published pay equity audit. Median offer sits below BLS benchmark.",
      alignment: "contradiction",
    });
  } else {
    comparisons.push({
      category: "Compensation Transparency", icon: DollarSign,
      claimExcerpt: "No compensation claims in EVP copy",
      signalReality: "Compensation data shows partial transparency. Not addressing it may raise candidate suspicion.",
      alignment: "gap",
    });
  }

  // Hiring technology
  if (lower.includes("fair") || lower.includes("equit") || lower.includes("unbiased") || lower.includes("inclusive hiring")) {
    comparisons.push({
      category: "Hiring Technology", icon: Eye,
      claimExcerpt: "Claims fair or unbiased hiring process",
      signalReality: "AI resume screening detected. No published bias audit. No candidate disclosure about AI usage. Claim is unsupported.",
      alignment: "contradiction",
    });
  }

  // Promotion / mobility
  if (lower.includes("career") || lower.includes("promot") || lower.includes("mobil") || lower.includes("advancement")) {
    comparisons.push({
      category: "Promotion & Mobility", icon: ArrowUpRight,
      claimExcerpt: "Promises career growth or internal mobility",
      signalReality: "No public promotion equity data available. Internal mobility programs not externally verifiable. Claim is aspirational but unverified.",
      alignment: "gap",
    });
  }

  // Leadership stability
  if (lower.includes("leader") || lower.includes("vision") || lower.includes("trust")) {
    comparisons.push({
      category: "Leadership Stability", icon: ShieldCheck,
      claimExcerpt: "References strong leadership or trust",
      signalReality: "Executive team publicly visible. Glassdoor sentiment is polarized. No published DEI accountability metrics from leadership.",
      alignment: "gap",
    });
  }

  // Ensure at least 3 items
  if (comparisons.length < 3) {
    comparisons.push({
      category: "Workforce Stability", icon: Users,
      claimExcerpt: "General employer brand messaging",
      signalReality: "Workforce signals appear stable but no specific claims were made to validate.",
      alignment: "aligned",
    });
  }

  const holdsUp = comparisons.filter(c => c.alignment === "aligned");
  const breaks = comparisons.filter(c => c.alignment !== "aligned");

  // Score: start at 70, subtract for gaps/contradictions
  const contradictions = comparisons.filter(c => c.alignment === "contradiction").length;
  const gaps = comparisons.filter(c => c.alignment === "gap").length;
  const aligned = comparisons.filter(c => c.alignment === "aligned").length;
  const total = comparisons.length;
  const rawScore = Math.round(((aligned * 100 + gaps * 50 + contradictions * 10) / total));
  const score = Math.max(0, Math.min(100, rawScore));

  const band = scoreBand(score);

  // Jackye recommendation
  let jackyeRec: string;
  if (score >= 80) {
    jackyeRec = "Your EVP messaging largely holds up against the public signals. That's rare. Keep it honest — and back your claims with data where you can. The candidates checking are the ones you actually want.";
  } else if (score >= 60) {
    jackyeRec = `Your messaging is mostly on track, but there are ${gaps} area${gaps !== 1 ? "s" : ""} where the public data doesn't fully support what you're saying. That's not a crisis — it's an opportunity. Close the gaps before a candidate or journalist does it for you. Start with the contradictions first.`;
  } else if (score >= 40) {
    jackyeRec = `There are significant disconnects between what your EVP promises and what the data shows. ${contradictions} signal${contradictions !== 1 ? "s" : ""} directly contradict your messaging. This is the kind of gap that erodes candidate trust during the interview process. You need to either change the messaging or change the reality. I'd start with a full EVP audit.`;
  } else {
    jackyeRec = "I'm going to be direct: your employer brand messaging is telling a story that the data doesn't support. Candidates who do their homework — and the best ones always do — will see through this. This isn't about better copywriting. It's about fixing the underlying signals first, then rebuilding your narrative on solid ground.";
  }

  return { alignmentScore: score, band: band.label, holdsUp, breaks, jackyeRec };
}

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const band = scoreBand(score);
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
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-1">EVP Alignment Score</div>
        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider ${band.color} ${band.bg} border ${band.border}`}>
          {band.label}
        </span>
      </div>
    </div>
  );
}

/* ── Comparison Row ── */
function ComparisonRow({ item, type }: { item: SignalComparison; type: "holds" | "breaks" }) {
  const alignLabel = item.alignment === "aligned" ? "Aligned" : item.alignment === "gap" ? "Gap" : "Contradiction";
  const alignColor = item.alignment === "aligned"
    ? "text-civic-green bg-civic-green/10 border-civic-green/30"
    : item.alignment === "gap"
      ? "text-civic-yellow bg-civic-yellow/10 border-civic-yellow/30"
      : "text-civic-red bg-civic-red/10 border-civic-red/30";

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <item.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{item.category}</span>
        </div>
        <span className={`px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider border ${alignColor}`}>
          {alignLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <div>
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Your Claim</div>
          <p className="text-sm text-foreground leading-relaxed">{item.claimExcerpt}</p>
        </div>
        <div>
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Signal Reality</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.signalReality}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function EVPRealityCheck() {
  const navigate = useNavigate();
  const [evpText, setEvpText] = useState("");
  const [result, setResult] = useState<EvpResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  usePageSEO({
    title: "EVP Reality Check — Does Your Employer Brand Match the Data?",
    description: "Compare your Employee Value Proposition against real employer intelligence signals. Find where your EVP holds up and where it breaks.",
    path: "/evp-reality-check",
  });

  const handleAnalyze = () => {
    if (!evpText.trim() || evpText.trim().length < 20) return;
    setIsAnalyzing(true);
    // Simulate brief analysis delay
    setTimeout(() => {
      setResult(analyzeEvp(evpText));
      setIsAnalyzing(false);
    }, 1200);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setEvpText(text);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-[840px] mx-auto w-full px-4 sm:px-6 py-10 lg:py-16">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="font-mono text-[0.7rem] uppercase text-primary tracking-[0.2em] mb-3">Recruiting Intelligence</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.15] tracking-tight mb-3">
            EVP Reality Check
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[600px]">
            Paste your employer brand messaging — career page copy, EVP statements, recruiting promises — and see how it holds up against real employer intelligence signals.
          </p>
        </div>

        {/* ── Input Section ── */}
        <div className="bg-card border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">EVP / Employer Brand Copy</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 px-2 py-1 text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground hover:text-primary border border-border hover:border-primary transition-colors"
              >
                <Clipboard className="w-3 h-3" /> Paste
              </button>
              {evpText && (
                <button
                  onClick={() => { setEvpText(""); setResult(null); }}
                  className="flex items-center gap-1 px-2 py-1 text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground hover:text-civic-red border border-border hover:border-civic-red/50 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={evpText}
            onChange={(e) => setEvpText(e.target.value)}
            placeholder={"Paste your EVP statements, career page messaging, recruiting promises, or employer brand copy here...\n\nExample:\n\"We offer competitive compensation, inclusive hiring practices, and long-term career growth in a stable, values-driven environment.\""}
            className="w-full h-40 bg-background border border-border p-4 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary transition-colors"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-[0.6rem] font-mono text-muted-foreground/50">
              {evpText.length > 0 ? `${evpText.length} characters` : "Min 20 characters"}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={evpText.trim().length < 20 || isAnalyzing}
              className="bg-primary text-primary-foreground px-5 py-2.5 font-mono text-[0.7rem] font-semibold tracking-wider uppercase hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Run Reality Check"
              )}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

            {/* Score */}
            <div className="bg-card border border-border p-6">
              <ScoreRing score={result.alignmentScore} />
            </div>

            {/* Where EVP Holds Up */}
            {result.holdsUp.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-civic-green" strokeWidth={1.5} />
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">Where the EVP Holds Up</span>
                </div>
                <div className="space-y-3">
                  {result.holdsUp.map((item, i) => <ComparisonRow key={i} item={item} type="holds" />)}
                </div>
              </div>
            )}

            {/* Where EVP Breaks */}
            {result.breaks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-civic-red" strokeWidth={1.5} />
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">Where the EVP Breaks</span>
                </div>
                <div className="space-y-3">
                  {result.breaks.map((item, i) => <ComparisonRow key={i} item={item} type="breaks" />)}
                </div>
              </div>
            )}

            {/* Jackye's Recommendation */}
            <div className="border-l-2 border-primary bg-primary/[0.04] p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[0.65rem] tracking-widest uppercase text-primary font-semibold">Jackye's Recommendation</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">{result.jackyeRec}</p>
              <div className="font-mono text-[0.6rem] tracking-wider uppercase text-muted-foreground italic">
                — Fix the signal, then fix the story.
              </div>
            </div>

            {/* CTA */}
            <div className="bg-card border border-border p-6 text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">Need help redesigning your EVP?</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-[460px] mx-auto leading-relaxed">
                Work with Jackye to redesign your EVP and recruiting narrative based on what the data actually shows.
              </p>
              <button
                onClick={() => navigate("/work-with-jackye")}
                className="bg-primary text-primary-foreground px-6 py-3 font-mono text-[0.7rem] font-semibold tracking-wider uppercase hover:brightness-110 transition-all inline-flex items-center gap-2"
              >
                Request EVP Advisory <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
