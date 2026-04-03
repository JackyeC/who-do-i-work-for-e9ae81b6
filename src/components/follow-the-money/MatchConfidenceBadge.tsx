import { Badge } from "@/components/ui/badge";
import { Fingerprint } from "lucide-react";
import type { MatchConfidence } from "@/types/follow-the-money";

const CONFIG: Record<MatchConfidence, { label: string; className: string }> = {
  high: { label: "High-confidence employer match", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Possible employer-name ambiguity", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { label: "Results may vary by employer name variant", className: "bg-muted/50 text-muted-foreground border-border" },
};

interface Props {
  confidence: MatchConfidence;
}

export function MatchConfidenceBadge({ confidence }: Props) {
  const { label, className } = CONFIG[confidence];
  return (
    <Badge variant="outline" className={`gap-1.5 text-xs font-mono ${className}`}>
      <Fingerprint className="w-3 h-3" />
      {label}
    </Badge>
  );
}
