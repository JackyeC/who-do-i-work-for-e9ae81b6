import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Layers, HelpCircle, ExternalLink,
  ChevronDown, FileText, AlertTriangle, User,
} from "lucide-react";

const EVIDENCE_CONFIG = {
  direct_source: {
    label: "Verified",
    icon: ShieldCheck,
    className: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/10",
  },
  multi_source: {
    label: "Multi-source",
    icon: Layers,
    className: "text-primary border-primary/30 bg-primary/10",
  },
  inferred: {
    label: "Inferred",
    icon: HelpCircle,
    className: "text-muted-foreground border-border bg-muted/30",
  },
};

const CLAIM_TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  layoff: AlertTriangle,
  safety: AlertTriangle,
  political: FileText,
  labor: FileText,
  civil_rights: ShieldCheck,
  environmental: FileText,
  legal: FileText,
  accountability: FileText,
};

/**
 * Attribution enforcement: a claim is only renderable if it has
 * both source_label AND source_url. Everything else is suppressed.
 */
function isAttributed(claim: any): boolean {
  return !!(claim.source_label && claim.source_url);
}

/**
 * Quality gate for news-sourced claims: the claim text must mention
 * the company name (or a reasonable substring) to avoid junk matches
 * from loosely-associated news articles.
 */
function passesQualityGate(claim: any, companyName: string): boolean {
  if (claim.claim_type !== "news" && claim.signal_table !== "company_news_signals") return true;
  // News claims must reference the company name to be shown
  const text = (claim.claim_text || "").toLowerCase();
  const name = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  // Check each word of the company name (at least 4 chars) appears in the claim
  const words = name.split(/\s+/).filter((w: string) => w.length >= 4);
  return words.some((w: string) => text.includes(w));
}

interface CompanyClaimsSectionProps {
  companyId: string;
  companyName: string;
}

export function CompanyClaimsSection({ companyId, companyName }: CompanyClaimsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 10;

  const { data: rawClaims, isLoading } = useQuery({
    queryKey: ["company-claims", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_claims")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("confidence_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId,
  });

  // ENFORCEMENT: suppress unattributed + junk news claims from UI
  const claims = (rawClaims ?? []).filter((c: any) => isAttributed(c) && passesQualityGate(c, companyName));

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Verified Claims
          </h2>
        </div>
        <div className="border border-border/40 bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            We could not verify any claims for this company yet.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Claims are generated from public records including WARN filings, FEC data, EEOC records, court cases, and more. Data coverage expands continuously.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-primary" />
            Verified Claims ({claims.length})
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-[10px] gap-1 px-1.5 py-0 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/10 cursor-help"
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                Source Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="text-xs">Every claim links to a public record. Unattributed claims are automatically hidden.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-foreground/70 mb-3 leading-relaxed">
          Structured intelligence generated from public records. Every claim links to its source.
        </p>

        <div className="space-y-2">
          {(showAll ? claims : claims.slice(0, INITIAL_LIMIT)).map((claim: any) => {
            const evidenceConf = EVIDENCE_CONFIG[claim.evidence_type as keyof typeof EVIDENCE_CONFIG] || EVIDENCE_CONFIG.inferred;
            const EvidenceIcon = evidenceConf.icon;
            const TypeIcon = CLAIM_TYPE_ICONS[claim.claim_type] || FileText;
            const isExpanded = expandedId === claim.id;

            return (
              <div
                key={claim.id}
                className="border border-border/40 bg-card rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors"
                >
                  <TypeIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{claim.claim_text}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-1 cursor-help", evidenceConf.className)}>
                            <EvidenceIcon className="w-2.5 h-2.5" />
                            {evidenceConf.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="text-xs">
                            {claim.evidence_type === 'direct_source' && "Linked directly to a primary public record."}
                            {claim.evidence_type === 'multi_source' && "Corroborated across multiple public sources."}
                            {claim.evidence_type === 'inferred' && "Pattern-based insight from available data."}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-[10px] text-muted-foreground font-mono">{claim.source_label}</span>
                      {claim.event_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(claim.event_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform mt-0.5", isExpanded && "rotate-180")} />
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-border/30">
                    {claim.decision_impact && (
                      <div className="mt-2 rounded-md border-l-2 border-primary/40 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-primary" />
                          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">What this could mean for you</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{claim.decision_impact}</p>
                      </div>
                    )}

                    <div className="bg-muted/20 rounded-md p-3 mt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Evidence Type</span>
                        <Badge variant="outline" className={cn("text-[10px] gap-1", evidenceConf.className)}>
                          <EvidenceIcon className="w-2.5 h-2.5" />
                          {evidenceConf.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Source</span>
                        <span className="font-mono text-foreground">{claim.source_label}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-mono text-foreground">{Math.round(claim.confidence_score * 100)}%</span>
                      </div>
                      {claim.event_date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Event Date</span>
                          <span className="text-foreground">
                            {new Date(claim.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <a
                        href={claim.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View source record →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!showAll && claims.length > INITIAL_LIMIT && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-3 py-2.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg border border-border/40 transition-colors"
          >
            Show all {claims.length} claims
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
