import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight, Search, FileSearch, Layers, BarChart3, Briefcase, Building } from "lucide-react";
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
const SectionReveal = lazy(() => import("@/components/landing/SectionReveal").then(m => ({ default: m.SectionReveal })));

const FEATURED_SLUGS = ["meta", "google", "amazon", "boeing", "accenture", "att"];

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [heroQuery, setHeroQuery] = useState("");

  usePageSEO({
    title: "WDIWF — Know Who You're Really Working For",
    description: "WDIWF is career intelligence for people who refuse to find out the hard way. Forensically evaluate companies before you accept the offer.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "WDIWF — Who Do I Work For?",
      description: "Career intelligence platform that forensically evaluates companies — so you never accept an offer blind again.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://wdiwf.jackyeclayton.com",
    },
  });

  const { data: featuredCompanies } = useQuery({
    queryKey: ["homepage-featured-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, total_pac_spending, insider_score")
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

      {/* ── SECTION 1: HERO ── */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 py-24 lg:py-32 bg-background overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[70%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(240,192,64,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[720px] mx-auto text-center">
          <h1
            className="text-foreground font-sans leading-[1.05] tracking-tight mx-auto"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 800, maxWidth: "18ch", opacity: 0, animation: "heroFadeIn 0.8s ease 0.3s forwards" }}
          >
            Know who you're{" "}
            <span className="text-primary">really</span>{" "}
            working for.
          </h1>

          <p
            className="text-muted-foreground max-w-[56ch] mx-auto leading-relaxed"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)", marginTop: "20px", opacity: 0, animation: "heroFadeIn 0.6s ease 0.7s forwards" }}
          >
            Career intelligence built on public records. Search any employer. See the receipts.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 mx-auto max-w-[520px] relative group"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 1s forwards" }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Scan a company..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="mr-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                Scan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-3 tracking-wide" style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.2s forwards" }}>
            Powered by FEC, SEC EDGAR, BLS, OSHA, NLRB, and Senate Lobbying data.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ── SECTION 2: SCROLLING TICKER ── */}
      <Suspense fallback={<div className="h-[36px] bg-background border-b border-border/10" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* ── SECTION 3: FEATURED COMPANY CARDS ── */}
      <section className="px-6 lg:px-16 py-16 lg:py-20 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">
            Recent Receipts
          </p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-10 text-center" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800 }}>
            What we've found so far
          </h2>

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
                        <h3 className="font-sans text-foreground group-hover:text-primary transition-colors truncate font-semibold text-base">
                          {co.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {co.industry} · {co.state}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      co.civic_footprint_score >= 70 ? "bg-green-500/10 text-green-400" :
                      co.civic_footprint_score >= 40 ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {co.civic_footprint_score}/100
                    </span>
                    <span>
                      {co.total_pac_spending > 0
                        ? `PAC: $${co.total_pac_spending >= 1000000 ? (co.total_pac_spending / 1000000).toFixed(1) + "M" : co.total_pac_spending >= 1000 ? (co.total_pac_spending / 1000).toFixed(0) + "K" : co.total_pac_spending}`
                        : "No PAC data"}
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

      {/* ── SECTION 4: WHAT IS WDIWF? ── */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">
            What is WDIWF?
          </p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-6 text-center" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
            Every company runs a background check on you. This is yours on them.
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[600px] mx-auto text-center mb-14">
            WDIWF aggregates public data — PAC filings, OSHA citations, lobbying disclosures, WARN Act notices, SEC filings — and turns it into a forensic employer profile. So you can see the receipts before you sign.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                icon: <FileSearch className="w-8 h-8 text-primary" strokeWidth={1.5} />,
                title: "Forensic Intelligence",
                body: "Go deeper than Glassdoor. WDIWF pulls the data companies hope you never see — leadership turnover, DEIB follow-through, legal filings, and the gap between what they promise and what they deliver.",
              },
              {
                icon: <Layers className="w-8 h-8 text-primary" strokeWidth={1.5} />,
                title: "Integrity Scoring",
                body: "Every company gets a score based on receipts, not branding. We measure what they actually do against what they say — so you can see the truth before you sign.",
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-primary" strokeWidth={1.5} />,
                title: "Career Leverage",
                body: "Walk into every interview, negotiation, and offer conversation with intelligence that shifts the power dynamic. Stop auditioning. Start evaluating.",
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`py-8 ${i < 2 ? "md:border-r md:border-border md:pr-8" : ""} ${i > 0 ? "md:pl-8" : ""} ${i < 2 ? "border-b md:border-b-0 border-border pb-8 md:pb-0" : ""}`}
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="font-sans font-bold text-foreground mb-2" style={{ fontSize: "18px" }}>
                  {card.title}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: START HERE — Pricing Tiers ── */}
      <section className="px-6 lg:px-16 py-20 lg:py-24 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">
            Start Here
          </p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-12 text-center" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
            Where do you start?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border bg-card p-7 flex flex-col">
              <Search className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">For Candidates</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">Is your offer safe?</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Run a forensic audit on any employer before you sign.
              </p>
              <Button onClick={() => navigate("/pricing")} className="w-full mb-2">
                Get a Candidate Report — $49
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">Full integrity dossier on one employer, delivered in 48 hours.</p>
            </div>

            <div className="border border-border bg-card p-7 flex flex-col">
              <Briefcase className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">For Recruiters</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">Stop losing talent to the Integrity Gap.</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Show candidates your company passes the receipts test before they walk.
              </p>
              <Button onClick={() => navigate("/recruiter-brief")} variant="outline" className="w-full mb-2">
                Get the RecruiterBrief
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">Candidate-facing integrity report you can share during the hiring process.</p>
            </div>

            <div className="border border-border bg-card p-7 flex flex-col">
              <Shield className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-2">For Executives</span>
              <h3 className="font-sans font-bold text-foreground text-lg mb-2">Is your brand audit-proof?</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                Before your next executive hire finds your PAC filings — we will.
              </p>
              <Button onClick={() => { window.location.href = "mailto:jackye@jackyeclayton.com"; }} variant="outline" className="w-full mb-2">
                Book a Corporate Integrity Audit
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">White-glove corporate integrity assessment with Jackye Clayton.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: THE INTEGRITY GAP ── */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
                The Integrity Gap
              </p>
              <h2 className="font-sans text-foreground leading-[1.1] mb-6" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
                Companies interview you. But who's interviewing them?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Integrity Gap is the distance between what a company says about itself and what it actually does. Their careers page says "people-first." Their turnover data says otherwise. WDIWF closes that gap — giving you the forensic tools to evaluate employers with the same rigor they use to evaluate you.
              </p>
            </div>
            <div>
              <blockquote className="border-l-2 border-primary pl-6 py-2">
                <p className="font-sans text-foreground leading-snug italic" style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 700 }}>
                  "You wouldn't buy a house without an inspection. Why would you accept a job without one?"
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: WHO IT'S FOR ── */}
      <section className="px-6 lg:px-16 py-20 lg:py-24 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
            Who It's For
          </p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-12" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
            Built for people who ask the hard questions.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                persona: "Job Seekers",
                quote: '"I got the offer. Now what?"',
                body: "Evaluate your next company before you say yes. See the data behind the culture deck and know exactly what you're walking into.",
              },
              {
                persona: "Employees Reconsidering",
                quote: '"Something feels off."',
                body: "Validate what your gut is telling you. Compare your company's public commitments to their actual track record — and decide whether to stay, push for change, or move on.",
              },
              {
                persona: "Career Coaches & Advisors",
                quote: '"My client deserves better intel."',
                body: "Give your clients real data to fuel career decisions. WDIWF turns your coaching conversations from opinion-based to evidence-based.",
              },
              {
                persona: "TA Leaders",
                quote: '"Is our house in order?"',
                body: "The best candidates are already researching you. WDIWF shows you what they'll find — so you can fix it before it costs you a hire.",
              },
            ].map((card) => (
              <div key={card.persona} className="rounded-xl p-7 bg-card border border-border hover:border-primary/30 transition-colors">
                <p className="font-mono text-xs tracking-[0.1em] uppercase text-primary mb-2">
                  {card.persona}
                </p>
                <p className="font-sans text-foreground italic mb-3" style={{ fontSize: "18px", fontWeight: 600 }}>
                  {card.quote}
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: CREDIBILITY ── */}
      <Suspense fallback={null}>
        <SectionReveal>
          <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-24">
            <div className="max-w-[1100px] mx-auto">
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-6">
                Built by someone who helped build the machine — and knows what it misses.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 items-start">
                <img
                  src={jackyeHeadshotSm}
                  alt="Jackye Clayton, Founder of WDIWF"
                  className="w-24 h-24 rounded-full object-cover"
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="font-sans text-muted-foreground leading-relaxed mb-6" style={{ fontSize: "15px", maxWidth: "56ch" }}>
                    WDIWF is created by Jackye Clayton — TA architect, HR Tech strategist, LinkedIn Learning instructor, and Associate Editor at The HR Gazette. Host of the Inclusive AF podcast, co-host of But First, Coffee and People in Squares. After years inside the hiring machines of major HR tech companies, she's now building the tool she wished candidates always had.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {[
                      { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
                      { label: "Associate Editor, HR Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
                      { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
                      { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
                      { label: "People in Squares", url: "https://www.linkedin.com/posts/jackyeclayton_people-in-squares-valentines-day-show-activity-7428078957075525633-kxn8" },
                      { label: "Leapsome Top 26 HR Influencer", url: "https://www.leapsome.com/blog/hr-influencers" },
                      { label: "Peoplebox Top 68 HR Experts", url: "https://www.peoplebox.ai/blog/top-50-hr-influencers-2024/" },
                      { label: "Unleash 2025 Speaker", url: "https://hr-gazette.com/unleash-america-2025-preview-with-jackye-clayton/" },
                      { label: "Workhuman Live 2025", url: null },
                    ].map((badge) => (
                      badge.url ? (
                        <a key={badge.label} href={badge.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap hover:border-primary/40 hover:text-primary transition-colors">
                          {badge.label}
                        </a>
                      ) : (
                        <span key={badge.label} className="inline-flex items-center px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap">
                          {badge.label}
                        </span>
                      )
                    ))}
                  </div>
                  <Link to="/about" className="font-sans text-sm text-muted-foreground hover:text-primary transition-colors mt-6 inline-block">
                    Meet Jackye →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>
      </Suspense>

      {/* ── SECTION 9: CTA + EMAIL CAPTURE ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden">
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(240,192,64,0.05) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
            The hiring process is about to get a lot more honest.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[48ch] mx-auto mb-8">
            WDIWF is building the career intelligence platform that flips the interview. Get early access and be the first to pull receipts on your next employer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/join")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              Join the Waitlist
            </button>
            <button
              onClick={() => navigate("/receipts")}
              className="border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all rounded-lg"
            >
              See the Receipts
            </button>
          </div>
          <p className="font-sans text-xs text-muted-foreground/50 mt-4">
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
