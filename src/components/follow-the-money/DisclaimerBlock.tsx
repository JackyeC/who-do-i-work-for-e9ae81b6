import { AlertTriangle } from "lucide-react";

interface Props {
  text: string;
}

export function DisclaimerBlock({ text }: Props) {
  return (
    <aside
      role="note"
      aria-label="Data disclaimer"
      className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 flex gap-3 items-start"
    >
      <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </aside>
  );
}
