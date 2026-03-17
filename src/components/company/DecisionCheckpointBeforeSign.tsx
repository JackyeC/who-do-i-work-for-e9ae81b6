import { useState, useMemo } from "react";
import { getStoredWorkProfile } from "@/components/WorkProfileQuiz";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
}

interface DecisionCheckpointProps extends SignalInputs {
  companyName: string;
  companySlug: string;
}

interface Insight {
  text: string;
}

function generateAligned(signals: SignalInputs, profile: ReturnType<typeof getStoredWorkProfile>): Insight[] {
  if (!profile) return [];
  const results: Insight[] = [];

  for (const p of profile.priorities) {
    if (p === "Stability" && !signals.hasLayoffSignals && !signals.hasWarnNotices) {
      results.push({ text: "This role appears aligned with your preference for stability — no active workforce reduction signals detected." });
    }
    if (p === "Higher pay" && (signals.hasPayEquity || signals.hasCompensationData)) {
      results.push({ text: "Compensation data is publicly available, which supports your focus on fair pay." });
    }
    if (p === "Transparent communication" && signals.hasPayEquity && signals.hasBenefitsData) {
      results.push({ text: "This company publicly discloses compensation and benefits information, aligning with your transparency preference." });
    }
    if (p === "Clear and consistent leadership" && signals.executiveCount > 0 && !signals.hasLayoffSignals) {
      results.push({ text: "Leadership team is documented with no major disruption signals — consistent with your preference for clear leadership." });
    }
    if (p === "Respectful team environment" && signals.hasSentimentData) {
      results.push({ text: "Employee sentiment data is available for this employer, supporting your focus on team culture." });
    }
  }

  const sliders = profile.sliders;
  if (sliders) {
    if (sliders.stable_dynamic < 30 && !signals.hasLayoffSignals && !signals.hasWarnNotices) {
      results.push({ text: "No restructuring signals detected — consistent with your preference for a stable environment." });
    }
    if (sliders.open_needtoknow < 30 && signals.hasPayEquity && signals.hasBenefitsData) {
      results.push({ text: "Public disclosure of compensation and benefits aligns with your preference for openness." });
    }
  }

  return results.slice(0, 3);
}

function generateClarifications(signals: SignalInputs): Insight[] {
  const results: Insight[] = [];

  if (!signals.hasCompensationData && !signals.hasPayEquity) {
    results.push({ text: "Ask about compensation philosophy and how ranges are set." });
  }
  if (!signals.hasSentimentData) {
    results.push({ text: "Ask current employees about day-to-day team dynamics." });
  }
  if (!signals.hasJobPostings) {
    results.push({ text: "Ask about growth trajectory and open roles on this team." });
  }
  if (signals.executiveCount === 0) {
    results.push({ text: "Ask who you'd report to and how leadership communicates priorities." });
  }
  if (!signals.hasBenefitsData) {
    results.push({ text: "Ask about benefits structure and how it's evolved recently." });
  }

  return results.slice(0, 4);
}

function generateConcerns(signals: SignalInputs, profile: ReturnType<typeof getStoredWorkProfile>): Insight[] {
  if (!profile) return [];
  const results: Insight[] = [];

  if (signals.hasLayoffSignals || signals.hasWarnNotices) {
    const wantsStability = profile.priorities.includes("Stability") || (profile.sliders?.stable_dynamic ?? 50) < 30;
    if (wantsStability) {
      results.push({ text: "Active workforce reduction signals were detected. This may conflict with your preference for stability." });
    }
  }

  const sliders = profile.sliders;
  if (sliders) {
    if (sliders.flexible_structured < 30 && signals.hasAiHrSignals) {
      results.push({ text: "This environment may offer less flexibility than you prefer — structured hiring processes were detected." });
    }
    if (sliders.remote_inperson < 30 && signals.hasSentimentData) {
      results.push({ text: "Employee signals suggest in-office expectations may be present, which could affect your remote work preference." });
    }
    if (sliders.handsoff_handson < 30 && signals.hasSentimentData) {
      results.push({ text: "Oversight patterns were detected in employee sentiment — this may not match your preference for autonomy." });
    }
    if (sliders.open_needtoknow < 30 && !signals.hasPayEquity && !signals.hasBenefitsData) {
      results.push({ text: "Limited public disclosure on compensation and benefits — worth verifying against your transparency expectations." });
    }
  }

  for (const avoid of profile.avoids) {
    if (avoid === "Frequent layoffs or instability" && (signals.hasLayoffSignals || signals.hasWarnNotices)) {
      if (!results.some(r => r.text.includes("workforce reduction"))) {
        results.push({ text: "Workforce reduction signals match your stated concern about layoffs and instability." });
      }
    }
  }

  return results;
}

export function DecisionCheckpointBeforeSign(props: DecisionCheckpointProps) {
  const { companyName, companySlug, ...signals } = props;
  const navigate = useNavigate();
  const profile = getStoredWorkProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const storageKey = `checkpoint-notes-${companySlug}`;
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(storageKey) || ""; } catch { return ""; }
  });

  const handleNotesChange = (value: string) => {
    setNotes(value);
    try { localStorage.setItem(storageKey, value); } catch {}
  };

  const aligned = useMemo(() => generateAligned(signals, profile), [signals, profile]);
  const clarifications = useMemo(() => generateClarifications(signals), [signals]);
  const concerns = useMemo(() => generateConcerns(signals, profile), [signals, profile]);

  if (!profile) {
    return (
      <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
        <p className="text-base font-semibold text-foreground mb-1">Before you sign…</p>
        <p className="text-sm text-muted-foreground mb-4">Set your work preferences to personalize this checkpoint.</p>
        <Button size="sm" variant="outline" onClick={() => navigate("/dashboard?tab=career")} className="gap-1.5 text-xs">
          Set Preferences <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  const hasContent = aligned.length > 0 || clarifications.length > 0 || concerns.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card overflow-hidden">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-6 py-6 text-left hover:bg-accent/30 transition-colors"
        >
          <p className="text-base font-semibold text-foreground mb-1">Before you sign…</p>
          <p className="text-sm text-muted-foreground mb-4">Let's make sure nothing important gets missed.</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            Continue <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-5 border-b border-border/40">
              <p className="text-base font-semibold text-foreground">Before you sign…</p>
              <p className="text-xs text-muted-foreground mt-1">Based on your preferences and what we've found for {companyName}.</p>
            </div>

            {aligned.length > 0 && (
              <div className="px-6 py-5 border-b border-border/40">
                <p className="text-xs font-medium text-[hsl(var(--civic-green))] uppercase tracking-wider mb-3">What aligns</p>
                <ul className="space-y-2.5">
                  {aligned.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground/85 leading-relaxed pl-4 border-l-2 border-[hsl(var(--civic-green))]/40"
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {clarifications.length > 0 && (
              <div className="px-6 py-5 border-b border-border/40">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Worth clarifying</p>
                <ul className="space-y-2.5">
                  {clarifications.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground/85 leading-relaxed pl-4 border-l-2 border-border"
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {concerns.length > 0 && (
              <div className="px-6 py-5 border-b border-border/40">
                <p className="text-xs font-medium text-[hsl(var(--civic-yellow))] uppercase tracking-wider mb-3">Take a closer look</p>
                <ul className="space-y-2.5">
                  {concerns.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground/85 leading-relaxed pl-4 border-l-2 border-[hsl(var(--civic-yellow))]/40"
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-6 py-4">
              <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={`w-3 h-3 transition-transform ${notesOpen ? "rotate-180" : ""}`} />
                  Personal notes
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    placeholder="Add your own notes about this opportunity…"
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="mt-3 text-sm min-h-[80px] bg-background/50"
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="px-6 pb-5">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                This summary is generated from public records and your stated preferences. It does not represent complete information — always verify independently before making a decision.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
