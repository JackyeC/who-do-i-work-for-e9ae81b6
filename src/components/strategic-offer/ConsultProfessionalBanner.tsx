import { Scale } from "lucide-react";

interface ConsultProfessionalBannerProps {
  clause?: string;
}

export function ConsultProfessionalBanner({ clause }: ConsultProfessionalBannerProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
      <Scale className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <p className="text-xs text-foreground leading-relaxed">
        <span className="font-semibold">Professional review recommended.</span>{" "}
        {clause
          ? `This ${clause} may warrant review by a qualified employment attorney before signing.`
          : "One or more clauses in this offer may warrant review by a qualified employment attorney before signing."}
      </p>
    </div>
  );
}
