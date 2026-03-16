import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronUp, ShieldCheck, Clock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SourceTier, TIER_LABELS, TIER_COLORS } from "@/lib/evidenceQualityScore";

interface SourceProvenanceCardProps {
  sourceName: string;
  sourceType: string;
  tier: SourceTier;
  sourceUrl?: string | null;
  dateRetrieved?: string | null;
  datePublished?: string | null;
  entityMatched?: string | null;
  matchConfidence?: number | null;
  verificationStatus?: string | null;
  className?: string;
  compact?: boolean;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SourceProvenanceCard({
  sourceName,
  sourceType,
  tier,
  sourceUrl,
  dateRetrieved,
  datePublished,
  entityMatched,
  matchConfidence,
  verificationStatus,
  className,
  compact = false,
}: SourceProvenanceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = verificationStatus === "cross_verified"
    ? "Cross-Verified"
    : verificationStatus === "verified"
    ? "Verified"
    : verificationStatus === "conflict"
    ? "Conflict Detected"
    : verificationStatus === "stale"
    ? "Stale"
    : "Pending";

  const statusColor = verificationStatus === "cross_verified" || verificationStatus === "verified"
    ? "text-[hsl(var(--civic-green))]"
    : verificationStatus === "conflict"
    ? "text-destructive"
    : verificationStatus === "stale"
    ? "text-[hsl(var(--civic-yellow))]"
    : "text-muted-foreground";

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[10px]", className)}>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-mono", TIER_COLORS[tier])}>
          T{tier}
        </Badge>
        <span className="text-muted-foreground">{sourceName}</span>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </span>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border/60 bg-card text-sm", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-mono shrink-0", TIER_COLORS[tier])}>
            {TIER_LABELS[tier]}
          </Badge>
          <span className="font-medium text-foreground truncate">{sourceName}</span>
          <ShieldCheck className={cn("w-3.5 h-3.5 shrink-0", statusColor)} />
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/40">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-2">
            <div>
              <span className="text-muted-foreground">Source Type</span>
              <p className="text-foreground font-medium">{sourceType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Verification</span>
              <p className={cn("font-medium", statusColor)}>{statusLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Filed</span>
              <span className="text-foreground ml-auto">{formatDate(datePublished)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Retrieved</span>
              <span className="text-foreground ml-auto">{formatDate(dateRetrieved)}</span>
            </div>
            {entityMatched && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Entity Matched</span>
                <p className="text-foreground font-medium">{entityMatched}</p>
              </div>
            )}
            {matchConfidence != null && (
              <div>
                <span className="text-muted-foreground">Match Confidence</span>
                <p className="text-foreground font-medium">{Math.round(matchConfidence * 100)}%</p>
              </div>
            )}
          </div>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
            >
              <Link2 className="w-3 h-3" />
              View Primary Source
            </a>
          )}
        </div>
      )}
    </div>
  );
}
