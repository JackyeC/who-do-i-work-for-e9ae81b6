import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePremium, STRIPE_TIERS } from "@/hooks/use-premium";
import { useNavigate } from "react-router-dom";

interface PremiumGateProps {
  feature: string;
  description?: string;
  requiredTier?: "candidate" | "professional";
  children: React.ReactNode;
}

export function PremiumGate({ feature, description, requiredTier = "candidate", children }: PremiumGateProps) {
  const { tier, isLoggedIn } = usePremium();
  const navigate = useNavigate();
  

  const tierRank = { free: 0, candidate: 1, professional: 2 };
  const hasAccess = tierRank[tier] >= tierRank[requiredTier];

  if (hasAccess) return <>{children}</>;

  const targetTier = requiredTier === "professional" ? STRIPE_TIERS.professional : STRIPE_TIERS.candidate;

  const handleUpgrade = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate("/pricing");
  };

  return (
    <Card className="border-dashed border-2 border-primary/15 bg-muted/30">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2 text-lg">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          {description || `This feature requires a ${targetTier.label} plan.`}
        </p>
        <div className="flex items-center justify-center gap-2">
          {!isLoggedIn ? (
            <Button size="default" onClick={() => navigate("/login")}>
              Sign Up Free
            </Button>
          ) : (
            <Button size="default" onClick={handleUpgrade} className="gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Upgrade to {targetTier.label} — {targetTier.price}
            </Button>
          )}
        </div>
        <p className="text-micro text-muted-foreground mt-4">
          Candidate $29/mo · Professional $99/mo
        </p>
      </CardContent>
    </Card>
  );
}
