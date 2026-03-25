import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, ExternalLink, Calendar, Hash, Search, Loader2,
  Filter, AlertTriangle, ChevronRight
} from "lucide-react";

interface Props {
  searchQuery: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  flight_log: "Flight Log",
  email: "Email",
  court_filing: "Court Filing",
  financial_record: "Financial Record",
  deposition: "Deposition",
  report: "Report",
  general: "General",
};

export function DocumentsTab({ searchQuery }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState("");

  const effectiveSearch = searchQuery || localSearch;

  const { data: documents, isLoading } = useQuery({
    queryKey: ["pn-documents", effectiveSearch, typeFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("power_network_documents")
        .select("*, power_network_datasets(name, reliability_level)")
        .order("date_published", { ascending: false, nullsFirst: false })
        .limit(50);

      if (typeFilter !== "all") {
        query = query.eq("document_type", typeFilter);
      }

      if (effectiveSearch) {
        query = query.ilike("title", `%${effectiveSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const reliabilityColor = (level: string) => {
    switch (level) {
      case "verified": return "bg-civic-green/10 text-civic-green border-civic-green/20";
      case "partially_verified": return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20";
      default: return "bg-civic-red/10 text-civic-red border-civic-red/20";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        {!searchQuery && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 bg-background font-mono text-sm"
            />
          </div>
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 bg-background">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Searching archive...</span>
        </div>
      ) : documents?.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No documents found. Datasets will be populated when ingestion connectors are activated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents?.map((doc: any) => (
            <Card key={doc.id} className="border-border/30 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </Badge>
                      {doc.power_network_datasets && (
                        <Badge className={`text-xs ${reliabilityColor(doc.power_network_datasets.reliability_level)}`}>
                          {doc.power_network_datasets.reliability_level}
                        </Badge>
                      )}
                      {doc.has_redactions && (
                        <Badge variant="outline" className="text-xs text-civic-yellow border-civic-yellow/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Redacted
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-medium text-foreground text-sm truncate">
                      {doc.title}
                    </h3>

                    {doc.content_summary && (
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {doc.content_summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {doc.external_doc_id && (
                        <span className="flex items-center gap-1 font-mono">
                          <Hash className="h-3 w-3" />
                          {doc.external_doc_id}
                        </span>
                      )}
                      {doc.date_published && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.date_published).toLocaleDateString()}
                        </span>
                      )}
                      {doc.page_count && (
                        <span>{doc.page_count} pages</span>
                      )}
                      {doc.power_network_datasets && (
                        <span className="text-primary/70">
                          {doc.power_network_datasets.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {doc.source_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
