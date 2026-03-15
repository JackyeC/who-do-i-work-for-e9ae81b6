import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/use-premium";
import { useCredits } from "@/hooks/use-credits";
import { CreditPurchaseCard } from "@/components/CreditPurchaseCard";
import { SignupModal } from "@/components/SignupModal";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportTeaserGateProps {
  children: ReactNode;
  teaser: ReactNode;
  companyName?: string;
}

export function ReportTeaserGate({ children, teaser, companyName }: ReportTeaserGateProps) {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { hasCredits } = useCredits();
  const [showSignup, setShowSignup] = useState(false);

  if (isPremium || hasCredits) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="mb-4">{teaser}</div>

      <div className="relative">
        <div className="blur-[6px] pointer-events-none select-none max-h-[400px] overflow-hidden">
          {children}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background flex flex-col items-center justify-end pb-8">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              Unlock the full {companyName ? `${companyName} ` : ""}report
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              See all signals, connection chains, workforce data, and Jackye's Take.
            </p>

            {user ? (
              <CreditPurchaseCard variant="inline" message="Choose a plan:" />
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowSignup(true)}
                  className="w-full gap-1.5 font-mono text-xs tracking-wider uppercase"
                >
                  Unlock Report Free
                </Button>
                <p className="text-xs text-muted-foreground">
                  Or unlock this report for just $4.99
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SignupModal
        open={showSignup}
        onOpenChange={setShowSignup}
        headline={`Unlock the full ${companyName || ""} report`.trim()}
        subtext="No credit card required. Your first report is free."
      />
    </div>
  );
}
