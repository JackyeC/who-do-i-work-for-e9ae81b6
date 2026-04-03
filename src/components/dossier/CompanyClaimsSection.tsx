import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Layers, HelpCircle, ExternalLink,
  ChevronDown, FileText, AlertTriangle,
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

interface CompanyClaimsSectionProps {
  companyId: string;
  companyName: string;
}

export function CompanyClaimsSection({ companyId, companyName }: CompanyClaimsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: claims, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (!claims || claims.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-primary" />
        Verified Claims ({claims.length})
      </h2>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Structured intelligence generated from public records. Every claim links to its source.
      </p>

      <div className="space-y-2">
        {claims.map((claim: any) => {
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
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-1", evidenceConf.className)}>
                      <EvidenceIcon className="w-2.5 h-2.5" />
                      {evidenceConf.label}
                    </Badge>
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
                    {claim.source_url && (
                      <a
                        href={claim.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View source record →
                      </a>
                    )}
                    {!claim.source_url && (
                      <p className="text-[10px] text-muted-foreground italic">
                        No direct source link available. This claim is {claim.evidence_type === 'inferred' ? 'inferred from patterns' : 'based on aggregated signals'}.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
