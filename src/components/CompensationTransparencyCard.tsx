import { useState } from "react";
import { safeSignalLabel, normalizeCategory } from "@/utils/signalTextSanitizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, Search, ExternalLink, Loader2, ShieldCheck,
  AlertTriangle, FileText, Scale, BarChart3, Briefcase, TrendingDown,
  Users, Bot, Calendar, Info, CloudOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useScanWithFallback } from "@/hooks/use-scan-with-fallback";
import { SavedIntelligenceBadge } from "@/components/scan/ScanUnavailableBanner";
import { SignalMeta } from "@/components/SignalMeta";

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
  vendor_detection: { label: "Pay Analytics Vendor", icon: Bot },
  gap_metrics: { label: "Gap Metrics", icon: TrendingDown },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  direct: "bg-civic-green/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  strong_inference: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  moderate_inference: "bg-civic-yellow/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  weak_inference: "bg-muted text-muted-foreground border-border",
  unverified: "bg-muted text-muted-foreground border-border",
};

// BLS / AAUW reference data (static benchmarks)
const NATIONAL_BENCHMARKS = {
  bls: { label: "BLS (2024)", gap: 83, source: "https://www.bls.gov/cps/earnings.htm" },
  aauw: { label: "AAUW (2024)", gap: 84, source: "https://www.aauw.org/resources/research/simple-truth/" },
  equalPayDates: [
    { group: "All Women", date: "March 12", color: "bg-primary" },
    { group: "AAPI Women", date: "April 3", color: "bg-blue-500" },
    { group: "Black Women", date: "July 9", color: "bg-purple-500" },
    { group: "Native Women", date: "Sept 21", color: "bg-amber-600" },
    { group: "Latina Women", date: "Oct 3", color: "bg-red-500" },
  ],
};

function GapBar({ label, cents, color }: { label: string; cents: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${cents}%` }} />
      </div>
      <span className="text-xs font-bold text-foreground w-10 text-right">{cents}¢</span>
    </div>
  );
}

export function CompensationTransparencyCard({ companyName, dbCompanyId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scanExtras, setScanExtras] = useState<{
    gapMetrics?: any;
    vendorsDetected?: string[];
    hasPayAudit?: boolean;
    salaryRangesInPostings?: boolean;
  } | null>(null);

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

  const [firecrawlDown, setFirecrawlDown] = useState(false);

  const { runScan: handleScan, isFirecrawlDown, cooldownMinutes } = useScanWithFallback({
    functionName: "pay-equity-scan",
    companyId: dbCompanyId,
    companyName,
    setLoading: setIsScanning,
    onSuccess: (data) => {
      setScanExtras({
        gapMetrics: data?.gapMetrics,
        vendorsDetected: data?.vendorsDetected,
        hasPayAudit: data?.hasPayAudit,
        salaryRangesInPostings: data?.salaryRangesInPostings,
      });
      queryClient.invalidateQueries({ queryKey: ["pay-equity-signals", dbCompanyId] });
    },
    onError: (reason) => {
      if (reason === 'firecrawl_error') setFirecrawlDown(true);
    },
  });

  const grouped = (signals || []).reduce<Record<string, any[]>>((acc, s) => {
    const cat = normalizeCategory(s.signal_category || "pay_reporting");
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

  const gapMetrics = scanExtras?.gapMetrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Compensation Transparency & Pay Equity
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleScan}
            disabled={isScanning || !dbCompanyId || isFirecrawlDown}
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFirecrawlDown ? <CloudOff className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            {isScanning ? "Scanning..." : isFirecrawlDown ? `Paused (~${cooldownMinutes}m)` : "Scan"}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Gender/racial pay gaps, salary transparency, pay audits, analytics vendors, and Equal Pay Day benchmarks.
          {lastScanned && <span className="ml-1">Last scanned: {lastScanned}</span>}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* ─── National Benchmark Context ─────────────────────── */}
            <div className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">National Pay Gap Benchmark</span>
              </div>
              <div className="space-y-2 mb-3">
                <GapBar label="BLS (2024)" cents={83} color="bg-primary" />
                <GapBar label="AAUW" cents={84} color="bg-primary/70" />
                {gapMetrics?.gender_pay_gap_pct && (
                  <GapBar
                    label={companyName.slice(0, 12)}
                    cents={Math.round(100 - gapMetrics.gender_pay_gap_pct)}
                    color={gapMetrics.gender_pay_gap_pct > 20 ? "bg-destructive" : gapMetrics.gender_pay_gap_pct > 10 ? "bg-civic-yellow" : "bg-civic-green"}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>Sources:</span>
                <a href={NATIONAL_BENCHMARKS.bls.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">BLS</a>
                <span>·</span>
                <a href={NATIONAL_BENCHMARKS.aauw.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">AAUW</a>
              </div>
            </div>

            {/* ─── Equal Pay Day Timeline ─────────────────────────── */}
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Equal Pay Day (2025)</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                How far into the next year women must work to match men's prior-year earnings.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {NATIONAL_BENCHMARKS.equalPayDates.map((d) => (
                  <Badge key={d.group} variant="outline" className="text-[10px] gap-1">
                    <div className={cn("w-2 h-2 rounded-full", d.color)} />
                    {d.group}: {d.date}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ─── Detected Vendors ──────────────────────────────── */}
            {(scanExtras?.vendorsDetected?.length || 0) > 0 && (
              <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Pay Analytics Vendors Detected</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scanExtras!.vendorsDetected!.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  These tools analyze payroll data to detect statistically unexplained pay gaps. Detection suggests the company is actively monitoring pay equity.
                </p>
              </div>
            )}

            {/* ─── Pay Audit & Salary Transparency Status ────────── */}
            {scanExtras && (
              <div className="grid grid-cols-2 gap-2">
                <div className={cn(
                  "p-3 rounded-lg border text-center",
                  scanExtras.hasPayAudit ? "border-civic-green/30 bg-civic-green/5" : "border-border bg-muted/30"
                )}>
                  {scanExtras.hasPayAudit ? (
                    <ShieldCheck className="w-5 h-5 text-civic-green mx-auto mb-1" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  )}
                  <div className={cn("text-xs font-semibold", scanExtras.hasPayAudit ? "text-civic-green" : "text-muted-foreground")}>
                    {scanExtras.hasPayAudit ? "Pay Audit Detected" : "No Pay Audit Found"}
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border text-center",
                  scanExtras.salaryRangesInPostings ? "border-civic-green/30 bg-civic-green/5" : "border-border bg-muted/30"
                )}>
                  {scanExtras.salaryRangesInPostings ? (
                    <DollarSign className="w-5 h-5 text-civic-green mx-auto mb-1" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  )}
                  <div className={cn("text-xs font-semibold", scanExtras.salaryRangesInPostings ? "text-civic-green" : "text-muted-foreground")}>
                    {scanExtras.salaryRangesInPostings ? "Salary Ranges Posted" : "No Salary Ranges Found"}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Company Gap Metrics (if disclosed) ────────────── */}
            {gapMetrics && (gapMetrics.gender_pay_gap_pct || gapMetrics.racial_pay_gap_pct || gapMetrics.ceo_worker_ratio) && (
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Disclosed Gap Metrics {gapMetrics.disclosed_year ? `(${gapMetrics.disclosed_year})` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {gapMetrics.gender_pay_gap_pct && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">{gapMetrics.gender_pay_gap_pct}%</div>
                      <div className="text-[10px] text-muted-foreground">Gender Gap</div>
                    </div>
                  )}
                  {gapMetrics.racial_pay_gap_pct && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">{gapMetrics.racial_pay_gap_pct}%</div>
                      <div className="text-[10px] text-muted-foreground">Racial Gap</div>
                    </div>
                  )}
                  {gapMetrics.ceo_worker_ratio && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">{gapMetrics.ceo_worker_ratio}:1</div>
                      <div className="text-[10px] text-muted-foreground">CEO-Worker Ratio</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Detected Signals by Category ──────────────────── */}
            {(signals || []).length === 0 && !isScanning ? (
              <div className="text-center py-4 text-muted-foreground">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No company-specific pay equity signals detected yet.</p>
                <p className="text-xs mt-1">Click Scan to search public sources for {companyName}.</p>
              </div>
            ) : (
              <>
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
                              <span className="text-sm font-medium text-foreground">{safeSignalLabel(signal.signal_type, "Compensation Signal")}</span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] shrink-0", CONFIDENCE_STYLES[signal.confidence] || CONFIDENCE_STYLES.moderate_inference)}
                              >
                                {signal.confidence?.replace("_", " ")}
                              </Badge>
                            </div>
                            <SignalMeta
                              sourceType={signal.source_type}
                              detectionMethod={signal.detection_method}
                              confidence={signal.confidence}
                              sourceUrl={signal.source_url}
                              evidenceText={signal.evidence_text}
                              detectedAt={signal.date_detected}
                              lastVerifiedAt={signal.last_verified}
                              compact
                            />
                            {signal.jurisdiction && (
                              <Badge variant="outline" className="text-[10px] mt-1">{signal.jurisdiction}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {missingCategories.length > 0 && (
                  <div className="border border-dashed border-border rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Not Detected in Public Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingCategories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-[10px] text-muted-foreground">
                          {CATEGORY_META[cat]?.label || cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
          National benchmarks from BLS & AAUW. Company signals detected from public sources. No legal conclusions drawn.
          There is no real-time "gender pay gap alert system" yet — this is as close as it gets.
        </p>
      </CardContent>
    </Card>
  );
}
