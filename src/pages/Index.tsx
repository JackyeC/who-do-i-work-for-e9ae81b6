import { useState, lazy, Suspense, forwardRef } from "react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight, Eye, Target, Brain, Rocket, CheckCircle2, Menu, X, FileSearch, AlertTriangle, Link2, Search, Layers, BarChart3, Users, Briefcase, Mic, Award, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-page-seo";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const EmailCapture = lazy(() => import("@/components/landing/EmailCapture").then(m => ({ default: m.EmailCapture })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));
const SectionReveal = lazy(() => import("@/components/landing/SectionReveal").then(m => ({ default: m.SectionReveal })));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  if (!isLoaded || authLoading) return null;

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      {/* ── Site Header ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 lg:px-16 py-4 w-full">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center shrink-0">
            <span style={{fontFamily:"Inter,sans-serif",fontWeight:900,letterSpacing:"-0.03em",fontSize:"26px"}}>
              <span className="text-foreground">W</span>
              <span style={{color:"#F0C040"}}>?</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/receipts" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
            <Link to="/about" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/for-employers" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">For Companies</Link>
            <Link to="/browse" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
            <Link to="/contact" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            {!authLoading && (
              user ? (
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="font-sans text-sm">
                  Dashboard
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate("/login")} className="font-sans text-sm rounded-full px-5">
                  Get Early Access
                </Button>
              )
            )}
          </nav>
          <button className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden px-6 pb-4 border-b border-border/50 bg-background">
          <nav className="flex flex-col gap-3">
            <Link to="/receipts" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2">How It Works</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2">About</Link>
            <Link to="/for-employers" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2">For Companies</Link>
            <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Insights</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Contact</Link>
            {!authLoading && (
              user ? (
                <Button size="sm" variant="outline" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }} className="w-full">Dashboard</Button>
              ) : (
                <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }} className="w-full">Get Early Access</Button>
              )
            )}
          </nav>
        </div>
      )}

      <Suspense fallback={null}><ExitIntentCapture /></Suspense>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 min-h-[85vh] py-24 lg:py-32 bg-background overflow-hidden">
        {/* Subtle gold gradient */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[70%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(240,192,64,0.06) 0%, transparent 70%)" }} />

        <div className="relative z-[1] max-w-[1100px] mx-auto w-full">
          <h1
            className="text-foreground font-sans leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 800, maxWidth: "14ch", opacity: 0, animation: "heroFadeIn 0.8s ease 0.3s forwards" }}
          >
            Know who you're{" "}
            <span className="text-primary">really</span>{" "}
            working for.
          </h1>

          <p
            className="text-muted-foreground max-w-[52ch] leading-relaxed"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)", marginTop: "24px", opacity: 0, animation: "heroFadeIn 0.6s ease 0.7s forwards" }}
          >
            WDIWF is career intelligence for people who refuse to find out the hard way. We forensically evaluate companies — so you can negotiate smarter, ask harder questions, and never accept an offer blind again.
          </p>

          <div
            className="flex items-center gap-4 flex-wrap"
            style={{ marginTop: "32px", opacity: 0, animation: "heroFadeIn 0.5s ease 1s forwards" }}
          >
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="bg-primary text-primary-foreground font-sans text-base font-semibold px-8 py-4 rounded-lg hover:brightness-110 transition-all cursor-pointer"
            >
              Get Early Access
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="font-sans text-base text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
            >
              See how it works ↓
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: THREE VALUE PROPS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-16 lg:py-20">
        <div className="max-w-[1100px] mx-auto">
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
                <h2 className="font-sans font-bold text-foreground mb-2" style={{ fontSize: "18px" }}>
                  {card.title}
                </h2>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: THE INTEGRITY GAP (The Problem)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
                The Integrity Gap
              </p>
              <h2 className="font-sans text-foreground leading-[1.1] mb-6" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
                Companies interview you. But who's interviewing them?
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Right now, the hiring process is a one-way mirror. Companies run background checks, AI screenings, and behavioral assessments on you — while you're left Googling their CEO and hoping the Glassdoor reviews are real.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  That's the Integrity Gap: the distance between what a company says about itself and what it actually does. Their careers page says "people-first culture." Their turnover data says otherwise. Their press release says "committed to diversity." Their leadership team tells a different story.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  WDIWF closes that gap. We give you the forensic tools to evaluate employers with the same rigor they use to evaluate you.
                </p>
              </div>
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

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: HOW IT WORKS (3 Steps)
      ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 lg:px-16 py-24 lg:py-32 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
            How It Works
          </p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-12" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 800 }}>
            Three steps to knowing the truth.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Search",
                body: "Enter a company name. WDIWF aggregates publicly available data — leadership changes, legal records, employee sentiment, DEIB commitments, funding history, and more — into one forensic profile.",
              },
              {
                step: "02",
                title: "Score",
                body: "Our Integrity Score measures the gap between what a company claims and what the data shows. No sponsored results. No employer branding. Just receipts.",
              },
              {
                step: "03",
                title: "Decide",
                body: "Use your intelligence report to ask better questions in interviews, negotiate from a position of strength, or walk away before it costs you. Your career. Your terms.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl p-7 bg-card border border-border">
                <span className="font-mono text-xs font-bold text-primary tracking-wider mb-4 block">
                  {item.step}
                </span>
                <h3 className="font-sans font-bold text-foreground mb-3" style={{ fontSize: "18px" }}>
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5: WHO IT'S FOR (4 Persona Cards)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
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
              <div key={card.persona} className="rounded-xl p-7 bg-background border border-border hover:border-primary/30 transition-colors">
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

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6: CREDIBILITY / SOCIAL PROOF
      ══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        <SectionReveal>
          <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
            <div className="max-w-[1100px] mx-auto">
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-6">
                Built by someone who knows where the bodies are buried
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
                    WDIWF is created by Jackye Clayton — TA architect, HR Tech strategist, LinkedIn Learning instructor, and Associate Editor at The HR Gazette. Host of the Inclusive AF podcast, co-host of But First, Coffee and People in Squares. After building and auditing hiring systems for companies like Textio and SeekOut, she's now building the tool she wished candidates always had.
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

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7: EMAIL CAPTURE / CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-16 py-28 lg:py-36 text-center relative overflow-hidden">
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
              onClick={() => navigate(user ? "/dashboard" : "/login")}
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

      {/* ── Email Capture (existing component) ── */}
      <Suspense fallback={null}><EmailCapture /></Suspense>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8: FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-card border-t border-border px-6 lg:px-16 py-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center mb-3">
                <span style={{fontFamily:"Inter,sans-serif",fontWeight:900,letterSpacing:"-0.03em",fontSize:"22px"}}>
                  <span className="text-foreground">W</span>
                  <span style={{color:"#F0C040"}}>?</span>
                </span>
              </Link>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[28ch]">
                Career intelligence that closes the Integrity Gap. Know before you go.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">WDIWF</p>
              <nav className="flex flex-col gap-2">
                <Link to="/" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                <Link to="/receipts" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                <Link to="/about" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link to="/for-employers" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">For Companies</Link>
                <Link to="/browse" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
                <Link to="/contact" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              </nav>
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">Connect</p>
              <nav className="flex flex-col gap-2">
                <a href="https://www.linkedin.com/in/jackyeclayton/" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
                <a href="https://jackyeclayton.com/speaking" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Speaking</a>
                <a href="https://www.inclusiveafpodcast.com" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Inclusive AF Podcast</a>
                <a href="https://wrkdefined.com/podcast/but-first-coffee" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">But First, Coffee</a>
              </nav>
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">Legal</p>
              <nav className="flex flex-col gap-2">
                <Link to="/privacy" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-center flex-wrap gap-3">
            <p className="font-sans text-xs text-muted-foreground/50">
              © 2026 WDIWF. A People Puzzles venture. Built because you deserve to know.
            </p>
            <p className="font-sans text-xs text-muted-foreground/50">
              Built on public records: FEC · SEC · BLS · OSHA · NLRB · Senate Lobbying
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default Index;
