import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Search, FileSearch, Layers, BarChart3, Briefcase, Building, Shield, Eye, Zap, BookOpen, Bell, TrendingUp, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const EmailCapture = lazy(() => import("@/components/landing/EmailCapture").then(m => ({ default: m.EmailCapture })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));

const FEATURED_SLUGS = ["meta", "google", "amazon", "boeing", "accenture", "att"];

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [heroQuery, setHeroQuery] = useState("");

  usePageSEO({
    title: "Who Do I Work For — Career Intelligence by Jackye Clayton",
    description: "Career intelligence built on public records. Research any employer — SEC filings, OSHA violations, political giving, compensation data. Know before you sign.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For",
      description: "Career intelligence platform founded by Jackye Clayton. Research any employer using public records — so you never accept an offer blind again.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://whodoiworkfor.com",
    },
  });

  const { data: featuredCompanies } = useQuery({
    queryKey: ["homepage-featured-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, employer_clarity_score, total_pac_spending, insider_score")
        .in("slug", FEATURED_SLUGS)
        .limit(6);
      return data || [];
    },
    staleTime: 300_000,
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

      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO
          The promise. The movement. The action.
      ═══════════════════════════════════════════════ */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 pt-24 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(43 85% 59% / 0.05) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(43 85% 59% / 0.03) 0%, transparent 70%)" }} />

        <div className="relative z-[1] max-w-[800px] mx-auto">
          {/* Eyebrow */}
          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-6 text-center"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.2s forwards" }}
          >
            The trust layer for the world of work
          </p>

          {/* Headline */}
          <h1
            className="text-foreground font-sans leading-[1.02] tracking-tight text-center mx-auto"
            style={{
              fontSize: "clamp(2.75rem, 7.5vw, 5.5rem)",
              fontWeight: 800,
              letterSpacing: "-2px",
              maxWidth: "16ch",
              opacity: 0,
              animation: "heroFadeIn 0.8s ease 0.4s forwards",
            }}
          >
            I can't believe what you say, because I see{" "}
            <span className="text-primary">what you do.</span>
          </h1>

          {/* Sub */}
          <p
            className="text-muted-foreground max-w-[52ch] mx-auto leading-relaxed text-center"
            style={{ fontSize: "clamp(1rem, 1.4vw, 1.125rem)", marginTop: "24px", opacity: 0, animation: "heroFadeIn 0.6s ease 0.8s forwards" }}
          >
            Career intelligence built on public records. Every company runs a background check on you. This is yours on them.
          </p>

          {/* Search */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-10 mx-auto max-w-[560px] relative group"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 1.1s forwards" }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Search any employer..."
                className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="mr-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                Scan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Source line */}
          <p className="font-mono text-[10px] text-muted-foreground/40 mt-4 tracking-wide text-center" style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.3s forwards" }}>
            Federal Election Commission · Securities & Exchange Commission · Bureau of Labor Statistics · Occupational Safety & Health Administration · National Labor Relations Board · Senate Lobbying Disclosures
          </p>
        </div>
      </section>

      <style>{`@keyframes heroFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── TICKER ── */}
      <Suspense fallback={<div className="h-[36px] bg-background border-b border-border/10" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — THE MOVEMENT MANIFESTO
          What this is. Why it exists. Bold. Direct.
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[720px] mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">What We Believe</p>
          <h2 className="text-h1 text-foreground mb-8">
            Stop applying. Start aligning.
          </h2>
          <div className="space-y-6 text-left">
            {[
              "Every year, millions of people accept jobs at companies they haven't researched — because the tools don't exist. Until now.",
              "We built Who Do I Work For because your employer's political spending, lobbying activity, enforcement record, and leadership behavior should not be a surprise you discover after you've signed.",
              "This is not a review site. This is not a job board. This is a career advocacy platform — built on public records, not opinions. Facts over feelings. Receipts over rankings.",
            ].map((text, i) => (
              <p key={i} className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: "clamp(15px, 1.3vw, 17px)" }}>
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOLD DIVIDER ── */}
      <div className="gold-line mx-auto w-full max-w-[200px]" />

      {/* ═══════════════════════════════════════════════
          SECTION 3 — WHAT WDIWF DOES (PLATFORM)
          The product. Clear, scannable, real.
      ═══════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">The Platform</p>
          <h2 className="text-h1 text-foreground text-center mb-4">
            Everything you need to know before you sign.
          </h2>
          <p className="text-body-lg text-center max-w-[56ch] mx-auto mb-16">
            We aggregate public data and turn it into forensic employer intelligence — so you can evaluate companies with the same rigor they use to evaluate you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FileSearch className="w-6 h-6" strokeWidth={1.5} />, title: "Employer Dossiers", desc: "Forensic profiles built from political filings, enforcement records, lobbying data, leadership behavior, and workforce signals.", link: "/browse" },
              { icon: <Eye className="w-6 h-6" strokeWidth={1.5} />, title: "Values Alignment", desc: "Map your non-negotiables. See which employers match — and where the gaps are between what they say and what records show.", link: "/alignment" },
              { icon: <Shield className="w-6 h-6" strokeWidth={1.5} />, title: "Offer Review", desc: "Upload an offer. Get an AI-powered analysis of compensation, red flags, and leverage points — grounded in real data.", link: "/offer-analysis" },
              { icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />, title: "Career Map", desc: "Track your trajectory. Understand role mobility, industry shifts, and where your skills carry the most weight.", link: "/career-map" },
              { icon: <Bell className="w-6 h-6" strokeWidth={1.5} />, title: "Watchlist & Alerts", desc: "Track companies. Get notified when new signals surface — layoffs, lobbying shifts, enforcement actions, leadership changes.", link: "/dashboard" },
              { icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />, title: "State of Work", desc: "Weekly intelligence on what's happening in the world of work — policy changes, labor shifts, and what they mean for you.", link: "/receipts" },
              { icon: <MessageCircle className="w-6 h-6" strokeWidth={1.5} />, title: "Ask Jackye", desc: "AI-powered career guidance in Jackye's voice. Strategic, direct, and grounded in 20 years of talent acquisition experience.", link: "/ask-jackye" },
              { icon: <Layers className="w-6 h-6" strokeWidth={1.5} />, title: "Public Records Trust", desc: "Every signal is traceable to a source. Every score is explainable. No black boxes. No opinions dressed as data.", link: "/methodology" },
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

      {/* ═══════════════════════════════════════════════
          SECTION 4 — RECENT RECEIPTS
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-16 lg:py-24 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">Recent Receipts</p>
          <h2 className="text-h2 text-foreground text-center mb-10">We see what you did.</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featuredCompanies || []).map((co: any) => (
              <Link key={co.id} to={`/company/${co.slug}`} className="group">
                <div className="border border-border bg-card p-5 hover:border-primary/30 transition-all h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-muted-foreground/70" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-sans text-foreground group-hover:text-primary transition-colors truncate font-semibold text-base">{co.name}</h3>
                        <p className="text-xs text-muted-foreground">{co.industry} · {co.state}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      co.employer_clarity_score >= 70 ? "bg-civic-green/10 text-civic-green" :
                      co.employer_clarity_score >= 40 ? "bg-civic-yellow/10 text-civic-yellow" :
                      "bg-civic-red/10 text-civic-red"
                    }`}>
                      {co.employer_clarity_score}/100
                    </span>
                    <span>
                      {co.total_pac_spending > 0
                        ? `Political Action Committee: $${co.total_pac_spending >= 1000000 ? (co.total_pac_spending / 1000000).toFixed(1) + "M" : co.total_pac_spending >= 1000 ? (co.total_pac_spending / 1000).toFixed(0) + "K" : co.total_pac_spending}`
                        : "No Political Action Committee data"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/receipts" className="font-sans text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              View all receipts →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — THE INTEGRITY GAP
      ═══════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Integrity Gap</p>
              <h2 className="text-h1 text-foreground mb-6">
                Companies interview you. But who's interviewing them?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The Integrity Gap is the distance between what a company says about itself and what it actually does. Their careers page says "people-first." Their turnover data says otherwise. Their mission statement mentions equity. Their lobbying record funds the opposite.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Who Do I Work For closes that gap — giving you the forensic tools to evaluate employers with the same rigor they use to evaluate you. No spin. No rankings. No guesswork. Just receipts.
              </p>
            </div>
            <div className="space-y-6">
              <blockquote className="border-l-2 border-primary pl-6 py-2">
                <p className="font-sans text-foreground leading-snug italic" style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 700 }}>
                  "You wouldn't buy a house without an inspection. Why would you accept a job without one?"
                </p>
              </blockquote>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Public data sources", value: "12+" },
                  { label: "Companies profiled", value: "500+" },
                  { label: "Signals tracked", value: "40+" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-mono text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 6 — WHO IT'S FOR
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Who It's For</p>
          <h2 className="text-h1 text-foreground mb-12">
            Built for people who ask the hard questions.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                persona: "Job Seekers",
                quote: "I got the offer. Now what?",
                body: "Evaluate your next company before you say yes. See the data behind the culture deck and know exactly what you're walking into.",
              },
              {
                persona: "Employees Reconsidering",
                quote: "Something feels off.",
                body: "Validate what your gut is telling you. Compare your company's public commitments to their actual track record — and decide whether to stay, push for change, or move on.",
              },
              {
                persona: "Career Coaches & Advisors",
                quote: "My client deserves better intel.",
                body: "Give your clients real data to fuel career decisions. Turn your coaching conversations from opinion-based to evidence-based.",
              },
              {
                persona: "Talent Acquisition Leaders",
                quote: "Is our house in order?",
                body: "The best candidates are already researching you. We show you what they'll find — so you can fix it before it costs you a hire.",
              },
            ].map((card) => (
              <div key={card.persona} className="p-7 bg-card border border-border hover:border-primary/30 transition-colors">
                <p className="font-mono text-xs tracking-[0.1em] uppercase text-primary mb-2">{card.persona}</p>
                <p className="font-sans text-foreground italic mb-3" style={{ fontSize: "18px", fontWeight: 600 }}>
                  "{card.quote}"
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 7 — PRICING
      ═══════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">Start Here</p>
          <h2 className="text-h1 text-foreground text-center mb-12">Where do you start?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border bg-background p-7 flex flex-col">
              <Search className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">I'm Curious</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">Know before you sign.</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Search any company. See the basics. Read the Receipts. Free forever.
              </p>
              <Button onClick={() => navigate("/join")} variant="outline" className="w-full mb-2">Start Free</Button>
              <p className="text-[11px] text-muted-foreground text-center">Employer Clarity Scores, news ticker, Values Alignment quiz & more.</p>
            </div>

            <div className="border border-primary bg-background p-7 flex flex-col ring-1 ring-primary/20 shadow-lg shadow-primary/10">
              <Briefcase className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">The Signal</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">I'm actively looking.</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Full dossiers. Comp data. Interview prep. Values matching.
              </p>
              <Button onClick={() => navigate("/pricing")} className="w-full mb-2">Get The Signal — $49/mo</Button>
              <p className="text-[11px] text-muted-foreground text-center">Unlimited audits, comp benchmarks, interview intel & more.</p>
            </div>

            <div className="border border-border bg-background p-7 flex flex-col">
              <Shield className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">The Match</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">Find me my job.</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Auto-matched jobs. Application tracking. Priority alerts.
              </p>
              <Button onClick={() => navigate("/pricing")} variant="outline" className="w-full mb-2">Get The Match — $149/mo</Button>
              <p className="text-[11px] text-muted-foreground text-center">Smart job matching, auto-apply, career mapping & more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 8 — MEET JACKYE
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-6">
            Built by someone who helped build the machine — and knows what it misses.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 items-start">
            <img
              src={jackyeHeadshotSm}
              alt="Jackye Clayton, Founder of Who Do I Work For"
              className="w-28 h-28 rounded-full object-cover ring-2 ring-primary/20"
              width={112}
              height={112}
              loading="lazy"
              decoding="async"
            />
            <div>
              <h3 className="font-sans font-bold text-foreground text-xl mb-3">Jackye Clayton</h3>
              <p className="font-mono text-xs text-primary tracking-wide uppercase mb-4">Founder · 20 Years in Talent Acquisition · Career Advocate</p>
              <p className="font-sans text-muted-foreground leading-relaxed mb-6" style={{ fontSize: "15px", maxWidth: "56ch" }}>
                After years inside the hiring machines of major HR tech companies, I built the tool I wished candidates always had. Every company runs a background check on you. I think it's time we returned the favor.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
                  { label: "Associate Editor, HR Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
                  { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
                  { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
                  { label: "Unleash 2025 Speaker", url: "https://hr-gazette.com/unleash-america-2025-preview-with-jackye-clayton/" },
                ].map((badge) => (
                  <a key={badge.label} href={badge.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap hover:border-primary/40 hover:text-primary transition-colors">
                    {badge.label}
                  </a>
                ))}
              </div>
              <Link to="/about" className="font-sans text-sm text-primary hover:text-primary/80 transition-colors mt-6 inline-block font-medium">
                Meet Jackye →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden border-t border-border">
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(43 85% 59% / 0.04) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know who you work for.</p>
          <h2 className="text-h1 text-foreground mb-4">
            Stop applying. Start aligning.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[44ch] mx-auto mb-8">
            You don't need more applications. You need better decisions. We built the trust layer — now use it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/join")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/receipts")}
              className="border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              See the Receipts
            </button>
          </div>
          <p className="font-sans text-xs text-muted-foreground/40 mt-4">
            No spam. No selling your data. That would be ironic.
          </p>
        </div>
      </section>

      <Suspense fallback={null}><EmailCapture /></Suspense>

      <SiteFooter />
    </div>
  );
});

export default Index;
