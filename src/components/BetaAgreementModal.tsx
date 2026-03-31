import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Bot } from "lucide-react";
import { useBetaAgreement } from "@/hooks/use-beta-agreement";
import { useAuth } from "@/contexts/AuthContext";

export function BetaAgreementModal() {
  const { user } = useAuth();
  const { needsAgreement, isLoading, acceptAgreement, isPending } = useBetaAgreement();

  if (!user || isLoading || !needsAgreement) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Private Beta Agreement
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2 space-y-3">
            <p>
              Welcome to the private preview of <span className="font-semibold text-foreground">Who Do I Work For?</span>
            </p>

            {/* TRAIGA-Compliant AI Disclosure — Clear and Conspicuous */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
              <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-foreground leading-snug">
                Who Do I Work For uses artificial intelligence to analyze company data, match you with opportunities, and draft application materials on your behalf. <span className="text-primary font-semibold">You are the final decision-maker.</span> No application is ever submitted without your explicit approval.
              </p>
            </div>

            <p>
              By entering, you agree that this is a <span className="font-semibold text-foreground">private preview</span>, the data is for testing only, and you will not share screenshots or information publicly.
            </p>
            <p className="text-xs text-muted-foreground">
              All platform data is sourced from publicly available records and is provided for educational purposes only. This is not legal or financial advice. Artificial intelligence outputs are informational signals, not verified findings.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-3">
          <Button
            onClick={() => acceptAgreement()}
            disabled={isPending}
            className="w-full gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {isPending ? "Accepting…" : "I Understand — Enter Beta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
