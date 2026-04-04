import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { Button } from "@/components/ui/button";
import { Shield, Check, Loader2, FileSearch, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Tier data ─── */
const TIERS = [
  {
    id: "curious",
    name: "The Check",
    tagline: "Know before you sign.",
    outcome: "Search any company. See the public record. Read the receipts. Decide if you want the full picture.",
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthly: 0,
    annualSavings: 0,
    monthlyPriceId: null,
    annualPriceId: null,
    features: [
      "Search any company — see Employer Clarity Score",
      "Read The Receipts (investigations)",
      "Live signal feed with source labels",
      "Workplace DNA quiz",
      "1 AI job-link audit per month",
    ],
    cta: "Start Free",
    badge: null,
    highlight: false,
    free: true,
  },
  {
    id: "signal",
    name: "The Signal",
    tagline: "I'm actively looking.",
    outcome: "Full dossiers. Comp data. Interview prep. Values matching. Everything you need before you apply or accept.",
    monthlyPrice: 49,
    annualPrice: 399,
    annualMonthly: 33,
    annualSavings: 189,
    monthlyPriceId: "price_1TEEvt89MyCOs8yv7SV1TeUJ",
    annualPriceId: "price_1TF2Wd89MyCOs8yv0GXHpkUE",
    features: [
      "Full company dossiers — all signals unlocked",
      "Unlimited AI job-link audits",
      "Values alignment scoring",
      "Compensation benchmarks (BLS data)",
      "Interview intelligence brief",
      "Side-by-side company comparisons",
      "Weekly Signal Alerts",
      "Cover letter generation",
    ],
    cta: "Get The Signal",
    badge: null,
    highlight: false,
    free: false,
  },
  {
    id: "match",
    name: "The Match",
    tagline: "Find me my job.",
    outcome: "Auto-matched jobs. Application tracking. Priority alerts. We do the searching — you do the deciding.",
    monthlyPrice: 149,
    annualPrice: 1199,
    annualMonthly: 100,
    annualSavings: 589,
    monthlyPriceId: "price_1TEEw589MyCOs8yvQI8FpHJx",
    annualPriceId: "price_1TEEw589MyCOs8yvQI8FpHJx",
    features: [
      "Everything in The Signal, plus:",
      "Smart job matching — jobs delivered to you",
      "Auto-apply queue with one-click send",
      "Application tracking dashboard",
      "Priority signal alerts",
      "Full career mapping + 5-year trajectory",
      "Downloadable PDF dossiers",
      "Negotiation simulator access",
    ],
    cta: "Get The Match",
    badge: "Most Popular",
    highlight: true,
    free: false,
  },
];

/* ─── User moment framing ─── */
const MOMENTS = [
  {
    moment: "You're interviewing next week.",
    need: "You need to know what the public record says about the company before you walk in. The Signal gives you the full dossier.",
  },
  {
    moment: "You just got an offer.",
    need: "You need compensation benchmarks, enforcement history, and leverage points. The Closer gives you a one-time deep-dive.",
  },
  {
    moment: "You're deciding whether to stay or leave.",
    need: "You need to compare your current employer against the market. The Match tracks the landscape for you.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useClerkWithFallback();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  usePageSEO({
    title: "Pricing — Know Before You Sign",
    description:
      "From a free employer check to full career intelligence. See what's included at every level — and why it matters before you apply, interview, or accept.",
    path: "/pricing",
    jsonLd: {
      "@type": "WebPage",
      name: "Pricing — Who Do I Work For",
      description: "Career intelligence plans: Free, The Signal ($49/mo), The Match ($149/mo), The Closer ($199 one-time).",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "Offer", name: "The Check", price: "0", priceCurrency: "USD" },
          { "@type": "Offer", name: "The Signal", price: "49", priceCurrency: "USD" },
          { "@type": "Offer", name: "The Match", price: "149", priceCurrency: "USD" },
          { "@type": "Offer", name: "The Closer", price: "199", priceCurrency: "USD" },
        ],
      },
    },
  });

  const handleCheckout = async (tier: (typeof TIERS)[number]) => {
    if (tier.free) {
      navigate("/join");
      return;
    }

    if (!user) {
      toast("Sign in to subscribe");
      navigate("/login");
      return;
    }

    const priceId = isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
    if (!priceId || priceId.includes("placeholder")) {
      toast("Coming soon — check back soon!");
      return;
    }

    setLoadingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
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
    <main className="flex-1">
      {/* ── HERO ── */}
      <section className="px-6 lg:px-16 pt-16 pb-6 max-w-3xl mx-auto text-center">
        <p
          className="text-[10px] uppercase tracking-[0.35em] font-semibold mb-4"
          style={{ color: "hsl(var(--primary))", fontFamily: "'DM Mono', monospace" }}
        >
          Pricing
        </p>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground mb-3">
          Pick the plan that matches your moment.
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Browsing? Interviewing? Deciding? Every level gives you more of the picture — the one companies don't put in the job description.
        </p>
      </section>

      {/* ── BILLING TOGGLE ── */}
      <div className="flex items-center justify-center gap-0 pb-10">
        <button
          onClick={() => setIsAnnual(false)}
          className={cn(
            "px-5 py-2.5 text-sm font-medium rounded-l-full border transition-colors",
            !isAnnual
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={cn(
            "px-5 py-2.5 text-sm font-medium rounded-r-full border border-l-0 transition-colors flex items-center gap-2",
            isAnnual
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

      {/* ── PRICING CARDS ── */}
      <section className="px-6 lg:px-16 pb-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const displayPrice = tier.free ? 0 : isAnnual ? tier.annualMonthly : tier.monthlyPrice;
            const isLoading = loadingTier === tier.id;

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative flex flex-col border bg-card p-6 transition-shadow",
                  tier.highlight
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border/50"
                )}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-black text-foreground tracking-tight">{tier.name}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5">{tier.tagline}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">${displayPrice}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                  {!tier.free && isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${tier.annualPrice}/yr billed annually · save ${tier.annualSavings}
                    </p>
                  )}
                  {!tier.free && !isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
                  )}
                  {tier.free && (
                    <p className="text-xs text-muted-foreground mt-1">Free forever</p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{tier.outcome}</p>

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
                  variant={tier.highlight ? "default" : "outline"}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── THE CLOSER — one-time deep-dive ── */}
      <section className="px-6 lg:px-16 pb-16">
        <div className="max-w-[800px] mx-auto">
          <div className="border border-primary/30 bg-primary/5 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <FileSearch className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-black text-foreground tracking-tight">The Closer</h3>
                  <span
                    className="text-[10px] tracking-wider uppercase text-primary px-2 py-0.5 border border-primary/20"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    One-time
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-lg">
                  You've got the offer. Now get the full picture. A deep-dive dossier on one company —
                  leadership, political spending, comp benchmarks, workforce stability,
                  and everything the public record reveals. Yours to keep as a PDF.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Full company dossier with citations",
                    "Executive leadership + donation map",
                    "Compensation benchmarks vs. market",
                    "OSHA, NLRB, WARN Act history",
                    "Interview intelligence brief",
                    "Downloadable PDF — yours to keep",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center lg:text-right shrink-0">
                <div className="flex items-baseline gap-1 justify-center lg:justify-end">
                  <span className="text-4xl font-black text-foreground">$199</span>
                  <span className="text-muted-foreground text-sm">one-time</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-4">No subscription required</p>
                <Button
                  onClick={() => {
                    toast("The Closer launches soon — check back!");
                  }}
                  className="w-full lg:w-auto"
                >
                  Get The Closer
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY THIS PLAN — user moments ── */}
      <section className="px-6 lg:px-16 pb-16">
        <div className="max-w-[640px] mx-auto">
          <h2
            className="text-[10px] uppercase tracking-[0.35em] font-semibold mb-8 text-center"
            style={{ color: "hsl(var(--primary))", fontFamily: "'DM Mono', monospace" }}
          >
            Which moment are you in?
          </h2>
          <div className="space-y-6">
            {MOMENTS.map((m, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="font-mono text-xs text-primary mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm text-foreground font-semibold mb-1">{m.moment}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.need}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST FOOTER ── */}
      <section className="px-6 lg:px-16 pb-16">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="bg-card border border-primary/20 p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span
                className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Our Guarantee
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Not satisfied? Full refund within 7 days — no questions asked.
              All payments processed securely through Stripe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
