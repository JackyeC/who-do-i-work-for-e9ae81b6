import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Layers, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceTier =
  | "verified"
  | "multi_source"
  | "inferred"
  | "no_evidence";

interface SourceLabelProps {
  tier: SourceTier;
  url?: string | null;
  className?: string;
}

const TIER_CONFIG: Record<SourceTier, {
  label: string;
  icon: typeof CheckCircle;
  badgeClass: string;
}> = {
  verified: {
    label: "Verified Source",
    icon: CheckCircle,
    badgeClass: "border-civic-green/40 text-civic-green bg-civic-green/10",
  },
  multi_source: {
    label: "Multi-Source Signal",
    icon: Layers,
    badgeClass: "border-primary/40 text-primary bg-primary/10",
  },
  inferred: {
    label: "Inferred",
    icon: HelpCircle,
    badgeClass: "border-amber-500/40 text-amber-600 bg-amber-500/10",
  },
  no_evidence: {
    label: "No Public Evidence Found",
    icon: XCircle,
    badgeClass: "border-muted-foreground/30 text-muted-foreground bg-muted/30",
  },
};

/**
 * Determines the source tier for a claim based on available data.
 */
export function classifyClaim(claim: {
  claim_source_url?: string | null;
  claim_source?: string | null;
  extraction_method?: string | null;
}): SourceTier {
  if (claim.claim_source_url) return "verified";
  if (claim.extraction_method === "multi_source") return "multi_source";
  if (claim.claim_source) return "inferred";
  return "no_evidence";
}

export function SourceLabel({ tier, url, className }: SourceLabelProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Badge variant="outline" className={cn("text-[10px] font-medium gap-1 py-0 h-5", config.badgeClass)}>
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </Badge>
      {tier === "verified" && url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5 text-[10px]"
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </span>
  );
}
