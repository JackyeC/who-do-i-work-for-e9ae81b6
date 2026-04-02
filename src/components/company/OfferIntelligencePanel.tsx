import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle, Eye, ShieldAlert, Bell, CheckCircle2,
  Building2, Star, ExternalLink, HelpCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/* ── Sector risk intelligence ── */
const SECTOR_RISKS: Record<string, string> = {
  "Behavioral Health": "Behavioral health employers in the US are facing Medicaid funding cuts, mass closures, and layoffs in 2025–2026. Ask about funding stability before you sign.",
  "Healthcare": "Healthcare consolidation is accelerating. Private equity ownership and staffing mandates are shifting the ground under workers. Ask who actually owns this company and how they're funded.",
  "Education": "School closures, enrollment shifts, and funding volatility are hitting education employers hard. Ask about enrollment trends and funding sources before committing.",
  "Staffing": "Staffing agencies are facing margin compression and contract instability. Ask about guaranteed hours, benefits eligibility, and client contract duration.",
  "Retail": "Retail is shedding stores and shifting to distribution. Ask whether the role you're being offered will exist in 18 months.",
  "Media": "Media layoffs have been relentless since 2023. Ask about revenue diversification and whether your role is tied to a single product or client.",
  "Real Estate": "Commercial real estate is still correcting. Ask about occupancy rates and whether your compensation is tied to transaction volume.",
  "Tech": "Tech hiring has rebounded selectively — mostly in AI and infrastructure. If the role isn't in those areas, ask why it's open now.",
  "Nonprofit": "Nonprofit funding is volatile, especially for orgs dependent on federal grants. Ask about funding runway and whether your position is grant-funded.",
  "Financial Services": "Financial services is automating aggressively. Ask whether this role has a two-year horizon or is backfilling someone who left.",
};

function getSectorRisk(industry: string): string | null {
  for (const [sector, risk] of Object.entries(SECTOR_RISKS)) {
    if (industry.toLowerCase().includes(sector.toLowerCase())) return risk;
  }
  return null;
}

/* ── Contextual questions by industry ── */
function getAskBeforeYouSign(industry: string, employeeCount?: string | null, signals?: string[]): string[] {
  const base = [
    "What does the funding structure look like — and has it changed in the last 12 months?",
    "What happened to the last person in this role?",
    "How is performance evaluated in the first year?",
  ];

  const industryQs: string[] = [];
  const lowerIndustry = industry.toLowerCase();

  if (lowerIndustry.includes("health") || lowerIndustry.includes("behavioral")) {
    industryQs.push("Is this position funded by Medicaid, grants, or private revenue?");
    industryQs.push("Have there been layoffs or site closures in the last 18 months?");
  } else if (lowerIndustry.includes("tech") || lowerIndustry.includes("software")) {
    industryQs.push("Is this role tied to a specific product line — and what's its revenue trajectory?");
    industryQs.push("What's the company's current runway or path to profitability?");
  } else if (lowerIndustry.includes("education")) {
    industryQs.push("Is enrollment trending up or down at this institution?");
    industryQs.push("Are there pending budget cuts or restructuring plans?");
  } else if (lowerIndustry.includes("retail") || lowerIndustry.includes("restaurant")) {
    industryQs.push("How many locations have opened or closed in the last year?");
    industryQs.push("Is this a corporate role or does it depend on franchise-level decisions?");
  } else if (lowerIndustry.includes("nonprofit")) {
    industryQs.push("What percentage of revenue comes from federal or state grants?");
    industryQs.push("Is this position grant-funded, and when does the grant cycle end?");
  } else {
    industryQs.push("What does leadership turnover look like at the director level and above?");
    industryQs.push("Has the company gone through a merger, acquisition, or restructuring recently?");
  }

  if (employeeCount) {
    const count = parseInt(employeeCount.replace(/[^0-9]/g, ""), 10);
    if (count && count < 100) {
      industryQs.push("Is there an HR function, or does the founder handle personnel decisions?");
    }
  }

  return [...base, ...industryQs].slice(0, 7);
}

/* ── Public signal cards ── */
interface PublicSignal {
  label: string;
  value: string;
  source: string;
  level: "neutral" | "positive" | "caution";
}

function derivePublicSignals(company: any): PublicSignal[] {
  const signals: PublicSignal[] = [];

  if (company.employer_clarity_score != null && company.employer_clarity_score > 0) {
    signals.push({
      label: "Employer Transparency Score",
      value: `${company.employer_clarity_score}/100`,
      source: "WDIWF analysis",
      level: company.employer_clarity_score >= 50 ? "positive" : "caution",
    });
  }

  if (company.civic_footprint_score != null && company.civic_footprint_score > 0) {
    signals.push({
      label: "Civic Footprint Score",
      value: `${company.civic_footprint_score}/100`,
      source: "Public records composite",
      level: company.civic_footprint_score >= 50 ? "positive" : "caution",
    });
  }

  if ((company.total_pac_spending ?? 0) > 0) {
    signals.push({
      label: "Political Spending",
      value: `$${(company.total_pac_spending).toLocaleString()}`,
      source: "FEC / OpenSecrets",
      level: "caution",
    });
  }

  if ((company.lobbying_spend ?? 0) > 0) {
    signals.push({
      label: "Lobbying Expenditures",
      value: `$${(company.lobbying_spend).toLocaleString()}`,
      source: "Senate lobbying disclosures",
      level: "caution",
    });
  }

  if (company.confidence_rating) {
    signals.push({
      label: "Data Confidence",
      value: company.confidence_rating.replace(/_/g, " "),
      source: "WDIWF coverage assessment",
      level: "neutral",
    });
  }

  return signals;
}

const SIGNAL_LEVEL_STYLES = {
  positive: "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5",
  caution: "border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5",
  neutral: "border-border/40 bg-muted/10",
};

/* ── Main component ── */
interface OfferIntelligencePanelProps {
  company: any;
  companyId: string;
}

export function OfferIntelligencePanel({ company, companyId }: OfferIntelligencePanelProps) {
  const { user } = useAuth();
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const signals = derivePublicSignals(company);
  const sectorRisk = getSectorRisk(company.industry || "");
  const questions = getAskBeforeYouSign(
    company.industry || "",
    company.employee_count,
    signals.map(s => s.label),
  );

  const handleFlag = async () => {
    setFlagging(true);
    try {
      const { error } = await supabase.from("audit_requests").insert({
        company_name: company.name,
        email: user?.email || "anonymous@wdiwf.com",
        status: "flagged_for_monitoring",
      });
      if (error) throw error;
      setFlagged(true);
      toast.success("We'll notify you when new public records appear for this company.");
    } catch {
      toast.error("Could not flag this employer. Please try again.");
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            What they're not telling you — yet.
          </h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          We don't have a full dossier on this employer. Here's what we found, and what to watch for.
        </p>
      </div>

      {/* ── Available Signals ── */}
      {signals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Available Signals</h3>
            <Badge variant="outline" className="text-[10px] font-mono">From public records</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {signals.map((s) => (
              <Card key={s.label} className={`border ${SIGNAL_LEVEL_STYLES[s.level]}`}>
                <CardContent className="p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-base font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{s.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Sector Risk Context ── */}
      {sectorRisk && (
        <Card className="border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Sector Risk Context</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{sectorRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Ask Before You Sign ── */}
      <Card className="border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Ask Before You Sign</h3>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox className="mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                  {q}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Flag CTA ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground mb-1">
                Flag this employer
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                We'll monitor public filings and notify you if new records surface — WARN notices, EEOC filings, PAC activity, or leadership changes.
              </p>
              {flagged ? (
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Monitoring active — we'll reach out when something surfaces.
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleFlag}
                  disabled={flagging}
                  className="gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {flagging ? "Flagging..." : "Flag this employer — notify me when records appear"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
