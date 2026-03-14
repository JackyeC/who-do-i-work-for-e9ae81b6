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
    return "This company has a concentrated power structure. One person or family controls enough votes to override other shareholders. That means the board works for them, not necessarily for employees or minority investors.";
  }
  if (hasDualClass) {
    return "Dual-class stock means not all shares are equal. Some insiders hold supervoting shares, giving them outsized control. Watch for decisions that benefit controlling shareholders over workers.";
  }
  if (hasConcentrated) {
    return "Ownership is concentrated among a few holders. This can be positive (long-term thinking) or risky (less accountability). Check if the board has strong independent voices.";
  }
  return "No unusual ownership signals detected. Standard governance structure.";
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
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
          Ownership & Control Structure
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Who actually controls {companyName} — voting power, share classes, and governance signals.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Governance signals */}
        {structures.map((s: any) => {
          const severity = SEVERITY_STYLES[s.signal_severity] || SEVERITY_STYLES.info;
          const Icon = STRUCTURE_ICONS[s.structure_type] || Shield;
          return (
            <div
              key={s.id}
              className={cn("rounded-lg border p-3.5 space-y-2", severity.bg, severity.border)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 shrink-0", severity.text)} />
                  <div>
                    {s.governance_signal && (
                      <Badge variant="outline" className={cn("text-[10px] mb-1", severity.text, severity.border)}>
                        Governance Signal
                      </Badge>
                    )}
                    <h4 className="text-sm font-semibold text-foreground">{s.governance_signal || s.description || "Ownership Signal"}</h4>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", severity.text, severity.border)}>
                  {severity.label}
                </Badge>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {s.holder_name && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-foreground">{s.holder_name}</span>
                    {s.holder_role && <span className="text-[10px] text-muted-foreground">({s.holder_role})</span>}
                  </div>
                )}
                {s.voting_power_pct && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Voting Power</span>
                    <p className={cn("text-sm font-bold", s.voting_power_pct > 30 ? "text-destructive" : "text-foreground")}>{s.voting_power_pct}%</p>
                  </div>
                )}
                {s.share_class && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Share Class</span>
                    <p className="text-sm font-medium text-foreground">{s.share_class}</p>
                  </div>
                )}
              </div>

              {s.description && s.governance_signal && (
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              )}

              {/* Source */}
              <div className="flex items-center gap-2 pt-1">
                {s.source && <Badge variant="outline" className="text-[10px]">{s.source}</Badge>}
                {s.confidence && <Badge variant="outline" className="text-[10px]">{s.confidence}</Badge>}
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    View Source <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* Jackye's Take */}
        <div className="bg-primary/[0.03] border border-primary/15 rounded-lg p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getJackyeTake(structures)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
