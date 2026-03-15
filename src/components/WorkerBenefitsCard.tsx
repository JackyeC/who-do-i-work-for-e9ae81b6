import { useState } from "react";
import { Heart, Loader2, ExternalLink, RefreshCw, Clock, Baby, Brain, GraduationCap, Home, Shield, Briefcase, Users, Wallet, HeartPulse, FileCheck, CloudOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SignalMeta } from "@/components/SignalMeta";
import { useScanWithFallback } from "@/hooks/use-scan-with-fallback";
import { SavedIntelligenceBadge } from "@/components/scan/ScanUnavailableBanner";

interface WorkerBenefitsCardProps {
  companyName: string;
  dbCompanyId: string;
}

const confidenceColors: Record<string, string> = {
  direct: "text-civic-green border-civic-green/30",
  strong_inference: "text-blue-500 border-blue-500/30",
  moderate_inference: "text-civic-yellow border-civic-yellow/30",
  weak_inference: "text-muted-foreground border-border",
};

const categoryIcons: Record<string, typeof Heart> = {
  "Healthcare": HeartPulse,
  "Parental Leave": Baby,
  "Paid Sick Leave": Shield,
  "Mental Health": Brain,
  "Fertility Benefits": Heart,
  "Retirement": Wallet,
  "Remote Work": Home,
  "Childcare": Baby,
  "Education Benefits": GraduationCap,
  "Union Relationships": Users,
  "Caregiver Leave": Heart,
  "Paid Time Off": Briefcase,
  "Disability Benefits": Shield,
  "Life Insurance": Shield,
  "Equity & Stock": Wallet,
};

const ALL_CATEGORIES = [
  "Healthcare", "Parental Leave", "Paid Sick Leave", "Mental Health",
  "Fertility Benefits", "Retirement", "Remote Work", "Childcare",
  "Education Benefits", "Union Relationships", "Caregiver Leave",
  "Paid Time Off", "Disability Benefits", "Life Insurance", "Equity & Stock",
];

export function WorkerBenefitsCard({ companyName, dbCompanyId }: WorkerBenefitsCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signals, isLoading } = useQuery({
    queryKey: ["worker-benefit-signals", dbCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_benefit_signals" as any)
        .select("*")
        .eq("company_id", dbCompanyId)
        .order("benefit_category", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbCompanyId,
  });

  const [firecrawlDown, setFirecrawlDown] = useState(false);

  const { runScan: handleScan, isFirecrawlDown, cooldownMinutes } = useScanWithFallback({
    functionName: "worker-benefits-scan",
    companyId: dbCompanyId,
    companyName,
    setLoading: setIsScanning,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["worker-benefit-signals", dbCompanyId] });
    },
    onError: (reason) => {
      if (reason === 'firecrawl_error' || reason === 'circuit_open') setFirecrawlDown(true);
    },
  });

  const grouped = (signals || []).reduce((acc: Record<string, any[]>, s: any) => {
    const cat = s.benefit_category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const hasSignals = (signals?.length || 0) > 0;
  const detectedCategories = new Set(Object.keys(grouped));
  const missingCategories = ALL_CATEGORIES.filter(c => !detectedCategories.has(c));

  const lastScanned = signals?.length
    ? signals.reduce((latest: string, s: any) => s.date_detected > latest ? s.date_detected : latest, signals[0].date_detected)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Worker Benefits & Protections
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
              {isScanning ? "Scanning…" : isFirecrawlDown ? `Paused (~${cooldownMinutes}m)` : "Scan"}
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
            <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No public evidence detected in scanned sources</p>
            <p className="text-xs text-muted-foreground">Click "Scan" to search public sources for worker benefit signals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border">
              <Badge variant="secondary" className="gap-1">
                <FileCheck className="w-3 h-3" />
                {signals!.length} benefit{signals!.length !== 1 ? "s" : ""} detected across {detectedCategories.size} categor{detectedCategories.size !== 1 ? "ies" : "y"}
              </Badge>
            </div>

            {/* Detected benefits by category */}
            {Object.entries(grouped).map(([category, catSignals]) => {
              const Icon = categoryIcons[category] || Heart;
              return (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {(catSignals as any[]).map((signal: any) => (
                      <div key={signal.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                         <div className="flex items-start justify-between gap-2 mb-1">
                           <span className="font-medium text-sm text-foreground">{signal.benefit_type}</span>
                           <Badge
                             variant="outline"
                             className={cn("text-xs shrink-0 capitalize", confidenceColors[signal.confidence] || "")}
                           >
                             {(signal.confidence || "").replace(/_/g, " ")}
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Missing categories */}
            {missingCategories.length > 0 && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Not Detected in Public Sources
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {missingCategories.map((cat) => {
                    const Icon = categoryIcons[cat] || Heart;
                    return (
                      <Badge key={cat} variant="outline" className="text-xs text-muted-foreground gap-1">
                        <Icon className="w-3 h-3" />
                        {cat}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  No publicly documented policy detected in scanned sources for the categories above.
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Signals are detected from publicly available sources and presented with confidence levels. No conclusions are drawn. Interpretation is left to the user.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
