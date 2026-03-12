import { Bot } from "lucide-react";

export function AIAnalysisNotice() {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/40">
      <Bot className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Automated Analysis Notice:</span>{" "}
        Evaluations are generated through automated systems using publicly available data.
        Results may contain errors or incomplete interpretations. Review all documents carefully
        and consult professional advisors when appropriate.
      </p>
    </div>
  );
}
