import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, AlertTriangle, Crown, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GovernanceSignalsCardProps {
  companyId: string;
  companyName: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-destructive/8", text: "text-destructive", border: "border-destructive/20", label: "High Risk" },
  warning: { bg: "bg-[hsl(var(--civic-yellow))]/8", text: "text-[hsl(var(--civic-yellow))]", border: "border-[hsl(var(--civic-yellow))]/20", label: "Elevated" },
  info: { bg: "bg-[hsl(var(--civic-blue))]/8", text: "text-[hsl(var(--civic-blue))]", border: "border-[hsl(var(--civic-blue))]/20", label: "Notable" },
  positive: { bg: "bg-[hsl(var(--civic-green))]/8", text: "text-[hsl(var(--civic-green))]", border: "border-[hsl(var(--civic-green))]/20", label: "Positive" },
};

const STRUCTURE_ICONS: Record<string, typeof Shield> = {
  "dual_class": Crown,
  "founder_control": Crown,
  "concentrated_ownership": AlertTriangle,
  "standard": Shield,
};

function getJackyeTake(structures: any[]): string {
  const hasDualClass = structures.some(s => s.structure_type === "dual_class" || s.structure_type === "founder_control");
  const hasConcentrated = structures.some(s => (s.voting_power_pct || 0) > 25);

  if (hasDualClass && hasConcentrated) {
    return "Concentrated power structure. One person or family controls enough votes to override other shareholders, which means the board is accountable to them, not necessarily to employees or minority investors. Worth understanding before you negotiate.";
  }
  if (hasDualClass) {
    return "Dual-class stock structure means not all shares carry equal weight. Some insiders hold supervoting shares, giving them disproportionate control over governance decisions. Watch for patterns where that control affects workforce policy.";
  }
  if (hasConcentrated) {
    return "Ownership is concentrated among a small number of holders. That can mean long-term strategic thinking, or it can mean limited accountability. Check whether the board has strong independent representation.";
  }
  return "No unusual ownership signals detected. Standard governance structure in the public record.";
}

export function GovernanceSignalsCard({ companyId, companyName }: GovernanceSignalsCardProps) {
  const { data: structures } = useQuery({
    queryKey: ["ownership-structures", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_ownership_structures")
        .select("*")
        .eq("company_id", companyId)
        .order("voting_power_pct", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  if (!structures || structures.length === 0) return null;

  return (
    <Card className="border-[hsl(var(--civic-yellow))]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-[hsl(var(--civic-yellow))]" />
          Ownership & Control Structure
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Who actually controls {companyName} — voting power, share classes, and governance signals.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Governance signals */}
        {structures.map((s: any) => {
          const severity = SEVERITY_STYLES[s.signal_severity] || SEVERITY_STYLES.info;
          const Icon = STRUCTURE_ICONS[s.structure_type] || Shield;
          return (
            <div
              key={s.id}
              className={cn("rounded-lg border p-4 space-y-3", severity.bg, severity.border)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-5 h-5 shrink-0", severity.text)} />
                  <div>
                    {s.governance_signal && (
                      <Badge variant="outline" className={cn("text-xs mb-1", severity.text, severity.border)}>
                        Governance Signal
                      </Badge>
                    )}
                    <h4 className="text-base font-semibold text-foreground">{s.governance_signal || s.description || "Ownership Signal"}</h4>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-xs shrink-0", severity.text, severity.border)}>
                  {severity.label}
                </Badge>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {s.holder_name && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{s.holder_name}</span>
                    {s.holder_role && <span className="text-xs text-muted-foreground">({s.holder_role})</span>}
                  </div>
                )}
                {s.voting_power_pct && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Voting Power</span>
                    <p className={cn("text-base font-bold", s.voting_power_pct > 30 ? "text-destructive" : "text-foreground")}>{s.voting_power_pct}%</p>
                  </div>
                )}
                {s.share_class && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Share Class</span>
                    <p className="text-base font-medium text-foreground">{s.share_class}</p>
                  </div>
                )}
              </div>

              {s.description && s.governance_signal && (
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              )}

              {/* Source */}
              <div className="flex items-center gap-2 pt-1">
                {s.source && <Badge variant="outline" className="text-xs">{s.source}</Badge>}
                {s.confidence && <Badge variant="outline" className="text-xs">{s.confidence}</Badge>}
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* Jackye's Take */}
        <div className="bg-primary/[0.03] border border-primary/15 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            {getJackyeTake(structures)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
