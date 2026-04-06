import { CheckCircle2, AlertTriangle } from "lucide-react";

interface FeelLikeWorkCardProps {
  title: string;
  bullets: string[];
  goodFitIf: string;
  beCarefulIf: string;
}

export function FeelLikeWorkCard({ title, bullets, goodFitIf, beCarefulIf }: FeelLikeWorkCardProps) {
  return (
    <div className="border border-border/40 bg-card p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-xs text-foreground/70 leading-relaxed pl-3 relative">
            <span className="absolute left-0 top-0.5 text-muted-foreground">-</span>
            {b}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-civic-green mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/70"><span className="font-medium text-foreground/80">Good fit if:</span> {goodFitIf}</p>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-civic-yellow mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/70"><span className="font-medium text-foreground/80">Be careful if:</span> {beCarefulIf}</p>
        </div>
      </div>
    </div>
  );
}
