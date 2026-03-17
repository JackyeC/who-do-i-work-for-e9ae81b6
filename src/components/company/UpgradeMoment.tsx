import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/use-premium";
import { useCredits } from "@/hooks/use-credits";
import { CreditPurchaseCard } from "@/components/CreditPurchaseCard";
import { SignupModal } from "@/components/SignupModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface UpgradeMomentProps {
  companyName: string;
}

export function UpgradeMoment({ companyName }: UpgradeMomentProps) {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { hasCredits } = useCredits();
  const [showSignup, setShowSignup] = useState(false);

  if (isPremium || hasCredits) return null;

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-6 text-center max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-foreground mb-2">
          See more of what's knowable before you decide.
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 text-left mb-5 mx-auto max-w-sm">
          <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/40">
            Additional signals and recurring patterns
          </li>
          <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/40">
            Source-level detail and evidence links
          </li>
          <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/40">
            Deeper context and interpretation
          </li>
        </ul>

        {user ? (
          <CreditPurchaseCard variant="inline" message="Choose a plan to unlock:" />
        ) : (
          <>
            <Button
              onClick={() => setShowSignup(true)}
              className="font-mono text-xs tracking-wider uppercase"
            >
              Unlock Full Intelligence
            </Button>
            <SignupModal
              open={showSignup}
              onOpenChange={setShowSignup}
              headline={`Unlock the full ${companyName} report`}
              subtext="No credit card required. Your first report is free."
            />
          </>
        )}
      </div>
    </div>
  );
}
