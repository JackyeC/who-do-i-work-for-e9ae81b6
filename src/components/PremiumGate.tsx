import { Lock, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePremium, STRIPE_TIERS } from "@/hooks/use-premium";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface PremiumGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
}

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  const { isPremium, isLoggedIn } = usePremium();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS.pro.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) return <>{children}</>;

  return (
    <Card className="border-dashed border-2 border-primary/15 bg-muted/30">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2 text-lg">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          {description || "This feature is available with a Pro account."}
        </p>
        <div className="flex items-center justify-center gap-2">
          {!isLoggedIn ? (
            <Button size="default" onClick={() => navigate("/login")}>
              Sign Up Free
            </Button>
          ) : (
            <Button size="default" onClick={handleUpgrade} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Upgrade to Pro — $29/mo
            </Button>
          )}
        </div>
        <p className="text-micro text-muted-foreground mt-4">
          Cancel anytime. Unlimited Offer Checks, alerts, and full report access.
        </p>
      </CardContent>
    </Card>
  );
}
