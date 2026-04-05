import { ReactNode } from "react";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EvaluationViewProps {
  /** Existing page content — rendered as the Intelligence layer */
  children: ReactNode;
  /** Optional coaching content to render below intelligence */
  coachingSlot?: ReactNode;
  /** Hide the verdict header (e.g., dossier already shows its own) */
  hideVerdict?: boolean;
}

/**
 * Unified Evaluation View layout.
 * Wraps existing page content with Verdict → Intelligence → Coaching → Action layers.
 * Purely additive — the children ARE the existing components.
 */
export function EvaluationView({ children, coachingSlot, hideVerdict }: EvaluationViewProps) {
  const {
    activeCompany,
    activeJob,
    activeOffer,
    alignmentScore,
    riskScore,
    verdictText,
  } = useEvaluation();

  const hasContext = !!activeCompany;

  const riskLevel = riskScore < 40 ? "low" : riskScore < 65 ? "medium" : "high";

  return (
    <div className="space-y-0">
      {/* ═══ VERDICT LAYER ═══ */}
      {hasContext && !hideVerdict && (
        <div className="container mx-auto max-w-3xl px-4 pt-6 pb-4">
          <VerdictCard
            alignmentScore={alignmentScore}
            riskScore={riskScore}
            riskLevel={riskLevel}
            verdictText={verdictText}
          />
        </div>
      )}

      {/* ═══ INTELLIGENCE LAYER ═══ */}
      {/* This is where existing page content renders (dossier, offer check, etc.) */}
      {children}

      {/* ═══ COACHING LAYER ═══ */}
      {coachingSlot && (
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {coachingSlot}
        </div>
      )}

      {/* ═══ ACTION LAYER ═══ */}
      {hasContext && (
        <ActionBar
          activeCompany={activeCompany}
          activeJob={activeJob}
          activeOffer={activeOffer}
        />
      )}
    </div>
  );
}

/* ── Verdict Card ── */
function VerdictCard({
  alignmentScore,
  riskScore,
  riskLevel,
  verdictText,
}: {
  alignmentScore: number;
  riskScore: number;
  riskLevel: string;
  verdictText: string;
}) {
  const Icon = riskLevel === "low" ? ShieldCheck : riskLevel === "medium" ? AlertTriangle : XCircle;
  const colorClass =
    riskLevel === "low"
      ? "text-civic-green border-civic-green/30 bg-civic-green/5"
      : riskLevel === "medium"
      ? "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/5"
      : "text-destructive border-destructive/30 bg-destructive/5";

  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-4", colorClass)}>
      <Icon className="w-6 h-6 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{verdictText || "Evaluating…"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Alignment {alignmentScore}/100 · Risk {riskScore}/100
        </p>
      </div>
    </div>
  );
}

/* ── Action Bar ── */
function ActionBar({
  activeCompany,
  activeJob,
  activeOffer,
}: {
  activeCompany: any;
  activeJob: any;
  activeOffer: any;
}) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border/40 bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Company-only context */}
        {activeCompany && !activeJob && !activeOffer && (
          <>
            <Link to="/check">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Should I apply?
              </Button>
            </Link>
            <Link to={`/dossier/${activeCompany.slug}`}>
              <Button size="sm" variant="outline" className="text-xs h-8">
                View full dossier
              </Button>
            </Link>
          </>
        )}

        {/* Job context */}
        {activeJob && (
          <>
            {activeJob.applicationLink && (
              <a href={activeJob.applicationLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="text-xs h-8">Apply</Button>
              </a>
            )}
            <Link to="/dashboard?tab=apply-kit">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Tailor materials
              </Button>
            </Link>
          </>
        )}

        {/* Offer context */}
        {activeOffer && (
          <>
            <Link to="/check">
              <Button size="sm" className="text-xs h-8">Should I accept?</Button>
            </Link>
            <Link to="/negotiation-simulator">
              <Button size="sm" variant="outline" className="text-xs h-8">
                What to negotiate?
              </Button>
            </Link>
          </>
        )}

        <span className="text-[10px] text-muted-foreground ml-auto">
          All signals from public sources
        </span>
      </div>
    </div>
  );
}
