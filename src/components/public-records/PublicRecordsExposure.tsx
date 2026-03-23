/**
 * SENSITIVE MODULE: Public Records & Network Exposure
 * 
 * This module displays documented associations from public records,
 * legal filings, government disclosures, and sourced reporting.
 * 
 * CORE RULE: A mention in a file or record does NOT equal guilt or wrongdoing.
 * The UI and data model must reflect that clearly.
 * 
 * Association data must be phrased conservatively, sourced clearly,
 * and displayed with contextual disclaimers. The system optimizes
 * for trust, defensibility, and user understanding.
 * 
 * FUTURE-READY: This module is designed to be reusable for other
 * network exposure categories including political spending, PACs,
 * lobbying, sanctions, legal controversies, executive network overlap,
 * and board interlocks.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Filter, SlidersHorizontal } from "lucide-react";
import { EvidenceCard } from "./EvidenceCard";
import { ContextNote } from "./ContextNote";
import { type StrengthLevel } from "./DocumentationStrengthBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SortOption = "recent" | "strength_desc" | "strength_asc";
type EntityFilter = "all" | "company" | "person" | "institution";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "strength_desc", label: "Strongest First" },
  { value: "strength_asc", label: "Weakest First" },
];

const ENTITY_FILTERS: { value: EntityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "company", label: "Company" },
  { value: "person", label: "Person" },
  { value: "institution", label: "Institution" },
];

const STRENGTH_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

interface PublicRecordsExposureProps {
  companyName: string;
  companyId?: string;
}

export function PublicRecordsExposure({ companyName, companyId }: PublicRecordsExposureProps) {
  const [sort, setSort] = useState<SortOption>("strength_desc");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [officialOnly, setOfficialOnly] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ["public-records-exposure", companyId, companyName],
    queryFn: async () => {
      // Query by company_id or entity_name
      let query = supabase
        .from("epstein_entity_links")
        .select("*");
      
      if (companyId) {
        query = query.or(`company_id.eq.${companyId},entity_name.ilike.%${companyName}%`);
      } else {
        query = query.ilike("entity_name", `%${companyName}%`);
      }

      const { data, error } = await query.order("document_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyName,
  });

  // Unique relationship types for filter
  const relationshipTypes = useMemo(() => {
    if (!records) return [];
    return [...new Set(records.map(r => r.relationship_type))];
  }, [records]);

  // Filtered and sorted records
  const filtered = useMemo(() => {
    if (!records) return [];
    let result = [...records];

    if (entityFilter !== "all") {
      result = result.filter(r => r.entity_type === entityFilter);
    }
    if (relationshipFilter !== "all") {
      result = result.filter(r => r.relationship_type === relationshipFilter);
    }
    if (officialOnly) {
      result = result.filter(r =>
        ["court_filing", "regulatory_action", "institutional_disclosure"].includes(r.source_type)
      );
    }

    result.sort((a, b) => {
      if (sort === "recent") {
        return (b.document_date || "").localeCompare(a.document_date || "");
      }
      if (sort === "strength_desc") {
        return (STRENGTH_ORDER[b.confidence_level] || 0) - (STRENGTH_ORDER[a.confidence_level] || 0);
      }
      return (STRENGTH_ORDER[a.confidence_level] || 0) - (STRENGTH_ORDER[b.confidence_level] || 0);
    });

    return result;
  }, [records, entityFilter, relationshipFilter, officialOnly, sort]);

  const hasStrongRecords = filtered.some(r => r.confidence_level === "high");
  const hasOnlyWeak = filtered.length > 0 && filtered.every(r => r.confidence_level === "low");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 shimmer-skeleton rounded" />
        <div className="h-24 shimmer-skeleton rounded" />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return null; // Don't render section if no records
  }

  const RELATIONSHIP_LABELS: Record<string, string> = {
    banking_relationship: "Banking",
    executive_or_founder_mention: "Executive",
    legal_settlement: "Settlement",
    regulator_action: "Regulator",
    account_holder_report: "Account",
    donation_or_funding_link: "Donation",
    institutional_association: "Institutional",
    testimony_or_deposition: "Testimony",
    media_report_with_document_basis: "Media",
    no_confirmed_company_level_evidence: "No Evidence",
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Disclaimer:</span>{" "}
          This section summarizes public records, legal filings, government disclosures, and sourced reporting.
          A mention in these records does not, by itself, establish wrongdoing by a company or individual.
          Review the linked evidence and context.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Filters</span>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="font-mono text-xs bg-card border border-border rounded-sm px-2 py-1 text-foreground"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Entity type */}
        <div className="flex items-center gap-1">
          {ENTITY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setEntityFilter(f.value)}
              className={cn(
                "font-mono text-xs tracking-wider px-2 py-1 border rounded-sm transition-colors",
                entityFilter === f.value
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Relationship type */}
        {relationshipTypes.length > 1 && (
          <select
            value={relationshipFilter}
            onChange={e => setRelationshipFilter(e.target.value)}
            className="font-mono text-xs bg-card border border-border rounded-sm px-2 py-1 text-foreground"
          >
            <option value="all">All Types</option>
            {relationshipTypes.map(t => (
              <option key={t} value={t}>{RELATIONSHIP_LABELS[t] || t.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}

        {/* Official sources only */}
        <button
          onClick={() => setOfficialOnly(!officialOnly)}
          className={cn(
            "font-mono text-xs tracking-wider px-2 py-1 border rounded-sm transition-colors",
            officialOnly
              ? "bg-primary/10 border-primary/25 text-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Official Sources Only
        </button>
      </div>

      {/* Summary line */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
        {hasStrongRecords && (
          <Badge variant="outline" className="text-xs font-mono tracking-wider border-primary/25 text-primary">
            Strong documentation available
          </Badge>
        )}
      </div>

      {/* Weak-only message */}
      {hasOnlyWeak && (
        <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            Limited documented company-level evidence found. Available records rely on indirect or unverified sources.
          </p>
        </div>
      )}

      {/* Context note */}
      <ContextNote />

      {/* Evidence cards */}
      <div className="space-y-3">
        {filtered.map(record => (
          <EvidenceCard
            key={record.id}
            sourceType={record.source_type}
            sourceTitle={record.source_title}
            sourceUrl={record.source_url}
            documentDate={record.document_date}
            summary={record.summary}
            verbatimExcerpt={record.verbatim_excerpt}
            confidenceLevel={record.confidence_level as StrengthLevel}
            relationshipType={record.relationship_type}
            personLinked={record.person_linked}
            riskTier={record.risk_tier}
          />
        ))}
      </div>
    </div>
  );
}
