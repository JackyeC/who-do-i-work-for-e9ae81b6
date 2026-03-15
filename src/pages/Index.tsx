import { useState, useEffect, forwardRef } from "react";
import jackyeHeadshot from "@/assets/jackye-headshot.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, FileText, MessageSquare, Compass, ArrowRight, ArrowLeftRight, Zap, Briefcase } from "lucide-react";
import { MiniReportTeaser } from "@/components/landing/MiniReportTeaser";
import { ExitIntentCapture } from "@/components/ExitIntentCapture";
import { FAQSection } from "@/components/landing/FAQSection";
import { EmailCapture } from "@/components/landing/EmailCapture";
import { usePageSEO } from "@/hooks/use-page-seo";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { SectionReveal } from "@/components/landing/SectionReveal";
import { motion } from "framer-motion";
import { rivalries2026 } from "@/data/rivalries2026";
import { RivalryBattleCard } from "@/components/RivalryBattleCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const [companyCount, setCompanyCount] = useState(0);
  const navigate = useNavigate();

  usePageSEO({
    title: "Who Do I Work For? — Career Intelligence Before You Accept",
    description: "Career Intelligence platform. Company intelligence, offer analysis, connection chains, and career strategy by Jackye Clayton. Know before you sign.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For?",
      description: "Career Intelligence platform. Understand the company behind the job offer.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://civic-align.lovable.app",
    },
  });

  useEffect(() => {
    supabase.from("companies").select("*", { count: "exact", head: true })
      .then(({ count }) => setCompanyCount(count || 0));
  }, []);

  const tools = [
    { icon: Shield, title: "Company Intelligence", desc: "Workforce signals, compensation patterns, political influence — one report.", cta: "Run a scan", href: "/browse" },
    { icon: FileText, title: "Offer Intelligence", desc: "Benchmark salary, flag non-competes, get negotiation language.", cta: "Analyze an offer", href: "/check" },
    { icon: MessageSquare, title: "Ask Jackye", desc: "20+ years of HR strategy, on demand. Real advice, not platitudes.", cta: "Ask Jackye", href: "/ask-jackye" },
    { icon: Compass, title: "Career Intelligence", desc: "Map skills to demand, align values to employers, build a plan.", cta: "Discover paths", href: "/career-intelligence" },
  ];

  const audiences = [
    { who: "Candidates", question: "Should I work here?", desc: "Run the intelligence before you accept. Know the political footprint, compensation reality, and culture signals." },
    { who: "Employees", question: "What kind of company am I inside?", desc: "Understand the signal trail behind your employer. Influence exposure, workforce stability, and what your leadership funds." },
    { who: "Recruiters & HR", question: "How do I recruit here honestly?", desc: "Audit your EVP against real data. Anticipate candidate objections. Close with confidence, not spin." },
    { who: "Sales", question: "How do I sell here smartly?", desc: "Understand buying committees, workforce priorities, and the political context that shapes procurement." },
    { who: "Journalists", question: "What is the signal trail?", desc: "Source-linked corporate intelligence. PAC donations, lobbying, federal contracts, revolving-door hires." },
  ];

  const trustSources = ["FEC Filings", "USASpending.gov", "SEC EDGAR", "Senate Lobbying", "BLS Wage Data", "OpenSecrets"];

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      <ExitIntentCapture />

      {/* ── Hero ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-36 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-sm uppercase text-primary mb-4 flex items-center gap-2"
          >
            <span className="w-8 h-px bg-primary inline-block" />
            Career Intelligence Platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl lg:text-[clamp(2.4rem,5vw,3.6rem)] leading-tight mb-6 text-foreground"
          >
            You vetted the candidate.{" "}
            <span className="text-primary">Who vetted the employer?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base lg:text-lg text-muted-foreground mb-10 max-w-[480px] leading-relaxed"
          >
            Surface compensation traps, non-compete risks, and political spending behind any offer. FEC · SEC · BLS sourced.
          </motion.p>
          <HeroSearch />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-mono text-sm font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
            >
              Scan the Employer
            </button>
          </motion.div>
        </div>

        {/* Mobile: simplified preview card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="bg-card border border-border p-6 relative">
            <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-sm uppercase text-primary tracking-widest">
              Live Intelligence Preview
            </div>
            <div className="font-serif text-lg mb-1">Koch Industries</div>
            <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground mb-4">
              Employer Clarity Score: 6.2 / 10 · High Scrutiny
            </div>
            {/* Full grid on desktop, 2 metrics on mobile */}
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
              {[
                { label: "Influence Exposure", val: "Significant", color: "text-civic-red" },
                { label: "Lobbying Spend", val: "$5.2M", color: "text-civic-yellow" },
                { label: "Hiring Transparency", val: "Moderate", color: "text-civic-yellow", desktopOnly: true },
                { label: "Workforce Stability", val: "Stable", color: "text-civic-green", desktopOnly: true },
              ].map(m => (
                <div key={m.label} className={`bg-card p-3 ${m.desktopOnly ? "hidden lg:block" : ""}`}>
                  <div className="font-mono text-sm uppercase text-muted-foreground mb-1">{m.label}</div>
                  <div className={`font-data text-lg font-bold ${m.color}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-sm p-2 border-l-2 border-l-civic-red bg-destructive/[0.07] text-foreground">Non-compete clause — unusually broad scope</div>
              <div className="text-sm p-2 border-l-2 border-l-civic-yellow bg-civic-yellow/[0.07] text-foreground hidden lg:block">Salary offer 8.2% below market median</div>
              <div className="text-sm p-2 border-l-2 border-l-civic-green bg-civic-green/[0.07] text-foreground">Federal contractor — strong job security signal</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Evidence Strip (merged counters + trust sources) ── */}
      <SectionReveal>
        <div className="border-y border-border px-6 py-8">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-8 lg:gap-14 flex-wrap">
              <AnimatedCounter end={companyCount || 850} suffix="+" label="Companies Tracked" />
              <AnimatedCounter end={6} suffix="" label="Federal Sources" />
              <AnimatedCounter end={20} suffix="+" label="Years HR Expertise" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {trustSources.map((src) => (
                <span key={src} className="font-mono text-sm tracking-wider uppercase text-muted-foreground/60">{src}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* ── Core Tools ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <SectionReveal>
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">Core Intelligence</div>
          <h2 className="text-2xl lg:text-3xl mb-4 text-foreground">
            Four tools. One truth. Zero surprises.
          </h2>
          <p className="text-muted-foreground text-base mb-14 max-w-[480px]">
            Every tool connects to the same intelligence engine. Same data, same sources, same rigor.
          </p>
        </SectionReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {tools.map((t, i) => (
            <SectionReveal key={t.title} delay={i * 0.1}>
              <div
                className="bg-card p-8 lg:p-10 hover:bg-surface-2 transition-colors cursor-pointer group"
                onClick={() => navigate(t.href)}
              >
                <t.icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.5} />
                <div className="font-serif text-lg mb-2 text-foreground">{t.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed mb-5">{t.desc}</div>
                <div className="flex items-center gap-1.5 font-mono text-sm tracking-wider uppercase text-primary group-hover:gap-2.5 transition-all">
                  {t.cta} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── Mini Report Teaser ── */}
      <MiniReportTeaser />

      {/* ── Jackye Section ── */}
      <SectionReveal>
        <section className="bg-card border-y border-border px-6 lg:px-16 py-24 lg:py-32">
          <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
            <div>
              <img src={jackyeHeadshot} alt="Jackye Clayton, Founder of Who Do I Work For" className="w-24 h-24 object-cover mb-4" />
              <div className="font-serif text-xl text-primary mb-1">Jackye Clayton</div>
              <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground">
                Founder · Career Strategist · HR Intelligence Expert
              </div>
            </div>
            <div>
              <blockquote className="border-l-2 border-primary pl-4 text-lg italic text-foreground leading-relaxed mb-2 font-serif" style={{ fontWeight: 400 }}>
                "The question isn't whether you want the job. It's whether you know exactly who you're going to work for. Run the chain first. Always."
              </blockquote>
              <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground pl-4 mb-6">— Jackye Clayton</div>
              <p className="text-base text-muted-foreground leading-relaxed">
                15+ years in HR watching candidates accept offers they shouldn't have — because they didn't have the data. Who Do I Work For exists because information is power.
              </p>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ── Audiences (tabs on mobile, rows on desktop) ── */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto w-full">
        <SectionReveal>
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">Who It's For</div>
          <h2 className="text-2xl lg:text-3xl mb-10 text-foreground">
            One engine. Five lenses. Every answer.
          </h2>
        </SectionReveal>

        {/* Mobile: tabbed */}
        <div className="lg:hidden">
          <Tabs defaultValue="Candidates">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-6">
              {audiences.map(a => (
                <TabsTrigger key={a.who} value={a.who} className="font-mono text-sm tracking-wider uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2">
                  {a.who}
                </TabsTrigger>
              ))}
            </TabsList>
            {audiences.map(a => (
              <TabsContent key={a.who} value={a.who} className="bg-card border border-border p-6">
                <div className="font-serif text-base text-foreground mb-2">{a.question}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{a.desc}</div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Desktop: rows */}
        <div className="hidden lg:flex flex-col gap-px bg-border border border-border">
          {audiences.map((a, i) => (
            <SectionReveal key={a.who} delay={i * 0.05}>
              <div className="bg-card p-8 grid grid-cols-[160px_1fr_2fr] gap-8 items-center">
                <div className="font-mono text-sm tracking-[0.15em] uppercase text-primary">{a.who}</div>
                <div className="font-serif text-base text-foreground">{a.question}</div>
                <div className="text-sm text-muted-foreground">{a.desc}</div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── Values-Aligned Jobs ── */}
      <SectionReveal>
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
      </SectionReveal>

      {/* ── Methodology ── */}
      <SectionReveal>
        <section className="px-6 lg:px-16 py-16 lg:py-20">
          <div className="max-w-[960px] mx-auto text-center">
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
        </section>
      </SectionReveal>

      {/* ── Rivalries Teaser ── */}
      <SectionReveal>
        <section className="px-6 lg:px-16 py-16 lg:py-20 max-w-[960px] mx-auto w-full">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rivalries2026.slice(0, 2).map(r => (
              <RivalryBattleCard key={r.id} rivalry={r} compact />
            ))}
          </div>
        </section>
      </SectionReveal>

      {/* ── Compare CTA ── */}
      <SectionReveal>
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
      </SectionReveal>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── Email Capture ── */}
      <EmailCapture />

      {/* ── Final CTA ── */}
      <SectionReveal>
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
      </SectionReveal>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 lg:px-16 py-6 flex justify-between items-center flex-wrap gap-4">
        <div className="font-mono text-sm tracking-wider text-muted-foreground">
          Who Do I Work For? · by Jackye Clayton
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a href="/terms" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="/methodology" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Methodology</a>
        </div>
      </footer>
    </div>
  );
});

export default Index;
