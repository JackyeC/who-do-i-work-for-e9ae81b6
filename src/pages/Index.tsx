import { lazy, Suspense, forwardRef } from "react";
import { FullyAuditedShowcase } from "@/components/landing/FullyAuditedShowcase";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  FileSearch,
  Shield,
  Target,
  Briefcase,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { usePageSEO } from "@/hooks/use-page-seo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroScanInput } from "@/components/landing/HeroScanInput";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));

const COMING_SOON_BADGE = (
  <span className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full">
    Coming Soon
  </span>
);

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();

  usePageSEO({
    title: "Check Any Employer Before You Apply — Career Intelligence",
    description:
      "Look up any company, build your Dream Job Profile, see aligned roles, and track applications with post-apply dossiers — grounded in public records and your stated priorities.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For",
      description: "Career advocacy platform by Jackye Clayton. Evaluate employers using public records — political spending, enforcement history, lobbying, compensation data.",
      applicationCategory: "BusinessApplication",
      creator: { "@type": "Person", name: "Jackye Clayton" },
      url: "https://whodoiworkfor.com",
    },
  });

  if (!isLoaded || authLoading) return null;

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      <MarketingNav />
      <Suspense fallback={null}><ExitIntentCapture /></Suspense>

      {/* 1 - HERO */}
      <section className="relative flex flex-col justify-center px-6 lg:px-16 pt-20 pb-12 lg:pt-32 lg:pb-20 bg-background overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.05) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.03) 0%, transparent 70%)" }} />

        <div className="relative z-[1] max-w-[780px] mx-auto flex flex-col items-center text-center">
          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-5"
            style={{ animation: "heroFadeIn 0.5s ease 0.15s" }}
          >
            Before you apply, accept, stay, or leave
          </p>

          <h1
            className="text-foreground font-sans text-center mx-auto"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1.04,
              maxWidth: "18ch",
              animation: "heroFadeIn 0.7s ease 0.3s",
            }}
          >
            Stop applying.<br />
            <span className="text-primary">Start aligning.</span>
          </h1>

          <p
            className="text-muted-foreground max-w-[52ch] mx-auto leading-relaxed mt-6"
            style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.075rem)", animation: "heroFadeIn 0.6s ease 0.8s" }}
          >
            Check who you&apos;re really working for in 30 seconds &mdash; the receipts on politics, enforcement, layoffs, and values, pulled from the public record so you&apos;re not guessing about your next move.
          </p>

          {/* Primary CTA — single form with submit inside HeroScanInput */}
          <div
            className="mt-9 w-full flex flex-col items-center gap-4"
            style={{ animation: "heroFadeIn 0.5s ease 0.5s" }}
          >
            <HeroScanInput />
          </div>

          {/* Work DNA Quiz CTA — split-test Path B */}
          <p
            className="font-mono text-xs text-muted-foreground mt-4 tracking-wide"
            style={{ animation: "heroFadeIn 0.4s ease 0.7s" }}
          >
            Not sure where to start?{" "}
            <button
              id="cta-work-dna-quiz"
              onClick={() => navigate("/quiz")}
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-semibold"
            >
              Find your Work DNA first &rarr;
            </button>
          </p>

          <p className="font-mono text-xs text-muted-foreground/60 mt-5 tracking-wide max-w-[52ch] mx-auto text-center leading-relaxed" style={{ animation: "heroFadeIn 0.4s ease 1.0s" }}>
            Built on FEC, SEC, OSHA, NLRB, BLS, and more — the public record, not the press release.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn { from { opacity: 0.01; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-scroll-left { animation: scroll-left 40s linear infinite; }
      `}</style>

      {/* TICKER */}
      <Suspense fallback={<div className="h-[36px] bg-background border-b border-border/10" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* FULLY AUDITED SHOWCASE */}
      <FullyAuditedShowcase />

      {/* 2 - HOW IT WORKS */}
      <section className="bg-muted/40 border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[900px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4 text-center">How It Works</p>
          <h2 className="text-h1 text-foreground text-center mb-14">
            Three moves. One spine.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {([
              {
                step: "01",
                title: "Define what \u201cgood\u201d means",
                body: "Take the quiz. Set your deal-breakers. We build your Dream Job Profile so every match actually means something.",
                link: "/dashboard?tab=profile",
                comingSoon: true,
              },
              {
                step: "02",
                title: "Investigate & match",
                body: "Pull the public record on any employer. Political spending, enforcement history, layoff patterns. See what lines up and where the risk is.",
                link: "/browse",
                comingSoon: false,
              },
              {
                step: "03",
                title: "Apply with receipts",
                body: "Track what you sent and why. Auto-apply only moves when you say so. Your dossier travels with your application.",
                link: "/dashboard?tab=tracker",
                comingSoon: true,
              },
            ] as const).map((item) => (
              <Link key={item.step} to={item.link} className="flex flex-col no-underline group/step hover:bg-primary/[0.03] rounded-lg p-4 -m-4 transition-colors relative">
                {item.comingSoon && <div className="absolute top-2 right-2">{COMING_SOON_BADGE}</div>}
                <span className="font-mono text-primary text-xs tracking-wider mb-3">{item.step}</span>
                <h3 className="font-sans font-bold text-foreground text-base mb-2 group-hover/step:text-primary transition-colors">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                <span className="text-xs text-primary mt-2 opacity-0 group-hover/step:opacity-100 transition-opacity flex items-center gap-1">
                  Try it <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 - PRODUCT MODULES */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-card/80 border-y border-border">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">The Platform</p>
          <h2 className="text-h1 text-foreground text-center mb-4">
            Built for the part nobody talks about.
          </h2>
          <p className="text-body-lg text-center max-w-[52ch] mx-auto mb-14">
            The due diligence between "I'm interested" and "I accept." All public record. All yours.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {([
              { icon: <FileSearch className="w-6 h-6" strokeWidth={1.5} />, title: "Employer Dossiers", desc: "The full picture on any company. Political spending, enforcement actions, lobbying, leadership moves. Sourced, traceable, no editorializing.", link: "/browse", comingSoon: false },
              { icon: <Target className="w-6 h-6" strokeWidth={1.5} />, title: "Dream Job Profile", desc: "Your deal-breakers, your priorities, your definition of good. One profile that drives every match you see.", link: "/dashboard?tab=profile", comingSoon: true },
              { icon: <Briefcase className="w-6 h-6" strokeWidth={1.5} />, title: "Jobs Feed & Matching", desc: "Roles that actually line up with what you said matters. When employer data is thin, we tell you that too.", link: "/jobs-feed", comingSoon: true },
              { icon: <Shield className="w-6 h-6" strokeWidth={1.5} />, title: "Auto-Apply", desc: "Set your floor. Cap your volume. Nothing goes out without your say-so unless you decide otherwise.", link: "/auto-apply", comingSoon: true },
              { icon: <FileText className="w-6 h-6" strokeWidth={1.5} />, title: "Applications & Dossiers", desc: "Track what you sent, when, and why. Post-apply dossiers give you receipts on your own process.", link: "/dashboard?tab=tracker", comingSoon: true },
              { icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />, title: "Command Center", desc: "One view. Today's signals, your matches, your applications, and one suggested move. Jackye is one click away.", link: "/dashboard?tab=overview", comingSoon: true },
            ] as { icon: React.ReactNode; title: string; desc: string; link: string; comingSoon: boolean }[]).map((item) => (
              <Link key={item.title} to={item.link} className="group p-6 border border-border bg-card hover:border-primary/30 transition-all relative">
                {item.comingSoon && <div className="absolute top-3 right-3">{COMING_SOON_BADGE}</div>}
                <div className="text-primary mb-4 group-hover:scale-105 transition-transform">{item.icon}</div>
                <h3 className="font-sans font-bold text-foreground text-[15px] mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 - FINAL CTA */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden border-t border-border bg-muted/30">
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know before you go.</p>
          <h2 className="text-h1 text-foreground mb-4">
            Your next move deserves receipts.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[46ch] mx-auto mb-8">
            Every company you&apos;re considering has a public record. Now you know where to read it.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate("/intelligence-check")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all rounded-xl"
            >
              Run My Free Scan
            </button>
            <button
              onClick={() => navigate("/ask-jackye")}
              className="border border-border text-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:bg-muted/50 transition-all rounded-xl"
            >
              Ask Jackye
            </button>
          </div>
          <p className="font-sans text-xs text-muted-foreground/40 mt-5">
            No spam. No selling your data. That would be ironic.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
});

export default Index;
