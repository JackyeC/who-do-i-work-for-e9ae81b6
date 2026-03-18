import { useState } from "react";
import { safeSignalLabel } from "@/utils/signalTextSanitizer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ValuesEvidenceCard } from "./ValuesEvidenceCard";
import { SIGNAL_DIRECTION_CONFIG, CONFIDENCE_CONFIG } from "@/lib/valuesLenses";

interface Signal {
  id: string;
  signal_label?: string;
  signal_summary?: string;
  signal_direction?: string;
  confidence_level?: string;
  confidence?: string;
  evidence_count?: number;
  signal_type?: string;
  value_category?: string;
  evidence_text?: string;
  evidence_url?: string;
}

interface Evidence {
  id: string;
  signal_type: string;
  source_name?: string;
  source_type?: string;
  source_url?: string;
  source_title?: string;
  evidence_summary?: string;
  evidence_excerpt?: string;
  related_legislation?: string;
  related_org?: string;
  related_politician?: string;
  amount?: number;
  event_date?: string;
  confidence_level: string;
  verification_status: string;
}

interface Props {
  company: { id: string; name: string; slug: string; industry: string; state: string };
  signals: Signal[];
  evidence: Evidence[];
  lensLabel: string;
  hasConflict?: boolean;
}

export function ValuesCompanyCard({ company, signals, evidence, lensLabel, hasConflict }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="overflow-hidden hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <Link
                to={`/company/${company.slug}`}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors font-display"
              >
                {company.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {company.industry} · {company.state}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasConflict && (
                <Badge variant="outline" className="text-[10px] border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Says one thing, does another
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {signals.length} record{signals.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* Signal items */}
          <div className="space-y-2 mb-3">
            {signals.slice(0, expanded ? signals.length : 3).map((signal) => {
              const dirConfig = SIGNAL_DIRECTION_CONFIG[signal.signal_direction || "informational_signal"];
              const confKey = signal.confidence_level || signal.confidence || "medium";
              const confConfig = CONFIDENCE_CONFIG[confKey] || CONFIDENCE_CONFIG.medium;

              return (
                <div key={signal.id} className="flex items-start gap-2 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dirConfig?.color || "text-muted-foreground"} bg-current`} />
                  <div className="flex-1 min-w-0">
                    {signal.evidence_url ? (
                      <a
                        href={signal.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
                      >
                        {safeSignalLabel(signal.signal_label || signal.signal_summary || signal.signal_type?.replace(/_/g, " "), "Signal Detected")}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">
                        {safeSignalLabel(signal.signal_label || signal.signal_summary || signal.signal_type?.replace(/_/g, " "), "Signal Detected")}
                      </span>
                    )}
                    {signal.signal_summary && signal.signal_label && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{signal.signal_summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {dirConfig && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dirConfig.color}`}>
                          {dirConfig.plainLabel}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${confConfig.color}`}>
                        {confConfig.plainLabel}
                      </Badge>
                      {signal.evidence_url && (
                        <a
                          href={signal.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline font-semibold"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> View source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evidence details */}
          {expanded && evidence.length > 0 && (
            <div className="space-y-2 mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source Documents</h4>
              {evidence.map((e) => (
                <ValuesEvidenceCard key={e.id} evidence={e} />
              ))}
            </div>
          )}

          {/* Expand / Profile link */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {(signals.length > 3 || evidence.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="gap-1 text-xs text-muted-foreground"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Show less" : `See the sources (${evidence.length})`}
              </Button>
            )}
            <Link to={`/company/${company.slug}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Full Company Snapshot <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
