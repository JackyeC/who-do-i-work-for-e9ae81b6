import { useState } from "react";
import {
  Shield, Loader2, ExternalLink, RefreshCw, Clock, AlertTriangle,
  CheckCircle2, XCircle, Bot, Video, Search, Brain, FileCheck,
  AlertOctagon, Eye, CloudOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useScanWithFallback } from "@/hooks/use-scan-with-fallback";
import { SavedIntelligenceBadge } from "@/components/scan/ScanUnavailableBanner";

interface AIAccountabilityCardProps {
  companyName: string;
  dbCompanyId: string;
}

const categoryIcons: Record<string, typeof Bot> = {
  "Sourcing": Search,
  "Screening": Bot,
  "Interview Intelligence": Video,
  "Assessment": Brain,
  "ATS": FileCheck,
  "HCM": FileCheck,
  "Chatbot": Bot,
  "Analytics": Brain,
  "Talent Marketplace": Search,
  "Compliance": Shield,
};

const confidenceLabel = (score: number) => {
  if (score >= 0.8) return { text: "Strong evidence", className: "text-civic-green border-civic-green/30" };
  if (score >= 0.5) return { text: "Some evidence", className: "text-civic-yellow border-civic-yellow/30" };
  return { text: "Weak evidence", className: "text-muted-foreground border-border" };
};

function TransparencyGauge({ score }: { score: number }) {
  const color = score >= 70 ? "text-civic-green" : score >= 40 ? "text-civic-yellow" : "text-destructive";
  const bgColor = score >= 70 ? "bg-civic-green" : score >= 40 ? "bg-civic-yellow" : "bg-destructive";
  const label = score >= 70 ? "Transparent" : score >= 40 ? "Partial" : "Opaque";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Transparency Score</span>
          <span className={cn("text-sm font-bold", color)}>{score}/100</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", bgColor)}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", color)}>
        {label}
      </Badge>
    </div>
  );
}

export function AIAccountabilityCard({ companyName, dbCompanyId }: AIAccountabilityCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signals, isLoading } = useQuery({
    queryKey: ["ai-hiring-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_hiring_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("category", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const [firecrawlDown, setFirecrawlDown] = useState(false);

  const { runScan: handleScan, isFirecrawlDown, cooldownMinutes } = useScanWithFallback({
    functionName: "ai-accountability-scan",
    companyId: dbCompanyId,
    companyName,
    setLoading: setIsScanning,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-hiring-signals", dbCompanyId] });
    },
    onError: (reason) => {
      if (reason === 'firecrawl_error' || reason === 'circuit_open') setFirecrawlDown(true);
    },
  });

  const hasSignals = (signals?.length || 0) > 0;
  const vendors = signals?.filter((s: any) => s.signal_type !== 'Regulatory Disclosure') || [];
  const audits = signals?.filter((s: any) => s.signal_type === 'Regulatory Disclosure') || [];
  const transparencyScore = signals?.[0]?.transparency_score ?? null;

  const safepathRisks = vendors.filter((s: any) => {
    const flags = s.safepath_flags || [];
    return flags.includes('emotion_ai') || flags.includes('black_box_ranking') || flags.includes('facial_analysis');
  });

  const auditMissing = vendors.filter((s: any) => s.bias_audit_status === 'missing');
  const auditVerified = vendors.filter((s: any) => s.bias_audit_status === 'verified');

  const lastScanned = signals?.length ? signals[0].last_scanned : null;

  // Group vendors by category
  const vendorsByCategory = vendors.reduce((acc: Record<string, any[]>, s: any) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            AI Hiring Accountability
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
              disabled={isScanning || isFirecrawlDown}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFirecrawlDown ? <CloudOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isScanning ? "Scanning…" : isFirecrawlDown ? `Paused (~${cooldownMinutes}m)` : "Deep Scan"}
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
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No public evidence detected in scanned sources</p>
            <p className="text-xs text-muted-foreground">Click "Deep Scan" to search public sources for AI hiring technology signals.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Transparency Score */}
            {transparencyScore !== null && (
              <TransparencyGauge score={transparencyScore} />
            )}

            {/* Regulatory Status */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
              {auditVerified.length > 0 || audits.some((a: any) => a.bias_audit_status === 'verified') ? (
                <Badge className="gap-1 bg-civic-green/10 text-civic-green border-civic-green/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Bias Audit: Verified
                </Badge>
              ) : vendors.length > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  Audit Missing / Hidden
                </Badge>
              ) : null}

              {auditMissing.length > 0 && (
                <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                  <AlertTriangle className="w-3 h-3" />
                  {auditMissing.length} vendor{auditMissing.length !== 1 ? "s" : ""} without audit
                </Badge>
              )}

              <Badge variant="secondary" className="gap-1">
                <Bot className="w-3 h-3" />
                {vendors.length} AI tool{vendors.length !== 1 ? "s" : ""} detected
              </Badge>
            </div>

            {/* SafePath Check */}
            {safepathRisks.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2">
                  <AlertOctagon className="w-4 h-4" />
                  SafePath Risk Alert
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  The following vendor references include signals associated with algorithmic risk categories:
                </p>
                <div className="space-y-1.5">
                  {safepathRisks.map((s: any, i: number) => {
                    const flags = (s.safepath_flags || []) as string[];
                    return (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">{s.vendor_name}</span>
                        {flags.includes('emotion_ai') && (
                          <Badge variant="destructive" className="text-xs gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Emotion AI
                          </Badge>
                        )}
                        {flags.includes('black_box_ranking') && (
                          <Badge variant="destructive" className="text-xs gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Black-Box Ranking
                          </Badge>
                        )}
                        {flags.includes('facial_analysis') && (
                          <Badge variant="destructive" className="text-xs gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Facial Analysis
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* The Hiring Stack */}
            {Object.entries(vendorsByCategory).map(([category, catVendors]) => {
              const Icon = categoryIcons[category] || Bot;
              return (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {(catVendors as any[]).map((signal: any, i: number) => {
                      const conf = confidenceLabel(signal.confidence_score || 0);
                      return (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">
                                {signal.vendor_name || 'Unknown Vendor'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {signal.signal_type}
                              </Badge>
                              {signal.bias_audit_status === 'verified' && (
                                <Badge className="text-xs gap-0.5 bg-civic-green/10 text-civic-green border-civic-green/30">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Audited
                                </Badge>
                              )}
                              {signal.bias_audit_status === 'missing' && (
                                <Badge variant="destructive" className="text-xs gap-0.5">
                                  <XCircle className="w-2.5 h-2.5" /> No Audit
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className={cn("text-xs shrink-0", conf.className)}>
                              {conf.text}
                            </Badge>
                          </div>

                          {signal.evidence_text && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{signal.evidence_text}"</p>
                          )}

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {signal.evidence_url && (
                              <a
                                href={signal.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                Evidence <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {signal.bias_audit_link && (
                              <a
                                href={signal.bias_audit_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-civic-green hover:underline inline-flex items-center gap-0.5"
                              >
                                Bias Audit <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Compliance disclosures */}
            {audits.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Regulatory Disclosures
                </h4>
                <div className="space-y-2">
                  {audits.map((audit: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-civic-green" />
                        <span className="font-medium text-sm text-foreground">{audit.evidence_text || 'Regulatory disclosure found'}</span>
                      </div>
                      {audit.evidence_url && (
                        <a
                          href={audit.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 mt-1"
                        >
                          View disclosure <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Signals are detected from publicly available sources and presented with confidence levels.
              No conclusions are drawn. Interpretation is left to the user.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
