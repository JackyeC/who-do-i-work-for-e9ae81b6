import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { Button } from "@/components/ui/button";
import { Shield, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "brief",
    name: "The Brief",
    tagline: "Full intelligence. Full access.",
    description: "The complete picture on any employer. Priority access to Jackye.",
    monthlyPrice: 99,
    annualPrice: 950,
    annualMonthly: 79,
    annualSavings: 238,
    monthlyPriceId: "price_brief_monthly_placeholder",
    annualPriceId: "price_brief_annual_placeholder",
    features: [
      "Everything in The Analyst",
      "Full employer intelligence dossier",
      "Monthly 30-min 1-on-1 with Jackye",
      "Apply When It Counts placement support",
      "Priority signal alerts",
      "Ask Jackye — unlimited questions",
    ],
    cta: "Get The Brief",
    badge: null,
    highlight: false,
    free: false,
  },
  {
    id: "analyst",
    name: "The Analyst",
    tagline: "Your AI career intelligence team.",
    description: "Unlimited audits. Real-time signals. Know more than the recruiter does.",
    monthlyPrice: 29,
    annualPrice: 278,
    annualMonthly: 23,
    annualSavings: 70,
    monthlyPriceId: "price_analyst_monthly_placeholder",
    annualPriceId: "price_analyst_annual_placeholder",
    features: [
      "Everything in The Check",
      "Unlimited AI job-link audits",
      "Values alignment scoring",
      "Real-time employer signal alerts",
      "Ask Jackye — 3 questions/month",
      "Early access to new W? features",
    ],
    cta: "Become an Analyst",
    badge: "Most Popular",
    highlight: true,
    free: false,
  },
  {
    id: "check",
    name: "The Check",
    tagline: "Know before you sign.",
    description: "Run your first employer audit. Free, forever.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthly: 0,
    annualSavings: 0,
    monthlyPriceId: null,
    annualPriceId: null,
    features: [
      "Workplace DNA Calibration",
      "Public Intelligence Dashboard",
      "1 AI job-link audit/month",
      "Monday Momentum newsletter",
      "Follow Jackye on LinkedIn & YouTube",
    ],
    cta: "Start Free",
    badge: null,
    highlight: false,
    free: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  usePageSEO({
    title: "Pricing — Who Do I Work For?",
    description:
      "Three plans for every stage of your career intelligence journey. The Check (Free), The Analyst ($29/mo), The Brief ($99/mo).",
    path: "/pricing",
    jsonLd: {
      "@type": "WebPage",
      name: "Pricing — Who Do I Work For?",
      description: "Three plans for every stage of your career intelligence journey.",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "Offer", name: "The Check", price: "0", priceCurrency: "USD" },
          { "@type": "Offer", name: "The Analyst", price: "29", priceCurrency: "USD" },
          { "@type": "Offer", name: "The Brief", price: "99", priceCurrency: "USD" },
        ],
      },
    },
  });

  const handleCheckout = async (tier: (typeof TIERS)[number]) => {
    if (tier.free) {
      navigate("/join");
      return;
    }

    const priceId = billing === "annual" ? tier.annualPriceId : tier.monthlyPriceId;
    if (!priceId || priceId.includes("placeholder")) {
      toast("Coming soon — check back soon!");
      return;
    }

    setLoadingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, mode: "subscription" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 lg:px-16 py-4 w-full">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center shrink-0">
            <span style={{ fontFamily: "Inter,sans-serif", fontWeight: 900, letterSpacing: "-0.03em", fontSize: "26px" }}>
              <span style={{ color: "#111111" }}>W</span>
              <span style={{ color: "#F0C040" }}>?</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {!authLoading && isLoaded && (
              user ? (
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="font-sans text-btn">
                  Dashboard
                </Button>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} className="font-sans text-nav text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </button>
                  <Button size="sm" onClick={() => navigate("/login")} className="font-sans text-btn rounded-full px-5">
                    Get started
                  </Button>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 lg:px-16 pt-16 pb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
            Choose Your Intelligence Level
          </h1>
          <p className="text-muted-foreground max-w-[520px] mx-auto text-base">
            From your first employer audit to full career intelligence — pick the plan that fits your search.
          </p>
        </section>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 pb-10">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-l-full border transition-colors",
              billing === "monthly"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-r-full border border-l-0 transition-colors flex items-center gap-2",
              billing === "annual"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Annual
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <section className="px-6 lg:px-16 pb-16">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const displayPrice = tier.free
                ? 0
                : billing === "annual"
                ? tier.annualMonthly
                : tier.monthlyPrice;
              const isLoading = loadingTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className={cn(
                    "relative flex flex-col rounded-xl border bg-card p-6 lg:p-8 transition-shadow",
                    tier.highlight
                      ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border"
                  )}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{tier.tagline}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${displayPrice}
                      </span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                    {!tier.free && billing === "annual" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${tier.annualPrice}/yr billed annually · save ${tier.annualSavings}
                      </p>
                    )}
                    {tier.free && (
                      <p className="text-xs text-muted-foreground mt-1">Free forever</p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleCheckout(tier)}
                    disabled={isLoading}
                    className={cn(
                      "w-full",
                      tier.highlight
                        ? ""
                        : tier.free
                        ? "variant-outline"
                        : ""
                    )}
                    variant={tier.free ? "outline" : "default"}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      tier.cta
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust footer */}
        <section className="px-6 lg:px-16 pb-16">
          <div className="max-w-[640px] mx-auto text-center">
            <div className="bg-card border border-primary/20 p-6 lg:p-8 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-mono text-sm tracking-[0.15em] uppercase text-primary font-semibold">Our Guarantee</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Not satisfied? We'll refund your purchase within 7 days — no questions asked.
                All payments processed securely through Stripe.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-16 py-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1">
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
                <span style={{ color: '#111111' }}>W</span>
                <span style={{ color: '#F0C040' }}>?</span>
              </span>
              <span className="text-sm text-muted-foreground"> · by Jackye Clayton</span>
            </div>
            <div className="flex gap-6">
              <a href="/privacy" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="/methodology" className="font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">Methodology</a>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4">
            <p className="font-mono text-xs tracking-wider text-muted-foreground/60 leading-relaxed max-w-[800px]">
              WDIWF reports publicly available data and does not provide character assessments, legal advice, or employment recommendations. All signals are sourced from public records and verified watchdog databases.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
