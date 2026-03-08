import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePremium } from "@/hooks/use-premium";
import { useNavigate } from "react-router-dom";

interface PremiumGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
}

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  const { isPremium, isLoggedIn } = usePremium();
  const navigate = useNavigate();

  if (isPremium) return <>{children}</>;

  return (
    <Card className="border-dashed border-2 border-primary/15 bg-muted/30">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2 text-lg">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          {description || "This feature is available with a premium account."}
        </p>
        <div className="flex items-center justify-center gap-2">
          {!isLoggedIn ? (
            <Button size="default" onClick={() => navigate("/login")}>
              Sign Up Free
            </Button>
          ) : (
            <Button size="default" disabled className="gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Coming Soon
            </Button>
          )}
        </div>
        <p className="text-micro text-muted-foreground mt-4">
          Premium features are coming soon. Sign up now to be first in line.
        </p>
      </CardContent>
    </Card>
  );
}
