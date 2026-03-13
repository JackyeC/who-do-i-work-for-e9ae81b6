import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users, TrendingDown, Eye, DollarSign, Landmark,
  Heart, Building2, MapPin, Briefcase,
  ShieldCheck, AlertTriangle, Search, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountabilityBadge, type AccountabilityStatus } from "@/components/AccountabilityBadge";

/* ── Types ── */

type SnapshotVerdict = "Strong Fit" | "Proceed with Caution" | "Needs Deeper Review";

type SignalLevel = "strong" | "high" | "moderate" | "low" | "weak" | "missing";

interface SnapshotSection {
  key: string;
  label: string;
  icon: typeof Users;
  signalLevel: SignalLevel;
  evidence: string[];
  status: "positive" | "neutral" | "warning" | "missing";
  exploreLabel?: string;
  exploreAnchor?: string;
  evidenceSource?: string;
  evidenceUrl?: string;
  accountabilityStatus?: AccountabilityStatus;
  accountabilityLabel?: string;
}

interface OfferCheckSnapshotProps {
  companyName: string;
  roleTitle?: string;
  location?: string;
  verdict: SnapshotVerdict;
  sections: SnapshotSection[];
  jackyeTake?: string;
}

/* ── Signal level styling ── */

const SIGNAL_LEVEL_CONFIG: Record<SignalLevel, { label: string; color: string; bg: string; border: string }> = {
  strong: { label: "Strong", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/30" },
  high: { label: "High", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  moderate: { label: "Moderate", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30" },
  low: { label: "Low", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", border: "border-[hsl(var(--civic-green))]/30" },
  weak: { label: "Weak", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", border: "border-[hsl(var(--civic-yellow))]/30" },
  missing: { label: "Audit Pending", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border/50" },
};

/* ── Verdict styling ── */

const VERDICT_CONFIG: Record<SnapshotVerdict, { color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  "Strong Fit": {
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/10",
    border: "border-[hsl(var(--civic-green))]/30",
    icon: ShieldCheck,
  },
  "Proceed with Caution": {
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/10",
    border: "border-[hsl(var(--civic-yellow))]/30",
    icon: AlertTriangle,
  },
  "Needs Deeper Review": {
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: Search,
  },
};

const STATUS_DOT: Record<string, string> = {
  positive: "bg-[hsl(var(--civic-green))]",
  neutral: "bg-primary",
  warning: "bg-[hsl(var(--civic-yellow))]",
  missing: "bg-muted-foreground/40",
};

/* ── Risk label helper ── */

function getRiskLabel(signalLevel: SignalLevel, sectionLabel: string): string {
  const labelMap: Record<SignalLevel, string> = {
    strong: "Leader",
    high: "High Risk",
    moderate: "Moderate Risk",
    low: "Low Risk",
    weak: "Audit Pending",
    missing: "Audit Pending",
  };
  return `${sectionLabel}: ${labelMap[signalLevel]}`;
}

/* ── Default section builder ── */

export function buildDefaultSections(opts: {
  hasExecs?: boolean;
  execCount?: number;
  hasLayoffs?: boolean;
  layoffRecent?: boolean;
  layoffCount?: number;
  warnFilings?: number;
  hiringSlowed?: boolean;
  hiringTransparency?: "high" | "medium" | "low" | "unknown";
  salaryRangesPublished?: boolean;
  biasAuditStatus?: string;
  offerStrength?: "strong" | "average" | "weak" | "unknown";
  salaryPercentile?: string;
  benefitsRating?: string;
  equityOffered?: boolean;
  influenceExposure?: "high" | "moderate" | "low" | "unknown";
  lobbyingSpend?: string;
  pacDonations?: string;
  federalContracts?: number;
  cultureAlignment?: "aligned" | "mixed" | "misaligned" | "unknown";
  sentimentRating?: string;
  hypocrisyScore?: string;
  deiSignals?: string;
}): SnapshotSection[] {
  const {
    hasExecs = false, execCount = 0,
    hasLayoffs = false, layoffRecent = false, layoffCount = 0, warnFilings = 0, hiringSlowed = false,
    hiringTransparency = "unknown", salaryRangesPublished = false, biasAuditStatus,
    offerStrength = "unknown", salaryPercentile, benefitsRating, equityOffered,
    influenceExposure = "unknown", lobbyingSpend, pacDonations, federalContracts,
    cultureAlignment = "unknown", sentimentRating, hypocrisyScore, deiSignals,
  } = opts;

  return [
    {
      key: "decision_makers",
      label: "Decision Makers",
      icon: Users,
      signalLevel: hasExecs ? (execCount >= 5 ? "strong" : "moderate") : "missing",
      evidence: hasExecs
        ? [
            `${execCount} executive${execCount !== 1 ? "s" : ""} and board members identified`,
            execCount >= 5 ? "Strong leadership transparency from public filings" : "Limited executive data — gaps in leadership visibility",
            "Decision-maker profiles available for review",
          ]
        : [
            "No executive data available yet",
            "Leadership visibility is a key trust signal",
            "Scan to discover decision makers",
          ],
      status: hasExecs ? "positive" : "missing",
      exploreLabel: "Explore leadership →",
      exploreAnchor: "#decision-makers",
      evidenceSource: hasExecs ? "SEC Proxy Filing" : undefined,
      accountabilityStatus: hasExecs ? (execCount >= 5 ? "verified" : "partial") : "audit_pending",
      accountabilityLabel: hasExecs ? "Leadership Verified" : "Audit Pending",
    },
    {
      key: "workforce_stability",
      label: "Workforce Stability",
      icon: TrendingDown,
      signalLevel: layoffRecent ? "high" : hasLayoffs ? "moderate" : "low",
      evidence: (() => {
        const bullets: string[] = [];
        if (layoffRecent) bullets.push(`Active workforce reduction detected${layoffCount ? ` (${layoffCount} event${layoffCount !== 1 ? "s" : ""})` : ""}`);
        else if (hasLayoffs) bullets.push(`${layoffCount || "Historical"} workforce reduction${layoffCount !== 1 ? "s" : ""} in past 18 months`);
        else bullets.push("No public layoff or restructuring signals detected");
        if (hiringSlowed) bullets.push("Hiring slowed in recent quarters");
        else bullets.push("Hiring activity appears stable");
        bullets.push(warnFilings > 0 ? `${warnFilings} WARN filing${warnFilings !== 1 ? "s" : ""} in past 6 months` : "No WARN filings in past 6 months");
        return bullets;
      })(),
      status: layoffRecent ? "warning" : hasLayoffs ? "neutral" : "positive",
      exploreLabel: "Explore workforce signals →",
      exploreAnchor: "#workforce-stability",
      evidenceSource: "WARN Database",
    },
    {
      key: "hiring_transparency",
      label: "Hiring Transparency",
      icon: Eye,
      signalLevel: hiringTransparency === "high" ? "strong" : hiringTransparency === "medium" ? "moderate" : hiringTransparency === "low" ? "weak" : "missing",
      evidence: (() => {
        const bullets: string[] = [];
        bullets.push(salaryRangesPublished ? "Salary ranges published on job postings" : "No salary ranges found on job postings");
        bullets.push(biasAuditStatus === "completed" ? "AI hiring bias audit completed" : biasAuditStatus === "partial" ? "Partial AI bias audit disclosure" : "No AI hiring bias audit disclosed");
        bullets.push(hiringTransparency === "high" ? "Hiring process clearly explained" : hiringTransparency === "medium" ? "Some hiring process visibility" : "Hiring process opaque or undisclosed");
        return bullets;
      })(),
      status: hiringTransparency === "high" ? "positive" : hiringTransparency === "medium" ? "neutral" : hiringTransparency === "low" ? "warning" : "missing",
      exploreLabel: "Explore hiring signals →",
      exploreAnchor: "#hiring-transparency",
      accountabilityStatus: biasAuditStatus === "completed" ? "published" : "audit_pending",
      accountabilityLabel: biasAuditStatus === "completed" ? "AI Bias Audit Published" : "Audit Pending",
    },
    {
      key: "offer_competitiveness",
      label: "Offer Competitiveness",
      icon: DollarSign,
      signalLevel: offerStrength === "strong" ? "strong" : offerStrength === "average" ? "moderate" : offerStrength === "weak" ? "weak" : "missing",
      evidence: (() => {
        const bullets: string[] = [];
        bullets.push(salaryPercentile ? `Salary at ${salaryPercentile} percentile vs. market` : offerStrength === "strong" ? "Salary above market benchmarks" : offerStrength === "weak" ? "Salary may fall below market benchmarks" : "Market salary comparison not yet available");
        bullets.push(benefitsRating ? `Benefits rated ${benefitsRating}` : "Benefits data not yet analyzed");
        bullets.push(equityOffered ? "Equity component included in offer" : equityOffered === false ? "No equity component in offer" : "Equity details not yet evaluated");
        return bullets;
      })(),
      status: offerStrength === "strong" ? "positive" : offerStrength === "average" ? "neutral" : offerStrength === "weak" ? "warning" : "missing",
      exploreLabel: "Explore compensation →",
      exploreAnchor: "#offer-competitiveness",
      evidenceSource: "BLS",
    },
    {
      key: "influence_spending",
      label: "Influence & Spending",
      icon: Landmark,
      signalLevel: influenceExposure === "high" ? "high" : influenceExposure === "moderate" ? "moderate" : influenceExposure === "low" ? "low" : "missing",
      evidence: (() => {
        const bullets: string[] = [];
        bullets.push(lobbyingSpend ? `${lobbyingSpend} in lobbying expenditures` : influenceExposure === "low" ? "Minimal lobbying activity on record" : "Lobbying data not yet collected");
        bullets.push(pacDonations ? `${pacDonations} in PAC donations` : "No PAC donation data available");
        bullets.push(federalContracts ? `${federalContracts} federal contract${federalContracts !== 1 ? "s" : ""} on record` : "No federal contracts detected");
        return bullets;
      })(),
      status: influenceExposure === "high" ? "warning" : influenceExposure === "moderate" ? "neutral" : influenceExposure === "low" ? "positive" : "missing",
      exploreLabel: "Follow the money →",
      exploreAnchor: "#influence-spending",
      evidenceSource: lobbyingSpend ? "LDA" : pacDonations ? "FEC" : undefined,
    },
    {
      key: "culture_trust",
      label: "Culture & Trust Signals",
      icon: Heart,
      signalLevel: cultureAlignment === "aligned" ? "strong" : cultureAlignment === "mixed" ? "moderate" : cultureAlignment === "misaligned" ? "weak" : "missing",
      evidence: (() => {
        const bullets: string[] = [];
        bullets.push(sentimentRating ? `Employee sentiment: ${sentimentRating}` : cultureAlignment === "aligned" ? "Public brand consistent with workforce signals" : "Employee sentiment data not available");
        bullets.push(hypocrisyScore ? `Say-Do Gap Index: ${hypocrisyScore}` : "Say-Do gap analysis not yet available");
        bullets.push(deiSignals ? `DEI signals: ${deiSignals}` : "DEI signal data not yet collected");
        return bullets;
      })(),
      status: cultureAlignment === "aligned" ? "positive" : cultureAlignment === "mixed" ? "neutral" : cultureAlignment === "misaligned" ? "warning" : "missing",
      exploreLabel: "Explore culture signals →",
      exploreAnchor: "#culture-trust",
    },
  ];
}

/* ── Derive verdict from sections ── */

export function deriveSnapshotVerdict(sections: SnapshotSection[]): SnapshotVerdict {
  const warnings = sections.filter(s => s.status === "warning").length;
  const missing = sections.filter(s => s.status === "missing").length;
  const positive = sections.filter(s => s.status === "positive").length;

  if (warnings >= 3 || (warnings >= 2 && missing >= 2)) return "Needs Deeper Review";
  if (warnings >= 1 || missing >= 3) return "Proceed with Caution";
  if (positive >= 4) return "Strong Fit";
  return "Proceed with Caution";
}

/* ── Generate Jackye's Take for the snapshot ── */

export function generateSnapshotJackyeTake(
  verdict: SnapshotVerdict,
  sections: SnapshotSection[],
): string {
  const warnings = sections.filter(s => s.status === "warning");
  const missing = sections.filter(s => s.status === "missing");
  const influenceWarning = warnings.find(w => w.key === "influence_spending");
  const hiringWarning = warnings.find(w => w.key === "hiring_transparency");

  if (verdict === "Strong Fit") {
    return "The receipts match the rhetoric — and in this market, that's remarkable. The transparency signals are strong across categories. Still, ask the questions below. Good character holds up under scrutiny. Facts over Feelings.";
  }

  if (verdict === "Needs Deeper Review") {
    const warningLabels = warnings.map(w => w.label.toLowerCase()).join(", ");
    if (influenceWarning && warnings.length >= 2) {
      return `This employer knows how to write checks in DC, but when it comes to workforce transparency? Silence. That gap between spending and disclosure is a character issue. Don't let a strong offer distract from the Dirty Receipts. Run the chain first.`;
    }
    return `The marketing is polished, but the receipts are messy — red flags in ${warningLabels}. Before you sign anything, look at the evidence trail. Human frailty is real, but so is corporate negligence. Don't commit your talent until they show the work.`;
  }

  if (influenceWarning && hiringWarning) {
    return "This employer spends money to shape policy but hasn't published a Bias Audit for their AI hiring tools. They'll lobby Congress about workforce issues but won't tell you how their algorithm screens you out. That's a character issue. Ask about the audit before committing.";
  }
  if (missing.length >= 2) {
    return "The receipts are incomplete, and silence is a strategy, not an accident. Missing signals don't mean bad signals — but they mean you need to ask the hard questions before signing. Facts over Feelings.";
  }
  return "This offer may look strong on paper, but the bigger question is whether the company behind it aligns with your goals, values, and risk tolerance. Look at the evidence trail before you commit.";
}

/* ── Component ── */

export function OfferCheckSnapshot({
  companyName,
  roleTitle,
  location,
  verdict,
  sections,
  jackyeTake,
}: OfferCheckSnapshotProps) {
  const verdictStyle = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictStyle.icon;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary font-semibold mb-1">
              Career Transparency System
            </div>
            <CardTitle className="text-lg font-display font-bold tracking-tight">
              Offer Check Snapshot
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Signal-based assessment of this employer — read in under 10 seconds.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-semibold gap-1.5 px-3 py-1", verdictStyle.color, verdictStyle.border, verdictStyle.bg)}
          >
            <VerdictIcon className="w-3.5 h-3.5" />
            {verdict}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company / Role / Location header */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            {companyName}
          </span>
          {roleTitle && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5" />
              {roleTitle}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
        </div>

        <Separator />

        {/* Snapshot signal cards — each self-contained with result + evidence + explore */}
        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const levelStyle = SIGNAL_LEVEL_CONFIG[section.signalLevel];
            const riskLabel = getRiskLabel(section.signalLevel, section.label);

            return (
              <div
                key={section.key}
                className="p-3.5 border border-border/50 space-y-2.5 bg-muted/20"
              >
                {/* Signal Result — immediately visible */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[section.status])} />
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{riskLabel}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-bold shrink-0 px-2 py-0.5", levelStyle.color, levelStyle.border, levelStyle.bg)}
                  >
                    {levelStyle.label}
                  </Badge>
                </div>

                {/* Accountability badge */}
                {section.accountabilityStatus && section.accountabilityLabel && (
                  <AccountabilityBadge
                    status={section.accountabilityStatus}
                    label={section.accountabilityLabel}
                    size="sm"
                  />
                )}

                {/* Evidence bullets */}
                <div>
                  <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground/60 mb-1">
                    Evidence
                  </div>
                  <ul className="space-y-1 pl-1">
                    {section.evidence.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Evidence source + Explore link */}
                <div className="flex items-center justify-between pt-1">
                  {section.evidenceSource && (
                    <span className="text-[9px] text-muted-foreground/60 font-mono">
                      Source: {section.evidenceSource}
                    </span>
                  )}
                  {section.exploreLabel && (
                    <a
                      href={section.exploreAnchor || "#"}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline ml-auto"
                    >
                      {section.exploreLabel}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Jackye's Take */}
        {jackyeTake && (
          <>
            <Separator />
            <div className="p-4 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">JC</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Jackye's Take</p>
                  <p className="text-[10px] text-muted-foreground">Accountability Intelligence</p>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">
                "{jackyeTake}"
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
