import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, MessageSquare, Compass, ArrowRight, ArrowLeftRight, Zap, Briefcase, Search, BarChart3, Eye, Users, DollarSign, Scale, Cpu, CheckCircle2 } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { HeroSearch } from "@/components/landing/HeroSearch";

// Lazy-load below-fold components
const SocialProofStrip = lazy(() => import("@/components/landing/SocialProofStrip").then(m => ({ default: m.SocialProofStrip })));
const MiniReportTeaser = lazy(() => import("@/components/landing/MiniReportTeaser").then(m => ({ default: m.MiniReportTeaser })));
const IntelligenceDashboard = lazy(() => import("@/components/landing/IntelligenceDashboard").then(m => ({ default: m.IntelligenceDashboard })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const EmailCapture = lazy(() => import("@/components/landing/EmailCapture").then(m => ({ default: m.EmailCapture })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));
const RivalryBattleCard = lazy(() => import("@/components/RivalryBattleCard").then(m => ({ default: m.RivalryBattleCard })));
const DreamJobWidget = lazy(() => import("@/components/community/DreamJobWidget").then(m => ({ default: m.DreamJobWidget })));

// Lazy-load framer-motion SectionReveal — not needed for hero
const SectionReveal = lazy(() => import("@/components/landing/SectionReveal").then(m => ({ default: m.SectionReveal })));

// Lazy-load data
const loadRivalries = () => import("@/data/rivalries2026").then(m => m.rivalries2026);

// Static trust sources (no fetch needed)
const TRUST_SOURCES = ["FEC Filings", "USASpending.gov", "SEC EDGAR", "Senate Lobbying", "BLS Wage Data", "OpenSecrets"];

// Hardcoded company count — avoids Supabase fetch on landing page critical path
const STATIC_COMPANY_COUNT = 850;

const tools = [
  { icon: Shield, title: "Company Intelligence", desc: "Workforce signals, compensation patterns, political influence — one report.", cta: "Run a scan", href: "/browse" },
  { icon: FileText, title: "Offer Intelligence", desc: "Benchmark salary, flag non-competes, get negotiation language.", cta: "Analyze an offer", href: "/check" },
  { icon: MessageSquare, title: "Intelligence Advisor", desc: "20+ years of HR strategy, on demand. Real advice, not platitudes.", cta: "Ask the Advisor", href: "/ask-jackye" },
  { icon: Compass, title: "Career Intelligence", desc: "Map skills to demand, align values to employers, build a plan.", cta: "Discover paths", href: "/career-intelligence" },
];

const audiences = [
  { who: "Candidates", question: "Should I work here?", desc: "Run the intelligence before you accept. Know the political footprint, compensation reality, and culture signals." },
  { who: "Employees", question: "What kind of company am I inside?", desc: "Understand the signal trail behind your employer. Influence exposure, workforce stability, and what your leadership funds." },
  { who: "Recruiters & HR", question: "How do I recruit here honestly?", desc: "Audit your EVP against real data. Anticipate candidate objections. Close with confidence, not spin." },
  { who: "Sales", question: "How do I sell here smartly?", desc: "Understand buying committees, workforce priorities, and the political context that shapes procurement." },
  { who: "Journalists", question: "What is the signal trail?", desc: "Source-linked corporate intelligence. PAC donations, lobbying, federal contracts, revolving-door hires." },
];

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [rivalries, setRivalries] = useState<any[] | null>(null);
  const [activeAudience, setActiveAudience] = useState("Candidates");

  usePageSEO({
    title: "Employer Background Check for Recruiters — Career Intelligence",
    description: "Vet employers before your candidates do. SEC filings, PAC spending, layoff history, and pay equity data — in one scan. Workforce Transparency Standard.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For?",
      description: "Career Intelligence platform. Understand the company behind the job offer.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://wdiwf.jackyeclayton.com",
    },
  });

  // Load rivalries only when section comes into viewport (triggered by Suspense)
  const loadRivalriesOnce = () => {
    if (!rivalries) loadRivalries().then(setRivalries);
  };

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      {/* Exit intent deferred */}
      <Suspense fallback={null}><ExitIntentCapture /></Suspense>

      {/* ── Hero — NO ANIMATIONS, renders instantly ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-36 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div className="font-mono text-sm uppercase text-primary mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-primary inline-block" />
            Career Intelligence Platform
          </div>
          <h1 className="text-3xl lg:text-[clamp(2.4rem,5vw,3.6rem)] leading-tight mb-6 text-foreground">
            See who you really work for{" "}
            <span className="text-primary">before you say yes.</span>
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground mb-10 max-w-[480px] leading-relaxed">
            Founded by a long-time Talent Acquisition executive who has been in the room where it happens, WDIWF was built to help both sides tell a clearer story through transparency.
          </p>
          <HeroSearch />
          <div className="mt-6">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
            >
              Scan the Employer
            </button>
          </div>
        </div>

        {/* Static preview card — no motion dependency */}
        <div>
          <div className="bg-card border border-border p-6 relative">
            <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-sm uppercase text-primary tracking-widest">
              Live Intelligence Preview
            </div>
            <div className="font-serif text-lg mb-1">Koch Industries</div>
            <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground mb-4">
              Employer Clarity Score: 6.2 / 10 · High Scrutiny
            </div>
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
              {[
                { label: "Influence Exposure", val: "Significant", color: "text-destructive" },
                { label: "Lobbying Spend", val: "$5.2M", color: "text-amber-500" },
                { label: "Hiring Transparency", val: "Moderate", color: "text-amber-500", desktopOnly: true },
                { label: "Workforce Stability", val: "Stable", color: "text-primary", desktopOnly: true },
              ].map(m => (
                <div key={m.label} className={`bg-card p-3 ${m.desktopOnly ? "hidden lg:block" : ""}`}>
                  <div className="font-mono text-sm uppercase text-muted-foreground mb-1">{m.label}</div>
                  <div className={`font-data text-lg font-bold ${m.color}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-sm p-2 border-l-2 border-l-destructive bg-destructive/[0.07] text-foreground">Non-compete clause — unusually broad scope</div>
              <div className="text-sm p-2 border-l-2 border-l-amber-500 bg-amber-500/[0.07] text-foreground hidden lg:block">Salary offer 8.2% below market median</div>
              <div className="text-sm p-2 border-l-2 border-l-primary bg-primary/[0.07] text-foreground">Federal contractor — strong job security signal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Evidence Strip (static, no AnimatedCounter to avoid JS overhead) ── */}
      <div className="border-y border-border px-6 py-8">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-8 lg:gap-14 flex-wrap">
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">{STATIC_COMPANY_COUNT}+</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Companies Tracked</div></div>
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">6</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Federal Sources</div></div>
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">20+</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Years HR Expertise</div></div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {TRUST_SOURCES.map((src) => (
              <span key={src} className="font-mono text-sm tracking-wider uppercase text-muted-foreground/70">{src}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Intelligence Dashboard — NEWS TERMINAL FEEL ── */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted/10" />}>
        <IntelligenceDashboard />
      </Suspense>
      {/* ── How It Works — 1-2-3 Flow ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">How It Works</div>
        <h2 className="text-2xl lg:text-3xl mb-14 text-foreground">
          Three steps. Full clarity.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {[
            { step: "01", icon: Search, title: "Search a company", desc: "Type any employer you're considering — or dreaming about. We'll pull the intelligence." },
            { step: "02", icon: BarChart3, title: "Get a Company Intelligence Report", desc: "Political spend, lawsuits, sentiment, diversity indicators, benefits, hiring tech — all sourced from public records." },
            { step: "03", icon: Eye, title: "Decide with eyes open", desc: "Ask better interview questions, negotiate smarter, or walk away. The intelligence is yours." },
          ].map(s => (
            <div key={s.step} className="bg-card p-8 lg:p-10">
              <div className="font-mono text-sm text-primary/50 mb-4">{s.step}</div>
              <s.icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.5} />
              <div className="font-serif text-lg mb-2 text-foreground">{s.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Five Pillars of Intelligence ── */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
        <div className="max-w-[960px] mx-auto">
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">What You'll See</div>
          <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
            Five pillars. One complete picture.
          </h2>
          <p className="text-muted-foreground text-base mb-14 max-w-[520px]">
            Every company report is organized around the signals that actually matter for your career decision.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border">
            {[
              { icon: Scale, title: "Power & Influence", signals: ["Political contributions", "Lobbying spend", "Board ties & interlocks"] },
              { icon: Users, title: "People & Experience", signals: ["Turnover signals", "Sentiment analysis", "Lawsuits & complaints"] },
              { icon: DollarSign, title: "Pay & Benefits", signals: ["Comp benchmarks", "Pay equity signals", "Benefits data"] },
              { icon: Shield, title: "Practice & Policy", signals: ["DEI actions vs. words", "ESG commitments", "Public stances"] },
              { icon: Cpu, title: "Process & Tech", signals: ["ATS detection", "AI hiring tools", "Surveillance signals"] },
            ].map(p => (
              <div key={p.title} className="bg-card p-6">
                <p.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
                <div className="font-mono text-sm tracking-wider uppercase text-foreground mb-3">{p.title}</div>
                <ul className="space-y-1.5">
                  {p.signals.map(s => (
                    <li key={s} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 bg-primary/50 rounded-full mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use This To — Decision Moments ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">Real Decisions</div>
            <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
              Use this before the moment that matters.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Before you accept an offer. Before you move across the country. Before you stay at a company that keeps making the news.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Write smarter questions for your interviews.",
              "Spot red flags early — before the ink is dry.",
              "Compare multiple offers beyond salary.",
              "Gather receipts before you refer your community.",
            ].map(item => (
              <div key={item} className="flex items-start gap-3 p-4 border border-border bg-card">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Tools ── */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
        <div className="max-w-[960px] mx-auto">
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">Core Intelligence</div>
          <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
            Four tools. One truth. Zero surprises.
          </h2>
          <p className="text-muted-foreground text-base mb-14 max-w-[480px]">
            Every tool connects to the same intelligence engine. Same data, same sources, same rigor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {tools.map((t) => (
              <div
                key={t.title}
                className="bg-background p-8 lg:p-10 hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => navigate(t.href)}
              >
                <t.icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.5} />
                <div className="font-serif text-lg mb-2 text-foreground">{t.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed mb-5">{t.desc}</div>
                <div className="flex items-center gap-1.5 font-mono text-sm tracking-wider uppercase text-primary group-hover:gap-2.5 transition-all">
                  {t.cta} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Dashboard moved above fold */}

      {/* ── Below-fold sections: lazy-loaded ── */}
      <Suspense fallback={null}>
        <SocialProofStrip />
      </Suspense>

      <Suspense fallback={null}>
        <MiniReportTeaser />
      </Suspense>

      {/* ── Jackye Section (below fold, uses small webp) ── */}
      <Suspense fallback={null}>
        <SectionReveal>
          <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
            <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
              <div>
                <img
                  src={jackyeHeadshotSm}
                  alt="Jackye Clayton, Founder of Who Do I Work For"
                  className="w-24 h-24 object-cover mb-4"
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                />
                <div className="font-serif text-xl text-primary mb-1">Jackye Clayton</div>
                <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground">
                  Founder · Career Strategist · HR Intelligence Expert
                </div>
              </div>
              <div>
                <blockquote className="border-l-2 border-primary pl-4 text-lg italic text-foreground leading-relaxed mb-2 font-serif" style={{ fontWeight: 400 }}>
                  "I've been in the rooms where corporate decisions are made, where talent strategies are set, and where power is wielded. Who Do I Work For? is the intelligence the industry never wanted you to have."
                </blockquote>
                <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground pl-4 mb-6">— Jackye Clayton, Founder</div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  WDIWF was built to help both sides tell a clearer story through transparency. 20+ years in the rooms where it happens — now that intelligence is yours.
                </p>
                <p className="font-mono text-sm italic text-primary mt-6 tracking-wide">
                  No judgment, just receipts.
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>
      </Suspense>

      {/* ── Audiences ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">Who It's For</div>
        <h2 className="text-2xl lg:text-3xl mb-2 text-foreground">
          Built for people who care about where people land.
        </h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-[520px]">
          Not another background check on you — this time, it's about them.
        </p>

        {/* Mobile: simplified tabs without heavy Radix */}
        <div className="lg:hidden">
          <div className="flex flex-wrap gap-1 mb-6">
            {audiences.map(a => (
              <button
                key={a.who}
                onClick={() => setActiveAudience(a.who)}
                className={`font-mono text-sm tracking-wider uppercase px-3 py-2 transition-colors ${
                  activeAudience === a.who
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {a.who}
              </button>
            ))}
          </div>
          {audiences.filter(a => a.who === activeAudience).map(a => (
            <div key={a.who} className="bg-card border border-border p-6">
              <div className="font-serif text-base text-foreground mb-2">{a.question}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>

        {/* Desktop: static rows */}
        <div className="hidden lg:flex flex-col gap-px bg-border border border-border">
          {audiences.map((a) => (
            <div key={a.who} className="bg-card p-8 grid grid-cols-[160px_1fr_2fr] gap-8 items-center">
              <div className="font-mono text-sm tracking-[0.15em] uppercase text-primary">{a.who}</div>
              <div className="font-serif text-base text-foreground">{a.question}</div>
              <div className="text-sm text-muted-foreground">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values-Aligned Jobs ── */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm tracking-[0.2em] uppercase text-primary">Values-Aligned Jobs</span>
            </div>
            <h2 className="text-xl lg:text-2xl text-foreground mb-2">
              Find roles that match what matters to you.
            </h2>
            <p className="text-sm text-muted-foreground max-w-[480px] leading-relaxed">
              Every listing enriched with civic scores, political signals, and culture data.
            </p>
          </div>
          <button
            onClick={() => navigate("/jobs")}
            className="bg-primary text-primary-foreground px-7 py-3 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all whitespace-nowrap flex items-center gap-2"
          >
            Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl mb-4 text-foreground">Built on public records. Every signal sourced.</h2>
            <p className="text-sm text-muted-foreground max-w-[520px] mx-auto mb-6">
              FEC filings · Senate lobbying · USAspending · BLS wage data · SEC reports · FRED indicators.
            </p>
            <button
              onClick={() => navigate("/methodology")}
              className="font-mono text-sm tracking-wider uppercase text-primary hover:underline"
            >
              Read our methodology →
            </button>
          </div>
          {/* Trust Card */}
          <div className="bg-card border border-primary/20 p-6 lg:p-8 max-w-[640px] mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm tracking-[0.15em] uppercase text-primary font-semibold">Our Standard</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Public records only. Verified watchdog data. No partisan endorsements. We connect the dots; you make the call.
            </p>
          </div>
        </div>
      </section>

      {/* ── Rivalries Teaser (lazy, loads data on demand) ── */}
      <Suspense fallback={null}>
        <SectionReveal>
          <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[960px] mx-auto w-full" onMouseEnter={loadRivalriesOnce}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm tracking-[0.2em] uppercase text-primary font-semibold">
                    2026 Intelligence
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Rivalry Super Tracker</h2>
              </div>
              <button
                onClick={() => navigate("/rivalries")}
                className="font-mono text-sm tracking-wider uppercase text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {rivalries && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rivalries.slice(0, 2).map(r => (
                  <Suspense key={r.id} fallback={null}>
                    <RivalryBattleCard rivalry={r} compact />
                  </Suspense>
                ))}
              </div>
            )}
          </section>
        </SectionReveal>
      </Suspense>

      {/* ── Compare CTA ── */}
      <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[960px] mx-auto w-full">
        <div
          className="bg-card border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => navigate("/compare")}
        >
          <div className="flex items-center gap-4">
            <ArrowLeftRight className="w-8 h-8 text-primary" strokeWidth={1.5} />
            <div>
              <div className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">Compare Two Employers</div>
              <div className="text-sm text-muted-foreground">Side-by-side scores, PAC spending, lobbying, and contracts.</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm tracking-wider uppercase text-primary group-hover:gap-2.5 transition-all whitespace-nowrap">
            Start comparison <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* ── FAQ + Email (lazy) ── */}
      <Suspense fallback={null}><FAQSection /></Suspense>
      <Suspense fallback={null}><EmailCapture /></Suspense>

      {/* ── Dream Job Widget ── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[480px] mx-auto">
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted/30 rounded-xl" />}>
            <DreamJobWidget />
          </Suspense>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 lg:px-16 py-28 lg:py-36 text-center">
        <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
          You deserve to know exactly who you work for.
        </h2>
        <p className="text-base text-muted-foreground max-w-[480px] mx-auto mb-10 leading-relaxed">
          Every candidate. Every offer. Every career decision. Run the intelligence first.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-primary text-primary-foreground px-8 py-3.5 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
        >
          Scan the Employer
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 lg:px-16 py-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div className="font-mono text-sm tracking-wider text-muted-foreground">
              Who Do I Work For? · by Jackye Clayton
            </div>
            <div className="flex gap-6">
              <a href="/privacy" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="/methodology" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Methodology</a>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground/60 leading-relaxed max-w-[800px]">
              WDIWF reports publicly available data and does not provide character assessments, legal advice, or employment recommendations. All signals are sourced from public records and verified watchdog databases. Users should independently verify information before making employment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default Index;
