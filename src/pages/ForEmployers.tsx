import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Shield, Eye, CheckCircle2, ArrowRight } from "lucide-react";

const ForEmployers = () => {
  usePageSEO({
    title: "For Companies — WDIWF",
    description:
      "The best talent is doing their homework. Is your company ready for the audit? Get ahead of your Integrity Score.",
    path: "/for-employers",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* ── Page Header ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 pt-20 pb-12">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
            For Companies
          </p>
          <h1
            className="font-sans text-foreground leading-[1.1] mb-6"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "24ch" }}
          >
            The best talent is doing their homework. Is your company ready for the audit?
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[52ch]">
            Top candidates evaluate employers before they accept. WDIWF shows them what they'll find. Get ahead of it.
          </p>
        </section>

        {/* ── Three Value Cards ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />,
                title: "Get Ahead of Your Score",
                body: "See your Integrity Score before candidates do. Understand how your employer brand compares to your operational reality — and close the gaps that cost you hires.",
              },
              {
                icon: <Eye className="w-6 h-6 text-primary" strokeWidth={1.5} />,
                title: "Identify the Gaps",
                body: "Find the distance between your employer brand and your reality. WDIWF surfaces the data points where your messaging doesn't match your outcomes — turnover, diversity metrics, legal records, and more.",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={1.5} />,
                title: "Signal Transparency",
                body: "Companies that opt into WDIWF are signaling that they welcome scrutiny. In a market where trust is the new currency, transparency is your competitive advantage.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg p-7 bg-card border border-border"
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="font-sans font-bold text-foreground mb-3" style={{ fontSize: "18px" }}>
                  {card.title}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The Case ── */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-20">
          <div className="max-w-[720px] mx-auto">
            <h2
              className="font-sans text-foreground leading-[1.1] mb-10"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}
            >
              Why this matters for your hiring.
            </h2>
            <div className="space-y-6">
              {[
                {
                  bold: "86% of job seekers",
                  rest: " research company reviews and ratings before deciding where to apply. They're already looking. WDIWF just gives them better tools.",
                },
                {
                  bold: "The cost of a bad employer brand",
                  rest: " is measurable. Companies with poor reputations pay 10% more per hire and take longer to fill roles. Addressing your Integrity Score is an investment, not an expense.",
                },
                {
                  bold: "Transparency builds trust faster",
                  rest: " than marketing. When a company proactively addresses its data, candidates notice. It's the difference between a company that says \"trust us\" and one that says \"here's the evidence.\"",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="font-mono text-sm text-primary mt-0.5 shrink-0">→</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">{item.bold}</strong>
                    {item.rest}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-20 text-center">
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Claim your company profile.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[44ch] mx-auto mb-8">
            Be among the first companies to opt into transparency. Request an Integrity Audit and get ahead of what candidates will find.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            Request an Integrity Audit <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ForEmployers;
