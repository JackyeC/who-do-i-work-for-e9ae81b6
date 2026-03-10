import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Megaphone, Building2, FileText, DollarSign } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";

interface LobbyingDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  companyName: string;
  totalLobbyingSpend: number | null;
}

export function LobbyingDetailDrawer({ open, onOpenChange, companyId, companyName, totalLobbyingSpend }: LobbyingDetailDrawerProps) {
  // State-level lobbying data
  const { data: stateLobbyingData, isLoading: stateLoading } = useQuery({
    queryKey: ["lobbying-detail-state", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_state_lobbying")
        .select("*")
        .eq("company_id", companyId!)
        .order("year", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Lobbying-related entity linkages
  const { data: lobbyingLinkages, isLoading: linkagesLoading } = useQuery({
    queryKey: ["lobbying-detail-linkages", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("entity_linkages")
        .select("*")
        .eq("company_id", companyId!)
        .in("link_type", ["trade_association_lobbying", "lobbying_on_bill"])
        .order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Trade associations
  const { data: tradeAssociations } = useQuery({
    queryKey: ["lobbying-trade-assoc", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_trade_associations")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const isLoading = stateLoading || linkagesLoading;

  // Aggregate issues from state lobbying
  const allIssues = (stateLobbyingData || []).flatMap((s: any) => s.issues || []);
  const issueCounts = allIssues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue] = (acc[issue] || 0) + 1;
    return acc;
  }, {});
  const topIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Aggregate by state
  const stateSpending = (stateLobbyingData || []).reduce<Record<string, number>>((acc, s: any) => {
    acc[s.state] = (acc[s.state] || 0) + (s.lobbying_spend || 0);
    return acc;
  }, {});
  const topStates = Object.entries(stateSpending).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Lobbying Detail
          </SheetTitle>
          <SheetDescription>
            Where {companyName}'s lobbying money goes — issues, states, and organizations.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Total */}
          {totalLobbyingSpend && totalLobbyingSpend > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Federal Lobbying ({new Date().getFullYear() - 1}–{new Date().getFullYear()})
                    </div>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(totalLobbyingSpend)}</div>
                  </div>
                  <a
                    href={`https://lda.senate.gov/filings/public/filing/search/?registrant=${encodeURIComponent(companyName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View Senate LDA filings <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Aggregated from quarterly Senate Lobbying Disclosure Act filings. This is what {companyName} paid to registered lobbying firms to advocate on their behalf in Congress — the money goes to lobbying firms, not directly to politicians.
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <LoadingState message="Loading lobbying details..." className="py-8" />
          ) : (
            <>
              {/* Issues lobbied on */}
              {topIssues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Issues Lobbied On
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topIssues.map(([issue, count]) => (
                      <Badge key={issue} variant="outline" className="text-xs">
                        {issue}
                        {count > 1 && <span className="ml-1 text-muted-foreground">×{count}</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* State-level breakdown */}
              {topStates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    State-Level Lobbying
                  </h3>
                  <div className="space-y-2">
                    {topStates.map(([state, amount]) => (
                      <div key={state} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <span className="text-sm font-medium text-foreground">{state}</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade associations that lobby */}
              {tradeAssociations && tradeAssociations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Trade Associations (Lobby on Company's Behalf)
                  </h3>
                  <div className="space-y-2">
                    {tradeAssociations.map((ta: any) => (
                      <div key={ta.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <span className="text-sm font-medium text-foreground">{ta.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Who receives the money — lobbying firms */}
              {lobbyingLinkages && lobbyingLinkages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Who Receives the Money
                  </h3>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    Lobbying dollars go to registered lobbying firms — not directly to politicians.
                    These firms advocate on {companyName}'s behalf in Congress.
                  </p>
                  <div className="space-y-2">
                    {lobbyingLinkages.map((l: any) => {
                      const meta = (() => { try { return JSON.parse(l.metadata || "{}"); } catch { return {}; } })();
                      return (
                        <div key={l.id} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{l.target_entity_name}</span>
                            {l.amount && <Badge variant="secondary" className="text-xs">{formatCurrency(l.amount)}</Badge>}
                          </div>
                          {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">Lobbying Firm</Badge>
                            {meta.filing_year && <span className="text-[10px] text-muted-foreground">Filed: {meta.filing_year}</span>}
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(l.confidence_score * 100) >= 80 ? "Strong evidence" : Math.round(l.confidence_score * 100) >= 50 ? "Some evidence" : "Weak evidence"}
                            </span>
                          </div>
                          {l.source_citation && (() => {
                            try {
                              const citations = JSON.parse(l.source_citation);
                              const url = citations?.[0]?.url;
                              if (url && url.startsWith("http")) {
                                return (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1">
                                    <ExternalLink className="w-2.5 h-2.5" /> View filing
                                  </a>
                                );
                              }
                            } catch {}
                            return null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No data fallback */}
              {topIssues.length === 0 && topStates.length === 0 && (!lobbyingLinkages || lobbyingLinkages.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">
                    Detailed lobbying breakdown not yet available for {companyName}.
                  </p>
                  <a
                    href={`https://www.opensecrets.org/federal-lobbying/lookup?search=${encodeURIComponent(companyName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                  >
                    Search OpenSecrets for lobbying records <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Source attribution */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] text-muted-foreground">
                  Sources: Senate Lobbying Disclosure Act filings, state lobbying registries, FollowTheMoney.org.
                  Federal lobbying data from <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lda.senate.gov</a>.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
