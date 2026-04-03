import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFuzzyPersonSearch } from "@/hooks/use-fuzzy-person-search";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Loader2, FileText, Network, ChevronRight, Building2
} from "lucide-react";

interface Props {
  searchQuery: string;
}

export function PeopleTab({ searchQuery }: Props) {
  const [localSearch, setLocalSearch] = useState("");
  const effectiveSearch = searchQuery || localSearch;

  // Use fuzzy search for person names when searching executives
  const { data: fuzzyResults, isLoading: fuzzyLoading } = useFuzzyPersonSearch(effectiveSearch);

  // Fall back to power_network_entities for general people browsing
  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["pn-people", effectiveSearch],
    queryFn: async () => {
      let query = (supabase as any)
        .from("power_network_entities")
        .select("*")
        .eq("entity_type", "person")
        .order("relationship_count", { ascending: false })
        .limit(100);

      if (effectiveSearch) {
        // Use OR to also match by nickname-expanded variants
        const variants = await supabase.rpc("resolve_name_variants", { _name: effectiveSearch.split(" ")[0] });
        const nameVariants = (variants.data || []) as string[];
        if (nameVariants.length > 1) {
          // Build an OR filter for all variant first names
          const orFilter = nameVariants.map(v => `name.ilike.%${v}%`).join(",");
          query = query.or(orFilter);
        } else {
          query = query.ilike("name", `%${effectiveSearch}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !effectiveSearch || effectiveSearch.trim().length >= 2,
  });

  const isLoading = fuzzyLoading || peopleLoading;

  // Merge fuzzy executive results with power_network results, deduped
  const mergedPeople = (() => {
    const seen = new Set<string>();
    const results: any[] = [];

    // Fuzzy executive matches first (higher relevance)
    (fuzzyResults || []).forEach((r) => {
      const key = r.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: r.id,
          name: r.name,
          description: r.title,
          document_count: 0,
          relationship_count: 0,
          company_id: r.company_id,
          match_type: r.match_type,
          total_donations: r.total_donations,
        });
      }
    });

    // Then network entities
    (people || []).forEach((p: any) => {
      const key = p.name?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(p);
      }
    });

    return results;
  })();

  return (
    <div className="space-y-4">
      {!searchQuery && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-background font-mono text-sm"
          />
        </div>
      )}

      {effectiveSearch && fuzzyResults && fuzzyResults.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs font-mono">Fuzzy</Badge>
          Found {fuzzyResults.length} name variant match{fuzzyResults.length !== 1 ? "es" : ""}
          {fuzzyResults.some(r => r.match_type === "nickname_match") && " (including nickname matches)"}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : mergedPeople.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No people entities found yet. Entities will be extracted automatically from ingested documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mergedPeople.map((person: any) => (
            <Card key={person.id} className="border-border/30 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      {person.name}
                    </h3>
                    {person.description && (
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {person.description}
                      </p>
                    )}
                    {person.aliases?.length > 0 && (
                      <p className="text-muted-foreground text-xs mt-1 font-mono">
                        aka: {person.aliases.join(", ")}
                      </p>
                    )}
                    {person.match_type && (
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {person.match_type === "nickname_match" ? "Nickname match" : "Fuzzy match"}
                      </Badge>
                    )}
                    {person.total_donations > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ${person.total_donations.toLocaleString()} in donations
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {person.document_count} docs
                  </span>
                  <span className="flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    {person.relationship_count} connections
                  </span>
                  {person.company_id && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      Linked
                    </Badge>
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
