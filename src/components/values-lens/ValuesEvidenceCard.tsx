import { ExternalLink, Shield, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_CONFIG } from "@/lib/valuesLenses";

interface EvidenceRecord {
  id: string;
  signal_type: string;
  source_name?: string;
  source_type?: string;
  source_url?: string;
  source_title?: string;
  evidence_summary?: string;
  evidence_excerpt?: string;
  related_legislation?: string;
  related_org?: string;
  related_politician?: string;
  amount?: number;
  event_date?: string;
  confidence_level: string;
  verification_status: string;
}

interface Props {
  evidence: EvidenceRecord;
}

const PLAIN_SOURCE_TYPES: Record<string, string> = {
  lobbying_filing: "Lobbying disclosure filing",
  pac_donation: "Political Action Committee donation",
  executive_donation: "Personal donation by a company executive",
  sec_filing: "Securities and Exchange Commission filing",
  government_contract: "Federal government contract",
  enforcement_action: "Government enforcement action",
  corporate_statement: "Official company statement",
  advocacy_alignment: "Link to an advocacy or trade group",
};

export function ValuesEvidenceCard({ evidence }: Props) {
  const conf = CONFIDENCE_CONFIG[evidence.confidence_level] || CONFIDENCE_CONFIG.medium;
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const plainSourceType = PLAIN_SOURCE_TYPES[evidence.source_type || ""] || evidence.source_type?.replace(/_/g, " ");

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium leading-snug">
            {evidence.evidence_summary || evidence.signal_type.replace(/_/g, " ")}
          </p>
          {evidence.evidence_excerpt && (
            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
              "{evidence.evidence_excerpt}"
            </p>
          )}
        </div>
        {evidence.amount && (
          <span className="text-sm font-bold text-primary font-data shrink-0">
            {formatCurrency(evidence.amount)}
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {plainSourceType && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {plainSourceType}
          </Badge>
        )}
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${conf.color}`}>
          {conf.plainLabel}
        </Badge>
        {evidence.event_date && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(evidence.event_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Related entities — plain language */}
      {(evidence.related_legislation || evidence.related_org || evidence.related_politician) && (
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
          {evidence.related_legislation && (
            <span className="flex items-center gap-1">
              <Info className="w-2.5 h-2.5" /> Bill: {evidence.related_legislation}
            </span>
          )}
          {evidence.related_org && <span>Group: {evidence.related_org}</span>}
          {evidence.related_politician && <span>Politician: {evidence.related_politician}</span>}
        </div>
      )}

      {/* Source link */}
      {evidence.source_url && (
        <a
          href={evidence.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <Shield className="w-3 h-3" />
          {evidence.source_name || "View the original record"}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}
