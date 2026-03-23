/**
 * Evidence card for public records entries.
 * Displays source, date, summary, confidence, and source link.
 */

import { ExternalLink, FileText, Scale, Building2, Landmark, Newspaper } from "lucide-react";
import { DocumentationStrengthBadge, type StrengthLevel } from "./DocumentationStrengthBadge";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SOURCE_ICONS: Record<string, typeof FileText> = {
  court_filing: Scale,
  regulatory_action: Landmark,
  institutional_disclosure: Building2,
  media_report: Newspaper,
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  banking_relationship: "Banking Relationship",
  executive_or_founder_mention: "Executive / Founder Mention",
  legal_settlement: "Legal Settlement",
  regulator_action: "Regulator Action",
  account_holder_report: "Account Holder Report",
  donation_or_funding_link: "Donation / Funding Link",
  institutional_association: "Institutional Association",
  testimony_or_deposition: "Testimony / Deposition",
  media_report_with_document_basis: "Media Report (Document-Based)",
  no_confirmed_company_level_evidence: "No Confirmed Company-Level Evidence",
};

interface EvidenceCardProps {
  sourceType: string;
  sourceTitle: string;
  sourceUrl?: string | null;
  documentDate?: string | null;
  summary: string;
  verbatimExcerpt?: string | null;
  confidenceLevel: StrengthLevel;
  relationshipType: string;
  personLinked?: string | null;
  riskTier?: string;
}

export function EvidenceCard({
  sourceType,
  sourceTitle,
  sourceUrl,
  documentDate,
  summary,
  verbatimExcerpt,
  confidenceLevel,
  relationshipType,
  personLinked,
  riskTier,
}: EvidenceCardProps) {
  const Icon = SOURCE_ICONS[sourceType] || FileText;
  const relLabel = RELATIONSHIP_LABELS[relationshipType] || relationshipType.replace(/_/g, " ");

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:border-border-2 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight truncate">{sourceTitle}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                {sourceType.replace(/_/g, " ")}
              </span>
              {documentDate && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(documentDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <DocumentationStrengthBadge level={confidenceLevel} />
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <Badge variant="outline" className="text-xs font-mono tracking-wider">
          {relLabel}
        </Badge>
        {personLinked && (
          <Badge variant="secondary" className="text-xs font-mono tracking-wider">
            {personLinked}
          </Badge>
        )}
        {riskTier && riskTier !== "informational" && (
          <Badge variant="outline" className="text-xs font-mono tracking-wider border-primary/25 text-primary">
            {riskTier}
          </Badge>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-foreground/85 leading-relaxed mb-2">{summary}</p>

      {/* Verbatim excerpt */}
      {verbatimExcerpt && (
        <blockquote className="border-l-2 border-border pl-3 py-1 mb-2">
          <p className="text-xs text-muted-foreground italic leading-relaxed">"{verbatimExcerpt}"</p>
        </blockquote>
      )}

      {/* Source link */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 font-mono tracking-wider"
        >
          <ExternalLink className="w-3 h-3" />
          View Source
        </a>
      )}
    </div>
  );
}
