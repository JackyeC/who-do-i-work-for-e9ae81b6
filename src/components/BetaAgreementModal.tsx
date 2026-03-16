import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
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
            <p>
              By entering, you agree that this is a <span className="font-semibold text-foreground">private preview</span>, the data is for testing only, and you will not share screenshots or information publicly.
            </p>
            <p className="text-xs text-muted-foreground">
              All platform data is sourced from publicly available records and is provided for educational purposes only. This is not legal or financial advice.
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
            {isPending ? "Accepting…" : "I Agree — Enter Beta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
