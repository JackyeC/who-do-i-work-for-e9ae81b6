import { useState } from "react";
import { Bot, Loader2, ExternalLink, ShieldCheck, AlertTriangle, Eye, BrainCircuit, RefreshCw, Clock, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIHiringCardProps {
  companyName: string;
  dbCompanyId: string;
}

const confidenceColors: Record<string, string> = {
  direct: "text-civic-green border-civic-green/30",
  strong_inference: "text-blue-500 border-blue-500/30",
  moderate_inference: "text-civic-yellow border-civic-yellow/30",
  weak_inference: "text-muted-foreground border-border",
  unverified: "text-muted-foreground border-border",
};

const categoryIcons: Record<string, typeof Bot> = {
  "Recruiting & Screening": Bot,
  "Interview & Assessment": Eye,
  "Talent Management": BrainCircuit,
  "Workforce Analytics": BrainCircuit,
  "Employee Monitoring": Eye,
  "Compliance & Governance": ShieldCheck,
  "HR Automation": Bot,
};

const statusIcons: Record<string, string> = {
  auto_detected: "🔍",
  needs_review: "👁️",
  verified: "✅",
  disputed: "⚠️",
  archived: "📦",
};

function getSummaryLabels(signals: any[]): string[] {
  const labels: string[] = [];
  const categories = new Set(signals.map((s: any) => s.signal_category));
  const hasVerified = signals.some((s: any) => s.status === "verified");
  const hasBiasAudit = signals.some((s: any) =>
    s.signal_type?.toLowerCase().includes("bias audit")
  );
  const hasGovernance = signals.some((s: any) =>
    s.signal_type?.toLowerCase().includes("governance")
  );
  const hasMonitoring = categories.has("Employee Monitoring");

  if (signals.length > 0) labels.push("AI hiring tools detected");
  if (categories.has("Recruiting & Screening")) labels.push("Automated screening signals found");
  if (hasBiasAudit) labels.push("Bias audit publicly disclosed");
  if (hasGovernance) labels.push("AI governance policy available");
  if (hasMonitoring) labels.push("Employee monitoring signals detected");
  if (categories.has("Talent Management")) labels.push("Talent marketplace platform detected");
  if (hasVerified) labels.push("Signals independently verified");

  return labels;
}

export function AIHiringCard({ companyName, dbCompanyId }: AIHiringCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signals, isLoading } = useQuery({
    queryKey: ["ai-hr-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_hr_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("confidence", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-hr-scan", {
        body: { companyId: dbCompanyId, companyName },
      });
      if (error) throw error;
      if (data?.success) {
        toast({
          title: "AI/HR scan complete",
          description: data.signalsFound > 0
            ? `Found ${data.signalsFound} AI/hiring technology signals`
            : "No AI/hiring technology signals detected",
        });
        queryClient.invalidateQueries({ queryKey: ["ai-hr-signals", dbCompanyId] });
      } else {
        throw new Error(data?.error || "Scan failed");
      }
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const grouped = (signals || []).reduce((acc: Record<string, any[]>, s: any) => {
    const cat = s.signal_category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const hasSignals = (signals?.length || 0) > 0;
  const verifiedCount = signals?.filter((s: any) => s.status === "verified").length || 0;
  const autoCount = signals?.filter((s: any) => s.status === "auto_detected").length || 0;
  const summaryLabels = hasSignals ? getSummaryLabels(signals!) : [];
  const lastScanned = signals?.length
    ? signals.reduce((latest: string, s: any) => s.date_detected > latest ? s.date_detected : latest, signals[0].date_detected)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            Hiring Technology & AI Use
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastScanned && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(lastScanned).toLocaleDateString()}
              </span>
            )}
            <Button
              onClick={handleScan}
              disabled={isScanning}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isScanning ? "Scanning…" : "Scan"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasSignals ? (
          <div className="text-center py-6">
            <BrainCircuit className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No AI/hiring technology signals detected yet</p>
            <p className="text-xs text-muted-foreground">Click "Scan" to search public sources for evidence of AI or automated systems in hiring and HR.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary labels */}
            {summaryLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border">
                {summaryLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs gap-1">
                    <FileCheck className="w-3 h-3" />
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
              <Badge variant="secondary" className="gap-1">
                <Bot className="w-3 h-3" />
                {signals!.length} signal{signals!.length !== 1 ? "s" : ""} detected
              </Badge>
              {verifiedCount > 0 && (
                <Badge variant="outline" className="gap-1 text-civic-green border-civic-green/30">
                  <ShieldCheck className="w-3 h-3" />
                  {verifiedCount} verified
                </Badge>
              )}
              {autoCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  🔍 {autoCount} auto-detected
                </Badge>
              )}
            </div>

            {/* Grouped signals */}
            {Object.entries(grouped).map(([category, catSignals]) => {
              const Icon = categoryIcons[category] || Bot;
              return (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {(catSignals as any[]).map((signal: any) => (
                      <div
                        key={signal.id}
                        className="p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs">{statusIcons[signal.status] || "🔍"}</span>
                            <span className="font-medium text-sm text-foreground">{signal.signal_type}</span>
                            {signal.vendor_name && (
                              <Badge variant="secondary" className="text-xs">{signal.vendor_name}</Badge>
                            )}
                            {signal.tool_name && signal.tool_name !== signal.vendor_name && (
                              <Badge variant="outline" className="text-xs">{signal.tool_name}</Badge>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs shrink-0 capitalize", confidenceColors[signal.confidence] || "")}
                          >
                            {(signal.confidence || "").replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {signal.evidence_text && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{signal.evidence_text}"</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {signal.source_type && (
                            <span className="text-xs text-muted-foreground">
                              Source: {signal.source_type}
                            </span>
                          )}
                          {signal.detection_method && (
                            <span className="text-xs text-muted-foreground">
                              Method: {signal.detection_method.replace(/_/g, " ")}
                            </span>
                          )}
                          {signal.source_url && (
                            <a
                              href={signal.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
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

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Signals are auto-detected from public sources and do not constitute proof of specific practices. 
              Information is provided for transparency purposes only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
