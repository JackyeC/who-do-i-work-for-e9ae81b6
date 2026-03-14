/**
 * Signal card for Narrative Power signals.
 * Evidence-first display with confidence badges and source links.
 */

import { ExternalLink, Radio, Megaphone, Newspaper, Users, Shield, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIGNAL_ICONS: Record<string, typeof Radio> = {
  influencer_campaign: Users,
  media_amplification: Newspaper,
  pr_narrative_campaign: Megaphone,
  advocacy_messaging: Shield,
  propaganda_network: Radio,
};

const SIGNAL_LABELS: Record<string, string> = {
  influencer_campaign: "Influencer Campaign",
  media_amplification: "Media Amplification",
  pr_narrative_campaign: "PR Narrative Campaign",
  advocacy_messaging: "Advocacy Messaging",
  propaganda_network: "Propaganda Network",
};

const ACTOR_LABELS: Record<string, string> = {
  company: "Company",
  pr_firm: "PR Firm",
  pac: "PAC",
  advocacy_group: "Advocacy Group",
  media_organization: "Media Org",
  influencer: "Influencer",
  think_tank: "Think Tank",
};

const CONFIDENCE_CONFIG: Record<string, { label: string; className: string; tooltip: string }> = {
  verified: {
    label: "Verified",
    className: "bg-primary/10 text-primary border-primary/25",
    tooltip: "Supported by official documents, court filings, government reports, or direct corporate disclosures.",
  },
  investigative_reporting: {
    label: "Investigative Reporting",
    className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/25",
    tooltip: "Based on credible investigative journalism with documented sourcing.",
  },
  allegation: {
    label: "Allegation",
    className: "bg-muted text-muted-foreground border-border",
    tooltip: "Claim or allegation that has not been independently verified. Review sources carefully.",
  },
};

interface NarrativeSignalCardProps {
  signalType: string;
  signalTitle: string;
  actorName: string;
  actorType: string;
  actorDescription?: string | null;
  narrativeTarget: string;
  narrativeMethod: string;
  evidenceSource: string;
  evidenceDescription?: string | null;
  evidenceUrls?: string[];
  confidenceLevel: string;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  intermediaries?: string[];
  narrativeChain?: string | null;
}

export function NarrativeSignalCard({
  signalType,
  signalTitle,
  actorName,
  actorType,
  narrativeTarget,
  narrativeMethod,
  evidenceSource,
  evidenceDescription,
  evidenceUrls,
  confidenceLevel,
  dateRangeStart,
  dateRangeEnd,
  intermediaries,
  narrativeChain,
}: NarrativeSignalCardProps) {
  const Icon = SIGNAL_ICONS[signalType] || Radio;
  const signalLabel = SIGNAL_LABELS[signalType] || signalType.replace(/_/g, " ");
  const actorLabel = ACTOR_LABELS[actorType] || actorType.replace(/_/g, " ");
  const confidence = CONFIDENCE_CONFIG[confidenceLevel] || CONFIDENCE_CONFIG.allegation;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:border-border-2 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{signalTitle}</p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {signalLabel}
              {dateRangeStart && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  {formatDate(dateRangeStart)}
                  {dateRangeEnd ? ` — ${formatDate(dateRangeEnd)}` : " — Present"}
                </>
              )}
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm cursor-help whitespace-nowrap shrink-0",
                confidence.className
              )}>
                {confidence.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              {confidence.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Actor</p>
          <p className="text-xs font-medium text-foreground truncate">{actorName}</p>
          <p className="font-mono text-[9px] text-muted-foreground">{actorLabel}</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Target</p>
          <p className="text-xs font-medium text-foreground">{narrativeTarget.length > 50 ? narrativeTarget.slice(0, 50) + "…" : narrativeTarget}</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Method</p>
          <p className="text-xs font-medium text-foreground">{narrativeMethod}</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Evidence</p>
          <p className="text-xs font-medium text-foreground">{evidenceSource.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Description */}
      {evidenceDescription && (
        <p className="text-sm text-foreground/85 leading-relaxed mb-2">{evidenceDescription}</p>
      )}

      {/* Narrative chain */}
      {narrativeChain && (
        <div className="flex items-center gap-1.5 mb-2 p-2 rounded bg-primary/[0.04] border border-primary/10">
          <Radio className="w-3 h-3 text-primary shrink-0" />
          <p className="font-mono text-[10px] text-primary tracking-wider">{narrativeChain}</p>
        </div>
      )}

      {/* Intermediaries */}
      {intermediaries && intermediaries.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Intermediaries:</span>
          {intermediaries.map((i, idx) => (
            <Badge key={idx} variant="outline" className="text-[10px] font-mono">
              {i}
            </Badge>
          ))}
        </div>
      )}

      {/* Evidence links */}
      {evidenceUrls && evidenceUrls.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {evidenceUrls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono tracking-wider"
            >
              <ExternalLink className="w-3 h-3" />
              Source {evidenceUrls.length > 1 ? idx + 1 : ""}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
