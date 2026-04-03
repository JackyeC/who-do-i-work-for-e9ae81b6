import { lazy, Suspense, forwardRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, FileSearch, Shield, TrendingUp, Bell, BookOpen, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { usePageSEO } from "@/hooks/use-page-seo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroScanInput } from "@/components/landing/HeroScanInput";
import { LiveDataFeed } from "@/components/landing/LiveDataFeed";

const LiveIntelligenceTicker = lazy(() => import("@/components/landing/LiveIntelligenceTicker").then(m => ({ default: m.LiveIntelligenceTicker })));
const ExitIntentCapture = lazy(() => import("@/components/ExitIntentCapture").then(m => ({ default: m.ExitIntentCapture })));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();

  usePageSEO({
    title: "Check Any Employer Before You Apply \u2014 Career Intelligence",
    description: "Look up any company and see what the public record says about political spending, labor violations, layoffs, and leadership. 30-second employer check powered by public data.",
    path: "/",
    jsonLd: {
      "@type": "WebApplication",
      name: "Who Do I Work For",
      description: "Career advocacy platform by Jackye Clayton. Evaluate employers using public records \u2014 political spending, enforcement history, lobbying, compensation data.",
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
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.15s forwards" }}
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
              opacity: 0,
              animation: "heroFadeIn 0.7s ease 0.3s forwards",
            }}
          >
            Stop applying.<br />
            <span className="text-primary">Start aligning.</span>
          </h1>

          <p
            className="text-muted-foreground max-w-[48ch] mx-auto leading-relaxed mt-6"
            style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.075rem)", opacity: 0, animation: "heroFadeIn 0.6s ease 0.6s forwards" }}
          >
            Check who you're really working for. Review an offer. Understand what the public record says. It takes 30 seconds.
          </p>

          {/* Hybrid Search / Upload */}
          <div
            className="mt-9 w-full flex justify-center"
            style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.9s forwards" }}
          >
            <HeroScanInput />
          </div>

          {/* Live Data Feed */}
          <div
            className="mt-6 w-full max-w-[560px]"
            style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.2s forwards" }}
          >
            <LiveDataFeed />
          </div>

          <p className="font-mono text-[9px] text-muted-foreground/30 mt-6 tracking-wide" style={{ opacity: 0, animation: "heroFadeIn 0.4s ease 1.4s forwards" }}>
            Federal Election Commission &middot; Securities & Exchange Commission &middot; Bureau of Labor Statistics &middot; Occupational Safety & Health Administration &middot; National Labor Relations Board &middot; Senate Lobbying Disclosures
          </p>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-scroll-left { animation: scroll-left 40s linear infinite; }
      `}</style>

      {/* TICKER */}
      <Suspense fallback={<div className="h-[36px] bg-background border-b border-border/10" />}>
        <LiveIntelligenceTicker />
      </Suspense>

      {/* 2 - HOW IT WORKS */}
      <section className="bg-card border-y border-border px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[900px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4 text-center">How It Works</p>
          <h2 className="text-h1 text-foreground text-center mb-14">
            Three steps. No ambiguity.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search or upload",
                body: "Enter a company name or upload a job offer. We pull the records.",
                link: "/offer-check",
              },
              {
                step: "02",
                title: "Read the receipts",
                body: "See the full employer dossier: political giving, enforcement records, lobbying data, leadership behavior, workforce signals, and values alignment.",
                link: "/browse",
              },
              {
                step: "03",
                title: "Make your move",
                body: "Apply, negotiate, stay, or leave with evidence, leverage, and confidence. Not hope.",
                link: "/receipts",
              },
            ].map((item) => (
              <Link key={item.step} to={item.link} className="flex flex-col no-underline group/step hover:bg-primary/[0.03] rounded-lg p-4 -m-4 transition-colors">
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
      <section className="px-6 lg:px-16 py-20 lg:py-28 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-3 text-center">The Platform</p>
          <h2 className="text-h1 text-foreground text-center mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-body-lg text-center max-w-[52ch] mx-auto mb-14">
            Six tools. One foundation: the public record.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <FileSearch className="w-6 h-6" strokeWidth={1.5} />, title: "Employer Dossiers", desc: "Forensic employer profiles: political giving, enforcement records, lobbying data, leadership behavior, workforce signals, and values alignment. All sourced. All traceable.", link: "/browse" },
              { icon: <Shield className="w-6 h-6" strokeWidth={1.5} />, title: "Offer Review", desc: "Upload an offer. Get an analysis of compensation, red flags, and leverage points, grounded in Bureau of Labor Statistics benchmarks and real company data.", link: "/offer-analysis" },
              { icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />, title: "Career Map", desc: "Track your trajectory. Understand role mobility, industry shifts, and where your skills carry the most weight, with data, not vibes.", link: "/career-map" },
              { icon: <Bell className="w-6 h-6" strokeWidth={1.5} />, title: "Watchlist & Alerts", desc: "Track companies you care about. Get notified when new signals surface: layoffs, lobbying shifts, enforcement actions, leadership changes.", link: "/dashboard" },
              { icon: <MessageCircle className="w-6 h-6" strokeWidth={1.5} />, title: "Ask Jackye", desc: "Career guidance in Jackye's voice: strategic, direct, grounded in 20 years inside talent acquisition. Not a chatbot. A career advocate.", link: "/ask-jackye" },
              { icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />, title: "State of Work", desc: "Weekly intelligence on what's happening in the world of work: policy changes, labor market shifts, and what they actually mean for your career.", link: "/receipts" },
            ].map((item) => (
              <Link key={item.title} to={item.link} className="group p-6 border border-border bg-card hover:border-primary/30 transition-all">
                <div className="text-primary mb-4 group-hover:scale-105 transition-transform">{item.icon}</div>
                <h3 className="font-sans font-bold text-foreground text-[15px] mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 - FINAL CTA */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center relative overflow-hidden border-t border-border">
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[60%] pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }} />
        <div className="relative z-[1] max-w-[600px] mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know who you work for.</p>
          <h2 className="text-h1 text-foreground mb-4">
            Facts over feelings.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[46ch] mx-auto mb-8">
            Every company you're considering has a public record. Now you know where to read it.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/offer-check")}
              className="bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
            >
              Run My Free Scan
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
