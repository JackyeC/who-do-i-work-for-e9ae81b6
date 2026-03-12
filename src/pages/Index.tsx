import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [companyCount, setCompanyCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("companies").select("*", { count: "exact", head: true })
      .then(({ count }) => setCompanyCount(count || 0));
  }, []);

  const features = [
    {
      num: "01",
      title: "Connection Chain Intelligence",
      body: "We map every verified link between a company and government agencies, political donors, lobbying firms, PACs, and regulatory bodies. See who your employer really funds, influences, and answers to — before you say yes.",
      tag: "Bloomberg-grade data",
    },
    {
      num: "02",
      title: "Offer Letter Analyzer",
      body: "Upload or paste your offer. We benchmark salary against verified market data, flag non-compete language, identify benefits gaps, and tell you exactly what to negotiate — and how. Never sign blind again.",
      tag: "Instant red flag detection",
    },
    {
      num: "03",
      title: "Ask Jackye — AI Career Coach",
      body: "Jackye Clayton's methodology, frameworks, and 20+ years of HR expertise — available 24/7 as your personal career strategist. She'll tell you what HR won't, and what most coaches are afraid to say out loud.",
      tag: "Jackye's voice. Your decisions.",
    },
    {
      num: "04",
      title: "EVP Intelligence for HR Teams",
      body: "HR professionals: see how your company's Employee Value Proposition holds up against what the data actually shows. Identify gaps between what you promise and what employees experience — before candidates find them first.",
      tag: "For recruiters & CHROs",
    },
  ];

  const audiences = [
    {
      who: "For Candidates",
      title: "Before you sign anything",
      body: "You spend months getting to an offer letter. Spend 10 minutes running the intelligence before you accept it.",
      items: [
        "Know the company's real political footprint",
        "Benchmark your offer against verified data",
        "Identify red flags in contract language",
        "Get Jackye's coaching on your specific situation",
      ],
    },
    {
      who: "For HR Professionals",
      title: "Before candidates find out first",
      body: "Your EVP is only as strong as the data behind it. Candidates are doing more research than ever — you should too.",
      items: [
        "Audit your EVP against intelligence data",
        "Identify culture-claims gaps before interviews",
        "Benchmark compensation with confidence",
        "Use Jackye's frameworks for EVP building",
      ],
    },
    {
      who: "For Recruiters",
      title: "Close with confidence",
      body: "Stop losing candidates at the offer stage. Run the intelligence before they do and get ahead of every objection.",
      items: [
        "Pre-empt candidate red flags with data",
        "Use Connection Chain in your pitch narrative",
        "Position yourself as a true career advisor",
        "Build trust with candidates that lasts",
      ],
    },
  ];

  const pricing = [
    {
      tier: "Candidate",
      price: "$29",
      per: "per month",
      featured: false,
      items: ["5 company intelligence reports", "Offer letter analysis", "Ask Jackye — 20 queries/mo", "Red flag alerts"],
    },
    {
      tier: "Professional",
      price: "$99",
      per: "per month",
      featured: true,
      items: ["Unlimited company reports", "Full Connection Chain access", "Unlimited Ask Jackye", "Offer benchmarking + negotiation guide", "EVP audit tools", "Priority data updates"],
    },
    {
      tier: "Enterprise / HR Teams",
      price: "Custom",
      per: "team pricing",
      featured: false,
      items: ["Team seats + admin dashboard", "White-label EVP reports", "API access", "Jackye Clayton keynote / training", "Custom data integrations"],
    },
  ];

  const trustSources = ["FEC Filings", "USASpending.gov", "SEC EDGAR", "OpenSecrets", "Glassdoor Intelligence", "Real-time Updates"];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 border-b border-border sticky top-0 bg-background z-50">
        <div>
          <div className="font-serif text-base font-bold text-primary">Who Do I Work For</div>
          <div className="font-mono text-micro uppercase text-muted-foreground tracking-widest">Career Intelligence by Jackye Clayton</div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="font-mono text-label uppercase text-muted-foreground hover:text-foreground transition-colors">Intelligence</a>
          <a href="#audience" className="font-mono text-label uppercase text-muted-foreground hover:text-foreground transition-colors">For HR Teams</a>
          <a href="#pricing" className="font-mono text-label uppercase text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-5 py-2 font-mono text-label uppercase tracking-wider font-semibold hover:brightness-110 transition-all"
          >
            Request Access
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div className="font-mono text-label uppercase text-primary mb-4 flex items-center gap-2">
            <span className="w-6 h-px bg-primary inline-block" />
            Career Intelligence Platform
          </div>
          <h1 className="font-serif text-3xl lg:text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-tight mb-6 text-foreground">
            Know who you're <em className="text-primary italic">really</em> working for before you sign.
          </h1>
          <p className="text-body-lg text-muted-foreground mb-8 max-w-[460px]">
            The first intelligence platform that maps political influence, offer red flags, and culture integrity so candidates and HR professionals make decisions with full information — not just good marketing.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-primary-foreground px-7 py-3 font-mono text-[11px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all"
            >
              Get Full Access
            </button>
            <button
              onClick={() => navigate("/browse")}
              className="border border-border text-muted-foreground px-7 py-3 font-mono text-[11px] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
            >
              See Live Demo
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="bg-card border border-border p-6 relative">
            <div className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-micro uppercase text-primary tracking-widest">
              Live Intelligence
            </div>
            <div className="font-serif text-lg font-bold mb-1">Koch Industries</div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mb-4">
              Intelligence Score: 6.2 / 10 · High Scrutiny
            </div>
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
              {[
                { label: "Political Exposure", val: "Significant", color: "text-civic-red" },
                { label: "Lobbying Spend", val: "$5.2M", color: "text-civic-yellow" },
                { label: "EVP Integrity", val: "Moderate", color: "text-civic-yellow" },
                { label: "Fed Contracts", val: "Active", color: "text-civic-green" },
              ].map(m => (
                <div key={m.label} className="bg-card p-3">
                  <div className="font-mono text-micro uppercase text-muted-foreground mb-1">{m.label}</div>
                  <div className={`font-serif text-lg font-bold ${m.color}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] p-2 border-l-2 border-civic-red bg-civic-red/[0.07] text-foreground">Non-compete clause — unusually broad scope</div>
              <div className="text-[11px] p-2 border-l-2 border-civic-yellow bg-civic-yellow/[0.07] text-foreground">Salary offer 8.2% below market median</div>
              <div className="text-[11px] p-2 border-l-2 border-civic-green bg-civic-green/[0.07] text-foreground">Federal contractor status — strong job security</div>
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

      {/* Features */}
      <section id="features" className="px-6 lg:px-16 py-20 lg:py-24 max-w-[1100px] mx-auto w-full">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">The Platform</div>
        <h2 className="font-serif text-2xl lg:text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold mb-12 text-foreground">
          Four tools. One truth.<br /><em className="text-primary italic">Zero surprises.</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {features.map(f => (
            <div key={f.num} className="bg-card p-8 hover:bg-surface-2 transition-colors">
              <div className="font-mono text-label text-muted-foreground mb-3">{f.num}</div>
              <div className="font-serif text-lg font-bold text-foreground mb-3">{f.title}</div>
              <div className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</div>
              <div className="mt-4 inline-block font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border border-primary/40 text-primary">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Jackye Section */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-4xl font-bold text-primary-foreground mb-4">
              JC
            </div>
            <div className="font-serif text-xl font-bold text-primary mb-1">Jackye Clayton</div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
              Founder · Career Intelligence by Jackye Clayton
            </div>
          </div>
          <div>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-6">
              I've spent over two decades in HR watching candidates accept offers they shouldn't have — because they didn't know what to ask, or they didn't have the data to ask it. I've watched companies build EVP decks that have nothing to do with the reality employees walk into on day one.
              <br /><br />
              <strong className="text-foreground">Who Do I Work For exists because information is power — and candidates have been showing up to the most important negotiations of their lives completely unarmed.</strong> That ends now.
            </p>
            <blockquote className="border-l-2 border-primary pl-4 font-serif text-lg italic text-foreground leading-relaxed mb-2">
              "The question isn't just whether you want the job. It's whether you know exactly who you're going to work for. Run the chain first. Always."
            </blockquote>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground pl-4">— Jackye Clayton</div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="px-6 lg:px-16 py-20 lg:py-24 max-w-[1100px] mx-auto w-full">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Built For</div>
        <h2 className="font-serif text-2xl lg:text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold mb-12 text-foreground">
          The right intelligence<br />for <em className="text-primary italic">every</em> career moment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {audiences.map(a => (
            <div key={a.who} className="bg-card p-8">
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary mb-3">{a.who}</div>
              <div className="font-serif text-base font-bold mb-3">{a.title}</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed mb-4">{a.body}</div>
              <div className="flex flex-col gap-1.5">
                {a.items.map(item => (
                  <div key={item} className="text-[11px] text-muted-foreground flex gap-2">
                    <span className="text-primary shrink-0">—</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-card border-t border-border px-6 lg:px-16 py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">Pricing</div>
          <h2 className="font-serif text-2xl lg:text-display font-bold mb-12 text-foreground">Simple, transparent access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {pricing.map(p => (
              <div key={p.tier} className={`p-8 relative ${p.featured ? "bg-surface-2" : "bg-background"}`}>
                {p.featured && (
                  <div className="absolute -top-2.5 left-6 bg-primary text-primary-foreground font-mono text-micro font-semibold tracking-wider px-2 py-0.5 uppercase">
                    Most Popular
                  </div>
                )}
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{p.tier}</div>
                <div className="font-serif text-4xl font-bold text-foreground mb-1">{p.price}</div>
                <div className="font-mono text-label text-muted-foreground mb-6">{p.per}</div>
                <div className="flex flex-col gap-2 mb-6">
                  {p.items.map(item => (
                    <div key={item} className="text-[12px] text-muted-foreground flex gap-2">
                      <span className="text-primary shrink-0">—</span>{item}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className={`w-full py-3 font-mono text-label font-semibold tracking-wider uppercase transition-all ${
                    p.featured
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "bg-transparent border border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {p.tier === "Enterprise / HR Teams" ? "Contact Us" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-16 py-24 lg:py-28 text-center border-t border-border">
        <h2 className="font-serif text-2xl lg:text-[clamp(2rem,4vw,3.2rem)] font-bold mb-4 text-foreground">
          You deserve to know <em className="text-primary italic">exactly</em> who you work for.
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
            onClick={() => navigate("/pricing")}
            className="border border-border text-muted-foreground px-7 py-3 font-mono text-[11px] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
          >
            Request a Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-16 py-6 flex justify-between items-center flex-wrap gap-4">
        <div className="font-mono text-[9px] tracking-wider text-muted-foreground">
          © 2026 Who Do I Work For · Career Intelligence by Jackye Clayton
        </div>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Data Sources", "Contact"].map(link => (
            <a key={link} href="#" className="font-mono text-[9px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Index;
