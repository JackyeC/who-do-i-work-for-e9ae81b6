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
    <Card className="border-dashed border-2 border-primary/20">
      <CardContent className="p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description || "This feature is available with a premium account."}
        </p>
        <div className="flex items-center justify-center gap-2">
          {!isLoggedIn ? (
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign Up Free
            </Button>
          ) : (
            <Button size="sm" disabled className="gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Coming Soon
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Premium features are coming soon. Sign up now to be first in line.
        </p>
      </CardContent>
    </Card>
  );
}
