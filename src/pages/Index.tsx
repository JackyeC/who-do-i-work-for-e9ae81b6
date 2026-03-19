import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight, ArrowLeftRight, Zap, Search, Eye, Target, Brain, Rocket, CheckCircle2, Menu, X, Crosshair } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-page-seo";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { PathfinderTracks } from "@/components/landing/PathfinderTracks";
import { DemoCompanyProfile } from "@/components/landing/DemoCompanyProfile";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const SocialProofStrip = lazy(() => import("@/components/landing/SocialProofStrip").then(m => ({ default: m.SocialProofStrip })));
const IntelligenceDashboard = lazy(() => import("@/components/landing/IntelligenceDashboard").then(m => ({ default: m.IntelligenceDashboard })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const EmailCapture = lazy(() => import("@/components/landing/EmailCapture").then(m => ({ default: m.EmailCapture })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));
const RivalryBattleCard = lazy(() => import("@/components/RivalryBattleCard").then(m => ({ default: m.RivalryBattleCard })));
const SectionReveal = lazy(() => import("@/components/landing/SectionReveal").then(m => ({ default: m.SectionReveal })));

const loadRivalries = () => import("@/data/rivalries2026").then(m => m.rivalries2026);

const TRUST_SOURCES = ["FEC Filings", "USASpending.gov", "SEC EDGAR", "Senate Lobbying", "BLS Wage Data", "OpenSecrets"];
const STATIC_COMPANY_COUNT = 850;

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rivalries, setRivalries] = useState<any[] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageSEO({
    title: "Career Intelligence — Stop Guessing, Start Auditing",
    description: "Not a job board. A career audit center. Use 15+ years of recruiting intelligence to find the job that matches your DNA and your worth.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For?",
      description: "Career Intelligence platform. Audit your career, not just search for jobs.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://wdiwf.jackyeclayton.com",
    },
  });

  const loadRivalriesOnce = () => {
    if (!rivalries) loadRivalries().then(setRivalries);
  };

      {/* ══════════════════════════════════════════════════════════════════
          TWO-SIDED PLATFORM PATHS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20" style={{ background: "#0a0a0e" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Candidates */}
            <div
              className="rounded-2xl p-8 text-left flex flex-col"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(240,192,64,0.10)" }}
              >
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-[2px] font-semibold text-primary mb-3">
                For Candidates
              </p>
              <h3 className="font-sans font-bold text-foreground mb-3" style={{ fontSize: "18px", lineHeight: 1.3 }}>
                Find work that matches what you actually believe in.
              </h3>
              <p className="font-sans text-muted-foreground mb-6 flex-1" style={{ fontSize: "14px", lineHeight: 1.65 }}>
                We verify the company before you apply.
              </p>
              <Button
                onClick={() => navigate("/auto-apply")}
                className="w-full rounded-full gap-2"
              >
                Find Your Match <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* For Organizations */}
            <div
              className="rounded-2xl p-8 text-left flex flex-col"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(240,192,64,0.10)" }}
              >
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-[2px] font-semibold text-primary mb-3">
                For Organizations
              </p>
              <h3 className="font-sans font-bold text-foreground mb-3" style={{ fontSize: "18px", lineHeight: 1.3 }}>
                Prove your mission is real. Find candidates who are already bought in.
              </h3>
              <p className="font-sans text-muted-foreground mb-6 flex-1" style={{ fontSize: "14px", lineHeight: 1.65 }}>
                Get verified against public data — not your marketing copy.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/for-employers")}
                className="w-full rounded-full gap-2"
              >
                Get Verified <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p
            className="text-center mt-8 font-sans"
            style={{ fontSize: "14px", color: "#7a7590", letterSpacing: "1px" }}
          >
            No bias. Just receipts.
          </p>
        </div>
      </section>


  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      {/* Live Intelligence Ticker */}
      <Suspense fallback={<div className="h-[28px] bg-primary" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* ── Site Header ── */}
      <header className="px-6 lg:px-16 py-4 max-w-[1100px] mx-auto w-full flex items-center justify-between">
        <Link to="/" className="font-serif text-foreground" style={{ fontSize: '20px', fontWeight: 700 }}>
          WDIWF
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          {!authLoading && (
            user ? (
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="font-sans text-btn">
                Dashboard
              </Button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="font-sans text-nav text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </button>
                <Button size="sm" onClick={() => navigate("/login")} className="font-sans text-btn rounded-full px-5">
                  Get started
                </Button>
              </>
            )
          )}
        </nav>
        <button className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden px-6 pb-4 border-b border-border/50">
          <nav className="flex flex-col gap-3">
            {!authLoading && (
              user ? (
                <Button size="sm" variant="outline" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }} className="font-mono text-xs tracking-wider uppercase w-full">Dashboard</Button>
              ) : (
                <>
                  <button onClick={() => { setMobileMenuOpen(false); navigate("/login"); }} className="font-mono text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors py-2">Sign in</button>
                  <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }} className="font-mono text-xs tracking-wider uppercase w-full">Get started</Button>
                </>
              )
            )}
          </nav>
        </div>
      )}

      <Suspense fallback={null}><ExitIntentCapture /></Suspense>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — "The Flip Moment"
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center px-6 text-center"
        style={{ minHeight: "100vh", background: "#0a0a0e" }}
      >
        {/* Grain overlay */}
        <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
          <filter id="hero-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>

        <div className="relative z-[1] flex flex-col items-center">
          {/* Eyebrow label */}
          <p className="text-eyebrow" style={{ marginBottom: '24px' }}>
            Career Intelligence Platform
          </p>

          {/* Headline */}
          <h1
            className="text-display"
            style={{
              color: "#f0ebe0",
              animation: "heroFadeIn 0.8s ease forwards",
            }}
          >
            The recruiting platform that audits the company first.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: "17px",
              color: "#b8b4a8",
              lineHeight: 1.7,
              maxWidth: "580px",
              marginTop: "24px",
              textAlign: "center",
              opacity: 0,
              animation: "heroFadeIn 0.6s ease 0.9s forwards",
            }}
          >
            Before we match you with a job, we check whether the employer deserves great talent.
            Verified integrity scores. Value-aligned hiring. Built for people who won't settle.
          </p>

          {/* CTA */}
          <div
            style={{
              marginTop: "36px",
              opacity: 0,
              animation: "heroFadeIn 0.5s ease 1.5s forwards",
            }}
          >
            {(() => {
              const hasPersona = typeof window !== "undefined" && !!localStorage.getItem("wdiwf_persona");
              return (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => navigate(hasPersona ? "/dashboard" : "/quiz")}
                    className="hover-btn"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      background: "#f0c040",
                      color: "#0a0a0e",
                      padding: "16px 44px",
                      borderRadius: "50px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {hasPersona ? "Continue to my intelligence →" : "Start your audit →"}
                  </button>
                  {hasPersona && (
                    <button
                      onClick={() => navigate("/quiz")}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px",
                        color: "#7a7590",
                        marginTop: "8px",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                      }}
                    >
                      Or retake the quiz →
                    </button>
                   )}
                  <Link
                    to="/join"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: "#7a7590",
                      marginTop: "10px",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Launching April 6 — get early access →
                  </Link>
                </div>
              );
            })()}
          </div>

          {/* ── Benefit Cards ── */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-[900px]"
            style={{
              marginTop: "64px",
              opacity: 0,
              animation: "heroFadeIn 0.6s ease 2s forwards",
            }}
          >
            {[
              {
                icon: <Shield className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Company Integrity Score",
                body: "We audit culture, turnover, leadership stability, and Glassdoor trajectory before any candidate sees the job.",
              },
              {
                icon: <Target className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Value Alignment Matching",
                body: "Skills get you in the door. Values keep you there. Our AI matches on both.",
              },
              {
                icon: <Eye className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Candidate Intelligence",
                body: "Job seekers see exactly what they're walking into — so only the right people apply.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl p-6 text-left"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(240,192,64,0.10)" }}
                >
                  {card.icon}
                </div>
                <h3
                  className="font-sans font-semibold mb-2"
                  style={{ fontSize: "15px", color: "#f0ebe0" }}
                >
                  {card.title}
                </h3>
                <p
                  className="font-sans"
                  style={{ fontSize: "13px", color: "#9994a8", lineHeight: 1.6 }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-24" style={{ background: "#0a0a0e" }}>
        <div className="max-w-[900px] mx-auto">
          <p
            className="text-xs uppercase tracking-[3px] font-semibold text-center mb-3"
            style={{ color: "#f0c040" }}
          >
            How It Works
          </p>
          <h2
            className="font-sans text-center leading-[1.1] mb-16"
            style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-2px", color: "#f0ebe0" }}
          >
            Four steps. Full transparency.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                title: "Company gets audited",
                body: "We pull public signals — Glassdoor trajectory, leadership turnover, workforce stability, public legal and civic record.",
              },
              {
                step: "02",
                title: "Integrity score calculated",
                body: "Our model flags Reality Gaps (what companies say vs. what employees report) and Insider Risk. High-risk employers are flagged before any candidate is matched.",
              },
              {
                step: "03",
                title: "Candidates matched on values, not just skills",
                body: "Our AI scores alignment across skills (40%), values (35%), and experience (25%). Protected attributes are masked.",
              },
              {
                step: "04",
                title: "Everyone walks in informed",
                body: "Candidates see company integrity data. Employers see values-aligned candidates. Recruiters see it all.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl p-7"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="inline-block font-sans mb-4"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#f0c040",
                    letterSpacing: "1px",
                  }}
                >
                  STEP {item.step}
                </span>
                <h3
                  className="font-sans font-bold mb-3"
                  style={{ fontSize: "17px", color: "#f0ebe0", lineHeight: 1.3 }}
                >
                  {item.title}
                </h3>
                <p
                  className="font-sans"
                  style={{ fontSize: "14px", color: "#9994a8", lineHeight: 1.65 }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-16 py-16 max-w-[700px] mx-auto w-full text-center">
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#7a7590",
            marginBottom: "12px",
          }}
        >
          Or scan a company directly
        </div>
        <div id="hero-search-anchor">
          <HeroSearch />
        </div>
      </section>

      {/* heroFadeIn keyframe */}
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ── Evidence Strip ── */}
      <div className="border-y border-border px-6 py-8">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-8 lg:gap-14 flex-wrap">
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">{STATIC_COMPANY_COUNT}+</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Companies Tracked</div></div>
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">6</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Federal Sources</div></div>
            <div><div className="font-data text-2xl font-bold text-foreground tabular-nums">15+</div><div className="font-mono text-xs uppercase text-muted-foreground tracking-wider">Years HR Expertise</div></div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {TRUST_SOURCES.map((src) => (
              <span key={src} className="font-mono text-sm tracking-wider uppercase text-muted-foreground/70">{src}</span>
            ))}
          </div>
        </div>
        <p style={{
          fontSize: '12px',
          fontWeight: 400,
          color: '#3d3a4a',
          textAlign: 'center',
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '16px auto 0',
        }}>
          Built on public records: FEC filings · SEC EDGAR · USAspending.gov · BLS wage data · OSHA · NLRB · Senate Lobbying Disclosures · ProPublica · OpenSecrets · CourtListener
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DEMO DOSSIER — Conversion Engine
      ══════════════════════════════════════════════════════════════════ */}
      <section id="demo-dossier" className="px-6 lg:px-16 py-20 lg:py-28 bg-card border-y border-border">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-10">
            <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">
              This is what you won't see on a job board
            </div>
            <h2 className="text-2xl lg:text-3xl text-foreground mb-4">
              Most candidates never see this before they accept.{" "}
              <span className="text-primary">You should.</span>
            </h2>
          </div>
          <DemoCompanyProfile />
          <div className="flex justify-center mt-8">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all flex items-center gap-2"
            >
              Run this for a company you're considering
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5-TRACK PATHFINDER
      ══════════════════════════════════════════════════════════════════ */}
      <PathfinderTracks />

      {/* ══════════════════════════════════════════════════════════════════
          WHAT YOU GET — Three Value Cards
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
        <div className="max-w-[960px] mx-auto">
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">What You Get</div>
          <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
            Three layers of career intelligence.
          </h2>
          <p className="text-muted-foreground text-base mb-14 max-w-[520px]">
            This isn't a job board. It's a clarity engine for your career.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {[
              {
                icon: Eye,
                title: "The Truth",
                desc: "See what companies don't put on the careers page.",
                signals: ["Employer Clarity Scores", "Ghost-Post Detection", "Reality Gap Analysis", "Pay equity signals"],
              },
              {
                icon: Brain,
                title: "The Strategy",
                desc: "Build a career plan based on data, not vibes.",
                signals: ["Workplace DNA Calibration", "5-Year Career Mapping", "Internal role matching", "Skills gap analysis"],
              },
              {
                icon: Rocket,
                title: "The Alignment",
                desc: "Execute your move with clarity and advocacy.",
                signals: ["Purple Squirrel Auto-Apply", "Interview Intelligence Briefs", "Negotiation Coaching", "Offer review & benchmarking"],
              },
            ].map(card => (
              <div key={card.title} className="bg-background p-8 lg:p-10">
                <card.icon className="w-6 h-6 text-primary mb-4" strokeWidth={1.5} />
                <div className="font-mono text-sm tracking-wider uppercase text-foreground mb-2">{card.title}</div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{card.desc}</p>
                <ul className="space-y-2">
                  {card.signals.map(s => (
                    <li key={s} className="text-sm text-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 bg-primary/60 rounded-full mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COMPARISON TABLE — Generic Job Boards vs WDIWF
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <div className="text-center mb-14">
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">The Difference</div>
          <h2 className="text-2xl lg:text-3xl text-foreground">
            Phone Book vs. Clarity Engine.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {/* Generic */}
          <div className="bg-card p-8 lg:p-10">
            <div className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Indeed / LinkedIn</div>
            <ul className="space-y-3">
              {[
                "Lists of job titles",
                "Company marketing copy",
                "Apply and pray",
                "No salary transparency",
                "No culture intelligence",
                "No negotiation support",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <X className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* WDIWF */}
          <div className="bg-card p-8 lg:p-10 border-l-2 border-l-primary">
            <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">WDIWF Intelligence</div>
            <ul className="space-y-3">
              {[
                "Intelligence reports on every employer",
                "Reality Gap analysis — claims vs. facts",
                "Auto-Apply with DNA-matched targeting",
                "BLS wage benchmarks + offer scoring",
                "Political influence, lawsuits, sentiment",
                "Negotiation scripts + coaching",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Intelligence Dashboard ── */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted/10" />}>
        <IntelligenceDashboard />
      </Suspense>

      {/* ── Social Proof ── */}
      <Suspense fallback={null}>
        <SocialProofStrip />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════════
          THE JACKYE FACTOR — Authority
      ══════════════════════════════════════════════════════════════════ */}
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
                  Founder & Executive Agent
                </div>
              </div>
              <div>
                <blockquote className="border-l-2 border-primary pl-4 text-lg italic text-foreground leading-relaxed mb-2 font-serif" style={{ fontWeight: 400 }}>
                  "I've spent 15+ years building the hiring machines for the biggest names in Tech. I know exactly where the 'Ghost Jobs' are hidden and where the hidden budget lives. I built WDIWF to put that power in your hands."
                </blockquote>
                <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground pl-4 mb-6">— Jackye Clayton, Founder & Executive Agent</div>
                <div className="flex items-center gap-3 pl-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs tracking-wider uppercase text-primary">Data-Backed by Jackye Clayton</span>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>
      </Suspense>

      {/* ── Rivalries Teaser ── */}
      <Suspense fallback={null}>
        <SectionReveal>
          <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[960px] mx-auto w-full" onMouseEnter={loadRivalriesOnce}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm tracking-[0.2em] uppercase text-primary font-semibold">2026 Intelligence</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Rivalry Super Tracker</h2>
              </div>
              <button onClick={() => navigate("/rivalries")} className="font-mono text-sm tracking-wider uppercase text-primary hover:underline flex items-center gap-1 whitespace-nowrap">
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

      {/* ── Methodology ── */}
      <section className="px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl mb-4 text-foreground">Built on public records. Every signal sourced.</h2>
            <p className="text-sm text-muted-foreground max-w-[520px] mx-auto mb-6">
              FEC filings · Senate lobbying · USAspending · BLS wage data · SEC reports · FRED indicators.
            </p>
            <button onClick={() => navigate("/methodology")} className="font-mono text-sm tracking-wider uppercase text-primary hover:underline">
              Read our methodology →
            </button>
          </div>
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

      {/* ── FAQ + Email ── */}
      <Suspense fallback={null}><FAQSection /></Suspense>
      <Suspense fallback={null}><EmailCapture /></Suspense>

      {/* ── Final CTA ── */}
      <section className="px-6 lg:px-16 py-28 lg:py-36 text-center">
        <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
          You deserve to know exactly who you work for.
        </h2>
        <p className="text-base text-muted-foreground max-w-[480px] mx-auto mb-10 leading-relaxed">
          Stop applying blind. Start auditing your career with intelligence.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/career-map")}
            className="bg-primary text-primary-foreground px-8 py-3.5 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
          >
            Calibrate My Workplace DNA
          </button>
          <button
            onClick={() => navigate("/login")}
            className="border border-border bg-card px-8 py-3.5 font-mono text-sm tracking-wider uppercase text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            Scan an Employer
          </button>
        </div>
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
