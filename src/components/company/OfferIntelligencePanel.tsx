import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye, ShieldAlert, Bell, CheckCircle2,
  Building2, HelpCircle, AlertTriangle, ChevronDown, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSectorRisk } from "./offer-intelligence/sectorRisks";
import { getAskBeforeYouSign } from "./offer-intelligence/askBeforeYouSign";
import { CommunitySignals } from "./offer-intelligence/CommunitySignals";
import { WarnFilingsCard } from "./WarnFilingsCard";
import { useCompanyReviews } from "@/hooks/use-company-reviews";

/* ── Public signal cards from company record ── */
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
  );

  // Check review flag from Apify data
  const { data: reviewData } = useCompanyReviews(
    companyId,
    company.name || "",
    company.state || ""
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
          {reviewData?.reviewCarefully && (
            <Badge variant="destructive" className="text-xs gap-1 ml-auto">
              <AlertTriangle className="w-3 h-3" />
              Review carefully
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          We don't have a full dossier on this employer. Here's what we found, and what to watch for.
        </p>
      </div>

      {/* ── Community / Secondary Signals (Indeed, BBB) — PRIMARY content on limited data pages ── */}
      <CommunitySignals
        companyId={companyId}
        companyName={company.name}
        companyState={company.state}
      />

      {/* ── WARN Filings ── */}
      <WarnFilingsCard companyId={companyId} companyName={company.name} prominent />

      {/* ── Verified Signals ── */}
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground">Sector Risk Context</h3>
                  <Badge variant="warning" className="text-[10px] font-mono">Industry Alert</Badge>
                </div>
                <p className="text-sm text-foreground font-medium leading-relaxed mb-1">
                  {sectorRisk.summary}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sectorRisk.detail}
                </p>
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
            <Badge variant="secondary" className="text-[10px]">{questions.length} questions</Badge>
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
                <Button size="sm" onClick={handleFlag} disabled={flagging} className="gap-2">
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
