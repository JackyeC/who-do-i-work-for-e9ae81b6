import { ShieldAlert } from "lucide-react";

export function LegalDisclaimer() {
  return (
    <div className="sticky bottom-0 z-30 bg-muted/95 backdrop-blur-sm border-t border-border/60 py-2.5 px-4">
      <div className="container mx-auto max-w-3xl flex items-center gap-2.5 justify-center">
        <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground text-center">
          <span className="font-semibold text-foreground">Educational insights only.</span>{" "}
          Not legal advice. Consult an attorney for contract reviews.{" "}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
