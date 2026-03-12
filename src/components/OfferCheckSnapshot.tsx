import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users, TrendingDown, Eye, DollarSign, Landmark,
  Heart, MessageSquare, Building2, MapPin, Briefcase,
  ShieldCheck, AlertTriangle, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ── */

type SnapshotVerdict = "Strong Fit" | "Proceed with Caution" | "Needs Deeper Review";

interface SnapshotSection {
  key: string;
  label: string;
  icon: typeof Users;
  summary: string;
  status: "positive" | "neutral" | "warning" | "missing";
}

interface OfferCheckSnapshotProps {
  companyName: string;
  roleTitle?: string;
  location?: string;
  verdict: SnapshotVerdict;
  sections: SnapshotSection[];
  jackyeTake?: string;
}

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

/* ── Default section builder ── */

export function buildDefaultSections(opts: {
  hasExecs?: boolean;
  execCount?: number;
  hasLayoffs?: boolean;
  layoffRecent?: boolean;
  hiringTransparency?: "high" | "medium" | "low" | "unknown";
  offerStrength?: "strong" | "average" | "weak" | "unknown";
  influenceExposure?: "high" | "moderate" | "low" | "unknown";
  cultureAlignment?: "aligned" | "mixed" | "misaligned" | "unknown";
}): SnapshotSection[] {
  const {
    hasExecs = false, execCount = 0,
    hasLayoffs = false, layoffRecent = false,
    hiringTransparency = "unknown",
    offerStrength = "unknown",
    influenceExposure = "unknown",
    cultureAlignment = "unknown",
  } = opts;

  return [
    {
      key: "decision_makers",
      label: "Decision Makers",
      icon: Users,
      summary: hasExecs
        ? `${execCount} executive${execCount !== 1 ? "s" : ""} and board members identified shaping strategy and risk.`
        : "No executive data available yet. Run a scan to discover leadership.",
      status: hasExecs ? "positive" : "missing",
    },
    {
      key: "workforce_stability",
      label: "Workforce Stability",
      icon: TrendingDown,
      summary: layoffRecent
        ? "Recent layoffs or WARN activity detected. This may directly affect the role."
        : hasLayoffs
          ? "Historical layoff signals found, but no recent activity within 90 days."
          : "No public layoff or restructuring signals detected.",
      status: layoffRecent ? "warning" : hasLayoffs ? "neutral" : "positive",
    },
    {
      key: "hiring_transparency",
      label: "Hiring Transparency",
      icon: Eye,
      summary: hiringTransparency === "high"
        ? "Salary ranges published, hiring process explained, and AI screening signals transparent."
        : hiringTransparency === "medium"
          ? "Some salary visibility, but hiring technology and process transparency are incomplete."
          : hiringTransparency === "low"
            ? "Limited salary range visibility, opaque hiring technology, and unclear screening process."
            : "Insufficient data to evaluate hiring transparency.",
      status: hiringTransparency === "high" ? "positive" : hiringTransparency === "medium" ? "neutral" : hiringTransparency === "low" ? "warning" : "missing",
    },
    {
      key: "offer_competitiveness",
      label: "Offer Competitiveness",
      icon: DollarSign,
      summary: offerStrength === "strong"
        ? "Salary, benefits, and equity appear strong against market benchmarks."
        : offerStrength === "average"
          ? "Compensation appears in line with market benchmarks. Review equity and benefits details."
          : offerStrength === "weak"
            ? "Offer may fall below market benchmarks. Consider negotiation before committing."
            : "Market comparison data not yet available for this offer.",
      status: offerStrength === "strong" ? "positive" : offerStrength === "average" ? "neutral" : offerStrength === "weak" ? "warning" : "missing",
    },
    {
      key: "influence_spending",
      label: "Influence & Spending",
      icon: Landmark,
      summary: influenceExposure === "high"
        ? "Significant political donations, lobbying, or federal contract signals detected."
        : influenceExposure === "moderate"
          ? "Some political and lobbying activity detected. Review the connection chain for context."
          : influenceExposure === "low"
            ? "Low political influence signals. Limited lobbying or PAC activity on record."
            : "Influence data not yet collected for this company.",
      status: influenceExposure === "high" ? "warning" : influenceExposure === "moderate" ? "neutral" : influenceExposure === "low" ? "positive" : "missing",
    },
    {
      key: "culture_trust",
      label: "Culture & Trust Signals",
      icon: Heart,
      summary: cultureAlignment === "aligned"
        ? "Public employer brand appears consistent with workforce and leadership signals."
        : cultureAlignment === "mixed"
          ? "Some alignment gaps between public messaging and observable workforce signals."
          : cultureAlignment === "misaligned"
            ? "Notable gaps between employer brand and actual workforce, leadership, or influence signals."
            : "Insufficient culture signals to evaluate alignment.",
      status: cultureAlignment === "aligned" ? "positive" : cultureAlignment === "mixed" ? "neutral" : cultureAlignment === "misaligned" ? "warning" : "missing",
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

  if (verdict === "Strong Fit") {
    return "This offer looks solid on paper, and the company behind it has the receipts to match. That's rare. Still — ask the questions below, because good character holds up under scrutiny. Facts over Feelings.";
  }

  if (verdict === "Needs Deeper Review") {
    const warningLabels = warnings.map(w => w.label.toLowerCase()).join(", ");
    return `Ugly Baby alert. The offer may look fine on paper, but the company behind it is showing red in ${warningLabels}. Before you sign anything, look at the flow of funds vs. the marketing fluff. Don't let a nice salary blind you to the character gaps. Run the chain first. Always.`;
  }

  // Proceed with Caution
  if (missing.length >= 2) {
    return "This offer may look good on paper, but the bigger question is whether the company behind it makes sense for your goals, values, and risk tolerance. This snapshot shows you where to look before you say yes. The receipts are incomplete — and silence is a strategy, not an accident.";
  }

  return "This offer may look good on paper, but the bigger question is whether the company behind it makes sense for your goals, values, and risk tolerance. This snapshot shows you where to look before you say yes.";
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
            <CardTitle className="text-lg font-display font-bold tracking-tight">
              Offer Check Snapshot
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Before you sign, know what you're stepping into.
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

      <CardContent className="space-y-5">
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

        {/* Intro copy */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          This snapshot gives you the quickest read on the company behind the offer — how stable it looks,
          how transparent it is, and where its money and influence may point.
        </p>

        <Separator />

        {/* Snapshot sections */}
        <div className="grid gap-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.key}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="mt-0.5 shrink-0 flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[section.status])} />
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{section.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {section.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* What This May Mean for You — only if we have enough data */}
        {sections.filter(s => s.status !== "missing").length >= 3 && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">What This May Mean for You</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {verdict === "Strong Fit"
                  ? "The signals behind this company are unusually clear. You're in a good position to negotiate from strength — but still ask the hard questions. Good character holds up under scrutiny."
                  : verdict === "Proceed with Caution"
                    ? "There are gaps worth understanding before you commit. Look at where the money flows, who makes the decisions, and whether the employer brand matches the workforce signals. Ask about what you don't see — not just what they show you."
                    : "Multiple signal categories are raising flags. This doesn't mean the offer is bad — but it means you need answers before you sign. Ask about stability, transparency, and where the company's actual priorities lie. Silence on these topics tells you something too."}
              </p>
            </div>
          </>
        )}

        {/* Jackye's Take */}
        {jackyeTake && (
          <>
            <Separator />
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
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
