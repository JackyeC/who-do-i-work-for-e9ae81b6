import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function ConsentModal({ open, onAccept, onCancel }: ConsentModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Before You Upload
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2 space-y-3">
            <p>
              This tool analyzes offer terms and detects signal patterns using publicly available data. It provides <span className="font-semibold text-foreground">educational insights only</span>.
            </p>
            <p>
              Your documents are encrypted, visible only to you, and are not used to train AI models. You can delete your data at any time.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-muted/40 border border-border/40">
            <Checkbox
              checked={checked}
              onCheckedChange={(c) => setChecked(!!c)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I understand this is not legal advice and agree to the{" "}
              <a href="/terms" target="_blank" className="text-primary hover:underline inline-flex items-center gap-0.5">
                Terms of Service <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </label>
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onAccept} disabled={!checked} className="gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
