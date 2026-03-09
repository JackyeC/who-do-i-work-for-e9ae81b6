import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  TrendingUp, RefreshCw, Loader2, Users, GraduationCap, Ear,
  Brain, School, Award, CheckCircle2, AlertTriangle, HelpCircle,
  ArrowUpRight, ShieldCheck
} from "lucide-react";

interface PromotionEquityCardProps {
  companyName: string;
  dbCompanyId: string;
}

const EQUITY_CATEGORIES = [
  { key: "internal_promotion", label: "Promotes From Within", icon: TrendingUp, color: "text-primary" },
  { key: "women_leadership", label: "Women in Leadership / Promotions", icon: Users, color: "text-pink-500" },
  { key: "minority_advancement", label: "Minority Advancement", icon: Award, color: "text-amber-500" },
  { key: "deaf_accessibility", label: "Deaf / Hard-of-Hearing Inclusion", icon: Ear, color: "text-blue-500" },
  { key: "learning_disability", label: "Learning Disability Support", icon: Brain, color: "text-purple-500" },
  { key: "hbcu_pipeline", label: "HBCU Pipeline / Partnerships", icon: School, color: "text-green-600" },
  { key: "no_degree", label: "No-Degree Pathways", icon: GraduationCap, color: "text-orange-500" },
];

function getSignalStatus(signals: any[], category: string) {
  const matching = signals.filter(s => s.value_category === category);
  if (matching.length === 0) return "none";
  const hasDirectEvidence = matching.some(s => s.confidence === "direct");
  return hasDirectEvidence ? "strong" : "signal";
}

export function PromotionEquityCard({ companyName, dbCompanyId }: PromotionEquityCardProps) {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signals, isLoading } = useQuery({
    queryKey: ["promotion-equity-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_values_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .in("value_category", EQUITY_CATEGORIES.map(c => c.key))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const hasSignals = (signals?.length || 0) > 0;

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("values-scan", {
        body: { companyId: dbCompanyId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");
      toast({
        title: "Promotion equity scan complete",
        description: `Found ${data.signalsFound || 0} signals across all value categories.`,
      });
      queryClient.invalidateQueries({ queryKey: ["promotion-equity-signals", dbCompanyId] });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const statusConfig = {
    strong: { icon: CheckCircle2, label: "Evidence Found", badgeClass: "bg-primary/10 text-primary border-primary/20" },
    signal: { icon: ArrowUpRight, label: "Signal Detected", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    none: { icon: HelpCircle, label: "No Evidence", badgeClass: "bg-muted text-muted-foreground border-border" },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Promotion Equity & Internal Mobility
          </CardTitle>
          <Button
            onClick={handleScan}
            disabled={scanning}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {scanning ? "Scanning…" : "Scan"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Does {companyName} promote from within? Are women, minorities, deaf individuals, people with learning disabilities, HBCU grads, and non-degree holders part of the pipeline?
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category grid */}
            <div className="grid gap-2">
              {EQUITY_CATEGORIES.map((cat) => {
                const status = getSignalStatus(signals || [], cat.key);
                const config = statusConfig[status];
                const matching = (signals || []).filter((s: any) => s.value_category === cat.key);
                const StatusIcon = config.icon;

                return (
                  <div
                    key={cat.key}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      status === "strong" && "border-primary/20 bg-primary/[0.02]",
                      status === "signal" && "border-amber-500/20 bg-amber-500/[0.02]",
                      status === "none" && "border-border bg-muted/30"
                    )}
                  >
                    <cat.icon className={cn("w-4 h-4 mt-0.5 shrink-0", cat.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                        <Badge variant="outline" className={cn("text-[10px] gap-1", config.badgeClass)}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {config.label}
                        </Badge>
                      </div>
                      {matching.length > 0 ? (
                        <div className="space-y-1 mt-1">
                          {matching.slice(0, 3).map((s: any, i: number) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{s.signal_type}:</span>{" "}
                              {s.signal_summary}
                              {s.evidence_url && (
                                <a href={s.evidence_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5">
                                  source <ArrowUpRight className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          No public evidence detected. Click Scan to search.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {hasSignals && (
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {(signals || []).filter((s: any) => s.confidence === "direct").length} direct signals,{" "}
                    {(signals || []).filter((s: any) => s.confidence === "inferred").length} inferred
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Signals detected from career pages, press releases, diversity reports, ESG filings, and public partnerships.
                </p>
              </div>
            )}

            {!hasSignals && (
              <div className="text-center py-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click "Scan" to detect promotion equity signals from public sources.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Typically takes 30–60 seconds.</p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
              Sources: Diversity reports, career pages, press releases, HBCU partnerships, Skill-First hiring pledges, ESG filings.
              This tool reports public signals — it does not provide legal or employment advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
