import { useState } from "react";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VerifySignalButtonProps {
  signalType: string;
  signalId?: string;
  companyId?: string;
  compact?: boolean;
}

export function VerifySignalButton({ signalType, signalId, companyId, compact = false }: VerifySignalButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to flag signals.", variant: "destructive" });
        return;
      }
      const { error } = await (supabase as any).from("signal_disputes").insert({
        user_id: user.id,
        signal_type: signalType,
        signal_id: signalId || null,
        company_id: companyId || null,
        reason: reason.trim(),
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Signal flagged", description: "Thank you. Our team will review this signal." });
      setTimeout(() => setOpen(false), 1500);
    } catch (e: any) {
      toast({ title: "Failed to submit", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <CheckCircle2 className="w-2.5 h-2.5 text-[hsl(var(--civic-green))]" />
        Flagged for review
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors"
      >
        <Flag className="w-2.5 h-2.5" />
        {!compact && "Verify This Signal"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-primary" />
              Flag Signal for Review
            </DialogTitle>
            <DialogDescription>
              If you believe this signal is incorrect, outdated, or misleading, let us know.
              Our team will review and update accordingly.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Explain why this signal may be incorrect…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
              {submitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting…</> : "Submit Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
