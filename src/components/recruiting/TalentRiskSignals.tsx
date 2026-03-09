import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, ExternalLink, Users, Building2, Scale, AlertTriangle, Briefcase, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskSignal {
  label: string;
  description: string;
  severity: "high" | "medium" | "low";
  sourceUrl?: string;
  sourceLabel?: string;
}

interface Props {
  companyId: string;
  companyName: string;
}

function severityColor(s: "high" | "medium" | "low") {
  switch (s) {
    case "high": return "bg-destructive/10 text-destructive border-destructive/30";
    case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    case "low": return "bg-muted text-muted-foreground border-border";
  }
}

export function TalentRiskSignals({ companyId, companyName }: Props) {
  const [risks, setRisks] = useState<RiskSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      setLoading(true);
      const detected: RiskSignal[] = [];

      const [warnRes, ideologyRes, aiHrRes, sentimentRes, revDoorRes, darkMoneyRes, valuesRes] = await Promise.all([
        supabase.from("company_warn_notices").select("id, employees_affected, notice_date, source_url, layoff_type").eq("company_id", companyId).order("notice_date", { ascending: false }).limit(5),
        supabase.from("company_ideology_flags").select("id, category, description, severity, evidence_url").eq("company_id", companyId).limit(5),
        supabase.from("ai_hr_signals").select("id, signal_type, signal_category, source_url").eq("company_id", companyId).limit(3),
        supabase.from("company_worker_sentiment").select("id, sentiment, ai_summary, top_complaints").eq("company_id", companyId).limit(1),
        supabase.from("company_revolving_door").select("id, person, new_role").eq("company_id", companyId).limit(3),
        supabase.from("company_dark_money").select("id, name, source").eq("company_id", companyId).limit(2),
        supabase.from("company_values_signals").select("id, value_category, signal_type, severity, evidence_url").eq("company_id", companyId).eq("severity", "high").limit(5),
      ]);

      // Workforce restructuring
      if (warnRes.data && warnRes.data.length > 0) {
        const totalAffected = warnRes.data.reduce((s, w) => s + (w.employees_affected || 0), 0);
        detected.push({
          label: "Workforce Restructuring detected",
          description: `${warnRes.data.length} WARN notice${warnRes.data.length > 1 ? "s" : ""} filed affecting ${totalAffected.toLocaleString()} workers`,
          severity: totalAffected > 1000 ? "high" : "medium",
          sourceUrl: warnRes.data[0]?.source_url || `https://www.google.com/search?q=${encodeURIComponent(companyName + " WARN notice layoff")}`,
          sourceLabel: "WARN Act Records",
        });
      }

      // Executive/leadership changes via revolving door
      if (revDoorRes.data && revDoorRes.data.length > 0) {
        detected.push({
          label: "Executive Leadership Change detected",
          description: `${revDoorRes.data.length} revolving door connection${revDoorRes.data.length > 1 ? "s" : ""} between government and company leadership`,
          severity: "medium",
          sourceUrl: `https://www.opensecrets.org/revolving/search-result.php?search=${encodeURIComponent(companyName)}`,
          sourceLabel: "OpenSecrets",
        });
      }

      // Policy alignment controversy
      if (ideologyRes.data && ideologyRes.data.length > 0) {
        const highSeverity = ideologyRes.data.filter(f => f.severity === "high" || f.severity === "critical");
        detected.push({
          label: "Policy Alignment controversy detected",
          description: `${ideologyRes.data.length} ideology flag${ideologyRes.data.length > 1 ? "s" : ""} including ${ideologyRes.data.map(f => f.category).slice(0, 2).join(", ")}`,
          severity: highSeverity.length > 0 ? "high" : "medium",
          sourceUrl: ideologyRes.data[0]?.evidence_url || undefined,
          sourceLabel: "Evidence",
        });
      }

      // AI/HR concerns
      if (aiHrRes.data && aiHrRes.data.length > 0) {
        detected.push({
          label: "AI Hiring Technology concerns detected",
          description: `${aiHrRes.data.length} signal${aiHrRes.data.length > 1 ? "s" : ""} related to ${[...new Set(aiHrRes.data.map(s => s.signal_category))].slice(0, 2).join(", ")}`,
          severity: "medium",
          sourceUrl: aiHrRes.data[0]?.source_url || undefined,
          sourceLabel: "Source",
        });
      }

      // Dark money
      if (darkMoneyRes.data && darkMoneyRes.data.length > 0) {
        detected.push({
          label: "Undisclosed political spending connections",
          description: `Linked to ${darkMoneyRes.data.map(d => d.name).slice(0, 2).join(", ")}`,
          severity: "high",
          sourceUrl: darkMoneyRes.data[0]?.source || undefined,
          sourceLabel: "Public records",
        });
      }

      // Negative worker sentiment
      if (sentimentRes.data && sentimentRes.data.length > 0) {
        const s = sentimentRes.data[0];
        if (s.sentiment === "negative" || s.sentiment === "mixed") {
          const complaints = Array.isArray(s.top_complaints) ? (s.top_complaints as string[]).slice(0, 2).join(", ") : "various concerns";
          detected.push({
            label: "Worker Sentiment concerns detected",
            description: `${s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1)} sentiment — top issues: ${complaints}`,
            severity: s.sentiment === "negative" ? "high" : "medium",
          });
        }
      }

      // High-severity values signals (DEI rollbacks, etc.)
      if (valuesRes.data && valuesRes.data.length > 0) {
        const categories = [...new Set(valuesRes.data.map(v => v.value_category))];
        detected.push({
          label: "High-severity values signals detected",
          description: `${valuesRes.data.length} signal${valuesRes.data.length > 1 ? "s" : ""} in ${categories.slice(0, 3).join(", ")}`,
          severity: "high",
          sourceUrl: valuesRes.data[0]?.evidence_url || undefined,
          sourceLabel: "Evidence",
        });
      }

      // Sort by severity
      const order = { high: 0, medium: 1, low: 2 };
      detected.sort((a, b) => order[a.severity] - order[b.severity]);

      setRisks(detected);
      setLoading(false);
    };

    detect();
  }, [companyId, companyName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Talent Risk Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No talent risk signals detected for {companyName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          Talent Risk Signals
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Signals that may affect recruiting success or candidate perception for {companyName}. Displayed neutrally — no judgments are made.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {risks.map((r, i) => (
          <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn("text-xs", severityColor(r.severity))}>
                    {r.severity}
                  </Badge>
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              {r.sourceUrl && (
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-1"
                >
                  {r.sourceLabel || "Source"} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2 italic">
          This platform reports signals detected from publicly available data sources. No conclusions are drawn. Interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}
