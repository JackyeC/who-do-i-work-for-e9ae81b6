import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowRight, Shield, FileText, MessageSquare, Compass } from "lucide-react";
import { usePageSEO } from "@/hooks/use-page-seo";

const Index = () => {
  const [companyCount, setCompanyCount] = useState(0);
  const navigate = useNavigate();

  usePageSEO({
    title: "Know Who You're Really Working For",
    description: "Employer Intelligence platform. Company intelligence, offer analysis, connection chains, and career strategy by Jackye Clayton. Know before you sign.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For?",
      description: "Employer Intelligence platform connecting policy, company behavior, and career strategy.",
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
    {
      icon: Shield,
      title: "Company Intelligence",
      desc: "Full employer intelligence report. Workforce signals, hiring technology, compensation patterns, culture integrity, political influence. Every signal sourced.",
      cta: "Run a scan",
      href: "/browse",
    },
    {
      icon: FileText,
      title: "Offer Intelligence",
      desc: "Upload your offer letter. Benchmark salary, flag non-competes, calculate walk-away math, get negotiation language. Never sign blind.",
      cta: "Analyze an offer",
      href: "/check",
    },
    {
      icon: MessageSquare,
      title: "Ask Jackye",
      desc: "20+ years of HR strategy, available 24/7. Jackye interprets signals, explains what they mean, and gives you the advice most coaches won't.",
      cta: "Ask Jackye",
      href: "/ask-jackye",
    },
    {
      icon: Compass,
      title: "Career Intelligence",
      desc: "Discover paths you haven't considered. Map your skills to market demand, align values to employers, and build an action plan that moves.",
      cta: "Discover paths",
      href: "/career-intelligence",
    },
  ];

  const audiences = [
    { who: "Candidates", question: "Should I work here?", desc: "Run the intelligence before you accept. Know the political footprint, compensation reality, and culture signals." },
    { who: "Employees", question: "What kind of company am I inside?", desc: "Understand the signal trail behind your employer. Influence exposure, workforce stability, and what your leadership actually funds." },
    { who: "Recruiters & HR", question: "How do I recruit here honestly?", desc: "Audit your EVP against real data. Anticipate candidate objections. Close with confidence, not spin." },
    { who: "Sales & Enterprise", question: "How do I sell here smartly?", desc: "Understand buying committees, workforce priorities, and the political context that shapes procurement decisions." },
    { who: "Journalists", question: "What is the signal trail?", desc: "Source-linked corporate intelligence. PAC donations, lobbying expenditures, federal contracts, revolving-door hires. Every claim cited." },
  ];

  const trustSources = ["FEC Filings", "USASpending.gov", "SEC EDGAR", "Senate Lobbying Disclosures", "BLS Wage Data", "OpenSecrets"];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-32 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div className="font-mono text-label uppercase text-primary mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-primary inline-block" />
            Employer Intelligence Platform
          </div>
          <h1 className="text-3xl lg:text-[clamp(2.4rem,5vw,3.6rem)] leading-tight mb-6 text-foreground">
            Know who you're <em className="text-primary not-italic">really</em> working for before you sign.
          </h1>
          <p className="text-body-lg text-muted-foreground mb-8 max-w-[480px]">
            Employer Intelligence for the modern workforce. We connect policy, company behavior, workforce signals, and compensation patterns so you make decisions with full information.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-primary-foreground px-7 py-3 font-mono text-[11px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
            >
              Get Full Access
            </button>
            <button
              onClick={() => navigate("/would-you-work-here")}
              className="border border-border text-muted-foreground px-7 py-3 font-mono text-[11px] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
            >
              Would You Work Here?
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="bg-card border border-border p-6 relative">
            <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-micro uppercase text-primary tracking-widest">
              Live Intelligence Preview
            </div>
            <div className="font-serif text-lg mb-1">Koch Industries</div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mb-4">
              Employer Clarity Score: 6.2 / 10 · High Scrutiny
            </div>
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
              {[
                { label: "Influence Exposure", val: "Significant", color: "text-civic-red" },
                { label: "Lobbying Spend", val: "$5.2M", color: "text-civic-yellow" },
                { label: "Hiring Transparency", val: "Moderate", color: "text-civic-yellow" },
                { label: "Workforce Stability", val: "Stable", color: "text-civic-green" },
              ].map(m => (
                <div key={m.label} className="bg-card p-3">
                  <div className="font-mono text-micro uppercase text-muted-foreground mb-1">{m.label}</div>
                  <div className={`font-data text-lg font-bold ${m.color}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] p-2 border-l-2 border-l-civic-red bg-destructive/[0.07] text-foreground">Non-compete clause — unusually broad scope</div>
              <div className="text-[11px] p-2 border-l-2 border-l-civic-yellow bg-civic-yellow/[0.07] text-foreground">Salary offer 8.2% below market median</div>
              <div className="text-[11px] p-2 border-l-2 border-l-civic-green bg-civic-green/[0.07] text-foreground">Federal contractor — strong job security signal</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="flex items-center justify-center gap-6 lg:gap-12 flex-wrap px-6 py-5 border-y border-border">
        {trustSources.map((src, i) => (
          <span key={src} className="flex items-center gap-6 lg:gap-12">
            <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">{src}</span>
            {i < trustSources.length - 1 && <span className="w-px h-4 bg-border hidden lg:block" />}
          </span>
        ))}
      </div>

      {/* Core Tools */}
      <section className="px-6 lg:px-16 py-20 lg:py-24 max-w-[1100px] mx-auto w-full">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Core Intelligence</div>
        <h2 className="text-2xl lg:text-[clamp(1.8rem,3.5vw,2.6rem)] mb-3 text-foreground">
          Four tools. One truth. Zero surprises.
        </h2>
        <p className="text-muted-foreground text-body-lg mb-12 max-w-[540px]">
          Every tool connects to the same intelligence engine. Same data, same sources, same rigor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {tools.map(t => (
            <div
              key={t.title}
              className="bg-card p-8 hover:bg-surface-2 transition-colors cursor-pointer group"
              onClick={() => navigate(t.href)}
            >
              <t.icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.5} />
              <div className="font-serif text-lg mb-3 text-foreground">{t.title}</div>
              <div className="text-[13px] text-muted-foreground leading-relaxed mb-4">{t.desc}</div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-primary group-hover:gap-2.5 transition-all">
                {t.cta} <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Jackye Section */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-24 h-24 bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-4xl text-primary-foreground mb-4">
              JC
            </div>
            <div className="font-serif text-xl text-primary mb-1">Jackye Clayton</div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
              Founder · Career Strategist · HR Intelligence Expert
            </div>
          </div>
          <div>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-6">
              I've spent over two decades in HR watching candidates accept offers they shouldn't have — because they didn't have the data. I've watched companies build EVP decks that have nothing to do with the reality employees walk into on day one.
            </p>
            <p className="text-body-lg text-foreground leading-relaxed mb-6">
              <strong>Who Do I Work For exists because information is power — and candidates have been showing up to the most important negotiations of their lives completely unarmed.</strong>
            </p>
            <blockquote className="border-l-2 border-primary pl-4 text-lg italic text-foreground leading-relaxed mb-2" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              "The question isn't whether you want the job. It's whether you know exactly who you're going to work for. Run the chain first. Always."
            </blockquote>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground pl-4">— Jackye Clayton</div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="px-6 lg:px-16 py-20 lg:py-24 max-w-[1100px] mx-auto w-full">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Who It's For</div>
        <h2 className="text-2xl lg:text-[clamp(1.8rem,3.5vw,2.6rem)] mb-12 text-foreground">
          One engine. Five lenses. Every answer.
        </h2>
        <div className="flex flex-col gap-px bg-border border border-border">
          {audiences.map(a => (
            <div key={a.who} className="bg-card p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[160px_1fr_2fr] gap-4 lg:gap-8 items-center">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary">{a.who}</div>
              <div className="font-serif text-base text-foreground">{a.question}</div>
              <div className="text-[13px] text-muted-foreground">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-16">
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Methodology</div>
          <h2 className="text-xl mb-4 text-foreground">Built on public records. Every signal sourced.</h2>
          <p className="text-[13px] text-muted-foreground max-w-[600px] mx-auto mb-6">
            FEC filings · Senate lobbying disclosures · USAspending contracts · BLS wage data · SEC reports · FRED indicators. Every signal links to its source. No opinions. No ratings. Just evidence.
          </p>
          <button
            onClick={() => navigate("/methodology")}
            className="font-mono text-[10px] tracking-wider uppercase text-primary hover:underline"
          >
            Read our methodology →
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-16 py-24 lg:py-28 text-center">
        <h2 className="text-2xl lg:text-[clamp(2rem,4vw,3rem)] mb-4 text-foreground">
          You deserve to know exactly who you work for.
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-[480px] mx-auto mb-10 leading-relaxed">
          Every candidate. Every offer. Every career decision. Run the intelligence first.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-7 py-3 font-mono text-[11px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
          >
            Get Full Access
          </button>
          <button
            onClick={() => navigate("/work-with-jackye")}
            className="border border-border text-muted-foreground px-7 py-3 font-mono text-[11px] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
          >
            Work With Jackye
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-16 py-6 flex justify-between items-center flex-wrap gap-4">
        <div className="font-mono text-[9px] tracking-wider text-muted-foreground">
          © 2026 Who Do I Work For · Employer Intelligence by Jackye Clayton
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="font-mono text-[9px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a href="/terms" className="font-mono text-[9px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="/methodology" className="font-mono text-[9px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">Methodology</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
