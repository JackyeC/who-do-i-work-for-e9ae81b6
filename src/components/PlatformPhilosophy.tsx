import { Info } from "lucide-react";

export function PlatformPhilosophy() {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border mb-4">
      <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This platform reports signals detected in publicly available sources.
          All signals include source references and confidence levels.
          No conclusions are drawn. Interpretation is left to the user.
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          Confidence: <strong>High</strong> = direct disclosure or official filing · <strong>Medium</strong> = third-party report or vendor case study · <strong>Low</strong> = indirect signal from public sources
        </p>
      </div>
    </div>
  );
}
