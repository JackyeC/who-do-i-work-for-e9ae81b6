import { ReactNode } from "react";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { useAuth } from "@/contexts/AuthContext";
import { DossierPaywall } from "@/components/dossier/DossierPaywall";
import { SignalExamples } from "@/components/dossier/SignalExamples";
import { InfluenceGauge } from "@/components/dossier/InfluenceGauge";
import { SignupGate } from "@/components/SignupGate";

interface DossierProtectorProps {
  companyId: string;
  companyName: string;
  influenceScore: number;
  /** Layer 1 content — always visible */
  overviewContent: ReactNode;
  /** Layers 2–7 content — gated */
  fullContent: ReactNode;
}

/**
 * Higher-Order wrapper that enforces the fuzz/lock paywall.
 *
 * If the company IS in the user's tracked list → render full 7-layer dossier.
 * If NOT → show Overview + Influence Score + one Signal Example + blurred previews + CTA.
 */
export function DossierProtector({
  companyId,
  companyName,
  influenceScore,
  overviewContent,
  fullContent,
}: DossierProtectorProps) {
  const { user } = useAuth();
  const { isCompanyTracked, isPremium } = useTrackedCompanies();

  const isTracked = isCompanyTracked(companyId);
  const hasFullAccess = isTracked && isPremium;

  if (hasFullAccess) {
    return (
      <>
        {overviewContent}
        {fullContent}
      </>
    );
  }

  // Unauthenticated users: show overview + signup gate (no paywall yet)
  if (!user) {
    return (
      <>
        {overviewContent}

        <div className="flex justify-center py-6">
          <InfluenceGauge value={influenceScore} label="Influence Score" size="lg" />
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <SignalExamples companyId={companyId} />
        </div>

        {/* Signup gate — convert visitors to free accounts */}
        <SignupGate feature="the full company dossier">
          {fullContent}
        </SignupGate>
      </>
    );
  }

  // Authenticated but not premium: existing paywall flow
  return (
    <>
      {/* Always visible: Layer 1 overview */}
      {overviewContent}

      {/* Always visible: Influence Score gauge */}
      <div className="flex justify-center py-6">
        <InfluenceGauge value={influenceScore} label="Influence Score" size="lg" />
      </div>

      {/* Always visible: one signal example */}
      <div className="rounded-2xl border border-border/40 bg-card p-6">
        <SignalExamples />
      </div>

      {/* Paywall CTA */}
      <DossierPaywall companyId={companyId} companyName={companyName} />
    </>
  );
}
