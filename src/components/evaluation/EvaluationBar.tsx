import { useEvaluation } from "@/contexts/EvaluationContext";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/**
 * Persistent thin bar showing the current evaluation context.
 * Only renders when a company/job/offer is active.
 */
export function EvaluationBar() {
  const {
    activeCompany,
    activeJob,
    activeOffer,
    alignmentScore,
    riskScore,
    verdictText,
    contextLabel,
    clearContext,
  } = useEvaluation();

  if (!activeCompany) return null;

  const riskLevel =
    riskScore < 40 ? "low" : riskScore < 65 ? "medium" : "high";

  const RiskIcon = riskLevel === "low" ? ShieldCheck : riskLevel === "medium" ? AlertTriangle : XCircle;
  const riskColor =
    riskLevel === "low"
      ? "text-civic-green"
      : riskLevel === "medium"
      ? "text-civic-yellow"
      : "text-destructive";

  return (
    <div className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur-sm px-4 py-2">
      <div className="container mx-auto max-w-5xl flex items-center gap-3 text-xs">
        {/* Context label */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <RiskIcon className={cn("w-3.5 h-3.5 shrink-0", riskColor)} />
          <span className="font-semibold text-foreground truncate">
            You're evaluating: {contextLabel}
          </span>
          {verdictText && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0 shrink-0",
                riskLevel === "low" && "border-civic-green/40 text-civic-green",
                riskLevel === "medium" && "border-civic-yellow/40 text-civic-yellow",
                riskLevel === "high" && "border-destructive/40 text-destructive"
              )}
            >
              {verdictText}
            </Badge>
          )}
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-muted-foreground">
            Alignment: <span className="font-semibold text-foreground">{alignmentScore}</span>
          </span>
          <span className="text-muted-foreground">
            Risk: <span className={cn("font-semibold", riskColor)}>{riskScore}</span>
          </span>
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-2 shrink-0">
          {activeCompany && (
            <Link
              to={`/dossier/${activeCompany.slug}`}
              className="text-primary hover:underline"
            >
              Signals
            </Link>
          )}
          {activeOffer && (
            <Link to="/offer-check" className="text-primary hover:underline">
              Offer
            </Link>
          )}
          <button
            onClick={clearContext}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear evaluation context"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
