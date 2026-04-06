import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ShieldAlert, ShieldCheck, Bot, Eye, AlertTriangle, RefreshCw, Loader2,
  FileWarning, Video, BrainCircuit, Clock, CheckCircle2, XCircle
} from "lucide-react";

interface HiringTransparencyCardProps {
  companyName: string;
  dbCompanyId: string;
}

const PSYCH_SAFETY_KEYWORDS = [
  "sentiment ai", "emotion ai", "emotion detection", "emotion recognition",
  "video interview analysis", "facial analysis", "behavioral analysis",
  "voice analysis", "tone analysis", "personality assessment ai",
  "psychometric ai", "neuroscience-based",
];

const AUDIT_KEYWORDS = [
  "bias audit", "nyc local law 144", "aedt", "automated employment decision tool",
  "bias audit summary", "aedt disclosure", "algorithmic audit",
];

function isPsychSafetyRisk(signal: any): boolean {
  const text = `${signal.signal_type} ${signal.evidence_text} ${signal.tool_name || ""}`.toLowerCase();
  return PSYCH_SAFETY_KEYWORDS.some((kw) => text.includes(kw));
}

function hasBiasAudit(signal: any): boolean {
  const text = `${signal.signal_type} ${signal.evidence_text} ${signal.tool_name || ""}`.toLowerCase();
  return AUDIT_KEYWORDS.some((kw) => text.includes(kw));
}

export function HiringTransparencyCard({ companyName, dbCompanyId }: HiringTransparencyCardProps) {
  const [scanning, setScanning] = useState(false);
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

  // Also check ai_hiring_signals table for legacy data
  const { data: hiringSignals } = useQuery({
    queryKey: ["ai-hiring-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_hiring_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const allSignals = [...(signals || []), ...(hiringSignals || [])];
  const hasSignals = allSignals.length > 0;

  // Derive audit & safety status
  const detectedVendors = new Set<string>();
  let auditFound = false;
  let psychRisks: any[] = [];
  let transparencyWarning = false;

  allSignals.forEach((s) => {
    if (s.vendor_name) detectedVendors.add(s.vendor_name);
    if (s.tool_name) detectedVendors.add(s.tool_name);
    if (hasBiasAudit(s)) auditFound = true;
    if (isPsychSafetyRisk(s)) psychRisks.push(s);
  });

  // If AI tools detected but no bias audit → Transparency Warning
  if (hasSignals && !auditFound && detectedVendors.size > 0) {
    transparencyWarning = true;
  }

  const handleDeepDive = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("whodoiworkfor-intelligence-scan", {
        body: { companyId: dbCompanyId, companyName, scanParts: ['ai_hiring', 'audit_hunt'] },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");
      const aiCount = data.results?.aiHiring || 0;
      const auditStatus = data.results?.auditStatus || 'unknown';
      toast({
        title: "Deep Dive complete",
        description: aiCount > 0
          ? `Found ${aiCount} AI hiring signals. Audit status: ${auditStatus === 'audit_found' ? 'Bias audit found ✅' : 'No audit found ⚠️'}`
          : "No AI hiring signals detected",
      });
      queryClient.invalidateQueries({ queryKey: ["ai-hr-signals", dbCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["ai-hiring-signals", dbCompanyId] });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const overallStatus = !hasSignals
    ? "unknown"
    : auditFound
    ? "audited"
    : transparencyWarning
    ? "warning"
    : "clean";

  const statusConfig = {
    unknown: { icon: Bot, label: "Not Scanned", color: "text-muted-foreground", bg: "bg-muted/50" },
    audited: { icon: ShieldCheck, label: "Bias Audit Found", color: "text-civic-green", bg: "bg-civic-green/5" },
    warning: { icon: ShieldAlert, label: "Transparency Warning", color: "text-civic-red", bg: "bg-civic-red/5" },
    clean: { icon: CheckCircle2, label: "No AI Tools Detected", color: "text-civic-green", bg: "bg-civic-green/5" },
  };

  const status = statusConfig[overallStatus];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            2026 Hiring Transparency Report
          </CardTitle>
          <Button
            onClick={handleDeepDive}
            disabled={scanning}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {scanning ? "Scanning…" : "Deep Dive"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Detects AI hiring vendors, checks for NYC Local Law 144 / AEDT bias audits, and flags psychological safety risks.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Status Badge */}
            <div className={cn("flex items-center gap-3 p-4 rounded-lg border border-border", status.bg)}>
              <StatusIcon className={cn("w-6 h-6", status.color)} />
              <div>
                <div className={cn("font-semibold text-sm", status.color)}>{status.label}</div>
                <div className="text-xs text-muted-foreground">
                  {overallStatus === "warning"
                    ? `${detectedVendors.size} AI tool(s) detected with no public bias audit disclosure.`
                    : overallStatus === "audited"
                    ? "Company has published a bias audit or AEDT disclosure."
                    : overallStatus === "clean"
                    ? "No AI hiring tools detected in public sources."
                    : "AI hiring tool detection updates automatically during scans."}
                </div>
              </div>
            </div>

            {/* Detected AI Vendors */}
            {detectedVendors.size > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Detected AI Vendors ({detectedVendors.size})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(detectedVendors).map((vendor) => (
                    <Badge key={vendor} variant="secondary" className="text-xs gap-1">
                      <BrainCircuit className="w-3 h-3" />
                      {vendor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bias Audit Status */}
            {hasSignals && (
              <div className={cn(
                "p-3 rounded-lg border",
                auditFound ? "border-civic-green/30 bg-civic-green/5" : "border-civic-red/30 bg-civic-red/5"
              )}>
                <div className="flex items-center gap-2">
                  {auditFound ? (
                    <ShieldCheck className="w-4 h-4 text-civic-green" />
                  ) : (
                    <FileWarning className="w-4 h-4 text-civic-red" />
                  )}
                  <span className={cn("text-sm font-medium", auditFound ? "text-civic-green" : "text-civic-red")}>
                    {auditFound ? "Bias Audit Disclosed" : "No Bias Audit Found"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {auditFound
                    ? "A bias audit summary or AEDT disclosure was found in public sources."
                    : "NYC Local Law 144 requires bias audits for automated employment decision tools. No public audit was detected."}
                </p>
              </div>
            )}

            {/* Psychological Safety Flags */}
            {psychRisks.length > 0 && (
              <div className="p-3 rounded-lg border border-civic-red/30 bg-civic-red/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-civic-red" />
                  <span className="text-sm font-medium text-civic-red">
                    Psychological Safety Flag
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Company uses Sentiment AI or Video Interview Analysis without a verified audit.
                  These tools may disproportionately impact candidates from marginalized communities.
                </p>
                <div className="space-y-1.5">
                  {psychRisks.map((risk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Video className="w-3 h-3 text-civic-red shrink-0" />
                      <span className="text-foreground font-medium">{risk.signal_type || risk.tool_name}</span>
                      {risk.vendor_name && (
                        <Badge variant="outline" className="text-xs">{risk.vendor_name}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasSignals && overallStatus === "unknown" && (
              <div className="text-center py-4">
                <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click "Deep Dive" to scan for AI hiring tools and bias audits.</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Sources: Career pages, job listings, vendor integrations, public AEDT disclosures.
              Psychological safety flags follow SafePath methodology for protecting vulnerable candidates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
