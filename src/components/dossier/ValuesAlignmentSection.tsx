import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ValuesAlignmentProps {
  companyName: string;
  issueSignals: Array<{ issue_category: string; signal_type: string; description: string }>;
  publicStances: Array<{ issue_category?: string; public_position?: string; gap_severity?: string }>;
  eeocCount: number;
  lobbyingSpend: number;
  pacSpending: number;
}

const COLUMN_TO_LABEL: Record<string, string> = {
  labor_rights_importance: "Labor Rights",
  worker_protections_importance: "Worker Protections",
  dei_equity_importance: "Inclusion & Equity",
  pay_transparency_importance: "Pay Transparency",
  pay_equity_importance: "Compensation Fairness",
  environment_climate_importance: "Environment & Climate",
  ai_ethics_importance: "AI Ethics",
  data_privacy_importance: "Data Privacy",
  political_transparency_importance: "Political Transparency",
  anti_corruption_importance: "Leadership Ethics",
  mission_alignment_importance: "Mission Alignment",
  reproductive_rights_importance: "Reproductive Healthcare",
  education_access_importance: "Education Access",
  anti_discrimination_importance: "Anti-Discrimination",
  workplace_safety_importance: "Workplace Safety",
  union_rights_importance: "Union Rights",
  political_donations_importance: "Political Donations",
  community_investment_importance: "Community Investment",
  remote_flexibility_importance: "Remote Flexibility",
  benefits_importance: "Benefits",
};

// Maps issue categories from signals to values columns
const ISSUE_TO_COLUMN: Record<string, string> = {
  "Labor": "labor_rights_importance",
  "Labor Rights": "labor_rights_importance",
  "Workers Rights": "worker_protections_importance",
  "DEI": "dei_equity_importance",
  "Civil Rights": "anti_discrimination_importance",
  "Environment": "environment_climate_importance",
  "Climate": "environment_climate_importance",
  "AI": "ai_ethics_importance",
  "Data Privacy": "data_privacy_importance",
  "Political Spending": "political_donations_importance",
  "Lobbying": "political_transparency_importance",
  "Pay Equity": "pay_equity_importance",
  "Workplace Safety": "workplace_safety_importance",
  "Union": "union_rights_importance",
  "Anti-Corruption": "anti_corruption_importance",
};

interface AlignmentItem {
  label: string;
  detail: string;
  type: "aligned" | "conflict";
}

export function ValuesAlignmentSection({ companyName, issueSignals, publicStances, eeocCount, lobbyingSpend, pacSpending }: ValuesAlignmentProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (supabase as any).from("user_values_profile").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  if (loading) return null;

  // No profile — show CTA
  if (!profile) {
    return (
      <Card className="rounded-none border border-border/50">
        <CardContent className="p-6 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-sm font-black tracking-tight text-foreground uppercase mb-2">WHAT THIS MEANS FOR YOU</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Complete your Values Profile to see how {companyName} aligns with what matters to you — and where the conflicts are.
          </p>
          <Button asChild variant="outline" size="sm" className="font-mono text-xs">
            <Link to="/values">Build Your Values Profile <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Build alignment items
  const items: AlignmentItem[] = [];

  // Check high-importance values against company signals
  const highValues = Object.entries(profile).filter(
    ([k, v]) => k.endsWith("_importance") && typeof v === "number" && v >= 70
  );

  const signalCategories = new Set(issueSignals.map(s => s.issue_category));
  const gapCategories = new Set(publicStances.filter(s => s.gap_severity === "Large").map(s => s.issue_category));

  for (const [column, importance] of highValues) {
    const label = COLUMN_TO_LABEL[column] || column.replace(/_importance$/, "").replace(/_/g, " ");

    // Check if there are negative signals in this area
    const matchingIssues = Object.entries(ISSUE_TO_COLUMN).filter(([, col]) => col === column).map(([cat]) => cat);
    const hasNegativeSignal = matchingIssues.some(cat => signalCategories.has(cat));
    const hasGap = matchingIssues.some(cat => gapCategories.has(cat));

    if (hasNegativeSignal || hasGap) {
      items.push({
        label,
        detail: hasGap
          ? `You rated ${label} as important (${importance}/100). ${companyName} has a documented stance-record gap in this area.`
          : `You rated ${label} as important (${importance}/100). ${companyName} has active signals in this area worth reviewing.`,
        type: "conflict",
      });
    }
  }

  // EEOC check against discrimination values
  if (eeocCount > 0 && (profile.anti_discrimination_importance >= 70 || profile.dei_equity_importance >= 70)) {
    items.push({
      label: "Anti-Discrimination",
      detail: `You care deeply about discrimination. ${companyName} has ${eeocCount} EEOC enforcement action${eeocCount > 1 ? "s" : ""} on record.`,
      type: "conflict",
    });
  }

  // Political spending check
  if ((lobbyingSpend > 500_000 || pacSpending > 250_000) && (profile.political_transparency_importance >= 70 || profile.political_donations_importance >= 70)) {
    items.push({
      label: "Political Spending",
      detail: `You flagged political transparency as important. ${companyName} has significant political spending on record.`,
      type: "conflict",
    });
  }

  // Find aligned areas — high values with clean stances
  const cleanStances = publicStances.filter(s => s.gap_severity === "Aligned" || !s.gap_severity);
  for (const stance of cleanStances.slice(0, 3)) {
    const matchCol = Object.entries(ISSUE_TO_COLUMN).find(([cat]) => cat === stance.issue_category)?.[1];
    if (matchCol && profile[matchCol] >= 70) {
      items.push({
        label: COLUMN_TO_LABEL[matchCol] || stance.issue_category || "General",
        detail: `${companyName}'s public stance on ${stance.issue_category} appears consistent with their record — and it's something you care about.`,
        type: "aligned",
      });
    }
  }

  const conflicts = items.filter(i => i.type === "conflict");
  const aligned = items.filter(i => i.type === "aligned");

  return (
    <div className="space-y-4">
      {conflicts.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-xs text-destructive tracking-wider uppercase">Conflicts with Your Values</p>
          {conflicts.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-destructive/50 bg-destructive/5 rounded-none">
              <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {aligned.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-xs text-civic-green tracking-wider uppercase">Aligns with Your Values</p>
          {aligned.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-civic-green/50 bg-civic-green/5 rounded-none">
              <CheckCircle2 className="w-4 h-4 text-civic-green mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          We couldn't find direct matches between your values profile and {companyName}'s signals. This doesn't mean alignment — it means we don't have enough data to compare yet.
        </p>
      )}

      <div className="pt-2">
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground font-mono">
          <Link to="/values">Edit Your Values Profile <ArrowRight className="w-3 h-3 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}

export function hasValuesConflicts(items: AlignmentItem[]): boolean {
  return items.filter(i => i.type === "conflict").length > 0;
}
