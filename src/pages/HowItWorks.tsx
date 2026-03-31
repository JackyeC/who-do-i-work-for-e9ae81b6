import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, UserCheck, FileSearch, Shield, TrendingUp, Bell, MessageCircle, BookOpen, Scale } from "lucide-react";

const HowItWorks = () => {
  usePageSEO({
    title: "How It Works — Who Do I Work For",
    description: "Five steps to career clarity. Values alignment, employer dossiers, offer review, career mapping, and ongoing protection — all built on public records.",
    path: "/how-it-works",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 pt-20 pb-12 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">
            How It Works
          </p>
          <h1
            className="font-sans text-foreground leading-[1.08] mb-5 mx-auto"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "22ch" }}
          >
            Career advocacy in five steps.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[52ch] mx-auto">
            This is not a feature tour. This is a system designed to protect your career, surface what matters, and make sure you are never the last to know.
          </p>
        </section>

        {/* ═══════════════════════════════════════════
            5-STEP PROCESS
        ═══════════════════════════════════════════ */}
        <section className="max-w-[760px] mx-auto px-6 lg:px-16 py-12">
          <div className="space-y-16">

            {/* Step 1 */}
            <div className="flex gap-5 items-start">
              <span className="font-mono text-primary text-xs tracking-wider mt-1.5 shrink-0 w-6">01</span>
              <div>
                <h2 className="font-sans font-bold text-foreground text-lg mb-3">Tell us what matters to you.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Before we investigate anything, we ask you what you care about. Your non-negotiables. Your deal-breakers. The things you need from an employer that go beyond a job title and a salary.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  That might be pay transparency. It might be political alignment. It might be enforcement history, leadership stability, or how a company treats whistleblowers. Whatever it is, we build your profile around it.
                </p>
                <div className="p-4 bg-card border border-border mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    <span className="font-sans text-sm font-semibold text-foreground">Values Profile</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Map your priorities across categories like compensation transparency, political giving, environmental record, workforce treatment, and leadership behavior. This becomes the lens through which every employer is evaluated for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5 items-start">
              <span className="font-mono text-primary text-xs tracking-wider mt-1.5 shrink-0 w-6">02</span>
              <div>
                <h2 className="font-sans font-bold text-foreground text-lg mb-3">We investigate the employer.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  We pull from public records — Federal Election Commission filings, Securities & Exchange Commission disclosures, Bureau of Labor Statistics data, Occupational Safety & Health Administration enforcement records, National Labor Relations Board complaints, Senate lobbying disclosures, and more — and compile a forensic profile of the company.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  This is not a review site. This is not opinion. This is what the public record says.
                </p>
                <div className="p-4 bg-card border border-border mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    <span className="font-sans text-sm font-semibold text-foreground">Employer Dossier</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Political spending breakdowns, lobbying activity, enforcement history, leadership signals, workforce data, corporate structure, and values alignment — all sourced, all traceable, all in plain English.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5 items-start">
              <span className="font-mono text-primary text-xs tracking-wider mt-1.5 shrink-0 w-6">03</span>
              <div>
                <h2 className="font-sans font-bold text-foreground text-lg mb-3">We compare what they say to what they do.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  The careers page says "people-first." The turnover data says otherwise. The mission statement mentions equity. The lobbying record funds the opposite. We close that gap.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Every employer dossier includes an integrity analysis — matching public claims against the actual record. Because mission statements are marketing. Records are receipts.
                </p>
                <div className="p-4 bg-card border border-border mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    <span className="font-sans text-sm font-semibold text-foreground">Integrity Gap Analysis</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We surface the distance between what a company says about itself and what records show. You see the alignment — or the contradiction — before you commit.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-5 items-start">
              <span className="font-mono text-primary text-xs tracking-wider mt-1.5 shrink-0 w-6">04</span>
              <div>
                <h2 className="font-sans font-bold text-foreground text-lg mb-3">We help you review the offer, role, or risk.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Got an offer? Upload it. We analyze compensation against Bureau of Labor Statistics benchmarks, flag red flags, and identify leverage points — so you walk into the negotiation with data, not hope.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Already employed and reconsidering? We help you evaluate your current employer with the same rigor — so you can decide whether to stay, push for change, or start planning your next move.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-sans text-sm font-semibold text-foreground">Offer Review</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compensation analysis, red flag detection, and leverage points — grounded in real data, not guesswork.
                    </p>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-sans text-sm font-semibold text-foreground">Career Map</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Track your trajectory. Understand role mobility, industry shifts, and where your skills carry the most weight.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-5 items-start">
              <span className="font-mono text-primary text-xs tracking-wider mt-1.5 shrink-0 w-6">05</span>
              <div>
                <h2 className="font-sans font-bold text-foreground text-lg mb-3">We help you decide whether to apply, stay, negotiate, or leave.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  This is not a job board. We do not push you toward any particular company. We give you the evidence, the context, and the leverage — and then you decide. Apply. Stay. Negotiate. Leave. Whatever makes sense for your life.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  And once you decide, we keep watching. Your watchlist tracks the companies that matter to you and alerts you when new signals surface — layoffs, lobbying shifts, enforcement actions, leadership changes. You are never the last to know.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-sans text-xs font-semibold text-foreground">Watchlist & Alerts</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Track companies. Get notified when signals change.
                    </p>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-sans text-xs font-semibold text-foreground">Ask Jackye</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Career guidance — strategic, direct, grounded in 20 years of talent acquisition.
                    </p>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-sans text-xs font-semibold text-foreground">State of Work</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Weekly intelligence on policy changes, labor shifts, and what they mean for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── GOLD DIVIDER ── */}
        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══════════════════════════════════════════
            FINAL CTA
        ═══════════════════════════════════════════ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-20 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know who you work for.</p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Your career is not a lottery. Stop treating it like one.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[46ch] mx-auto mb-8">
            Search any employer. Read the receipts. Protect your career. That is what this platform is for.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/join"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
            >
              Protect My Career <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center justify-center gap-2 border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              Check a Company
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
