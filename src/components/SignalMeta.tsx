import { ExternalLink, Clock, Search, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VerifySignalButton } from "@/components/VerifySignalButton";

/** Maps raw source_type or detection_method values to display labels */
const SOURCE_TYPE_LABELS: Record<string, string> = {
  company_website: "automated scan of company website",
  careers_page: "automated scan of company website",
  vendor_case_study: "vendor case study",
  news_article: "news coverage",
  government_filing: "government filing",
  third_party_report: "third-party report",
  worker_review: "worker review aggregation",
  company_disclosure: "company disclosure",
  official_filing: "government filing",
  keyword_detection: "automated scan of company website",
  vendor_detection: "vendor case study",
  ai_analysis: "automated scan of company website",
  firecrawl_ai: "automated scan of company website",
};

const CONFIDENCE_STYLES: Record<string, { label: string; className: string }> = {
  direct: { label: "High", className: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  high: { label: "High", className: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
  strong_inference: { label: "Medium", className: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  moderate_inference: { label: "Medium", className: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  medium: { label: "Medium", className: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
  weak_inference: { label: "Low", className: "text-muted-foreground border-border" },
  low: { label: "Low", className: "text-muted-foreground border-border" },
  unverified: { label: "Low", className: "text-muted-foreground border-border" },
};

export function getConfidenceDisplay(confidence: string) {
  return CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.low;
}

export function getSourceTypeLabel(sourceType?: string | null, detectionMethod?: string | null): string {
  if (sourceType && SOURCE_TYPE_LABELS[sourceType]) return SOURCE_TYPE_LABELS[sourceType];
  if (detectionMethod && SOURCE_TYPE_LABELS[detectionMethod]) return SOURCE_TYPE_LABELS[detectionMethod];
  if (sourceType) return sourceType.replace(/_/g, " ");
  if (detectionMethod) return detectionMethod.replace(/_/g, " ");
  return "public source";
}

interface SignalMetaProps {
  sourceType?: string | null;
  detectionMethod?: string | null;
  confidence?: string | null;
  sourceUrl?: string | null;
  evidenceText?: string | null;
  detectedAt?: string | null;
  lastVerifiedAt?: string | null;
  compact?: boolean;
  signalType?: string;
  signalId?: string;
  companyId?: string;
}

/**
 * Reusable signal metadata footer for any signal card.
 * Shows: detection source, confidence, dates, evidence, source link.
 */
export function SignalMeta({
  sourceType,
  detectionMethod,
  confidence,
  sourceUrl,
  evidenceText,
  detectedAt,
  lastVerifiedAt,
  compact = false,
  signalType,
  signalId,
  companyId,
}: SignalMetaProps) {
  const conf = confidence ? getConfidenceDisplay(confidence) : null;
  const sourceLabel = getSourceTypeLabel(sourceType, detectionMethod);

  const isStale = lastVerifiedAt
    ? (Date.now() - new Date(lastVerifiedAt).getTime()) > 90 * 24 * 60 * 60 * 1000
    : detectedAt
    ? (Date.now() - new Date(detectedAt).getTime()) > 90 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className={cn("space-y-1", compact ? "mt-1" : "mt-2")}>
      {/* Evidence snippet */}
      {evidenceText && !compact && (
        <p className="text-xs text-muted-foreground italic">"{evidenceText}"</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {/* Algorithm signal label */}
        <span className="text-[10px] font-semibold text-muted-foreground">Algorithm Signal</span>

        {/* Detection source */}
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Search className="w-2.5 h-2.5" />
          Detected via: {sourceLabel}
        </span>

        {/* Confidence */}
        {conf && (
          <Badge variant="outline" className={cn("text-[10px] shrink-0", conf.className)}>
            {conf.label} confidence
          </Badge>
        )}

        {/* Dates */}
        {detectedAt && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            Detected: {new Date(detectedAt).toLocaleDateString()}
          </span>
        )}
        {lastVerifiedAt && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified: {new Date(lastVerifiedAt).toLocaleDateString()}
          </span>
        )}
        {isStale && (
          <span className="text-[10px] text-muted-foreground/70 italic">
            Signal not recently verified.
          </span>
        )}

        {/* Source link */}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            View evidence <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}

        {/* Verify This Signal */}
        {signalType && (
          <VerifySignalButton
            signalType={signalType}
            signalId={signalId}
            companyId={companyId}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

interface SignalDensityProps {
  sourcesScanned?: number;
  signalsDetected?: number;
  categories?: string[];
}

/**
 * Summary density bar for aggregate modules.
 * Shows source count, signal count, and recurring signal categories.
 */
export function SignalDensity({ sourcesScanned, signalsDetected, categories }: SignalDensityProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground p-2 rounded-md bg-muted/30 border border-border">
      {sourcesScanned != null && (
        <span>Sources scanned: <strong className="text-foreground">{sourcesScanned}</strong></span>
      )}
      {signalsDetected != null && (
        <span>Recurring concern signals detected: <strong className="text-foreground">{signalsDetected}</strong></span>
      )}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-1">
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
