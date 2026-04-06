import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { triageIncident, PROTECTED_CHARACTERISTICS, type ProtectedBasis, type PatternType, type ReportedType, type TriageOutcome } from "@/lib/unfair-vs-illegal-logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, ChevronLeft, FileText, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Step = 1 | 2 | 3 | "result";

export default function UnfairVsIllegal() {
  const [step, setStep] = useState<Step>(1);
  const [basis, setBasis] = useState<ProtectedBasis | null>(null);
  const [pattern, setPattern] = useState<PatternType | null>(null);
  const [reported, setReported] = useState<ReportedType | null>(null);
  const [result, setResult] = useState<TriageOutcome | null>(null);

  const handleBasisSelect = (value: ProtectedBasis) => {
    setBasis(value);
    setStep(2);
  };

  const handlePatternSelect = (value: PatternType) => {
    setPattern(value);
    setStep(3);
  };

  const handleReportedSelect = (value: ReportedType) => {
    setReported(value);
    if (basis && pattern) {
      setResult(triageIncident({ protectedBasis: basis, pattern, reported: value }));
      setStep("result");
    }
  };

  const reset = () => {
    setStep(1);
    setBasis(null);
    setPattern(null);
    setReported(null);
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>Unfair vs. Illegal | WDIWF</title>
        <meta name="description" content="Determine whether a workplace incident is unfair treatment or legally actionable. A strategic triage tool for workers." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Disclaimer */}
        <div className="border border-civic-yellow/30 bg-civic-yellow/5 px-4 py-3 mb-6">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Not legal advice.</strong> This tool helps you understand the general landscape.
            It does not replace an employment attorney. If your situation involves immediate safety concerns, contact an attorney or the EEOC directly.
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-black text-foreground tracking-tight">Unfair vs. Illegal</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Three questions. One clear picture of where you stand.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                (typeof step === "number" ? step >= s : true) ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <p className="text-sm font-bold text-foreground mb-4">
              Was the treatment connected to any of these protected characteristics?
            </p>
            <div className="space-y-2">
              {PROTECTED_CHARACTERISTICS.map((pc) => (
                <button
                  key={pc.value}
                  onClick={() => handleBasisSelect(pc.value)}
                  className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors text-sm text-foreground"
                >
                  {pc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
              <ChevronLeft className="w-3 h-3" /> Back
            </button>
            <p className="text-sm font-bold text-foreground mb-4">
              Is this a pattern or an isolated incident?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handlePatternSelect("pattern")}
                className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">Pattern -- this has happened more than once</p>
                <p className="text-xs text-muted-foreground">Multiple incidents, ongoing behavior, or a sustained environment</p>
              </button>
              <button
                onClick={() => handlePatternSelect("isolated")}
                className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">Isolated -- this happened once</p>
                <p className="text-xs text-muted-foreground">A single incident or conversation</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
              <ChevronLeft className="w-3 h-3" /> Back
            </button>
            <p className="text-sm font-bold text-foreground mb-4">
              Did you report this through internal channels?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleReportedSelect("yes")}
                className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">Yes -- I reported it to HR or management</p>
              </button>
              <button
                onClick={() => handleReportedSelect("no")}
                className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">No -- I have not reported it yet</p>
              </button>
              <button
                onClick={() => handleReportedSelect("no_channels")}
                className="w-full text-left px-4 py-3 border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">No channels exist -- there is no HR or reporting mechanism</p>
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === "result" && result && (
          <div>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
              <ChevronLeft className="w-3 h-3" /> Start over
            </button>

            <div className="border border-border/40 bg-card mb-6">
              {/* Category header */}
              <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                {result.category.includes("Unfair") ? (
                  <AlertTriangle className="w-5 h-5 text-civic-yellow" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="text-sm font-black text-foreground">{result.category}</p>
                  <Badge className={cn(
                    "text-[9px] font-bold mt-1",
                    result.category.includes("Unfair") ? "bg-civic-yellow/10 text-civic-yellow" : "bg-primary/10 text-primary"
                  )}>
                    {result.category.includes("Unfair") ? "NOT A LEGAL CLAIM" : "POTENTIALLY ACTIONABLE"}
                  </Badge>
                </div>
              </div>

              {/* Legal standing */}
              <div className="px-6 py-4 border-b border-border/20">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Legal Standing</p>
                <p className="text-sm text-foreground leading-relaxed">{result.legalStanding}</p>
              </div>

              {/* Explanation */}
              <div className="px-6 py-4 border-b border-border/20">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">What This Means</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
              </div>

              {/* Documentation checklist */}
              <div className="px-6 py-4 border-b border-border/20">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Documentation Checklist</p>
                <ul className="space-y-1.5">
                  {result.documentationChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary font-bold mt-0.5">--</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next steps */}
              <div className="px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Next Steps</p>
                <ul className="space-y-1.5">
                  {result.nextSteps.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link to="/evidence-logger">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  Start documenting in Evidence Logger
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs">
                Assess another situation
              </Button>
            </div>
          </div>
        )}

        {/* Bottom disclaimer */}
        <div className="mt-12 border-t border-border/20 pt-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            This tool provides general educational information about employment law concepts. It is not legal advice and does not create an attorney-client relationship.
            Employment laws vary by state and locality. Consult a licensed employment attorney for advice specific to your situation.
            Time limits for filing complaints are strict -- do not delay if you believe you have a legal claim.
          </p>
        </div>
      </div>
    </>
  );
}
