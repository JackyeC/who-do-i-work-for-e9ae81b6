import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, DollarSign, Users, Flag, AlertTriangle, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/LoadingState";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PACDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  companyName: string;
  totalPACSpending: number;
  corporatePACExists: boolean;
}

export function PACDetailDrawer({ open, onOpenChange, companyId, companyName, totalPACSpending, corporatePACExists }: PACDetailDrawerProps) {
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

              {/* Top recipients */}
              {candidates && candidates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    Top PAC Recipients ({candidates.length} politicians)
                  </h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {candidates.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            {c.flagged && <Badge variant="destructive" className="text-[10px]">Flagged</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={cn("text-[10px]",
                              c.party === "Republican" && "border-destructive/50 text-destructive",
                              c.party === "Democrat" && "border-primary/50 text-primary"
                            )}>{c.party}</Badge>
                            <span className="text-[10px] text-muted-foreground">{c.state}{c.district ? `, D-${c.district}` : ""}</span>
                            <Badge variant="outline" className="text-[10px]">{c.donation_type}</Badge>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">{formatCurrency(c.amount)}</span>
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
                        These candidates have been flagged for controversial positions or voting records.
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
                          <span className="text-sm font-medium text-foreground">{sp.name}</span>
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

              {/* How to report / verify */}
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
                    <a href="https://www.fec.gov/legal-resources/policy-other-guidance/advisory-opinions/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> FEC Advisory Opinions
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Source */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] text-muted-foreground">
                  Sources: Federal Election Commission (OpenFEC). All PAC data from official <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">FEC filings</a>.
                  Individual contribution limits: $3,300 per candidate per election (2024 cycle).
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
