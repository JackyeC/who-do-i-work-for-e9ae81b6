import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, TrendingUp, BarChart3, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
  ticker?: string | null;
  cik?: string | null;
}

function formatValue(val: number | null): string {
  if (!val) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function InsiderTradingCard({ companyId, companyName, ticker, cik }: Props) {
  const { data: trades, isLoading } = useQuery({
    queryKey: ["insider-trades", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("insider_trades")
        .select("*")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (isLoading || !trades?.length) return null;

  const sales = trades.filter((t: any) => t.transaction_type === "sale");
  const purchases = trades.filter((t: any) => t.transaction_type === "purchase");
  const totalSold = sales.reduce((a: number, t: any) => a + (Number(t.total_value) || 0), 0);
  const totalBought = purchases.reduce((a: number, t: any) => a + (Number(t.total_value) || 0), 0);
  const netSelling = totalSold > totalBought * 2;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Insider Trading Activity
          {ticker && <Badge variant="outline" className="text-[10px] ml-1">{ticker}</Badge>}
          {netSelling && (
            <Badge variant="destructive" className="text-[10px] ml-auto">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Net Insider Selling
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-lg font-bold text-foreground">{trades.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <p className="text-lg font-bold text-foreground">{formatValue(totalSold)}</p>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sold</p>
          </div>
          <div className="p-3 rounded-lg bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/15 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
              <p className="text-lg font-bold text-foreground">{formatValue(totalBought)}</p>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bought</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Insider</TableHead>
                <TableHead className="text-[10px]">Type</TableHead>
                <TableHead className="text-[10px]">Date</TableHead>
                <TableHead className="text-[10px] text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 12).map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">
                    <div className="font-medium text-foreground">{t.filer_name}</div>
                    {t.filer_title && <div className="text-[10px] text-muted-foreground">{t.filer_title}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]",
                        t.transaction_type === "sale" ? "border-destructive/30 text-destructive" : "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]"
                      )}
                    >
                      {t.transaction_type === "sale" ? "SELL" : "BUY"}
                    </Badge>
                    {t.is_10b5_plan && <span className="text-[9px] text-muted-foreground ml-1">10b5-1</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-right text-foreground">
                    {formatValue(Number(t.total_value))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {trades[0]?.sec_filing_url && (
          <a href={trades[0].sec_filing_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary hover:underline justify-center">
            View all SEC Form 4 filings <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Source: SEC EDGAR Form 4 filings • Insider transactions by officers, directors, and 10% owners
        </p>
      </CardContent>
    </Card>
  );
}
