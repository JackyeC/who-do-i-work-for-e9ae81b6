import { Badge } from "@/components/ui/badge";

interface EvidenceCardProps {
  title: string;
  summary: string;
  sourceType: string;
  ndMeaning: string;
}

export function EvidenceCard({ title, summary, sourceType, ndMeaning }: EvidenceCardProps) {
  return (
    <div className="border border-border/40 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <Badge variant="outline" className="text-[10px] shrink-0 font-mono uppercase tracking-wider">
          {sourceType}
        </Badge>
      </div>
      <p className="text-xs text-foreground/70 leading-relaxed">{summary}</p>
      <div className="border-l-2 border-primary/40 pl-3 py-1.5 bg-primary/5">
        <p className="text-xs font-medium text-foreground/80 mb-0.5">Why this matters for ND workers</p>
        <p className="text-xs text-foreground/65 leading-relaxed">{ndMeaning}</p>
      </div>
    </div>
  );
}
