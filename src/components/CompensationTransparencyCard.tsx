import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, Search, ExternalLink, Loader2, ShieldCheck,
  AlertTriangle, FileText, Scale, BarChart3, Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  companyName: string;
  dbCompanyId?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof DollarSign }> = {
  pay_reporting: { label: "Pay Reporting", icon: BarChart3 },
  salary_transparency: { label: "Salary Transparency", icon: DollarSign },
  workforce_disclosure: { label: "Workforce Disclosure", icon: Briefcase },
  litigation: { label: "Litigation", icon: AlertTriangle },
  certification: { label: "Certification", icon: ShieldCheck },
  compensation_policy: { label: "Compensation Policy", icon: FileText },
  public_commitment: { label: "Public Commitment", icon: Scale },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  direct: "bg-civic-green/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  strong_inference: "bg-civic-blue/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30",
  moderate_inference: "bg-civic-yellow/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  weak_inference: "bg-muted text-muted-foreground border-border",
  unverified: "bg-muted text-muted-foreground border-border",
};

export function CompensationTransparencyCard({ companyName, dbCompanyId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  const { data: signals, isLoading } = useQuery({
    queryKey: ["pay-equity-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pay_equity_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId!)
        .order("date_detected", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const handleScan = async () => {
    if (!dbCompanyId) return;
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("pay-equity-scan", {
        body: { companyId: dbCompanyId, companyName },
      });
      if (error) throw error;
      toast({
        title: "Pay equity scan complete",
        description: `Found ${data?.signalsFound || 0} compensation transparency signals.`,
      });
      queryClient.invalidateQueries({ queryKey: ["pay-equity-signals", dbCompanyId] });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  // Group signals by category
  const grouped = (signals || []).reduce<Record<string, any[]>>((acc, s) => {
    const cat = s.signal_category || "pay_reporting";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const allCategories = Object.keys(CATEGORY_META);
  const detectedCategories = Object.keys(grouped);
  const missingCategories = allCategories.filter(c => !detectedCategories.includes(c));

  const lastScanned = signals?.[0]?.date_detected
    ? new Date(signals[0].date_detected).toLocaleDateString()
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Compensation Transparency & Equity Signals
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleScan}
            disabled={isScanning || !dbCompanyId}
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {isScanning ? "Scanning..." : "Scan"}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Public evidence of pay equity practices, salary transparency, and compensation disclosure.
          {lastScanned && <span className="ml-1">Last scanned: {lastScanned}</span>}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (signals || []).length === 0 && !isScanning ? (
          <div className="text-center py-6 text-muted-foreground">
            <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              We scanned public sources and did not detect pay equity or compensation transparency signals yet.
            </p>
            <p className="text-xs mt-1">Click Scan to search public sources for this company.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Detected signals grouped by category */}
            {detectedCategories.map(cat => {
              const meta = CATEGORY_META[cat] || { label: cat, icon: FileText };
              const Icon = meta.icon;
              return (
                <div key={cat} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {grouped[cat].length} signal{grouped[cat].length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {grouped[cat].map((signal: any) => (
                      <div key={signal.id} className="bg-muted/50 rounded-md p-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{signal.signal_type}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] shrink-0", CONFIDENCE_STYLES[signal.confidence] || CONFIDENCE_STYLES.moderate_inference)}
                          >
                            {signal.confidence?.replace("_", " ")}
                          </Badge>
                        </div>
                        {signal.evidence_text && (
                          <p className="text-xs text-muted-foreground mb-1">"{signal.evidence_text}"</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {signal.source_type && (
                            <span className="text-[10px] text-muted-foreground">
                              Source: {signal.source_type}
                            </span>
                          )}
                          {signal.jurisdiction && (
                            <Badge variant="outline" className="text-[10px]">
                              {signal.jurisdiction}
                            </Badge>
                          )}
                          {signal.source_url && (
                            <a
                              href={signal.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              View source <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Missing categories */}
            {missingCategories.length > 0 && (
              <div className="border border-dashed border-border rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Not Detected in Public Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {missingCategories.map(cat => {
                    const meta = CATEGORY_META[cat] || { label: cat, icon: FileText };
                    return (
                      <Badge key={cat} variant="outline" className="text-[10px] text-muted-foreground">
                        {meta.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
          This module presents publicly available evidence about compensation transparency. It does not adjudicate employer pay practices or make legal conclusions.
        </p>
      </CardContent>
    </Card>
  );
}
