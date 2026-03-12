import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/hooks/use-premium";
import { toast } from "sonner";
import { useState } from "react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    priceId: null,
    features: [
      { label: "3 company scans/mo", included: true },
      { label: "Government data only (FEC, contracts)", included: true },
      { label: "Top 3 dossier layers", included: true },
      { label: "1 offer check", included: true },
      { label: "5 Ask Jackye questions/mo", included: true },
      { label: "Full Firecrawl scans", included: false },
      { label: "Dossier export", included: false },
      { label: "Influence chain & EVP audit", included: false },
    ],
    popular: false,
    cta: "Get Started Free",
  },
  {
    name: "Candidate",
    price: "$29",
    period: "/mo",
    priceId: STRIPE_TIERS.candidate.price_id,
    features: [
      { label: "10 company scans/mo", included: true },
      { label: "Full scans (govt + web intelligence)", included: true },
      { label: "All 7 dossier layers", included: true },
      { label: "5 offer checks/mo", included: true },
      { label: "30 Ask Jackye questions/mo", included: true },
      { label: "Track & alert on companies", included: true },
      { label: "Dossier export", included: false },
      { label: "Influence chain & EVP audit", included: false },
    ],
    popular: true,
    cta: "Get Candidate",
  },
  {
    name: "Professional",
    price: "$99",
    period: "/mo",
    priceId: STRIPE_TIERS.professional.price_id,
    features: [
      { label: "50 company scans/mo", included: true },
      { label: "Full scans (govt + web intelligence)", included: true },
      { label: "All 7 dossier layers", included: true },
      { label: "20 offer checks/mo", included: true },
      { label: "100 Ask Jackye questions/mo", included: true },
      { label: "Track & alert on companies", included: true },
      { label: "Dossier export (PDF)", included: true },
      { label: "Influence chain & EVP audit", included: true },
    ],
    popular: false,
    cta: "Get Professional",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (priceId: string | null, tierName: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!priceId) {
      navigate("/dashboard");
      return;
    }
    setLoadingTier(tierName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
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
        <div className="text-center mb-16">
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

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 flex flex-col relative ${
                tier.popular
                  ? "border-primary bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                  : "border-border/40 bg-card"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
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
                onClick={() => handleCheckout(tier.priceId, tier.name)}
                disabled={loadingTier === tier.name}
              >
                {loadingTier === tier.name ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

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
