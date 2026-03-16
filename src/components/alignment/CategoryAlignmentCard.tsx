import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Minus, ExternalLink } from "lucide-react";

interface Claim {
  claim_text: string;
  claim_source: string;
  claim_source_url: string | null;
}

interface CategoryAlignmentCardProps {
  category: string;
  alignmentScore: number;
  alignmentLevel: string;
  claimCount: number;
  signalCount: number;
  claims?: Claim[];
}

function levelStyle(level: string) {
  if (level === "Strong" || level === "Moderate")
    return { color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30", Icon: CheckCircle2 };
  if (level === "Mixed")
    return { color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30", Icon: Minus };
  return { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", Icon: AlertTriangle };
}

export function CategoryAlignmentCard({
  category, alignmentScore, alignmentLevel, claimCount, signalCount, claims = [],
}: CategoryAlignmentCardProps) {
  const style = levelStyle(alignmentLevel);
  const Icon = style.Icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{category}</CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold tabular-nums", style.color)}>{alignmentScore}</span>
            <Badge variant="outline" className={cn("text-[10px]", style.color, style.border)}>
              <Icon className="w-3 h-3 mr-1" />
              {alignmentLevel}
            </Badge>
          </div>
        </div>
        {/* Score bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={cn("h-full rounded-full transition-all duration-700", style.bg.replace("/10", ""))}
            style={{ width: `${alignmentScore}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{claimCount} claim{claimCount !== 1 ? "s" : ""} detected</span>
          <span>{signalCount} behavior signal{signalCount !== 1 ? "s" : ""}</span>
        </div>

        {/* Claims */}
        {claims.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">What They Say</p>
            {claims.slice(0, 3).map((c, i) => (
              <div key={i} className="p-2.5 bg-muted/30 rounded-lg border border-border/30">
                <p className="text-xs text-foreground leading-relaxed">"{c.claim_text}"</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{c.claim_source}</span>
                  {c.claim_source_url && (
                    <a
                      href={c.claim_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      View Source <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {claimCount === 0 && signalCount === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Data Not Disclosed: This employer has not made this information public.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
