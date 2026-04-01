import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, Landmark, DollarSign, Users, FileText, Scale, Building2 } from "lucide-react";
import { PoliticalSpectrumExplainer } from "@/components/policy/PoliticalSpectrumExplainer";

const INFLUENCE_LAYERS = [
  {
    icon: DollarSign,
    label: "PAC Spending",
    title: "Where the money goes.",
    desc: "Corporate PACs funnel employee and executive donations to candidates and committees. WDIWF tracks every FEC-reported dollar so you can see which politicians your employer backs — and whether those politicians vote for or against worker protections.",
  },
  {
    icon: Landmark,
    label: "Lobbying",
    title: "What they lobby for behind closed doors.",
    desc: "Companies spend millions lobbying Congress and state legislatures on bills that affect wages, benefits, safety standards, and hiring practices. We pull Senate Lobbying Disclosure Act filings so you can see what your employer fights for when you're not watching.",
  },
  {
    icon: Users,
    label: "Board & Executive Influence",
    title: "Who sits at the table — and where else they sit.",
    desc: "Board interlocks, advisory committee seats, and revolving-door connections between corporations and government agencies shape regulation. WDIWF maps these relationships so you can see the influence network around your employer.",
  },
  {
    icon: Scale,
    label: "Enforcement & Labor Record",
    title: "What the regulators found.",
    desc: "EEOC filings, OSHA citations, NLRB complaints, and Wage & Hour investigations reveal patterns that job postings never mention. We surface enforcement records so you can see whether a company's 'great place to work' claim holds up under scrutiny.",
  },
  {
    icon: FileText,
    label: "Trade Associations & Non-Disclosed Channels",
    title: "The organizations they fund — and what those organizations do.",
    desc: "Many companies fund industry groups and 501(c)(4) organizations that lobby against worker-friendly legislation while the company publicly claims to support those same issues. WDIWF traces the funding trail through public filings.",
  },
];

const CANDIDATE_STAKES = [
  "A company lobbying against pay transparency while advertising 'competitive compensation'",
  "An employer's PAC funding politicians who vote against parental leave — while promoting their family-friendly culture",
  "A firm spending millions fighting OSHA safety regulations while posting 'employee wellbeing' content on LinkedIn",
  "A tech company lobbying against AI hiring regulation while using unaudited AI screening on candidates",
];

export default function PolicyHub() {
  usePageSEO({
    title: "Policy & Influence — How Employer Power Shapes Your Career",
    description: "See how lobbying, PAC spending, board connections, and policy influence shape the companies you work for. Public records, not opinions.",
    path: "/policy",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ═══ HERO ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 pt-20 pb-16 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">
            Policy & Influence
          </p>
          <h1
            className="font-sans text-foreground leading-[1.08] mb-5 mx-auto"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "20ch" }}
          >
            Your employer has a political footprint. You should see it.
          </h1>
          <p className="text-sm text-muted-foreground max-w-[52ch] mx-auto leading-relaxed">
            Lobbying, PAC spending, board connections, and enforcement records shape the companies you work for.
            WDIWF surfaces these signals from public filings so you can see the full picture before you sign.
          </p>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ WHY THIS MATTERS TO WORKERS ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Why This Matters</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">
              Policy isn't abstract. It's your paycheck, your safety, and your rights.
            </h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                The legislation your employer lobbies for — or against — directly affects your wages, benefits, workplace safety, and job security. When a company spends millions fighting pay transparency laws, that's not just politics. That's your offer letter.
              </p>
              <p>
                Most career platforms ignore this entirely. WDIWF doesn't. We believe you have the right to know what your labor supports and whether the company's public values match their political spending.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ WHAT WE TRACK ═══ */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-16">
          <div className="max-w-[900px] mx-auto">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">What We Track</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-8">
              Five layers of employer influence.
            </h2>
            <div className="space-y-8">
              {INFLUENCE_LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="flex items-center justify-center w-10 h-10 border border-border bg-background shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-primary tracking-wide uppercase mb-1">{layer.label}</p>
                      <h3 className="text-sm font-bold text-foreground mb-1">{layer.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ REAL EXAMPLES ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">What This Looks Like</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-6">
              The gap between what they say and what they fund.
            </h2>
            <div className="space-y-4">
              {CANDIDATE_STAKES.map((stake, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-xs text-primary mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{stake}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-6">
              These aren't hypotheticals. These are patterns WDIWF detects in public filings — and surfaces in every company dossier.
            </p>
          </div>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ CTA ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-20 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">See the Receipts</p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Check your employer's political footprint.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[46ch] mx-auto mb-8">
            Search any company. See their PAC spending, lobbying record, enforcement history, and influence network — all from public sources.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Building2 className="w-4 h-4" />
            See Employer Policy Influence
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
