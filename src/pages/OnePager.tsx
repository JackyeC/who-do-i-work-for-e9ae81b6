const OnePager = () => {
  const trustSources = ["FEC Individual Receipts", "USASpending.gov", "OpenSecrets Lobbying", "SEC EDGAR", "Glassdoor Intelligence", "Real-time sync"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-6 py-12 print:py-6">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto] items-start gap-8 pb-8 border-b-2 border-primary mb-8">
          <div>
            <div className="font-serif text-3xl font-bold text-primary mb-1">Who Do I Work For</div>
            <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              Career Intelligence by Jackye Clayton
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-micro tracking-wider uppercase border border-primary/40 text-primary px-3 py-1 inline-block mb-1.5">
              Product Overview
            </div>
            <div className="font-mono text-[9px] text-muted-foreground">March 2026</div>
          </div>
        </div>

        {/* Problem */}
        <div className="bg-card border-l-[3px] border-l-civic-red p-5 mb-8">
          <div className="font-mono text-micro tracking-[0.2em] uppercase text-civic-red mb-2">The Problem</div>
          <div className="font-serif text-body-lg leading-relaxed text-foreground">
            Candidates spend months interviewing for a job, then accept an offer without knowing{" "}
            <em className="text-primary italic">who they're really working for</em> — or what the company's data actually says about culture, compensation, and values. HR teams build EVP decks disconnected from reality. Recruiters lose candidates at the offer stage because they don't have the intelligence to get ahead of objections.{" "}
            <em className="text-primary italic">We fix all three.</em>
          </div>
        </div>

        {/* Core modules */}
        <div className="grid grid-cols-2 gap-px bg-border border border-border mb-8">
          {[
            { num: "01 — Intelligence", title: "Connection Chain", body: "Every verified link between a company and its political donors, lobbying firms, PAC contributions, federal contracts, and regulatory relationships. Bloomberg-grade transparency for hiring decisions.", tag: "FEC · USASpending · OpenSecrets · SEC EDGAR" },
            { num: "02 — Protection", title: "Offer Letter Analyzer", body: "Benchmarks salary, flags non-compete language, identifies benefits gaps, and provides a negotiation guide — before you sign. Know your number. Know your rights. Know what to push back on.", tag: "Real-time salary data · Contract language detection" },
            { num: "03 — Coaching", title: "Ask Jackye — AI Coach", body: "Jackye Clayton's 20+ years of HR expertise as your personal career strategist. Available 24/7. She'll tell you what HR won't say and what most coaches are afraid to say out loud.", tag: "Jackye's methodology · Your situation · Your decisions" },
            { num: "04 — HR Intelligence", title: "EVP Intelligence", body: "HR professionals: audit your Employee Value Proposition against what the data actually shows. Close the gap between what you promise and what employees experience — before candidates surface it first.", tag: "For CHROs · Recruiters · HR Business Partners" },
          ].map(m => (
            <div key={m.num} className="bg-background p-5">
              <div className="font-mono text-[9px] text-muted-foreground tracking-wider mb-2">{m.num}</div>
              <div className="font-serif text-base font-bold text-foreground mb-2">{m.title}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">{m.body}</div>
              <div className="mt-3 font-mono text-micro tracking-wider uppercase text-primary border-l-2 border-primary pl-2">{m.tag}</div>
            </div>
          ))}
        </div>

        {/* Audience */}
        <div className="grid grid-cols-3 gap-px bg-border border border-border mb-8">
          {[
            { label: "For Candidates", title: "No more blind offers", items: ["Run intelligence before accepting", "Benchmark your compensation", "Know who you actually work for", "Negotiate from data, not hope"] },
            { label: "For HR Professionals", title: "EVP that holds up to scrutiny", items: ["Audit EVP against real data", "Identify culture gaps early", "Strengthen offer narratives", "Build with Jackye's frameworks"] },
            { label: "For Recruiters", title: "Close more. Lose fewer.", items: ["Get ahead of candidate objections", "Use intelligence in your pitch", "Position as a career advisor", "Build lasting candidate trust"] },
          ].map(a => (
            <div key={a.label} className="bg-card p-4">
              <div className="font-mono text-micro tracking-[0.18em] uppercase text-primary mb-2">{a.label}</div>
              <div className="font-serif text-sm font-bold mb-2">{a.title}</div>
              <div className="flex flex-col gap-1">
                {a.items.map(item => (
                  <div key={item} className="text-[10px] text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">—</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Jackye strip */}
        <div className="grid grid-cols-[auto_1fr] gap-5 bg-card border border-border border-t-2 border-t-primary p-5 mb-8 items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-xl font-bold text-primary-foreground shrink-0">
            JC
          </div>
          <div>
            <div className="font-serif text-base font-bold text-primary">Jackye Clayton</div>
            <div className="font-mono text-micro tracking-wider uppercase text-muted-foreground mb-1.5">Founder · Career Intelligence by Jackye Clayton</div>
            <div className="text-[11px] text-muted-foreground italic leading-relaxed">
              "The question isn't just whether you want the job. It's whether you know exactly who you're going to work for. Every candidate deserves to walk into that negotiation armed with the same information the company already has about them."
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-px bg-border border border-border mb-8">
          {[
            { tier: "Candidate", price: "$29", per: "per month", featured: false, items: ["5 company reports", "Offer letter analysis", "Ask Jackye — 20/mo", "Red flag alerts"] },
            { tier: "Professional", price: "$99", per: "per month", featured: true, items: ["Unlimited company reports", "Full Connection Chain", "Unlimited Ask Jackye", "EVP audit tools"] },
            { tier: "Enterprise / HR Teams", price: "Custom", per: "team pricing", featured: false, items: ["Team seats + admin", "White-label EVP reports", "API access", "Jackye Clayton training"] },
          ].map(p => (
            <div key={p.tier} className={`p-4 relative ${p.featured ? "bg-card" : "bg-background"}`}>
              {p.featured && (
                <div className="absolute -top-2.5 left-4 bg-primary text-primary-foreground font-mono text-[7px] font-semibold tracking-wider px-2 py-0.5 uppercase">
                  Popular
                </div>
              )}
              <div className="font-mono text-micro tracking-[0.18em] uppercase text-muted-foreground mb-1.5">{p.tier}</div>
              <div className="font-serif text-2xl font-bold text-foreground">{p.price}</div>
              <div className="font-mono text-[9px] text-muted-foreground mb-3">{p.per}</div>
              <div className="flex flex-col gap-1">
                {p.items.map(item => (
                  <div key={item} className="text-[10px] text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">—</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-[1fr_auto] items-end gap-8 border-t border-border pt-6">
          <div>
            <div className="font-mono text-micro tracking-[0.18em] uppercase text-muted-foreground mb-2">Verified Evidence Sources</div>
            <div className="flex flex-wrap gap-3">
              {trustSources.map(s => (
                <span key={s} className="font-mono text-[9px] text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-micro tracking-[0.18em] uppercase text-muted-foreground mb-1">Request a Demo</div>
            <div className="font-serif text-[13px] text-primary">whodoidworkfor.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnePager;
