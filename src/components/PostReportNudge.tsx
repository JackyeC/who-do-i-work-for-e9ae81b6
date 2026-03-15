import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/use-premium";
import { useCredits } from "@/hooks/use-credits";
import { CreditPurchaseCard } from "@/components/CreditPurchaseCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Shows a bottom-of-report nudge encouraging upgrade after reading a report.
 * Hidden for subscribers.
 */
export function PostReportNudge() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { creditsRemaining } = useCredits();
  const navigate = useNavigate();

  // Don't show for paid subscribers
  if (isPremium) return null;

  return (
    <div className="border border-border bg-card p-6 lg:p-8 mt-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-5 h-5 text-primary" />
        </div>

        {user ? (
          <>
            <h3 className="font-serif text-lg text-foreground mb-1">
              {creditsRemaining > 0
                ? `You have ${creditsRemaining} report${creditsRemaining === 1 ? "" : "s"} remaining`
                : "You've used your free report"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Unlock unlimited access or grab a report pack.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Button
                onClick={() => navigate("/pricing")}
                className="gap-1.5 font-mono text-xs tracking-wider uppercase"
              >
                View Plans <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <CreditPurchaseCard variant="inline" message="Or buy report credits:" />
          </>
        ) : (
          <>
            <h3 className="font-serif text-lg text-foreground mb-1">
              Want the full picture?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign up free for your first full report, or unlock this one for $4.99.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="gap-1.5 font-mono text-xs tracking-wider uppercase"
            >
              Get Started <ArrowRight className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
