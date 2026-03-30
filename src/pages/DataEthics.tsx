import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Shield, FileCheck, Eye, Scale, UserCheck, Lock, AlertTriangle, Database, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/* ── Tier badge colors ── */
const TIER_COLORS: Record<string, string> = {
  "1": "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  "2": "bg-primary/10 text-primary border-primary/20",
  "3": "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

function TierBadge({ tier, label }: { tier: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${TIER_COLORS[tier] || ""}`}>
      Tier {tier} <span className="opacity-70">|</span> {label}
    </span>
  );
}

function PolicySection({
  icon: Icon,
  number,
  title,
  children,
}: {
  icon: React.ElementType;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pl-8 pb-10 border-l border-border/40 last:pb-0">
      <div className="absolute -left-4 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="ml-6">
        <p className="text-xs font-mono text-primary/60 tracking-wider uppercase mb-1">{number}</p>
        <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

export default function DataEthics() {
  usePageSEO({
    title: "Data Transparency & Ethics Policy | WDIWF",
    description:
      "How WDIWF handles data: fact-only protocol, source tiers, extremism flags, right of correction, and privacy commitments. Verifiable data, not editorial opinion.",
    path: "/data-ethics",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-16 pb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase mb-6">
            <Shield className="w-3.5 h-3.5" />
            Data Ethics
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Data Transparency & Ethics Policy
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Verifiable data, not editorial opinion. Every signal we surface comes from a primary source, tagged with its tier, and open to correction.
          </p>
        </section>

        {/* User Promise */}
        <section className="container mx-auto px-4 pb-12 max-w-2xl">
          <blockquote className="relative bg-card border border-primary/20 rounded-2xl p-6 text-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-widest rounded-full">
              Our Promise
            </div>
            <p className="text-foreground text-sm leading-relaxed italic mt-2">
              "We don't tell you if a company is 'good' or 'bad.' We show you who they're connected to, where their money comes from, and who they worked for before they worked for you. You decide the rest."
            </p>
            <p className="text-xs text-primary font-medium mt-3">— Jackye Clayton, Founder</p>
          </blockquote>
        </section>

        {/* Policy sections */}
        <section className="container mx-auto px-4 pb-20 max-w-2xl">
          <PolicySection icon={FileCheck} number="01" title='The "Fact-Only" Protocol'>
            <p>
              WDIWF does not use adjectives like "corrupt," "extremist," or "unethical." Instead, the system surfaces <strong className="text-foreground">Data Anomalies</strong> — patterns in public records that warrant further investigation by you.
            </p>
            <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
              <p className="text-xs font-mono text-primary/70 uppercase tracking-wider mb-2">The Rule</p>
              <p>
                If a connection cannot be cited to a primary source — an SEC filing, IRS 990, FEC donation record, court docket, or verified government disclosure — it is not included. Period.
              </p>
            </div>
            <p>
              Affiliations are categorized by their legal or tax status (e.g., "501(c)(4) Board Member") rather than social labels. We report what the record says. We don't editorialize what it means.
            </p>
          </PolicySection>

          <PolicySection icon={Database} number="02" title="Source Tiers & Attribution">
            <p>
              Every red flag, every signal, every data point in WDIWF is tagged with a source tier so you can judge its weight for yourself.
            </p>
            <div className="space-y-3">
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TierBadge tier="1" label="Certified Public Record" />
                </div>
                <p className="text-xs">
                  SEC EDGAR filings, OGE Form 278, FEC/OpenFEC, CourtListener legal dockets, WARN Act notices, BLS data, OSHA records, NLRB decisions, USASpending.gov, Senate LDA disclosures, IRS Form 990, FARA registrations.
                </p>
              </div>

              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TierBadge tier="2" label="Structured Investigative Data" />
                </div>
                <p className="text-xs">
                  OpenSecrets, LittleSis, SPLC, ADL, POGO, ProPublica Nonprofit Explorer, Revolving Door Project, LegiStorm, Candid/GuideStar, OpenCorporates, Bellingcat.
                </p>
              </div>

              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TierBadge tier="3" label="Public Archives & Media" />
                </div>
                <p className="text-xs">
                  GDELT, NewsAPI, Ground News, major investigative reporting. These sources are always marked with context about the reporting outlet's factuality and bias rating.
                </p>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={AlertTriangle} number="03" title="Extremism & Affiliation Transparency">
            <p>
              When it comes to flagging connections to high-control organizations, hate groups, or extremist affiliations, WDIWF follows strict evidentiary rules:
            </p>
            <div className="space-y-2">
              <div className="flex gap-3 bg-muted/30 border border-border/40 rounded-xl p-4">
                <Search className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground text-xs font-semibold mb-1">Direct Evidence Only</p>
                  <p className="text-xs">
                    WDIWF will only flag an individual if their name appears on a verified membership roll, an IRS 990 filing as an officer or director, or in a sworn legal deposition. No rumors. No inferences.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-muted/30 border border-border/40 rounded-xl p-4">
                <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground text-xs font-semibold mb-1">The Proximity Filter</p>
                  <p className="text-xs">
                    WDIWF will report shared registered agent addresses, shared board seats, or financial flows between a corporate executive and a flagged organization — but will clearly label these as proximity signals, not direct affiliations.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-muted/30 border border-border/40 rounded-xl p-4">
                <Scale className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground text-xs font-semibold mb-1">Three-Point Verification</p>
                  <p className="text-xs">
                    Before any affiliation is elevated to a "red flag," it must pass our three-point standard: direct evidence of affiliation, a verifiable financial link, and a documented organizational connection. All three. Not one. Not two. Three.
                  </p>
                </div>
              </div>
            </div>
            <p>
              Regional demographic data (from PRRI Values Atlas or Census) may be provided as context, but is never assigned to an individual as a personal belief or affiliation.
            </p>
          </PolicySection>

          <PolicySection icon={UserCheck} number="04" title="Right of Correction">
            <p>
              Because WDIWF is built to empower — not to destroy — every person and company surfaced in our system has recourse.
            </p>
            <div className="space-y-2">
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <p className="text-foreground text-xs font-semibold mb-1">Data Dispute Mechanism</p>
                <p className="text-xs">
                  Any professional or company identified in WDIWF can submit a "Rebuttal Evidence" file. Approved rebuttals are attached to the company profile permanently for full transparency — both the original signal and the response.
                </p>
              </div>
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <p className="text-foreground text-xs font-semibold mb-1">Quarterly Bias Audit</p>
                <p className="text-xs">
                  The WDIWF scoring algorithm undergoes a quarterly Adverse Impact Audit to ensure that red flags are not disproportionately triggered by factors correlated with any protected class. If bias is detected, the algorithm is recalibrated before the next scoring cycle.
                </p>
              </div>
            </div>
            <p>
              <Link to="/request-correction" className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1">
                Submit a data correction request <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </PolicySection>

          <PolicySection icon={Lock} number="05" title="Privacy & Data Minimization">
            <p>
              WDIWF prioritizes data on <strong className="text-foreground">Individuals of Significant Influence</strong> — executives, board members, and senior government officials whose decisions affect workers at scale.
            </p>
            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-2">
              <p className="text-xs"><strong className="text-foreground">We do not</strong> scrape personal photos, home addresses (unless used for business registration), or private social media posts.</p>
              <p className="text-xs"><strong className="text-foreground">We do not</strong> track your browsing history, sell your data, or share your search activity with employers.</p>
              <p className="text-xs"><strong className="text-foreground">We do not</strong> use your private documents (uploaded resumes, offer letters) to train AI models.</p>
            </div>
            <p>
              For full details on how we handle your personal data, see our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </PolicySection>
        </section>

        {/* Footer CTA */}
        <section className="container mx-auto px-4 pb-16 max-w-2xl text-center">
          <div className="bg-card border border-border/40 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-2">Questions about our data practices?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're building this in public because transparency isn't just a feature — it's the whole point.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/methodology"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm"
              >
                Read Our Methodology
              </Link>
              <Link
                to="/receipts"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary/30 text-primary font-medium rounded-xl hover:bg-primary/5 transition-colors text-sm"
              >
                See The Receipts
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
