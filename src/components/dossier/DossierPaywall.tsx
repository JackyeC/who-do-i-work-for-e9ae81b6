import { Lock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/hooks/use-premium";
import { toast } from "sonner";
import { useState } from "react";

interface DossierPaywallProps {
  companyId: string;
  companyName: string;
}

export function DossierPaywall({ companyId, companyName }: DossierPaywallProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, isAtCapacity, trackCompany, slotsRemaining } = useTrackedCompanies();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleTrack = () => {
    trackCompany.mutate(companyId);
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS.starter.price_id },
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
          Unlock the Full Intelligence Dossier
        </h3>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
          Track <strong>{companyName}</strong> to access all 7 layers — Innovation, Ecosystem,
          Influence Receipts, Patterns, Talent Context, and Values Filters.
        </p>

        {!user ? (
          <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
            Sign Up to Get Started
          </Button>
        ) : !isPremium ? (
          <Button size="lg" onClick={handleSubscribe} disabled={checkoutLoading} className="gap-2">
            {checkoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Subscribe — Starting at $29/mo
          </Button>
        ) : isAtCapacity ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">
              All slots are in use. Untrack a company to free a slot.
            </p>
            <Button size="lg" variant="outline" onClick={() => navigate("/dashboard?tab=tracked")}>
              Manage Tracked Companies
            </Button>
          </div>
        ) : (
          <Button size="lg" onClick={handleTrack} disabled={trackCompany.isPending} className="gap-2">
            {trackCompany.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Track This Company ({slotsRemaining} slots remaining)
          </Button>
        )}

        <div className="mt-6 flex items-center justify-center gap-6 text-micro text-muted-foreground">
          <span>Starter $29/mo · 3 companies</span>
          <span>Pro $250/mo · 25 companies</span>
          <span>Team $800/mo · 100 companies</span>
        </div>
      </div>
    </div>
  );
}
