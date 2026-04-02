import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, ShieldCheck, Calendar, Globe, ChevronDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SourceDocument {
  id: string;
  title: string;
  document_type: string;
  source_url: string;
  source_domain: string | null;
  published_date: string | null;
  summary: string | null;
  why_it_matters: string | null;
  is_primary_source: boolean;
}

interface SourceDocumentsLayerProps {
  companyId: string;
  companyName: string;
}

const DOC_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  financial: {
    label: "Financial Filings",
    types: ["10-K", "10-Q", "annual_report", "proxy_statement", "DEF_14A", "8-K"],
  },
  governance: {
    label: "Governance & Board",
    types: ["governance", "board_report", "charter", "bylaws", "committee_charter"],
  },
  inclusion: {
    label: "Inclusion & ESG",
    types: ["dei_report", "esg_report", "sustainability_report", "impact_report", "cdp_disclosure"],
  },
  policies: {
    label: "Policies & Codes",
    types: ["code_of_conduct", "employee_handbook", "ethics_policy", "supplier_code", "privacy_policy"],
  },
};

const TYPE_LABELS: Record<string, string> = {
  "10-K": "10-K Annual Filing",
  "10-Q": "10-Q Quarterly Filing",
  annual_report: "Annual Report",
  proxy_statement: "Proxy Statement",
  DEF_14A: "DEF 14A Proxy",
  "8-K": "8-K Current Report",
  governance: "Governance Report",
  board_report: "Board Report",
  charter: "Corporate Charter",
  bylaws: "Corporate Bylaws",
  committee_charter: "Committee Charter",
  dei_report: "DEI / Inclusion Report",
  esg_report: "ESG Report",
  sustainability_report: "Sustainability Report",
  impact_report: "Impact Report",
  cdp_disclosure: "CDP Climate Disclosure",
  code_of_conduct: "Code of Conduct",
  employee_handbook: "Employee Handbook",
  ethics_policy: "Ethics Policy",
  supplier_code: "Supplier Code of Conduct",
  privacy_policy: "Privacy Policy",
  other: "Document",
};

function categorize(docType: string): string {
  for (const [cat, { types }] of Object.entries(DOC_CATEGORIES)) {
    if (types.includes(docType)) return cat;
  }
  return "policies";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function DocumentCard({ doc }: { doc: SourceDocument }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = TYPE_LABELS[doc.document_type] ?? doc.document_type;

  return (
    <Card className="border-border/30 hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] font-mono tracking-wide">
                {typeLabel}
              </Badge>
              {doc.is_primary_source && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--civic-green))]">
                  <ShieldCheck className="w-3 h-3" /> Primary Source
                </span>
              )}
              {doc.published_date && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {formatDate(doc.published_date)}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-foreground leading-snug">{doc.title}</p>

            {doc.source_domain && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                <Globe className="w-3 h-3" /> {doc.source_domain}
              </span>
            )}
          </div>

          <a
            href={doc.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
              Open <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        </div>

        {(doc.summary || doc.why_it_matters) && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[10px] font-mono uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
            >
              {expanded ? "Hide" : "More context"}
              <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 text-xs text-muted-foreground leading-relaxed">
                {doc.summary && <p>{doc.summary}</p>}
                {doc.why_it_matters && (
                  <div className="p-2.5 rounded bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-mono text-primary tracking-wider uppercase mb-1">Why This Matters</p>
                    <p className="text-xs text-foreground/80">{doc.why_it_matters}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SourceDocumentsLayer({ companyId, companyName }: SourceDocumentsLayerProps) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["source-documents", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_source_documents")
        .select("*")
        .eq("company_id", companyId)
        .order("published_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SourceDocument[];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/30 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10">
        <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No primary-source documents attached yet for {companyName}.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Annual reports, proxy statements, and ESG disclosures will appear here when indexed.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, SourceDocument[]> = {};
  for (const doc of documents) {
    const cat = categorize(doc.document_type);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  const categoryOrder = ["financial", "governance", "inclusion", "policies"];

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Primary-source documents from official filings, investor relations, and company disclosures.
        These are the receipts behind the signals.
      </p>

      {categoryOrder.map((catKey) => {
        const docs = grouped[catKey];
        if (!docs || docs.length === 0) return null;
        const catConfig = DOC_CATEGORIES[catKey];

        return (
          <div key={catKey}>
            <p className="font-mono text-[10px] text-primary tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              {catConfig.label}
              <Badge variant="outline" className="text-[10px] ml-auto">{docs.length}</Badge>
            </p>
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
