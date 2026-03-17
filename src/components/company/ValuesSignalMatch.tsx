import { useMemo } from "react";
import { getStoredWorkProfile } from "@/components/WorkProfileQuiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/use-premium";

interface SignalInputs {
  hasLayoffSignals: boolean;
  hasWarnNotices: boolean;
  hasPayEquity: boolean;
  hasBenefitsData: boolean;
  hasAiHrSignals: boolean;
  hasSentimentData: boolean;
  hasCompensationData: boolean;
  hasJobPostings: boolean;
  executiveCount: number;
  revolvingDoorCount: number;
  totalPacSpending: number;
  lobbyingSpend: number;
  lastReviewed?: string;
  updatedAt?: string;
}

interface MatchResult {
  label: string;
  summary: string;
  type: "aligned" | "mismatch";
  confidence: "Low" | "Medium" | "High";
  tacticalQuestion?: string;
  source?: string;
}

function getRecency(lastReviewed?: string, updatedAt?: string): string {
  const ref = lastReviewed || updatedAt;
  if (!ref) return "Unknown";
  const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
  if (days <= 30) return "Last 30 days";
  if (days <= 60) return "Last 60 days";
  return "6+ months";
}

function computeMatches(signals: SignalInputs): MatchResult[] {
  const profile = getStoredWorkProfile();
  if (!profile) return [];

  const results: MatchResult[] = [];

  // --- Priority matching ---
  for (const priority of profile.priorities) {
    switch (priority) {
      case "Stability":
        if (signals.hasLayoffSignals || signals.hasWarnNotices) {
          results.push({ label: "Stability", summary: "Active layoff or workforce reduction signals detected. This may conflict with your preference for stability.", type: "mismatch", confidence: "Medium" });
        } else {
          results.push({ label: "Stability", summary: "No active layoff or WARN signals detected. Stability indicators appear favorable.", type: "aligned", confidence: "Medium" });
        }
        break;
      case "Flexibility":
        if (signals.hasAiHrSignals) {
          results.push({ label: "Flexibility", summary: "AI hiring tools detected, which may indicate structured processes. Clarify flexibility expectations directly.", type: "mismatch", confidence: "Low" });
        } else {
          results.push({ label: "Flexibility", summary: "No rigid hiring automation signals detected. Flexibility indicators are neutral.", type: "aligned", confidence: "Low" });
        }
        break;
      case "Higher pay":
        if (signals.hasPayEquity || signals.hasCompensationData) {
          results.push({ label: "Compensation", summary: "Compensation data is publicly available, suggesting pay transparency.", type: "aligned", confidence: "Medium" });
        } else {
          results.push({ label: "Compensation", summary: "Limited compensation transparency. Benchmark independently before negotiating.", type: "mismatch", confidence: "Low" });
        }
        break;
      case "Clear growth and advancement paths":
        if (signals.hasJobPostings) {
          results.push({ label: "Growth", summary: "Active hiring patterns suggest organizational growth and potential advancement.", type: "aligned", confidence: "Low" });
        } else {
          results.push({ label: "Growth", summary: "Limited hiring visibility. Internal mobility signals are unclear.", type: "mismatch", confidence: "Low" });
        }
        break;
      case "Clear and consistent leadership":
        if (signals.executiveCount > 0 && !signals.hasLayoffSignals) {
          results.push({ label: "Leadership", summary: "Executive team is documented with no major disruption signals.", type: "aligned", confidence: "Medium" });
        } else if (signals.executiveCount === 0) {
          results.push({ label: "Leadership", summary: "Limited leadership visibility. Executive data is not publicly indexed.", type: "mismatch", confidence: "Low" });
        }
        break;
      case "Transparent communication":
        if (signals.hasPayEquity && signals.hasBenefitsData) {
          results.push({ label: "Transparency", summary: "Pay equity and benefits data are publicly disclosed.", type: "aligned", confidence: "High" });
        } else {
          results.push({ label: "Transparency", summary: "Limited public disclosure on compensation or benefits.", type: "mismatch", confidence: "Low" });
        }
        break;
      case "Respectful team environment":
        if (signals.hasSentimentData) {
          results.push({ label: "Culture", summary: "Worker sentiment data is available for this employer.", type: "aligned", confidence: "Medium" });
        } else {
          results.push({ label: "Culture", summary: "No public sentiment data indexed. Culture signals are limited.", type: "mismatch", confidence: "Low" });
        }
        break;
      default:
        break;
    }
  }

  // --- Avoidance matching ---
  for (const avoid of profile.avoids) {
    switch (avoid) {
      case "Frequent layoffs or instability":
        if (signals.hasLayoffSignals || signals.hasWarnNotices) {
          results.push({ label: "Layoff risk", summary: "Active workforce reduction signals detected. This matches your stated avoidance.", type: "mismatch", confidence: "Medium" });
        }
        break;
      case "Below-market compensation":
        if (!signals.hasCompensationData && !signals.hasPayEquity) {
          results.push({ label: "Comp risk", summary: "No compensation benchmark data available. Verify pay independently.", type: "mismatch", confidence: "Low" });
        }
        break;
      case "High turnover or negative culture signals":
        if (!signals.hasSentimentData) {
          results.push({ label: "Culture risk", summary: "No sentiment data to evaluate turnover or culture patterns.", type: "mismatch", confidence: "Low" });
        }
        break;
      default:
        break;
    }
  }

  // --- Slider clash detection (30/70 threshold) ---
  const sliders = profile.sliders;
  if (sliders) {
    // Flexible (<30) vs structured hiring signals
    if (sliders.flexible_structured < 30 && signals.hasAiHrSignals) {
      results.push({
        label: "Structure Friction",
        summary: "You prioritize flexibility, but this company shows signals of highly structured processes.",
        type: "mismatch",
        confidence: "Medium",
        source: "Hiring automation signals",
        tacticalQuestion: "How does the team balance process with individual autonomy in day-to-day work?",
      });
    } else if (sliders.flexible_structured > 70 && !signals.hasAiHrSignals) {
      results.push({
        label: "Structure",
        summary: "You prefer structured environments. This company does not show strong process-driven signals.",
        type: "aligned",
        confidence: "Low",
        source: "Hiring data",
      });
    }

    // Remote (<30) vs in-office sentiment
    if (sliders.remote_inperson < 30 && signals.hasSentimentData) {
      results.push({
        label: "Location Friction",
        summary: "You prefer remote work, but employee signals suggest in-office expectations may be present.",
        type: "mismatch",
        confidence: "Low",
        source: "Employee sentiment",
        tacticalQuestion: "How has the team's collaboration model evolved since recent office-presence changes, and how is deep-work time protected?",
      });
    }

    // Steady (<30) vs rapid hiring
    if (sliders.steady_fastmoving < 30 && signals.hasJobPostings) {
      results.push({
        label: "Velocity Alert",
        summary: "You prefer a steady pace, but hiring patterns suggest rapid scaling or high organizational velocity.",
        type: "mismatch",
        confidence: "Low",
        source: "Hiring data",
        tacticalQuestion: "What does onboarding look like during a scaling phase, and how are expectations set for new hires?",
      });
    }

    // Stable (<30) vs layoff/restructuring signals
    if (sliders.stable_dynamic < 30 && (signals.hasLayoffSignals || signals.hasWarnNotices)) {
      results.push({
        label: "Structural Shift",
        summary: "You value stability, but current signals indicate organizational restructuring is underway.",
        type: "mismatch",
        confidence: "Medium",
        source: "Workforce filings",
        tacticalQuestion: "How is the current restructuring affecting team composition and project continuity?",
      });
    } else if (sliders.stable_dynamic > 70 && !(signals.hasLayoffSignals || signals.hasWarnNotices)) {
      results.push({
        label: "Stability",
        summary: "You thrive in dynamic environments. No restructuring signals detected — this may be a steady-state employer.",
        type: "aligned",
        confidence: "Low",
        source: "Workforce data",
      });
    }

    // Hands-off (<30) vs high-oversight sentiment
    if (sliders.handsoff_handson < 30 && signals.hasSentimentData) {
      results.push({
        label: "Autonomy Risk",
        summary: "You value independence, but employee signals suggest management oversight patterns may be present.",
        type: "mismatch",
        confidence: "Low",
        source: "Employee sentiment",
        tacticalQuestion: "How much latitude do individual contributors have in setting priorities and managing their own time?",
      });
    }

    // Open (<30) vs no transparency data
    if (sliders.open_needtoknow < 30 && !signals.hasPayEquity && !signals.hasBenefitsData) {
      results.push({
        label: "Transparency Gap",
        summary: "You prefer open communication, but public disclosure signals for compensation and benefits are limited.",
        type: "mismatch",
        confidence: "Low",
        source: "Disclosure records",
        tacticalQuestion: "How does leadership communicate compensation philosophy and organizational changes to the team?",
      });
    } else if (sliders.open_needtoknow < 30 && signals.hasPayEquity && signals.hasBenefitsData) {
      results.push({
        label: "Transparency",
        summary: "You value openness, and this company publicly discloses compensation and benefits data.",
        type: "aligned",
        confidence: "Medium",
        source: "Public records",
      });
    }
  }

  return results;
}

function computeAlignmentScore(matches: MatchResult[]): number {
  if (matches.length === 0) return 0;
  const aligned = matches.filter((m) => m.type === "aligned").length;
  return Math.round((aligned / matches.length) * 100);
}

export function ValuesSignalMatch(props: SignalInputs) {
  const navigate = useNavigate();
  const profile = getStoredWorkProfile();
  const { isPremium } = usePremium();
  const matches = useMemo(() => computeMatches(props), [props]);
  const recency = getRecency(props.lastReviewed, props.updatedAt);

  if (!profile) {
    return (
      <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Personalize this report</p>
            <p className="text-xs text-muted-foreground">Set your work preferences to see how this company aligns with what matters to you.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard?tab=career")} className="gap-1.5 text-xs shrink-0">
            Set Preferences <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  const aligned = matches.filter((m) => m.type === "aligned");
  const mismatched = matches.filter((m) => m.type === "mismatch");
  const score = computeAlignmentScore(matches);

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How this aligns with you</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            Alignment: {score}/100
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            Data: {recency}
          </Badge>
        </div>
      </div>

      {aligned.length > 0 && (
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-xs font-medium text-[hsl(var(--civic-green))] uppercase tracking-wider mb-2.5">Aligned with your priorities</p>
          <ul className="space-y-1.5">
            {aligned.map((m, i) => (
              <li key={i} className="text-sm text-foreground/85 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[hsl(var(--civic-green))]/40">
                <span className="font-medium">{m.label}:</span> {m.summary}
                {m.source && <span className="ml-1.5 text-[10px] text-muted-foreground/70 font-mono">{m.source}</span>}
                <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">{m.confidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mismatched.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[hsl(var(--civic-yellow))] uppercase tracking-wider mb-2.5">Potential mismatches</p>
          <ul className="space-y-3">
            {mismatched.map((m, i) => (
              <li key={i} className="text-sm text-foreground/85 leading-relaxed pl-3 border-l-2 border-[hsl(var(--civic-yellow))]/30">
                <div className="relative">
                  <span className="font-medium">{m.label}:</span> {m.summary}
                  {m.source && <span className="ml-1.5 text-[10px] text-muted-foreground/70 font-mono">{m.source}</span>}
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">{m.confidence}</span>
                </div>
                {m.tacticalQuestion && (
                  <div className="mt-1.5 relative">
                    {isPremium ? (
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        Ask in your interview: "{m.tacticalQuestion}"
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-muted-foreground blur-[4px] select-none pointer-events-none italic leading-relaxed">
                          Ask in your interview: "{m.tacticalQuestion}"
                        </p>
                        <button
                          onClick={() => navigate("/pricing")}
                          className="shrink-0 flex items-center gap-1 text-[10px] text-primary font-medium hover:underline"
                        >
                          <Lock className="w-3 h-3" /> Unlock
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
