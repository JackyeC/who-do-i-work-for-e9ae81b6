import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, Search, ExternalLink, Plane, FileText, 
  Users, Loader2, ShieldAlert, BookOpen, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

export function EpsteinCrossCheckCard({ companyId, companyName }: Props) {
  const [scanning, setScanning] = useState(false);

  // Fetch existing cross-references from DB
  const { data: crossRefs, isLoading, refetch } = useQuery({
    queryKey: ["epstein-cross-refs", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("epstein_cross_references")
        .select(`
          *,
          epstein_persons:epstein_person_id (
            name, external_slug, category, black_book, stats, aliases, tags
          )
        `)
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("epstein-cross-check", {
        body: { action: "cross-check", companyId },
      });
      if (error) throw error;
      toast.success(`Checked ${data.checked} leaders. Found ${data.results?.length || 0} potential matches.`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Cross-check failed");
    } finally {
      setScanning(false);
    }
  };

  const hasMatches = crossRefs && crossRefs.length > 0;

  return (
    <Card className={cn(
      "border",
      hasMatches ? "border-destructive/40 bg-destructive/5" : "border-border"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShieldAlert className={cn(
              "w-5 h-5",
              hasMatches ? "text-destructive" : "text-muted-foreground"
            )} />
            <span>Epstein Files Cross-Check</span>
            {hasMatches && (
              <Badge variant="destructive" className="text-[10px]">
                {crossRefs.length} Match{crossRefs.length !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={scanning}
            className="gap-1.5"
          >
            {scanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {scanning ? "Scanning..." : hasMatches ? "Re-scan" : "Run Cross-Check"}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cross-references {companyName}'s leadership against the Epstein Exposed database of 1,500+ persons.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading cross-references...
          </div>
        )}

        {!isLoading && !hasMatches && !scanning && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No cross-check has been run yet.</p>
            <p className="text-xs mt-1">Click "Run Cross-Check" to scan leadership against the Epstein files.</p>
          </div>
        )}

        {hasMatches && crossRefs.map((ref: any) => {
          const ep = ref.epstein_persons;
          if (!ep) return null;

          return (
            <div key={ref.id} className="rounded-lg border border-destructive/20 bg-background p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{ep.name}</span>
                    <Badge
                      variant={ref.match_confidence === "high" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {ref.match_confidence} confidence
                    </Badge>
                    {ep.black_book && (
                      <Badge variant="secondary" className="text-[10px]">Black Book</Badge>
                    )}
                  </div>
                  {ep.category && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{ep.category}</p>
                  )}
                </div>
                <a
                  href={`https://epsteinexposed.com/persons/${ep.external_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {ref.match_details?.searched_name && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Matched: {ref.match_details.searched_name}
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  {ref.document_count} documents
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Plane className="w-3.5 h-3.5" />
                  {ref.flight_count} flights
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {ref.connection_count} connections
                </span>
              </div>

              {ep.tags && ep.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ep.tags.slice(0, 6).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
          <p className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Source: Epstein Exposed (epsteinexposed.com) — Public interest database derived from court documents and government records. Inclusion does not imply guilt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
