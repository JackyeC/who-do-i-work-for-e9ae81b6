import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, ExternalLink, Bot, Eye, UserCheck } from "lucide-react";

interface AutoApplyConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const SLIDES = [
  {
    icon: Bot,
    title: "We are your Agent",
    description: "We find values-aligned jobs and draft tailored applications. You make the choice on every single one.",
  },
  {
    icon: Eye,
    title: "We only tell the truth",
    description: "Our AI will never fabricate skills, titles, or experience. No fake credentials, no bot-spam. We only highlight what you have already provided.",
  },
  {
    icon: UserCheck,
    title: "You are the boss",
    description: "Every application requires your explicit approval before it is submitted. Nothing goes out without your say-so.",
  },
];

export function AutoApplyConsentModal({ open, onAccept, onCancel }: AutoApplyConsentModalProps) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState(false);

  const isLastSlide = step === SLIDES.length - 1;
  const current = SLIDES[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (isLastSlide) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      onCancel();
      return;
    }
    setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            The Fairness Contract
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Step {step + 1} of {SLIDES.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex flex-col items-center text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>

          {isLastSlide && (
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-muted/40 border border-border/40 mt-3">
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => setChecked(!!c)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground leading-relaxed">
                I understand and agree to the{" "}
                <a href="/terms#9" target="_blank" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  Career Agent Authorization <ExternalLink className="w-3 h-3" />
                </a>{" "}
                in the Terms of Service
              </span>
            </label>
          )}
        </div>

        <DialogFooter className="pt-2 flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {isLastSlide ? (
            <Button onClick={onAccept} disabled={!checked} className="gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Accept & Enable Auto-Apply
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
