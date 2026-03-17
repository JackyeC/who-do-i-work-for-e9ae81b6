import { useState } from "react";
import { Shield, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PremiumSourceGateProps {
  /** What the link leads to, e.g. "FEC filing for Amazon PAC" */
  sourceLabel: string;
  /** The actual URL (only shown to premium users) */
  sourceUrl: string;
  children: React.ReactNode;
}

export function PremiumSourceGate({ sourceLabel, sourceUrl, children }: PremiumSourceGateProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  // For now, gate is shown to free users (no subscription check — can be enhanced)

  const handleClick = (e: React.MouseEvent) => {
    // If user has premium, allow through (placeholder — always gate for now unless logged in)
    if (user) return; // Let link work normally for logged-in users
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <span onClick={handleClick} className="cursor-pointer">
        {children}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
              Unlock the Receipts
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Direct links to FEC filings, board records, and primary source documents are available in the Professional Intelligence tier.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Source:</span> {sourceLabel}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Maybe Later</Button>
            <Button onClick={() => { setOpen(false); navigate("/pricing"); }} className="gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              View Plans
            </Button>
          </DialogFooter>
          <p className="text-[10px] text-muted-foreground text-center">
            Professional Intelligence · $49/mo
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
