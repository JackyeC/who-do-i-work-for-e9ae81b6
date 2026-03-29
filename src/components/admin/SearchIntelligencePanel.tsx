import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";

export function SearchIntelligencePanel() {
  // Top searched companies (from companies table, most recently updated = most searched)
  const { data: topSearched = [] } = useQuery({
    queryKey: ["admin-search-intel"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, industry, employer_clarity_score, updated_at")
        .order("updated_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  // Zero-result searches: companies that were created but have minimal data (low score, no description)
  const { data: gapCompanies = [] } = useQuery({
    queryKey: ["admin-data-gaps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, industry, employer_clarity_score, description")
        .or("description.is.null,employer_clarity_score.eq.0")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
        <Search className="w-4.5 h-4.5 text-primary" /> Search Intelligence
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Searches */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Most Active Companies</p>
          <div className="space-y-1.5">
            {topSearched.map((co, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/20">
                <span className="text-foreground font-medium truncate max-w-[160px]">{co.name}</span>
                <Badge variant="outline" className="text-xs font-mono">{co.employer_clarity_score}</Badge>
              </div>
            ))}
          </div>
        </div>
        {/* Data Gaps */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-civic-yellow" /> Data Gaps
          </p>
          {gapCompanies.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No data gaps detected</p>
          ) : (
            <div className="space-y-1.5">
              {gapCompanies.map((co, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <span className="text-foreground font-medium truncate max-w-[160px]">{co.name}</span>
                  <span className="text-xs text-muted-foreground">{co.industry}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
