import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Network, Search, Loader2, Users, Building2, Landmark, FileText,
  ArrowRight, ChevronRight, Eye, Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  searchQuery: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  flight_log: "Flight Log",
  email_exchange: "Email Exchange",
  donation: "Donation",
  employment: "Employment",
  board_membership: "Board Membership",
  legal_proceeding: "Legal Proceeding",
  financial_transaction: "Financial Transaction",
};

const ENTITY_ICONS: Record<string, any> = {
  person: Users,
  organization: Building2,
  company: Building2,
  politician: Landmark,
  foundation: Landmark,
  financial_institution: Landmark,
  location: Landmark,
};

export function NetworkGraphTab({ searchQuery }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const effectiveSearch = searchQuery || localSearch;

  const { data: relationships, isLoading } = useQuery({
    queryKey: ["pn-relationships", effectiveSearch, typeFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("power_network_relationships")
        .select(`
          *,
          source:source_entity_id(id, name, entity_type),
          target:target_entity_id(id, name, entity_type)
        `)
        .order("confidence", { ascending: false })
        .limit(100);

      if (typeFilter !== "all") {
        query = query.eq("relationship_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return "text-civic-green";
    if (c >= 0.5) return "text-civic-yellow";
    return "text-civic-red";
  };

  return (
    <div className="space-y-4">
      {/* Placeholder for interactive graph */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8 text-center">
          <Network className="h-12 w-12 text-primary/40 mx-auto mb-3" />
          <h3 className="text-foreground font-medium mb-1">Interactive Network Graph</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The force-directed relationship graph will render here once datasets are ingested.
            Below is the relationship list view.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        {!searchQuery && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 bg-background font-mono text-sm"
            />
          </div>
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-56 bg-background">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Relationship type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Relationship list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : relationships?.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Network className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No relationships mapped yet. Connections will appear as datasets are processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {relationships?.map((rel: any) => {
            const SourceIcon = ENTITY_ICONS[rel.source?.entity_type] || Users;
            const TargetIcon = ENTITY_ICONS[rel.target?.entity_type] || Users;
            return (
              <Card key={rel.id} className="border-border/30 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Source */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <SourceIcon className="h-4 w-4 text-primary/70 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {rel.source?.name || "Unknown"}
                      </span>
                    </div>

                    {/* Relationship type */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs font-mono whitespace-nowrap">
                        {RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {/* Target */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-sm font-medium text-foreground truncate text-right">
                        {rel.target?.name || "Unknown"}
                      </span>
                      <TargetIcon className="h-4 w-4 text-primary/70 shrink-0" />
                    </div>
                  </div>

                  {rel.description && (
                    <p className="text-muted-foreground text-xs mt-2 line-clamp-1">
                      {rel.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className={`font-mono ${confidenceColor(rel.confidence)}`}>
                      {Math.round(rel.confidence * 100)}% confidence
                    </span>
                    {rel.is_verified && (
                      <Badge variant="outline" className="text-xs text-civic-green border-civic-green/20">
                        Verified
                      </Badge>
                    )}
                    {rel.date_observed && (
                      <span>{new Date(rel.date_observed).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
