import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Search, FileSearch, Shield, TrendingUp, Bell, BookOpen, MessageCircle, Layers, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { usePageSEO } from "@/hooks/use-page-seo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [heroQuery, setHeroQuery] = useState("");

  usePageSEO({
    title: "Who Do I Work For — Career Intelligence by Jackye Clayton",
    description: "Career advocacy built on public records. Evaluate employers, review offers, map your next move, and protect your career. Facts over feelings.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For",
      description: "Career advocacy platform by Jackye Clayton. Evaluate employers using public records — political spending, enforcement history, lobbying, compensation data.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://whodoiworkfor.com",
    },
  });

  if (!isLoaded || authLoading) return null;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      <MarketingNav />
      <Suspense fallback={null}><ExitIntentCapture /></Suspense>

      {/* ═══════════════════════════════════════════
          1 — HERO
      ═══════════════════════════════════════════ */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 pt-20 pb-16 lg:pt-32 lg:pb-24 bg-background overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.05) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.03) 0%, transparent 70%)" }} />

        <div className="relative z-[1] max-w-[780px] mx-auto text-center">
          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-5"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.15s forwards" }}
          >
            Career advocacy, not career fluff
          </p>

          <h1
            className="text-foreground font-sans text-center mx-auto"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1.04,
              maxWidth: "18ch",
              opacity: 0,
              animation: "heroFadeIn 0.7s ease 0.3s forwards",
            }}
          >
            Stop applying.{" "}
            <span className="text-primary">Start aligning.</span>
          </h1>

          <p
            className="text-muted-foreground max-w-[56ch] mx-auto leading-relaxed mt-6"
            style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.075rem)", opacity: 0, animation: "heroFadeIn 0.6s ease 0.6s forwards" }}
          >
            Who Do I Work For helps you evaluate employers, understand what your labor supports, review offers, map your next move, and protect your career — using public records, values alignment, and plain-English guidance.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-9 mx-auto max-w-[540px] relative group"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.9s forwards" }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Search any employer..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="mr-2 px-5 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                Check <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* CTA row */}
          <div
            className="flex flex-wrap gap-3 justify-center mt-6"
            style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.1s forwards" }}
          >
            {[
              { label: "Protect My Career", to: user ? "/dashboard" : "/join" },
              { label: "Review My Offer", to: "/offer-analysis" },
              { label: "Build My Career Map", to: "/career-map" },
            ].map((cta) => (
              <button
                key={cta.label}
                onClick={() => navigate(cta.to)}
                className="px-4 py-2 text-xs font-sans font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all bg-card"
              >
                {cta.label}
              </button>
            ))}
          </div>

          {/* Source line */}
          <p className="font-mono text-[9px] text-muted-foreground/30 mt-6 tracking-wide" style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.3s forwards" }}>
            Federal Election Commission · Securities & Exchange Commission · Bureau of Labor Statistics · Occupational Safety & Health Administration · National Labor Relations Board · Senate Lobbying Disclosures
          </p>
        </div>
      </section>

      <style>{`@keyframes heroFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── TICKER ── */}
      <Suspense fallback={<div className="h-[36px] bg-background border-y border-border/10" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* ═══════════════════════════════════════════
          2 — WHAT WDIWF DOES
      ═══════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[760px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4 text-center">What We Do</p>
          <h2 className="text-h1 text-foreground text-center mb-10">
            The background check your employer never expected.
          </h2>

          <div className="space-y-5">
            {[
              "We investigate employers using public records and labor signals — Federal Election Commission filings, Securities & Exchange Commission disclosures, Occupational Safety & Health Administration violations, lobbying reports, compensation data, and more.",
              "We compare what companies say with what they actually do — matching mission statements and careers-page promises against enforcement records, political spending, and workforce signals.",
              "We help you understand values alignment, employer risk, and career leverage — so you're never making a decision with less information than the company sitting across from you.",
              "We help you decide whether to apply, stay, negotiate, or leave — with evidence, not guesswork.",
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-start">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" strokeWidth={1.5} />
                <p className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: "clamp(14px, 1.2vw, 16px)" }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOLD DIVIDER ── */}
      <div className="gold-line mx-auto w-full max-w-[200px]" />

      {/* ═══════════════════════════════════════════
          3 — HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[900px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4 text-center">How It Works</p>
          <h2 className="text-h1 text-foreground text-center mb-14">
            Three steps. No ambiguity.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search or upload",
                body: "Enter a company name or upload a job offer. We pull the records.",
              },
              {
                step: "02",
                title: "Read the receipts",
                body: "See the full employer dossier — political giving, enforcement history, lobbying activity, leadership signals, workforce data, and values alignment.",
              },
              {
                step: "03",
                title: "Make your move",
                body: "Apply, negotiate, stay, or leave — with evidence, leverage, and confidence. Not hope.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col">
                <span className="font-mono text-primary text-xs tracking-wider mb-3">{item.step}</span>
                <h3 className="font-sans font-bold text-foreground text-base mb-2">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4 — WHY THIS EXISTS
      ═══════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[720px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Why This Exists</p>
          <h2 className="text-h1 text-foreground mb-8">
            You prove yourself to employers every day. When do they prove themselves to you?
          </h2>

          <div className="space-y-6">
            <p className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: "clamp(14px, 1.3vw, 16px)" }}>
              Too many people are asked to prove themselves to employers without ever being shown what those employers actually stand for. You tailor your resume. You prep for behavioral interviews. You write thank-you notes. And in return, you get a careers page full of stock photos and a mission statement that might not survive a single Federal Election Commission search.
            </p>
            <p className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: "clamp(14px, 1.3vw, 16px)" }}>
              Who Do I Work For exists because people deserve better than mission-statement theater, ghost jobs, and getting blindsided by the market. We built the trust layer — so you can stop guessing and start knowing.
            </p>
          </div>

          <blockquote className="border-l-2 border-primary pl-6 py-3 mt-10">
            <p className="font-sans text-foreground italic leading-snug" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", fontWeight: 600 }}>
              "You wouldn't buy a house without an inspection. Why would you accept a job without one?"
            </p>
          </blockquote>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5 — PRODUCT MODULES
      ═══════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">The Platform</p>
          <h2 className="text-h1 text-foreground text-center mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-body-lg text-center max-w-[52ch] mx-auto mb-14">
            Six tools. All built on the same foundation: public records, not opinions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <FileSearch className="w-6 h-6" strokeWidth={1.5} />, title: "Employer Dossiers", desc: "Forensic employer profiles — political giving, enforcement records, lobbying data, leadership behavior, workforce signals, and values alignment. All sourced. All traceable.", link: "/browse" },
              { icon: <Shield className="w-6 h-6" strokeWidth={1.5} />, title: "Offer Review", desc: "Upload an offer. Get an analysis of compensation, red flags, and leverage points — grounded in Bureau of Labor Statistics benchmarks and real company data.", link: "/offer-analysis" },
              { icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />, title: "Career Map", desc: "Track your trajectory. Understand role mobility, industry shifts, and where your skills carry the most weight — with data, not vibes.", link: "/career-map" },
              { icon: <Bell className="w-6 h-6" strokeWidth={1.5} />, title: "Watchlist & Alerts", desc: "Track companies you care about. Get notified when new signals surface — layoffs, lobbying shifts, enforcement actions, leadership changes.", link: "/dashboard" },
              { icon: <MessageCircle className="w-6 h-6" strokeWidth={1.5} />, title: "Ask Jackye", desc: "Career guidance in Jackye's voice — strategic, direct, grounded in 20 years inside talent acquisition. Not a chatbot. A career advocate.", link: "/ask-jackye" },
              { icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />, title: "State of Work", desc: "Weekly intelligence on what's happening in the world of work — policy changes, labor market shifts, and what they actually mean for your career.", link: "/receipts" },
            ].map((item) => (
              <Link key={item.title} to={item.link} className="group p-6 border border-border bg-background hover:border-primary/30 transition-all">
                <div className="text-primary mb-4 group-hover:scale-105 transition-transform">{item.icon}</div>
                <h3 className="font-sans font-bold text-foreground text-[15px] mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6 — STATE OF WORK TEASER
      ═══════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-16 lg:py-24 bg-background">
        <div className="max-w-[760px] mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The State of Work</p>
          <h2 className="text-h2 text-foreground mb-4">
            The world of work is shifting. We're tracking it.
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[50ch] mx-auto mb-8">
            Policy changes. Mass layoffs. Lobbying surges. Leadership turnover. Ghost jobs. We publish weekly intelligence so you're never the last to know.
          </p>
          <Link
            to="/receipts"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-sans text-sm font-semibold hover:brightness-110 transition-all"
          >
            Read the Receipts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── GOLD DIVIDER ── */}
      <div className="gold-line mx-auto w-full max-w-[200px]" />

      {/* ═══════════════════════════════════════════
          7 — COMPLIANCE & PUBLIC RECORDS TRUST
      ═══════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-16 lg:py-24">
        <div className="max-w-[760px] mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Public Records Trust</p>
          <h2 className="text-h2 text-foreground mb-4">
            No black boxes. No opinions dressed as data.
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[52ch] mx-auto mb-8">
            Every signal is traceable to a public source. Every score is explainable. We publish our methodology, run quarterly bias audits, and make our data sourcing transparent — because a trust layer only works if you can trust the layer.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: "Methodology", to: "/methodology" },
              { label: "Data Ethics", to: "/data-ethics" },
              { label: "Compliance", to: "/compliance" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="px-4 py-2 text-xs font-sans font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8 — FOUNDER BLOCK
      ═══════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-10 items-start">
            <img
              src={jackyeHeadshotSm}
              alt="Jackye Clayton, Founder of Who Do I Work For"
              className="w-[120px] h-[120px] rounded-full object-cover ring-2 ring-primary/20 mx-auto lg:mx-0"
              width={120}
              height={120}
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3">Meet the Founder</p>
              <h3 className="font-sans font-bold text-foreground text-xl mb-1">Jackye Clayton</h3>
              <p className="font-mono text-xs text-muted-foreground tracking-wide uppercase mb-5">
                Human Resources Technology Strategist · Talent Acquisition Architect · Instructor · Writer · Career Advocate
              </p>
              <p className="font-sans text-muted-foreground leading-relaxed mb-4" style={{ fontSize: "15px", maxWidth: "56ch" }}>
                Jackye Clayton is an Human Resources Technology strategist, talent acquisition architect, instructor, writer, and career advocate. She built Who Do I Work For to help people get great jobs with values and mission alignment — personally and professionally — and to make sure workers have receipts before they make career decisions.
              </p>
              <p className="font-sans text-muted-foreground leading-relaxed mb-6" style={{ fontSize: "15px", maxWidth: "56ch" }}>
                After 20 years inside the hiring machines of major technology companies, she saw the gap: companies run background checks on you, but you have no way to run one on them. Until now.
              </p>
              <div className="flex items-center gap-3 flex-wrap mb-5">
                {[
                  { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
                  { label: "Associate Editor, Human Resources Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
                  { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
                  { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
                  { label: "Unleash 2025 Speaker", url: "https://hr-gazette.com/unleash-america-2025-preview-with-jackye-clayton/" },
                ].map((badge) => (
                  <a key={badge.label} href={badge.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap hover:border-primary/40 hover:text-primary transition-colors">
                    {badge.label}
                  </a>
                ))}
              </div>
              <Link to="/about" className="font-sans text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                More about Jackye →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9 — FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden border-t border-border">
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know who you work for.</p>
          <h2 className="text-h1 text-foreground mb-4">
            Facts over feelings.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[46ch] mx-auto mb-8">
            You don't need more applications. You need better decisions. We built the trust layer for the world of work — now use it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/join")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
            >
              Protect My Career
            </button>
            <button
              onClick={() => navigate("/browse")}
              className="border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              Check a Company
            </button>
          </div>
          <p className="font-sans text-xs text-muted-foreground/40 mt-5">
            No spam. No selling your data. That would be ironic.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
});

export default Index;
