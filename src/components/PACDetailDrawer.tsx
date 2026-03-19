import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, DollarSign, Users, Flag, AlertTriangle, FileSearch, Info, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";
import { PartyBadge, computeRecipientMix } from "@/components/PartyBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

interface PACDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  companyName: string;
  totalPACSpending: number;
  corporatePACExists: boolean;
}

export function PACDetailDrawer({ open, onOpenChange, companyId, companyName, totalPACSpending, corporatePACExists }: PACDetailDrawerProps) {
  const [fetchingFEC, setFetchingFEC] = useState(false);
  const [fecError, setFecError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: partyBreakdown, isLoading: partyLoading } = useQuery({
    queryKey: ["pac-detail-party", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_party_breakdown")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ["pac-detail-candidates", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_candidates")
        .select("*")
        .eq("company_id", companyId!)
        .order("amount", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const { data: superPacs } = useQuery({
    queryKey: ["pac-detail-super", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_super_pacs")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const { data: executives, isLoading: execLoading } = useQuery({
    queryKey: ["pac-detail-execs", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("*")
        .eq("company_id", companyId!)
        .order("total_donations", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const isLoading = partyLoading || candidatesLoading || execLoading;
  const flaggedCandidates = (candidates || []).filter((c: any) => c.flagged);

  // Compute recipient mix from candidates
  const recipientMix = computeRecipientMix(
    (candidates || []).map((c: any) => ({ party: c.party, entityType: "politician", amount: c.amount }))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            PAC Spending Detail
          </SheetTitle>
          <SheetDescription>
            {companyName}'s Political Action Committee — who gets the money and how to verify it.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Total PAC Spending</div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPACSpending)}</div>
                </div>
                <Badge variant={corporatePACExists ? "default" : "outline"} className="text-xs">
                  {corporatePACExists ? "Corporate PAC Active" : "No Corporate PAC"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.fec.gov/data/committee/?q=${encodeURIComponent(companyName)}&committee_type=O&committee_type=U&committee_type=W`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <FileSearch className="w-3 h-3" /> Search FEC for this PAC
                </a>
                <a
                  href="https://www.fec.gov/legal-resources/enforcement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" /> Report to FEC
                </a>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <LoadingState message="Loading PAC details..." className="py-8" />
          ) : (
            <>
              {/* Recipient Mix Bar */}
              {recipientMix.length > 0 && (
                <div className="p-3 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Recipient Mix</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden mb-2">
                    {recipientMix.map((mix, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-full",
                          mix.label === "R" ? "bg-[hsl(0,65%,50%)]" :
                          mix.label === "D" ? "bg-[hsl(218,55%,48%)]" :
                          "bg-muted-foreground/30"
                        )}
                        style={{ width: `${mix.percentage}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {recipientMix.map((mix, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className={cn(
                          "w-2 h-2 rounded-full inline-block",
                          mix.label === "R" ? "bg-[hsl(0,65%,50%)]" :
                          mix.label === "D" ? "bg-[hsl(218,55%,48%)]" :
                          "bg-muted-foreground/30"
                        )} />
                        {mix.percentage}% {mix.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Party breakdown chart */}
              {partyBreakdown && partyBreakdown.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Party Split</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={partyBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="amount" nameKey="party">
                          {partyBreakdown.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {partyBreakdown.map((p: any) => (
                      <div key={p.party} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.party}: {formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No individual recipients yet — show explanation */}
              {(!candidates || candidates.length === 0) && partyBreakdown && partyBreakdown.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    Party-Level Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    We know how {companyName}'s PAC money splits by party. Pull individual recipient records from FEC to see exactly who gets the money.
                  </p>
                  <div className="space-y-2 mb-3">
                    {partyBreakdown.filter((p: any) => p.amount > 0).map((p: any) => (
                      <div key={p.party} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-sm font-medium text-foreground">{p.party}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {fecError && (
                    <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 mb-3">
                      <p className="text-xs text-destructive">{fecError}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        setFetchingFEC(true);
                        setFecError(null);
                        try {
                          const { data, error } = await supabase.functions.invoke('fec-pac-recipients', {
                            body: { companyId, companyName },
                          });
                          if (error) throw error;
                          if (data?.candidates?.length > 0) {
                            toast.success(`Found ${data.candidates.length} recipients from FEC records`);
                            queryClient.invalidateQueries({ queryKey: ["pac-detail-candidates", companyId] });
                          } else {
                            setFecError(data?.message || 'No disbursement records found on FEC.gov for this company.');
                          }
                        } catch (e) {
                          console.error('FEC fetch error:', e);
                          setFecError('FEC data temporarily unavailable — try the direct link below.');
                        } finally {
                          setFetchingFEC(false);
                        }
                      }}
                      disabled={fetchingFEC}
                      className="w-full"
                    >
                      {fetchingFEC ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Pulling FEC records...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Pull recipient records from FEC
                        </>
                      )}
                    </Button>
                    <a
                      href={`https://www.fec.gov/data/disbursements/?data_type=processed&committee_id=&recipient_name=&two_year_transaction_period=2024&min_date=&max_date=&min_amount=&max_amount=&committee_name=${encodeURIComponent(companyName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Or look up manually on FEC.gov →
                    </a>
                  </div>
                </div>
              )}

              {/* Top recipients */}
              {candidates && candidates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    Top PAC Recipients ({candidates.length})
                  </h3>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {candidates.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            <PartyBadge party={c.party} entityType="politician" size="sm" />
                            {c.flagged && <Badge variant="destructive" className="text-[10px]">Flagged</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{c.state}{c.district ? `-${c.district}` : ""}</span>
                            <Badge variant="outline" className="text-[10px]">{c.donation_type}</Badge>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0 ml-2">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                  {flaggedCandidates.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                        <span className="text-xs font-semibold text-destructive">{flaggedCandidates.length} Flagged Recipients</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {flaggedCandidates.map((c: any) => c.flag_reason).filter(Boolean).join("; ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Super PACs */}
              {superPacs && superPacs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Connected Super PACs</h3>
                  <div className="space-y-2">
                    {superPacs.map((sp: any) => (
                      <div key={sp.id} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-foreground">{sp.name}</span>
                            <PartyBadge entityType="pac" size="sm" />
                          </div>
                          {sp.amount > 0 && <Badge variant="secondary" className="text-xs">{formatCurrency(sp.amount)}</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{sp.pac_type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{sp.relationship}</Badge>
                          <Badge variant="outline" className="text-[10px]">{sp.confidence}</Badge>
                        </div>
                        {sp.description && <p className="text-xs text-muted-foreground mt-1">{sp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive donors */}
              {executives && executives.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Top Executive Donors (Personal Giving)
                  </h3>
                  <div className="space-y-1.5">
                    {executives.map((exec: any) => (
                      <div key={exec.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-2">
                          {exec.photo_url ? (
                            <img src={exec.photo_url} alt={exec.name} className="w-7 h-7 rounded-full object-cover border border-border/60" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border/60">
                              <Users className="w-3 h-3 text-muted-foreground/70" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-foreground">{exec.name}</div>
                            <div className="text-[10px] text-muted-foreground">{exec.title}</div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(exec.total_donations)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Executive donations are personal contributions and do not necessarily reflect corporate policy.
                  </p>
                </div>
              )}

              {/* How to verify */}
              <Card className="border-muted">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">How to Verify & Report</h3>
                  <div className="space-y-2">
                    <a href={`https://www.fec.gov/data/committee/?q=${encodeURIComponent(companyName)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> Look up this PAC on FEC.gov
                    </a>
                    <a href={`https://www.fec.gov/data/receipts/individual-contributions/?contributor_employer=${encodeURIComponent(companyName)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> Search individual contributions by employer
                    </a>
                    <a href="https://www.fec.gov/legal-resources/enforcement/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-destructive hover:underline">
                      <AlertTriangle className="w-3 h-3" /> File a complaint with the FEC
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="border-t border-border pt-4">
                <p className="text-[10px] text-muted-foreground">
                  Sources: Federal Election Commission (OpenFEC). Party badges reflect official FEC filing data.
                  Dashed-border badges indicate inferred alignment. All data from official <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">FEC filings</a>.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
