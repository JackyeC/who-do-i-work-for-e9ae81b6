import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditPurchaseCard } from "@/components/CreditPurchaseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Loader2, X, Building2, Mail, Users, TrendingUp, Search, Briefcase, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/hooks/use-premium";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    persona: "Job Seekers & Employees",
    personaIcon: Search,
    price: "$0",
    priceAnnual: "$0",
    period: "",
    periodAnnual: "",
    priceId: null,
    priceIdAnnual: null,
    features: [
      { label: "3 company scans/mo", included: true },
      { label: "Government data only (FEC, contracts)", included: true },
      { label: "Top 3 dossier layers", included: true },
      { label: "1 offer check", included: true },
      { label: "5 Ask Jackye questions/mo", included: true },
      { label: "Full Firecrawl scans", included: false },
      { label: "Dossier export", included: false },
      { label: "Employer Promise audit & influence chain", included: false },
    ],
    popular: false,
    cta: "Get Started Free",
  },
  {
    name: "Candidate",
    persona: "Recruiters & HR Buyers",
    personaIcon: Users,
    price: "$29",
    priceAnnual: "$24",
    period: "/mo",
    periodAnnual: "/mo",
    annualBilled: "Billed $290/yr",
    savings: "Save $58/yr",
    priceId: STRIPE_TIERS.candidate.price_id,
    priceIdAnnual: STRIPE_TIERS.candidate.price_id_annual,
    features: [
      { label: "10 company scans/mo", included: true },
      { label: "Full scans (govt + web intelligence)", included: true },
      { label: "All 7 dossier layers", included: true },
      { label: "5 offer checks/mo", included: true },
      { label: "30 Ask Jackye questions/mo", included: true },
      { label: "Track & alert on companies", included: true },
      { label: "Dossier export", included: false },
      { label: "Employer Promise audit & influence chain", included: false },
    ],
    popular: true,
    cta: "Start 7-Day Free Trial",
  },
  {
    name: "Professional",
    persona: "Journalists & Analysts",
    personaIcon: TrendingUp,
    price: "$99",
    priceAnnual: "$83",
    period: "/mo",
    periodAnnual: "/mo",
    annualBilled: "Billed $990/yr",
    savings: "Save $198/yr",
    priceId: STRIPE_TIERS.professional.price_id,
    priceIdAnnual: STRIPE_TIERS.professional.price_id_annual,
    features: [
      { label: "50 company scans/mo", included: true },
      { label: "Full scans (govt + web intelligence)", included: true },
      { label: "All 7 dossier layers", included: true },
      { label: "20 offer checks/mo", included: true },
      { label: "100 Ask Jackye questions/mo", included: true },
      { label: "Track & alert on companies", included: true },
      { label: "Dossier export (PDF)", included: true },
      { label: "Employer Promise audit & influence chain", included: true },
    ],
    popular: false,
    cta: "Get Professional",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  const isAnnual = billingInterval === "annual";

  const handleCheckout = async (priceId: string | null, priceIdAnnual: string | null, tierName: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const selectedPriceId = isAnnual && priceIdAnnual ? priceIdAnnual : priceId;
    if (!selectedPriceId) {
      navigate("/dashboard");
      return;
    }
    setLoadingTier(tierName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: selectedPriceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 text-xs font-mono uppercase tracking-wider">
            Simple Pricing
          </Badge>
          <h1 className="text-heading-1 font-bold text-foreground mb-4">
            Know Who You Work For. See the Receipts.
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sign up free to start scanning companies. Upgrade when you need deeper intelligence.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              !isAnnual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("annual")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
              isAnnual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <Badge className="absolute -top-2.5 -right-12 text-[9px] bg-green-500 text-white border-0">
              SAVE 17%
            </Badge>
          </button>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => {
            const Icon = tier.personaIcon;
            return (
              <div
                key={tier.name}
                className={cn(
                  "rounded-2xl border p-8 flex flex-col relative",
                  tier.popular
                    ? "border-primary bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-card"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                    Most Popular
                  </Badge>
                )}

                {/* Persona tag */}
                <div className="flex items-center gap-1.5 mb-4">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    {tier.persona}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-mono text-foreground">
                      {isAnnual ? tier.priceAnnual : tier.price}
                    </span>
                    {(isAnnual ? tier.periodAnnual : tier.period) && (
                      <span className="text-muted-foreground">
                        {isAnnual ? tier.periodAnnual : tier.period}
                      </span>
                    )}
                  </div>
                  {isAnnual && tier.annualBilled && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{tier.annualBilled}</span>
                      <Badge variant="secondary" className="text-[10px] text-green-600 bg-green-500/10 border-green-500/20">
                        {tier.savings}
                      </Badge>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2.5 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={tier.popular ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleCheckout(tier.priceId, tier.priceIdAnnual ?? null, tier.name)}
                  disabled={loadingTier === tier.name}
                >
                  {loadingTier === tier.name ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {tier.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Founding Partner — Primary Employer CTA */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-6 ring-1 ring-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[10px] tracking-wider uppercase px-4 py-1">
            Limited to 50 Partners
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                Founding Partner
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Gold Shield</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Claim your profile, get the 3-point transparency audit by Jackye, and receive 5 job credits. Move to the top of the feed.
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">$599</span>
                <span className="text-muted-foreground">/yr</span>
                <span className="text-sm text-muted-foreground line-through ml-2">$1,200/yr</span>
                <Badge variant="secondary" className="text-[10px] text-green-600 bg-green-500/10 border-green-500/20">
                  50% OFF
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Includes 5 job credits ($199 value each) · 30-day auto-expiry on listings</p>
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2"
            onClick={() => handleCheckout(STRIPE_TIERS.founding_partner.price_id, null, "Founding Partner")}
            disabled={loadingTier === "Founding Partner"}
          >
            {loadingTier === "Founding Partner" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Become a Founding Partner
          </Button>
        </div>

        {/* Standard Employer Certification */}
        <div className="rounded-2xl border border-amber-500/30 bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-6 ring-1 ring-amber-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                Employer Certification
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Standard</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Claim your profile, respond to insights, and earn Certified status. 1 job credit included.
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">$499</span>
                <span className="text-muted-foreground">/yr</span>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => handleCheckout(STRIPE_TIERS.employer_certification.price_id, null, "Employer Certification")}
            disabled={loadingTier === "Employer Certification"}
          >
            {loadingTier === "Employer Certification" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Get Certified
          </Button>
        </div>

        {/* Enterprise CTA */}
        <div className="rounded-2xl border border-border/40 bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Enterprise & Teams</h3>
              <p className="text-sm text-muted-foreground">
                Multi-seat access, API integration, dedicated support, and custom SLAs for HR departments and recruiting firms.
              </p>
            </div>
          </div>
          <Button variant="outline" size="lg" className="shrink-0 gap-2" asChild>
            <a href="mailto:enterprise@whodoinworkfor.com">
              <Mail className="w-4 h-4" />
              Contact Sales
            </a>
          </Button>
        </div>

        {/* Credit Packs */}
        <div className="max-w-md mx-auto mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Just need one report?</h2>
            <p className="text-sm text-muted-foreground">Buy scan credits — no subscription required.</p>
          </div>
          <CreditPurchaseCard />
        </div>

        {/* Social Proof */}
        <div className="text-center mb-10">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by professionals from
          </p>
          <div className="flex items-center justify-center gap-8 text-muted-foreground/50 text-sm font-medium">
            <span>Fortune 500 HR</span>
            <span className="text-border">|</span>
            <span>Investigative Journalism</span>
            <span className="text-border">|</span>
            <span>Recruiting Agencies</span>
            <span className="text-border">|</span>
            <span>Career Coaches</span>
          </div>
        </div>

        {/* Data Integrity */}
        <div className="rounded-2xl bg-muted/40 border border-border/30 px-8 py-6 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Data Integrity</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our data is sourced directly from FEC, USASpending, and SEC filings.
            We provide the receipts so you can verify the facts.
            No anonymous tips, no "feelings" — just intelligence.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
