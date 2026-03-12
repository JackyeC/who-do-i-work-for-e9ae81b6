import { Lock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium, STRIPE_TIERS } from "@/hooks/use-premium";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface DossierPaywallProps {
  companyId: string;
  companyName: string;
  layerIndex?: number;
}

export function DossierPaywall({ companyId, companyName, layerIndex }: DossierPaywallProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, dossierLayers } = usePremium();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent p-8 text-center">
      <div className="absolute inset-0 backdrop-blur-[2px] rounded-2xl" />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Unlock Deeper Intelligence
        </h3>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
          {tier === "free"
            ? `Upgrade to see all 7 dossier layers for ${companyName}. Free accounts see the first ${dossierLayers} layers.`
            : `This layer requires a Professional plan to access.`}
        </p>

        {!user ? (
          <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
            Sign Up to Get Started
          </Button>
        ) : tier === "free" ? (
          <Button
            size="lg"
            onClick={() => handleSubscribe(STRIPE_TIERS.candidate.price_id)}
            disabled={checkoutLoading}
            className="gap-2"
          >
            {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Upgrade to Candidate — $29/mo
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => handleSubscribe(STRIPE_TIERS.professional.price_id)}
            disabled={checkoutLoading}
            className="gap-2"
          >
            {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Upgrade to Professional — $99/mo
          </Button>
        )}

        <div className="mt-6 flex items-center justify-center gap-6 text-micro text-muted-foreground">
          <span>Candidate $29/mo · 10 scans</span>
          <span>Professional $99/mo · 50 scans</span>
        </div>
      </div>
    </div>
  );
}
