import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SourceLabel, type SourceTier } from "@/components/ui/source-label";
import {
  Users, TrendingDown, DollarSign, AlertTriangle, ShieldCheck,
  Building2, FileText, Briefcase, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

interface IntelRow {
  icon: typeof Users;
  title: string;
  detail: string;
  tier: SourceTier;
  iconColor?: string;
}

export default function CompanyIntelligenceSection({ companyId, companyName }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["offer-check-company-intel", companyId],
    queryFn: async () => {
      const [
        execs,
        warns,
        sentiment,
        stances,
        darkMoney,
        boardAffil,
        revolvingDoor,
        jobs,
        courtCases,
      ] = await Promise.all([
        supabase.from("company_executives").select("name, title, total_donations").eq("company_id", companyId).order("total_donations", { ascending: false }).limit(5),
        supabase.from("company_warn_notices" as any).select("notice_date, employees_affected, event_type").eq("company_id", companyId).order("notice_date", { ascending: false }).limit(5),
        supabase.from("company_worker_sentiment").select("sentiment, platform, ai_summary").eq("company_id", companyId).limit(10),
        supabase.from("company_public_stances" as any).select("topic, gap").eq("company_id", companyId).limit(5),
        supabase.from("company_dark_money").select("name, relationship").eq("company_id", companyId).limit(3),
        supabase.from("company_board_affiliations").select("name").eq("company_id", companyId).limit(5),
        supabase.from("company_revolving_door" as any).select("person, prior_role, new_role").eq("company_id", companyId).limit(3),
        supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("company_court_cases").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);

      return {
        executives: (execs.data ?? []) as { name: string; title: string; total_donations: number }[],
        warns: (warns.data ?? []) as { notice_date: string; employees_affected: number; event_type: string }[],
        sentiments: (sentiment.data ?? []) as { sentiment: string; platform: string; ai_summary: string | null }[],
        stances: (stances.data ?? []) as { topic: string; gap: string }[],
        darkMoney: (darkMoney.data ?? []) as { name: string; relationship: string }[],
        boardAffil: (boardAffil.data ?? []) as { name: string }[],
        revolvingDoor: (revolvingDoor.data ?? []) as { person: string; prior_role: string; new_role: string }[],
        activeJobs: jobs.count ?? 0,
        courtCases: courtCases.count ?? 0,
      };
    },
  });

  if (isLoading) return null;
  if (!data) return null;

  const rows: IntelRow[] = [];

  // Leadership
  if (data.executives.length > 0) {
    const top = data.executives.slice(0, 3);
    const names = top.map(e => `${e.name} (${e.title})`).join(", ");
    const totalDonations = data.executives.reduce((s, e) => s + (e.total_donations || 0), 0);
    rows.push({
      icon: Users,
      title: "Leadership Signals",
      detail: totalDonations > 0
        ? `Key leaders: ${names}. Combined political donations: $${totalDonations.toLocaleString()}.`
        : `Key leaders: ${names}. No political donations detected.`,
      tier: totalDonations > 0 ? "verified" : "inferred",
    });
  } else {
    rows.push({
      icon: Users,
      title: "Leadership Signals",
      detail: "No executive data available yet. This may be a private or recently added company.",
      tier: "no_evidence",
    });
  }

  // Layoffs / Workforce
  if (data.warns.length > 0) {
    const total = data.warns.reduce((s, w) => s + (w.employees_affected || 0), 0);
    const latest = data.warns[0];
    rows.push({
      icon: TrendingDown,
      title: "Layoffs & Workforce Trends",
      detail: `${data.warns.length} WARN notice(s) on record affecting ${total.toLocaleString()} workers. Most recent: ${latest.notice_date?.slice(0, 10) ?? "unknown"}.`,
      tier: "verified",
      iconColor: "text-destructive",
    });
  } else {
    rows.push({
      icon: TrendingDown,
      title: "Layoffs & Workforce Trends",
      detail: "No WARN Act notices or mass layoff events found in public records.",
      tier: "no_evidence",
    });
  }

  // Financial / Structural
  if (data.darkMoney.length > 0 || data.boardAffil.length > 0) {
    const parts: string[] = [];
    if (data.boardAffil.length > 0) parts.push(`Trade affiliations: ${data.boardAffil.map(b => b.name).join(", ")}.`);
    if (data.darkMoney.length > 0) parts.push(`Dark money connections: ${data.darkMoney.map(d => d.name).join(", ")}.`);
    rows.push({
      icon: Building2,
      title: "Financial & Structural Indicators",
      detail: parts.join(" "),
      tier: "inferred",
    });
  }

  // Revolving door
  if (data.revolvingDoor.length > 0) {
    const rd = data.revolvingDoor[0];
    rows.push({
      icon: AlertTriangle,
      title: "Revolving Door Connections",
      detail: `${rd.person}: moved from ${rd.prior_role} to ${rd.new_role}.${data.revolvingDoor.length > 1 ? ` +${data.revolvingDoor.length - 1} more.` : ""}`,
      tier: "inferred",
      iconColor: "text-civic-yellow",
    });
  }

  // Public stance gaps
  const conflicts = data.stances.filter(s => s.gap === "direct-conflict" || s.gap === "mixed");
  if (conflicts.length > 0) {
    rows.push({
      icon: FileText,
      title: "Say vs. Spend Gaps",
      detail: `${conflicts.length} topic(s) where public claims conflict with spending: ${conflicts.map(c => c.topic).join(", ")}.`,
      tier: "multi_source",
    });
  }

  // Court cases
  if (data.courtCases > 0) {
    rows.push({
      icon: AlertTriangle,
      title: "Legal Activity",
      detail: `${data.courtCases} court case(s) found in public records.`,
      tier: "verified",
      iconColor: "text-destructive",
    });
  }

  // Worker sentiment
  const posSentiment = data.sentiments.filter(s => s.sentiment === "positive").length;
  const negSentiment = data.sentiments.filter(s => s.sentiment === "negative").length;
  if (data.sentiments.length > 0) {
    rows.push({
      icon: ShieldCheck,
      title: "Worker Sentiment",
      detail: `${data.sentiments.length} report(s) analyzed: ${posSentiment} positive, ${negSentiment} negative.${data.sentiments[0]?.ai_summary ? ` "${data.sentiments[0].ai_summary.slice(0, 120)}…"` : ""}`,
      tier: "inferred",
    });
  }

  const hasData = rows.some(r => r.tier !== "no_evidence");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Company Intelligence
        </h3>
        {!hasData && (
          <span className="text-[10px] text-muted-foreground italic">Limited data available</span>
        )}
      </div>

      {!hasData && (
        <div className="bg-muted/30 border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Limited data available — this is what we found so far.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", row.iconColor ?? "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{row.title}</p>
                    <SourceLabel tier={row.tier} className="shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
