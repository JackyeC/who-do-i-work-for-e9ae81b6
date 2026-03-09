import { ExternalLink, Shield, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SIGNAL_DIRECTION_CONFIG, CONFIDENCE_CONFIG } from "@/lib/valuesLenses";

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

export function ValuesEvidenceCard({ evidence }: Props) {
  const conf = CONFIDENCE_CONFIG[evidence.confidence_level] || CONFIDENCE_CONFIG.low;
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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
        {evidence.source_type && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {evidence.source_type.replace(/_/g, " ")}
          </Badge>
        )}
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${conf.color}`}>
          {conf.label}
        </Badge>
        {evidence.event_date && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(evidence.event_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Related entities */}
      {(evidence.related_legislation || evidence.related_org || evidence.related_politician) && (
        <div className="flex items-center gap-2 flex-wrap">
          {evidence.related_legislation && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-2.5 h-2.5" /> {evidence.related_legislation}
            </span>
          )}
          {evidence.related_org && (
            <span className="text-[10px] text-muted-foreground">{evidence.related_org}</span>
          )}
          {evidence.related_politician && (
            <span className="text-[10px] text-muted-foreground">{evidence.related_politician}</span>
          )}
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
          {evidence.source_name || "View source"}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}
