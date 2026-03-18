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
  variant?: "card" | "blur";
  /** Dynamic CTA for blur variant */
  blurCta?: string;
}

export function PremiumGate({ feature, description, requiredTier = "candidate", children, variant = "card", blurCta }: PremiumGateProps) {
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

  // Blur variant: show blurred content with overlay CTA
  if (variant === "blur") {
    return (
      <div className="relative overflow-hidden rounded-lg">
        {/* Blurred content underneath */}
        <div className="select-none pointer-events-none" aria-hidden="true">
          {children}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg backdrop-blur-[8px] bg-background/40 border border-primary/10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-foreground font-medium text-center max-w-xs px-4 leading-relaxed">
            {blurCta || `This deep-dive found new signals. Unlock to see what changed.`}
          </p>
          {!isLoggedIn ? (
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign Up Free
            </Button>
          ) : (
            <Button size="sm" onClick={handleUpgrade} className="gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Upgrade to {targetTier.label} — {targetTier.price}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
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
