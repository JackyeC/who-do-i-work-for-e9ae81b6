import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Loader2, Globe, ShieldAlert, Factory, ChevronDown, ChevronUp, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";

interface AgencyContract {
  agencyName: string;
  agencyAcronym?: string;
  description: string;
  estimatedValue?: number;
  controversyFlag: boolean;
  notableCategory?: string;
  notableDescription?: string;
  source?: string;
  confidence: string;
}

interface SupplyChainFlag {
  country: string;
  flagType: string;
  description: string;
  severity: string;
  entityName?: string;
  source?: string;
  confidence: string;
}

interface InternationalEntry {
  country: string;
  influenceType: string;
  entityName?: string;
  description: string;
  amount?: number;
  confidence: string;
}

interface ScanResult {
  agencyContracts: AgencyContract[];
  internationalInfluence: InternationalEntry[];
  supplyChainFlags: SupplyChainFlag[];
  summary: string;
  alertCount: number;
}

interface Props {
  companyName: string;
  dbCompanyId?: string;
}

function severityColor(severity: string) {
  if (severity === "high") return "text-civic-red border-civic-red/30 bg-civic-red/10";
  if (severity === "medium") return "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/10";
  return "text-muted-foreground";
}

function categoryLabel(cat?: string) {
  const map: Record<string, string> = {
    immigration_enforcement: "Immigration Enforcement",
    surveillance: "Surveillance",
    military: "Military/Defense",
    private_prisons: "Private Prisons",
    law_enforcement: "Law Enforcement",
  };
  return cat ? map[cat] || cat : "Unknown";
}

function flagTypeLabel(type: string) {
  const map: Record<string, string> = {
    forced_labor: "Forced Labor",
    human_rights: "Human Rights",
    authoritarian_regime: "Authoritarian Regime",
    conflict_minerals: "Conflict Minerals",
    environmental: "Environmental",
  };
  return map[type] || type;
}

export function AgencyContractsCard({ companyName, dbCompanyId }: Props) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Listen to realtime alerts
  useEffect(() => {
    if (!dbCompanyId) return;

    const channel = supabase
      .channel(`alerts-${dbCompanyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_alerts',
        filter: `company_id=eq.${dbCompanyId}`,
      }, (payload) => {
        setAlerts(prev => [payload.new as any, ...prev]);
      })
      .subscribe();

    // Load existing alerts
    supabase
      .from('scan_alerts' as any)
      .select('*')
      .eq('company_id', dbCompanyId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setAlerts(data as any[]);
      });

    return () => { supabase.removeChannel(channel); };
  }, [dbCompanyId]);

  const runScan = async () => {
    if (!dbCompanyId) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("agency-scan", {
        body: { companyId: dbCompanyId, companyName },
      });
      if (error) throw error;
      if (data?.success) setResult(data.data);
    } catch (e) {
      console.error("Agency scan error:", e);
    } finally {
      setScanning(false);
    }
  };

  const totalFlags = (result?.agencyContracts?.filter(c => c.controversyFlag).length || 0) +
    (result?.supplyChainFlags?.length || 0);
  // Note: "flags" here means "notable context items" — not judgments

  return (
    <Card className={cn(totalFlags > 0 && "border-civic-red/20")}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Federal Agency Contracts & Global Footprint
          {totalFlags > 0 && (
            <Badge className="ml-auto text-xs bg-muted text-muted-foreground border-border">
              {totalFlags} notes
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tracks contracts with ICE, CBP, DHS, DOD, NSA and other federal agencies. Includes FARA filings, 
          authoritarian regime ties, and supply chain labor concerns.
        </p>
      </CardHeader>
      <CardContent>
        {/* Realtime alerts */}
        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-civic-red animate-pulse" />
              Live Alerts
            </div>
            {alerts.slice(0, 3).map((alert: any, i: number) => (
              <div key={alert.id || i} className="flex items-start gap-2 p-2 bg-civic-red/5 rounded-lg border border-civic-red/20 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-civic-red shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{alert.title}</span>
                  {alert.description && <p className="text-muted-foreground mt-0.5">{alert.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!result ? (
          <div className="text-center py-6">
            <Button onClick={runScan} disabled={scanning || !dbCompanyId} variant="outline">
              {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning agencies & global ties...</> : "Run Agency & Global Scan"}
            </Button>
            {!dbCompanyId && <p className="text-xs text-muted-foreground mt-2">No database ID linked for this company.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            {result.summary && (
              <div className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                {result.summary.slice(0, 300)}{result.summary.length > 300 && "..."}
              </div>
            )}

            {/* Agency Contracts */}
            {result.agencyContracts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <Shield className="w-4 h-4" />
                  Federal Agency Contracts ({result.agencyContracts.length})
                </div>
                <div className="space-y-2">
                  {result.agencyContracts.slice(0, expanded ? undefined : 4).map((c, i) => (
                    <div key={i} className={cn("p-3 rounded-lg border", c.controversyFlag ? "border-primary/20 bg-primary/5" : "border-border")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{c.agencyAcronym || c.agencyName}</span>
                          {c.controversyFlag && <Info className="w-3.5 h-3.5 text-muted-foreground" />}
                          {c.notableCategory && (
                            <Badge variant="outline" className="text-xs">{categoryLabel(c.notableCategory)}</Badge>
                          )}
                        </div>
                        {c.estimatedValue && <span className="text-sm font-bold text-foreground">{formatCurrency(c.estimatedValue)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                      {c.notableDescription && <p className="text-xs text-muted-foreground mt-1 italic">{c.notableDescription}</p>}
                    </div>
                  ))}
                  {result.agencyContracts.length > 4 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
                      {expanded ? <><ChevronUp className="w-3 h-3 mr-1" /> Show less</> : <><ChevronDown className="w-3 h-3 mr-1" /> Show all {result.agencyContracts.length}</>}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* International Influence */}
            {result.internationalInfluence.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <Globe className="w-4 h-4" />
                  International Influence ({result.internationalInfluence.length})
                </div>
                <div className="space-y-2">
                  {result.internationalInfluence.map((entry, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{entry.country}</span>
                        <Badge variant="outline" className="text-xs capitalize">{entry.influenceType.replace(/_/g, ' ')}</Badge>
                      </div>
                      {entry.entityName && <div className="text-xs text-muted-foreground mt-0.5">{entry.entityName}</div>}
                      <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                      {entry.amount && <p className="text-xs font-medium text-foreground mt-1">{formatCurrency(entry.amount)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supply Chain Flags */}
            {result.supplyChainFlags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-civic-red mb-3">
                  <Factory className="w-4 h-4" />
                  Supply Chain Concerns ({result.supplyChainFlags.length})
                </div>
                <div className="space-y-2">
                  {result.supplyChainFlags.map((flag, i) => (
                    <div key={i} className="p-3 rounded-lg border border-civic-red/20 bg-civic-red/5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{flag.country}</span>
                        <Badge className={cn("text-xs", severityColor(flag.severity))}>{flagTypeLabel(flag.flagType)}</Badge>
                        <Badge variant="outline" className={cn("text-xs", severityColor(flag.severity))}>{flag.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                      {flag.source && <p className="text-xs text-muted-foreground mt-1">Source: {flag.source}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.alertCount > 0 && (
              <p className="text-xs text-civic-red font-medium">⚡ {result.alertCount} new alerts generated from this scan</p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
          Sources: USASpending.gov, SAM.gov, FARA.gov, news reports. Scans run weekly with real-time alerts for new findings.
        </p>
      </CardContent>
    </Card>
  );
}
