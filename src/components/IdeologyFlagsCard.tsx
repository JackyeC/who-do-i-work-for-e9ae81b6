import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Loader2, ChevronDown, ChevronUp, Eye, BookOpen,
  Scale, HeartOff, Factory, Vote, Thermometer, Baby, Building, CloudOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { ExplainableMetric } from "@/components/ExplainableMetric";
import { useScanWithFallback } from "@/hooks/use-scan-with-fallback";

interface IdeologyFlag {
  orgName: string;
  category: string;
  relationshipType: string;
  description: string;
  amount?: number;
  evidenceUrl?: string;
  severity: string;
  confidence: string;
}

interface ScanResult {
  flags: IdeologyFlag[];
  summary: string;
  riskLevel: string;
  flagCount: number;
  alertCount: number;
}

interface Props {
  companyName: string;
  dbCompanyId?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  christian_nationalism: { label: "Christian Nationalism", icon: BookOpen, color: "text-purple-600" },
  white_supremacy: { label: "White Supremacy", icon: AlertTriangle, color: "text-civic-red" },
  anti_lgbtq: { label: "Anti-LGBTQ+", icon: HeartOff, color: "text-pink-600" },
  anti_labor: { label: "Anti-Labor", icon: Factory, color: "text-orange-600" },
  voter_suppression: { label: "Voter Suppression", icon: Vote, color: "text-civic-red" },
  climate_denial: { label: "Climate Denial", icon: Thermometer, color: "text-amber-600" },
  anti_reproductive_rights: { label: "Anti-Reproductive Rights", icon: Baby, color: "text-rose-600" },
  privatization: { label: "Privatization", icon: Building, color: "text-slate-600" },
};

function severityBadge(severity: string) {
  if (severity === "critical") return "bg-civic-red/10 text-civic-red border-civic-red/30";
  if (severity === "high") return "bg-orange-500/10 text-orange-600 border-orange-500/30";
  if (severity === "medium") return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  return "text-muted-foreground";
}

function riskLevelStyle(level: string) {
  if (level === "critical") return "bg-civic-red/10 text-civic-red border-civic-red/30";
  if (level === "high") return "bg-orange-500/10 text-orange-600 border-orange-500/30";
  if (level === "medium") return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30";
  if (level === "low") return "bg-civic-green/10 text-civic-green border-civic-green/30";
  return "text-muted-foreground";
}

function relationshipLabel(type: string) {
  const map: Record<string, string> = {
    direct_funding: "Direct Funding",
    pac_contribution: "PAC Contribution",
    executive_donation: "Executive Donation",
    board_membership: "Board Membership",
    trade_association: "Trade Association",
    lobbying_alignment: "Lobbying Alignment",
    event_sponsorship: "Event Sponsorship",
    foundation_grant: "Foundation Grant",
  };
  return map[type] || type.replace(/_/g, " ");
}

export function IdeologyFlagsCard({ companyName, dbCompanyId }: Props) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [liveFlags, setLiveFlags] = useState<any[]>([]);

  // Realtime ideology flag updates
  useEffect(() => {
    if (!dbCompanyId) return;

    const channel = supabase
      .channel(`ideology-${dbCompanyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'company_ideology_flags',
        filter: `company_id=eq.${dbCompanyId}`,
      }, (payload) => {
        setLiveFlags(prev => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dbCompanyId]);

  const [firecrawlDown, setFirecrawlDown] = useState(false);

  const { runScan, isFirecrawlDown, cooldownMinutes } = useScanWithFallback({
    functionName: "ideology-scan",
    companyId: dbCompanyId,
    companyName,
    setLoading: setScanning,
    onSuccess: (data) => {
      if (data?.data) setResult(data.data);
    },
    onError: (reason) => {
      if (reason === 'firecrawl_error' || reason === 'circuit_open') setFirecrawlDown(true);
    },
  });

  // Group flags by category
  const flagsByCategory = (result?.flags || []).reduce<Record<string, IdeologyFlag[]>>((acc, flag) => {
    (acc[flag.category] = acc[flag.category] || []).push(flag);
    return acc;
  }, {});

  const totalFlags = result?.flagCount || 0;

  return (
    <Card className={cn(
      totalFlags > 0 && result?.riskLevel === "critical" && "border-civic-red/30",
      totalFlags > 0 && result?.riskLevel === "high" && "border-orange-500/30"
    )}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Organizational Affiliation Signals
          {result && (
            <Badge className={cn("ml-auto text-xs", riskLevelStyle(result.riskLevel))}>
              Risk: {result.riskLevel}
            </Badge>
          )}
        </CardTitle>
        <ExplainableMetric metricKey="flagged-organization">
          <p className="text-xs text-muted-foreground">
            Public signals of corporate affiliations with organizations tracked by SPLC, ADL, and curated watchlists.
            Signals are presented with source links and evidence strength ratings. <span className="underline decoration-dotted">What is a "flagged organization"?</span>
          </p>
        </ExplainableMetric>
      </CardHeader>
      <CardContent>
        {/* Live updates indicator */}
        {liveFlags.length > 0 && (
          <div className="mb-4 p-2 bg-civic-red/5 rounded-lg border border-civic-red/20 text-xs">
            <div className="flex items-center gap-1 text-civic-red font-medium">
              <div className="w-2 h-2 rounded-full bg-civic-red animate-pulse" />
              {liveFlags.length} new flag{liveFlags.length > 1 ? 's' : ''} detected in real-time
            </div>
          </div>
        )}

        {!result ? (
          <div className="text-center py-6">
            <Button onClick={runScan} disabled={scanning || !dbCompanyId || isFirecrawlDown} variant="outline">
              {scanning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning ideological ties...</>
              ) : isFirecrawlDown ? (
                <><CloudOff className="w-4 h-4 mr-2" /> Paused (~{cooldownMinutes}m)</>
              ) : (
                "Run Ideology Scan"
              )}
            </Button>
            {!dbCompanyId && <p className="text-xs text-muted-foreground mt-2">No database ID linked.</p>}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            {result.summary && (
              <div className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                {result.summary.slice(0, 400)}{result.summary.length > 400 && "..."}
              </div>
            )}

            {/* Category breakdown */}
            {totalFlags === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No public affiliation signals detected in scanned sources.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(flagsByCategory).map(([category, flags]) => {
                  const config = CATEGORY_CONFIG[category] || { label: category, icon: AlertTriangle, color: "text-muted-foreground" };
                  const Icon = config.icon;

                  return (
                    <div key={category}>
                      <div className={cn("flex items-center gap-2 text-sm font-semibold mb-2", config.color)}>
                        <Icon className="w-4 h-4" />
                        {config.label} ({flags.length})
                      </div>
                      <div className="space-y-2">
                        {flags.slice(0, expanded ? undefined : 3).map((flag, i) => (
                          <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-foreground">{flag.orgName}</span>
                                <Badge className={cn("text-xs", severityBadge(flag.severity))}>{flag.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{relationshipLabel(flag.relationshipType)}</Badge>
                              </div>
                              {flag.amount && (
                                <span className="text-sm font-bold text-foreground shrink-0">
                                  {formatCurrency(flag.amount)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                            {flag.evidenceUrl && (
                              <a href={flag.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 inline-block">
                                View evidence →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {totalFlags > 3 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <><ChevronUp className="w-3 h-3 mr-1" /> Show less</> : <><ChevronDown className="w-3 h-3 mr-1" /> Show all {totalFlags} flags</>}
                  </Button>
                )}
              </div>
            )}

            {result.alertCount > 0 && (
              <p className="text-xs text-civic-red font-medium">
                ⚡ {result.alertCount} critical/high alerts generated
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
          Signals are detected from publicly available sources (SPLC, ADL, FEC filings, InfluenceWatch, Senate LDA, news reports) and presented with evidence strength ratings. No conclusions are drawn. Interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}
