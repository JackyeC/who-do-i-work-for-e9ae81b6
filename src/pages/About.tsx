import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ShieldCheck, FileText, Eye, Scale } from "lucide-react";

const About = () => {
  usePageSEO({
    title: "About WDIWF — Who Do I Work For?",
    description:
      "You deserve to know exactly who you work for. Learn how WDIWF verifies employers against public records. No bias — just receipts.",
    path: "/about",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 space-y-14">
        {/* Opening pull quote */}
        <div className="text-center py-8">
          <p className="font-serif text-2xl md:text-3xl font-bold text-foreground leading-snug max-w-xl mx-auto">
            "You deserve to know exactly who you work for."
          </p>
        </div>

        {/* Page headline */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground font-display">
            About Who Do I Work For?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            A career intelligence platform that surfaces what companies don't
            put on their careers page — using only public records.
          </p>
        </div>

        {/* Neutrality statement — featured */}
        <blockquote className="border-l-4 border-primary pl-5 py-4 rounded-r-lg bg-muted/30 space-y-3">
          <p className="text-base font-semibold text-foreground leading-relaxed">
            WDIWF does not evaluate the content of your mission.
          </p>
          <p className="text-base font-semibold text-primary leading-relaxed">
            We evaluate whether you're living it.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Faith-based. Climate-focused. Veterans. LGBTQ. Rural. Urban.
            <br />
            Every mission category is verified the same way —
            <br />
            against public data, not our opinion.
          </p>
          <p className="text-sm font-semibold text-foreground">
            We don't have a bias. We have receipts.
          </p>
        </blockquote>

        {/* What we do */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">How it works</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                title: "Public records only",
                desc: "FEC filings, SEC reports, BLS wage data, OSHA citations, NLRB cases, USAspending.gov, and more.",
              },
              {
                icon: Eye,
                title: "Reality Gap analysis",
                desc: "We compare what companies say on their careers page to what the public record actually shows.",
              },
              {
                icon: ShieldCheck,
                title: "Confidence-rated signals",
                desc: "Every data point carries a source type, recency, and confidence level — so you know what's verified and what's inferred.",
              },
              {
                icon: Scale,
                title: "No judgment, just data",
                desc: "We surface patterns. You decide what matters. Scores inform — they don't prescribe.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/40 bg-card p-5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Creator */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Built by Jackye Clayton</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            15+ years in talent acquisition and HR technology. Board member,
            LinkedIn Learning instructor, and HR technology advisor. WDIWF is
            built on the belief that recruiting works best when messaging and
            reality match.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
