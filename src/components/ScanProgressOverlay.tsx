import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, CheckCircle2, XCircle, Loader2, Clock, CircleSlash, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, { label: string; phase: string }> = {
  opensecrets: { label: "OpenSecrets Enrichment", phase: "Enrichment" },
  fec_campaign_finance: { label: "FEC Campaign Finance", phase: "Federal Data" },
  federal_contracts: { label: "Federal Contracts", phase: "Federal Data" },
  lobbying_disclosure: { label: "Lobbying Disclosure", phase: "Federal Data" },
  sec_edgar: { label: "SEC EDGAR Filings", phase: "Federal Data" },
  congress_cross_ref: { label: "Congress Cross-Reference", phase: "Federal Data" },
  opencorporates: { label: "Corporate Structure", phase: "Federal Data" },
  workplace_enforcement: { label: "Workplace Enforcement", phase: "Federal Data" },
  ai_hr_scan: { label: "Hiring Technology", phase: "Web Research" },
  worker_benefits: { label: "Worker Benefits", phase: "Web Research" },
  pay_equity: { label: "Pay Equity", phase: "Web Research" },
  worker_sentiment: { label: "Worker Sentiment", phase: "Web Research" },
  ideology: { label: "Ideology Signals", phase: "Web Research" },
  social: { label: "Social Monitoring", phase: "Web Research" },
  agency_contracts: { label: "Gov. Contracts", phase: "Web Research" },
  ai_accountability: { label: "AI Accountability", phase: "Web Research" },
};

const PHASE_ORDER = ["Enrichment", "Federal Data", "Web Research"];

function getStatusIcon(status: string) {
  switch (status) {
    case "completed_with_signals": return <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />;
    case "completed_no_signals": return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    case "no_sources_found": return <CircleSlash className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />;
    case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
    case "in_progress": return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground/40" />;
  }
}

interface ScanProgressOverlayProps {
  isOpen: boolean;
  companyName: string;
  moduleStatuses: Record<string, any>;
  scanStatus: string | null;
  totalSignals: number;
  totalSources: number;
  onClose: () => void;
  onForceRescan?: () => void;
}

export function ScanProgressOverlay({
  isOpen,
  companyName,
  moduleStatuses,
  scanStatus,
  totalSignals,
  totalSources,
  onClose,
}: ScanProgressOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const allModules = Object.keys(MODULE_LABELS);
  const completedCount = allModules.filter(k => {
    const s = moduleStatuses[k]?.status;
    return s === "completed_with_signals" || s === "completed_no_signals" || s === "failed" || s === "no_sources_found";
  }).length;
  const progress = allModules.length > 0 ? Math.round((completedCount / allModules.length) * 100) : 0;
  const isFinished = scanStatus && !["queued", "in_progress"].includes(scanStatus);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Group by phase
  const phaseGroups = PHASE_ORDER.map(phase => ({
    phase,
    modules: allModules.filter(k => MODULE_LABELS[k]?.phase === phase),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-lg mx-4 rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  isFinished ? "bg-[hsl(var(--civic-green))]/10" : "bg-primary/10"
                )}>
                  {isFinished ? (
                    <CheckCircle2 className="w-6 h-6 text-[hsl(var(--civic-green))]" />
                  ) : (
                    <Radar className="w-6 h-6 text-primary animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground font-display">
                    {isFinished ? "Scan Complete" : "Scanning..."}
                  </h2>
                  <p className="text-sm text-muted-foreground">{companyName}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-bold text-foreground">{formatTime(elapsed)}</div>
                  <div className="text-[10px] text-muted-foreground">elapsed</div>
                </div>
              </div>

              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedCount} of {allModules.length} modules</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Module list */}
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-4">
              {phaseGroups.map(({ phase, modules }) => {
                if (modules.length === 0) return null;
                const phaseCompleted = modules.every(k => {
                  const s = moduleStatuses[k]?.status;
                  return s && !["queued", "in_progress"].includes(s);
                });
                const phaseActive = modules.some(k => moduleStatuses[k]?.status === "in_progress");

                return (
                  <div key={phase}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest font-semibold",
                        phaseActive ? "text-primary" : phaseCompleted ? "text-[hsl(var(--civic-green))]" : "text-muted-foreground"
                      )}>
                        {phase}
                      </span>
                      {phaseActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {modules.map(key => {
                        const mod = MODULE_LABELS[key];
                        const status = moduleStatuses[key]?.status || "queued";
                        const signals = moduleStatuses[key]?.signalsFound || 0;
                        const isActive = status === "in_progress";

                        return (
                          <motion.div
                            key={key}
                            initial={false}
                            animate={{
                              backgroundColor: isActive ? "hsl(var(--primary) / 0.04)" : "transparent",
                            }}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                              isActive && "border border-primary/15"
                            )}
                          >
                            {getStatusIcon(status)}
                            <span className={cn(
                              "text-sm flex-1",
                              isActive ? "text-foreground font-medium" : 
                              status === "queued" ? "text-muted-foreground/60" : "text-foreground"
                            )}>
                              {mod?.label || key}
                            </span>
                            {signals > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {signals} signal{signals !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/30 bg-muted/20">
              {isFinished ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{totalSources} sources · {totalSignals} signals</span>
                  </div>
                  <Button onClick={onClose} size="sm" className="gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    View Results
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Scanning federal databases, corporate records, and web sources. 
                    This typically takes <strong>2–4 minutes</strong>. You can close this and continue browsing — the scan runs in the background.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
