import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, AlertTriangle, CheckCircle2, Heart, Eye,
  Megaphone, Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId?: string;
  companyName: string;
}

interface CultureSignal {
  type: "strength" | "risk" | "verify";
  label: string;
  detail: string;
}

export function CultureSnapshot({ companyId, companyName }: Props) {
  const { data: sentiment } = useQuery({
    queryKey: ["culture-sentiment", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_worker_sentiment")
        .select("overall_rating, ceo_approval, work_life_balance, compensation_rating, top_complaints, top_praises, ai_summary, hypocrisy_flags")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
  });

  const { data: hypocrisy } = useQuery({
    queryKey: ["culture-hypocrisy", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_hypocrisy_index")
        .select("chi_grade, direct_conflicts, total_stances")
        .eq("company_id", companyId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: stances } = useQuery({
    queryKey: ["culture-stances", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("topic, gap")
        .eq("company_id", companyId!)
        .limit(5);
      return data || [];
    },
  });

  // Build culture signals
  const signals: CultureSignal[] = [];

  if (sentiment) {
    if (sentiment.overall_rating && sentiment.overall_rating >= 3.8)
      signals.push({ type: "strength", label: "Above-Average Employee Satisfaction", detail: `Overall rating: ${sentiment.overall_rating}/5. Suggests functional day-to-day work environment.` });
    else if (sentiment.overall_rating && sentiment.overall_rating < 3.0)
      signals.push({ type: "risk", label: "Below-Average Employee Satisfaction", detail: `Overall rating: ${sentiment.overall_rating}/5. Pattern suggests systemic workplace issues.` });

    if (sentiment.ceo_approval && sentiment.ceo_approval >= 0.7)
      signals.push({ type: "strength", label: "Strong CEO Approval", detail: `${Math.round(sentiment.ceo_approval * 100)}% approval. Leadership has workforce credibility.` });
    else if (sentiment.ceo_approval && sentiment.ceo_approval < 0.4)
      signals.push({ type: "risk", label: "Low CEO Approval", detail: `${Math.round(sentiment.ceo_approval * 100)}% approval. Signals potential leadership-workforce disconnect.` });

    if (sentiment.work_life_balance && sentiment.work_life_balance < 2.5)
      signals.push({ type: "risk", label: "Burnout Culture Risk", detail: `Work-life balance rated ${sentiment.work_life_balance}/5. Pattern consistent with high-pressure or understaffed environment.` });

    const complaints = (sentiment.top_complaints as any[]) || [];
    complaints.slice(0, 2).forEach((c: any) => {
      signals.push({ type: "risk", label: `Recurring Concern: ${c.theme || "Workplace Issue"}`, detail: c.summary || c.text || "Employees report this as a repeated issue." });
    });

    const praises = (sentiment.top_praises as any[]) || [];
    praises.slice(0, 2).forEach((p: any) => {
      signals.push({ type: "strength", label: `Positive Pattern: ${p.theme || "Workplace Strength"}`, detail: p.summary || p.text || "Employees highlight this as a strength." });
    });
  }

  if (hypocrisy) {
    if (hypocrisy.direct_conflicts > 0) {
      signals.push({ type: "risk", label: `Values-Washing Risk (${hypocrisy.chi_grade})`, detail: `${hypocrisy.direct_conflicts} direct conflicts between public stances and spending behavior out of ${hypocrisy.total_stances} tracked stances.` });
    } else {
      signals.push({ type: "strength", label: `Consistent Say-Do Pattern (${hypocrisy.chi_grade})`, detail: `No direct conflicts between stated values and spending across ${hypocrisy.total_stances} tracked stances.` });
    }
  }

  const majorGaps = stances.filter(s => s.gap?.toLowerCase() === "major");
  if (majorGaps.length > 0) {
    signals.push({ type: "risk", label: "Major Say-Do Gaps Detected", detail: `Public positions on ${majorGaps.map(g => g.topic).join(", ")} conflict significantly with actual spending patterns.` });
  }

  // Always add verification prompts
  signals.push({ type: "verify", label: "Verify in Interviews", detail: "Ask about team turnover, last promotion timeline, typical work hours, and how conflict is handled." });
  signals.push({ type: "verify", label: "Check Onboarding Structure", detail: "Ask whether there's a documented 30/60/90-day plan. Companies that invest in onboarding tend to invest in retention." });

  const ICON_MAP = {
    strength: CheckCircle2,
    risk: AlertTriangle,
    verify: Eye,
  };
  const COLOR_MAP = {
    strength: "text-[hsl(var(--civic-green))]",
    risk: "text-[hsl(var(--civic-yellow))]",
    verify: "text-primary",
  };
  const BG_MAP = {
    strength: "bg-[hsl(var(--civic-green))]/5 border-[hsl(var(--civic-green))]/10",
    risk: "bg-[hsl(var(--civic-yellow))]/5 border-[hsl(var(--civic-yellow))]/10",
    verify: "bg-primary/5 border-primary/10",
  };

  const strengths = signals.filter(s => s.type === "strength");
  const risks = signals.filter(s => s.type === "risk");
  const verifies = signals.filter(s => s.type === "verify");

  return (
    <div id="culture-snapshot">
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Culture Snapshot Before You Sign
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            What public signals and worker sentiment tell us about working at {companyName}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!companyId && (
            <p className="text-sm text-muted-foreground italic py-4">
              Company not matched to database. Culture signals unavailable. Select a company from autocomplete for this section to populate.
            </p>
          )}

          {companyId && signals.filter(s => s.type !== "verify").length === 0 && (
            <p className="text-sm text-muted-foreground italic py-2">
              Limited culture data available for {companyName}. Use the verification questions below during your interview process.
            </p>
          )}

          {/* Grouped signals */}
          {[
            { items: strengths, title: "Culture Strengths" },
            { items: risks, title: "Culture Risks" },
            { items: verifies, title: "Verify Before Accepting" },
          ].filter(g => g.items.length > 0).map(group => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h4>
              {group.items.map((signal, i) => {
                const Icon = ICON_MAP[signal.type];
                return (
                  <div
                    key={i}
                    className={cn("flex items-start gap-3 p-3 rounded-xl border", BG_MAP[signal.type])}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", COLOR_MAP[signal.type])} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{signal.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{signal.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
