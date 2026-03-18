import { ShieldAlert } from "lucide-react";

export function LegalDisclaimer() {
  return (
    <div className="sticky bottom-0 z-30 bg-muted/95 backdrop-blur-sm border-t border-border/60 py-2.5 px-4">
      <div className="container mx-auto max-w-3xl flex flex-col items-center gap-1 justify-center">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Educational insights only.</span>{" "}
            Not legal advice. Does not create an attorney-client relationship. Consult an attorney for contract reviews.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/70 text-center">
          All career decisions remain the sole responsibility of the user.{" "}
          <a href="/terms" className="text-primary hover:underline">Terms</a>{" · "}
          <a href="/privacy" className="text-primary hover:underline">Privacy</a>{" · "}
          <a href="/disclaimers" className="text-primary hover:underline">Disclaimers</a>
        </p>
      </div>
    </div>
  );
}
