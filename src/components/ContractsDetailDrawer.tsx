import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Landmark, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";

interface ContractsDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  companyName: string;
  totalContracts: number | null;
  totalSubsidies: number | null;
}

export function ContractsDetailDrawer({ open, onOpenChange, companyId, companyName, totalContracts, totalSubsidies }: ContractsDetailDrawerProps) {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts-detail", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_agency_contracts")
        .select("*")
        .eq("company_id", companyId!)
        .order("contract_value", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const controversialContracts = (contracts || []).filter((c: any) => c.controversy_flag);
  const totalValue = (contracts || []).reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0);

  // Group by agency
  const byAgency = (contracts || []).reduce<Record<string, { total: number; count: number }>>((acc, c: any) => {
    const key = c.agency_name;
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += c.contract_value || 0;
    acc[key].count += 1;
    return acc;
  }, {});
  const topAgencies = Object.entries(byAgency).sort((a, b) => b[1].total - a[1].total).slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Government Contracts
          </SheetTitle>
          <SheetDescription>
            Federal contracts awarded to {companyName} — which agencies and how much.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Contracts</div>
                  <div className="text-xl font-bold text-foreground">{totalContracts ? formatCurrency(totalContracts) : formatCurrency(totalValue)}</div>
                </div>
                {totalSubsidies && (
                  <div>
                    <div className="text-xs text-muted-foreground">Subsidies & Tax Breaks</div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(totalSubsidies)}</div>
                  </div>
                )}
              </div>
              <a
                href={`https://www.usaspending.gov/search/?hash=&filters=%7B%22keyword%22%3A%22${encodeURIComponent(companyName)}%22%7D`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-3"
              >
                Search USASpending.gov <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>

          {isLoading ? (
            <LoadingState message="Loading contract details..." className="py-8" />
          ) : (
            <>
              {/* Controversy alerts */}
              {controversialContracts.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">{controversialContracts.length} Controversial Contracts</span>
                  </div>
                  <div className="space-y-2">
                    {controversialContracts.map((c: any) => (
                      <div key={c.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.agency_name}</span> — {c.controversy_description || c.controversy_category}
                        {c.contract_value && <span className="ml-1">({formatCurrency(c.contract_value)})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By agency */}
              {topAgencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Contracts by Agency</h3>
                  <div className="space-y-2">
                    {topAgencies.map(([agency, data]) => (
                      <div key={agency} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div>
                          <div className="text-sm font-medium text-foreground">{agency}</div>
                          <div className="text-[10px] text-muted-foreground">{data.count} contract{data.count > 1 ? "s" : ""}</div>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(data.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual contracts */}
              {contracts && contracts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Contract Details</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {contracts.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{c.agency_name}</span>
                          {c.contract_value && <span className="text-xs font-semibold text-foreground">{formatCurrency(c.contract_value)}</span>}
                        </div>
                        {c.contract_description && <p className="text-[10px] text-muted-foreground mb-1">{c.contract_description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.fiscal_year && <Badge variant="outline" className="text-[10px]">FY{c.fiscal_year}</Badge>}
                          {c.controversy_flag && <Badge variant="destructive" className="text-[10px]">Controversy</Badge>}
                          <Badge variant="outline" className="text-[10px]">{c.confidence}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No data */}
              {(!contracts || contracts.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">
                    No detailed contract records yet. Search the official source:
                  </p>
                  <a
                    href={`https://www.usaspending.gov/search/?hash=&filters=%7B%22keyword%22%3A%22${encodeURIComponent(companyName)}%22%7D`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                  >
                    Search USASpending.gov <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Source */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] text-muted-foreground">
                  Sources: <a href="https://www.usaspending.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">USASpending.gov</a>, FPDS.
                  Contract data reflects official federal procurement records.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
