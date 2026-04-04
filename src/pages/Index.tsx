import { forwardRef } from "react";
import { FullyAuditedShowcase } from "@/components/landing/FullyAuditedShowcase";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { usePageSEO } from "@/hooks/use-page-seo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { ExitIntentCapture } from "@/components/ExitIntentCapture";

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();

  usePageSEO({
    title: "WDIWF — Know Who You Work For Before You Say Yes",
    description:
      "Facts-over-feelings employer audit: public records turned into alignment and risk signals so you can decide if a company is right for you before you apply, accept, stay, or leave.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For",
      description:
        "Employer audit from public records — political spending, enforcement, labor signals, and more. Decide with receipts, not vibes.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://whodoiworkfor.com",
    },
  });

  if (!isLoaded || authLoading) return null;

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      <MarketingNav />
      <ExitIntentCapture />

      {/* HERO */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 pt-20 pb-14 lg:pt-28 lg:pb-20 bg-background overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.05) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[60%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.03) 0%, transparent 70%)" }}
        />

        <div className="relative z-[1] max-w-[720px] mx-auto flex flex-col items-center text-center">
          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-5"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.15s forwards" }}
          >
            Audit before you say yes
          </p>

          <h1
            className="text-foreground font-sans text-center mx-auto"
            style={{
              fontSize: "clamp(2rem, 6vw, 3.35rem)",
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1.08,
              maxWidth: "22ch",
              opacity: 0,
              animation: "heroFadeIn 0.7s ease 0.3s forwards",
            }}
          >
            Know who you work for before you say yes.
          </h1>

          <p
            className="text-muted-foreground max-w-[52ch] mx-auto leading-relaxed mt-6"
            style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.075rem)", opacity: 0, animation: "heroFadeIn 0.6s ease 0.6s forwards" }}
          >
            Every company runs a background check on you. WDIWF flips it. We turn public records into clear alignment and risk signals so you can decide if a company is right for you before you apply, accept, stay, or leave.
          </p>

          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.85s forwards" }}
          >
            <Button
              size="lg"
              className="w-full sm:min-w-[220px] sm:w-auto h-12 px-8 text-base font-semibold gap-2 shadow-sm"
              onClick={() => navigate("/offer-check")}
            >
              Check a company
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Link
              to="/how-it-works"
              className="font-sans text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
            >
              See how it works
            </Link>
          </div>

          <p
            className="font-mono text-xs text-muted-foreground mt-8 tracking-wide max-w-[52ch] mx-auto text-center leading-relaxed"
            style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1s forwards" }}
          >
            Facts over feelings — FEC, SEC, OSHA, NLRB, BLS, and more. The public record, not the press release.
          </p>

          <p
            className="text-xs text-muted-foreground/70 mt-6 max-w-[46ch] leading-relaxed"
            style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.1s forwards" }}
          >
            Curious first?{" "}
            <Link to="/would-you-work-here" className="text-primary/90 hover:underline">
              See a sample audit walkthrough
            </Link>
            {" — then check a real employer."}
          </p>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <FullyAuditedShowcase />

      {/* HOW IT WORKS — audit spine */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[900px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4 text-center">How it works</p>
          <h2 className="text-h1 text-foreground text-center mb-14">Data first. Then what it means. Then your call.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Check the employer",
                body: "Name the company. We pull what exists in the public record — political giving, enforcement, labor signals, and more — with sources you can trace.",
                link: "/offer-check",
              },
              {
                step: "02",
                title: "Read alignment & risk",
                body: "We don’t do vibes. You see the receipts, then plain-language framing: what matches what you care about, and what deserves a pause.",
                link: "/how-it-works",
              },
              {
                step: "03",
                title: "Move forward or pause",
                body: "Every flow ends in a decision helper — not a score without a story. Go deeper on the full dossier when you’re ready to decide.",
                link: "/pricing",
              },
            ].map((item) => (
              <Link
                key={item.step}
                to={item.link}
                className="flex flex-col no-underline group/step hover:bg-primary/[0.03] rounded-lg p-4 -m-4 transition-colors"
              >
                <span className="font-mono text-primary text-xs tracking-wider mb-3">{item.step}</span>
                <h3 className="font-sans font-bold text-foreground text-base mb-2 group-hover/step:text-primary transition-colors">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                <span className="text-xs text-primary mt-2 opacity-0 group-hover/step:opacity-100 transition-opacity flex items-center gap-1">
                  Go <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page reinforcement — one primary button only in hero + closing; link here avoids CTA fatigue */}
      <section className="px-6 lg:px-16 py-16 lg:py-20 bg-background border-b border-border">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3">Employer audit</p>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-4">Stop signing blind.</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            One front door: name the company, read the public record, then decide whether to move forward or pause. Everything else is optional once you’re in.
          </p>
          <Link
            to="/offer-check"
            className="font-sans text-sm font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            Check a company <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden border-t border-border">
        <div
          className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }}
        />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Receipts, not headlines</p>
          <h2 className="text-h1 text-foreground mb-4">Decide with the public record.</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[46ch] mx-auto mb-8">
            Same sources regulators and investors use — organized so you can answer one question: should I work here?
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="h-12 px-8" onClick={() => navigate("/offer-check")}>
              Check a company
            </Button>
          </div>
          <p className="font-sans text-xs text-muted-foreground/40 mt-5">No spam. No selling your data. That would be ironic.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
});

Index.displayName = "Index";

export default Index;
