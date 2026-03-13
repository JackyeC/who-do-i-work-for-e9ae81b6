import { useMemo } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, MinusCircle, CircleDot,
  HelpCircle, Database, FileSearch, Eye, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface ComponentScore {
  label: string;
  score: number;
  weight: number;
  signals: string[];
}

interface WorkforceIntelligenceBriefProps {
  totalScore: number;
  components: ComponentScore[];
  scanCompletion?: Record<string, boolean> | null;
  recordStatus?: string;
}

/* ─── Helpers ─── */

function getOfferRisk(score: number): { level: string; color: string; bg: string; border: string } {
  if (score >= 65) return { level: "Low", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/20" };
  if (score >= 40) return { level: "Moderate", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/20" };
  return { level: "Elevated", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" };
}

function getMeterColor(score: number): string {
  if (score >= 65) return "bg-[hsl(var(--civic-green))]";
  if (score >= 40) return "bg-[hsl(var(--civic-yellow))]";
  return "bg-destructive";
}

function getMeterTextColor(score: number): string {
  if (score >= 65) return "text-[hsl(var(--civic-green))]";
  if (score >= 40) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

/* ─── Signal gap detection ─── */

interface MissingSignal {
  label: string;
  category: string;
}

function getMissingSignals(components: ComponentScore[]): MissingSignal[] {
  const all: MissingSignal[] = [];
  const byLabel: Record<string, ComponentScore> = {};
  components.forEach(c => { byLabel[c.label] = c; });

  const ws = byLabel["Workforce Stability"];
  const ht = byLabel["Hiring Transparency"];
  const ca = byLabel["Compensation Alignment"];
  const ie = byLabel["Influence Exposure"];

  if (ws && ws.score < 50) {
    all.push({ label: "Promotion velocity & tenure patterns", category: "Workforce" });
    all.push({ label: "Internal mobility rate", category: "Workforce" });
  }
  if (ht && ht.score < 50) {
    all.push({ label: "AI hiring audit disclosures", category: "Hiring" });
    all.push({ label: "Benefits transparency reporting", category: "Hiring" });
  }
  if (ca && ca.score < 50) {
    all.push({ label: "Salary band transparency", category: "Compensation" });
    all.push({ label: "Pay equity audit reporting", category: "Compensation" });
  }
  if (ie && ie.score < 50) {
    all.push({ label: "Leadership diversity reporting", category: "Influence" });
  }

  // Always check these universal signals
  if (!ws || ws.score < 70) {
    all.push({ label: "Employee retention benchmarks", category: "Workforce" });
  }
  if (!ca || ca.score < 70) {
    all.push({ label: "Compensation benchmarking data", category: "Compensation" });
  }

  // Deduplicate by label
  const seen = new Set<string>();
  return all.filter(s => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

/* ─── Question generation ─── */

function getQuestionsToAsk(components: ComponentScore[]): string[] {
  const questions: string[] = [];
  const byLabel: Record<string, ComponentScore> = {};
  components.forEach(c => { byLabel[c.label] = c; });

  const ws = byLabel["Workforce Stability"];
  const ht = byLabel["Hiring Transparency"];
  const ca = byLabel["Compensation Alignment"];
  const ie = byLabel["Influence Exposure"];

  if (ws && ws.score < 60) {
    questions.push("What is the average tenure for someone in this role, and what does internal promotion typically look like?");
  }
  if (ht && ht.score < 60) {
    questions.push("Does the company use automated screening or AI tools in hiring, and has a bias audit been conducted?");
  }
  if (ca && ca.score < 60) {
    questions.push("Can you share the salary band for this role, and how compensation is benchmarked against market data?");
    questions.push("What is the company's approach to pay equity analysis?");
  }
  if (ie && ie.score < 60) {
    questions.push("How does the company's leadership reflect the diversity of its workforce and customer base?");
  }

  // Universal questions
  questions.push("What percentage of leadership roles were filled through internal promotion in the last two years?");

  if (questions.length > 5) return questions.slice(0, 5);
  return questions;
}

/* ─── Workforce analysis narrative ─── */

function getWorkforceAnalysis(
  score: number,
  components: ComponentScore[],
  missingCount: number,
): { known: string; gaps: string; impact: string } {
  const strongest = [...components].sort((a, b) => b.score - a.score)[0];
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];
  const strongAreas = components.filter(c => c.score >= 60);
  const weakAreas = components.filter(c => c.score < 40);

  if (score >= 65) {
    return {
      known: `This employer discloses above-average workforce transparency signals. ${strongest.label} is the strongest indicator at ${strongest.score}/100, supported by ${strongAreas.length} categories with verifiable data.`,
      gaps: weakAreas.length > 0
        ? `${weakest.label} (${weakest.score}/100) shows limited public disclosures. ${missingCount} transparency indicators could not be independently verified.`
        : `Signal coverage is strong across categories. Minor gaps exist in ${missingCount} secondary indicators.`,
      impact: `Candidates evaluating this employer have sufficient data to make an informed assessment. Remaining gaps can be addressed through direct inquiry during the interview process.`,
    };
  }
  if (score >= 40) {
    return {
      known: `Partial transparency signals are available. ${strongest.label} provides the most reliable data at ${strongest.score}/100. ${strongAreas.length} of 5 categories have meaningful signal coverage.`,
      gaps: `${weakAreas.length} signal categories fall below minimum confidence thresholds. ${weakest.label} (${weakest.score}/100) has the least available data. ${missingCount} workforce transparency indicators are unverifiable from public sources.`,
      impact: `Moderate transparency gaps increase the importance of direct employer inquiry. Candidates should treat missing signals as open questions — not as negative indicators — and prioritize verification of ${weakest.label.toLowerCase()} before making career commitments.`,
    };
  }
  return {
    known: `Limited workforce transparency signals are available for this employer. The strongest indicator, ${strongest.label}, scores ${strongest.score}/100 — below the threshold for reliable independent assessment.`,
    gaps: `${weakAreas.length} of 5 signal categories lack sufficient public data. ${missingCount} key transparency indicators cannot be verified. This pattern is common with smaller, private, or pre-IPO employers that are not yet subject to extensive disclosure requirements.`,
    impact: `Low signal coverage does not imply negative employer intent. However, candidates cannot independently verify core workforce conditions. All key employment factors — compensation, stability, advancement, and culture — should be verified through direct conversation and documented in offer terms.`,
  };
}

/* ─── Data confidence ─── */

function getDataConfidence(
  score: number,
  components: ComponentScore[],
  scanCompletion?: Record<string, boolean> | null,
  recordStatus?: string,
): { level: string; explanation: string; sources: string[] } {
  const confComponent = components.find(c => c.label === "Signal Confidence");
  const confScore = confComponent?.score ?? 0;
  const scanKeys = scanCompletion ? Object.values(scanCompletion) : [];
  const completedScans = scanKeys.filter(Boolean).length;
  const totalScans = scanKeys.length || 0;

  const sources: string[] = [];
  components.forEach(c => {
    c.signals.forEach(s => {
      if (!s.startsWith("Limited")) sources.push(s);
    });
  });

  // Add standard source categories
  const standardSources = [
    "Public workforce disclosures",
    "Job posting analysis",
    "Leadership composition data",
  ];
  if (components.find(c => c.label === "Compensation Alignment" && c.score > 20)) {
    standardSources.push("Salary & compensation datasets");
  }
  if (components.find(c => c.label === "Workforce Stability" && c.score > 20)) {
    standardSources.push("Promotion reporting signals");
  }

  let level: string;
  let explanation: string;

  if (confScore >= 70) {
    level = "High";
    explanation = `Analysis is based on ${completedScans > 0 ? `${completedScans} of ${totalScans} scan modules` : "multiple verified sources"}${recordStatus === "verified" ? " with a verified company record" : ""}. Signal coverage supports reliable workforce assessment.`;
  } else if (confScore >= 40) {
    level = "Moderate";
    explanation = `Analysis draws from ${completedScans > 0 ? `${completedScans} of ${totalScans} scan modules` : "available public data"}. Some signal categories lack independent verification. Confidence is sufficient for directional assessment but not comprehensive evaluation.`;
  } else {
    level = "Low";
    explanation = `Limited data sources are available for this employer. ${completedScans > 0 ? `Only ${completedScans} of ${totalScans} scan modules returned results.` : "Scan coverage is minimal."} Findings should be treated as preliminary and supplemented with direct employer inquiry.`;
  }

  return { level, explanation, sources: standardSources };
}

/* ─── Component ─── */

export function WorkforceIntelligenceBrief({
  totalScore,
  components,
  scanCompletion,
  recordStatus,
}: WorkforceIntelligenceBriefProps) {
  const risk = useMemo(() => getOfferRisk(totalScore), [totalScore]);
  const missingSignals = useMemo(() => getMissingSignals(components), [components]);
  const questions = useMemo(() => getQuestionsToAsk(components), [components]);
  const analysis = useMemo(
    () => getWorkforceAnalysis(totalScore, components, missingSignals.length),
    [totalScore, components, missingSignals.length],
  );
  const confidence = useMemo(
    () => getDataConfidence(totalScore, components, scanCompletion, recordStatus),
    [totalScore, components, scanCompletion, recordStatus],
  );

  const confComponent = components.find(c => c.label === "Signal Confidence");
  const confScore = confComponent?.score ?? 0;

  return (
    <div className="border border-border bg-card mt-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-0.5">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary font-semibold">
            Workforce Intelligence System
          </span>
        </div>
        <h3 className="text-base font-bold text-foreground leading-tight">
          Workforce Intelligence Brief
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          Pre-application transparency assessment · Generated from public workforce signals
        </p>
      </div>

      {/* Section 1: Career Signal Meter */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
            Career Signal Meter
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Transparency Signals */}
          <div className="border border-border bg-background p-3 space-y-2">
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
              Transparency Signals
            </div>
            <div className={cn("text-2xl font-black tabular-nums leading-none", getMeterTextColor(totalScore))}>
              {totalScore}
              <span className="text-xs font-medium text-muted-foreground">/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", getMeterColor(totalScore))}
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>

          {/* Confidence in Data */}
          <div className="border border-border bg-background p-3 space-y-2">
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
              Confidence in Data
            </div>
            <div className={cn("text-2xl font-black tabular-nums leading-none", getMeterTextColor(confScore))}>
              {confScore}
              <span className="text-xs font-medium text-muted-foreground">/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", getMeterColor(confScore))}
                style={{ width: `${confScore}%` }}
              />
            </div>
          </div>

          {/* Offer Risk Level */}
          <div className={cn("border p-3 space-y-2", risk.border, risk.bg)}>
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
              Offer Risk Level
            </div>
            <div className={cn("text-xl font-black leading-none", risk.color)}>
              {risk.level}
            </div>
            <div className="flex items-center gap-1">
              {risk.level === "Low" && <CheckCircle2 className="w-3 h-3 text-[hsl(var(--civic-green))]" />}
              {risk.level === "Moderate" && <MinusCircle className="w-3 h-3 text-[hsl(var(--civic-yellow))]" />}
              {risk.level === "Elevated" && <AlertTriangle className="w-3 h-3 text-destructive" />}
              <span className="text-[9px] text-muted-foreground">
                {risk.level === "Low" && "Strong transparency signals"}
                {risk.level === "Moderate" && "Incomplete transparency signals"}
                {risk.level === "Elevated" && "Risk indicators detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Workforce Analysis */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
            Workforce Analysis
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground/70 mb-1">
              What the system knows
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{analysis.known}</p>
          </div>
          <div>
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground/70 mb-1">
              What signals are missing
            </div>
            <p className="text-[13px] text-foreground/75 leading-relaxed">{analysis.gaps}</p>
          </div>
          <div>
            <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground/70 mb-1">
              Impact on candidate decision
            </div>
            <p className="text-[13px] text-foreground/75 leading-relaxed">{analysis.impact}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Key Workforce Signals Missing */}
      {missingSignals.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
              Key Workforce Signals Missing
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {missingSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                <span className="text-[12px] text-foreground/70">{signal.label}</span>
                <span className="text-[9px] text-muted-foreground/60 font-mono uppercase ml-auto shrink-0">
                  {signal.category}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            These indicators could not be independently verified from available public sources.
          </p>
        </div>
      )}

      {/* Section 4: Questions Worth Asking */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
            Questions Worth Asking
          </span>
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5">
              <span className="font-mono text-[10px] text-primary font-bold mt-0.5 shrink-0 w-4 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          These questions address the specific transparency gaps detected for this employer.
        </p>
      </div>

      {/* Section 5: Data Confidence */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
            Data Confidence
          </span>
          <span className={cn(
            "ml-auto font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5",
            confidence.level === "High" && "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10",
            confidence.level === "Moderate" && "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10",
            confidence.level === "Low" && "text-destructive bg-destructive/10",
          )}>
            {confidence.level} Confidence
          </span>
        </div>
        <p className="text-[13px] text-foreground/75 leading-relaxed mb-3">{confidence.explanation}</p>
        <div className="flex items-start gap-1.5">
          <FileSearch className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {confidence.sources.map((src) => (
              <span key={src} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* System footer */}
      <div className="px-5 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between flex-wrap gap-2">
        <p className="text-[9px] text-muted-foreground/60 font-mono">
          Career Transparency System · Workforce Intelligence Brief · Signals-based analysis — not legal or employment advice
        </p>
        <span className="text-[9px] text-muted-foreground/40 font-mono">
          Generated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}