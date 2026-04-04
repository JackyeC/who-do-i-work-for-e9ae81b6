import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeMissionIntegrity, type MissionIntegrityResult } from "@/lib/mission-integrity-score";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionIntegrityCardProps {
  companyId: string;
  companyName: string;
}

const GRADE_CONFIG: Record<string, { color: string; bg: string; Icon: typeof ShieldCheck }> = {
  A: { color: "text-civic-green", bg: "bg-civic-green/10", Icon: ShieldCheck },
  B: { color: "text-civic-green", bg: "bg-civic-green/10", Icon: ShieldCheck },
  C: { color: "text-civic-yellow", bg: "bg-civic-yellow/10", Icon: AlertTriangle },
  D: { color: "text-destructive", bg: "bg-destructive/10", Icon: AlertTriangle },
  F: { color: "text-destructive", bg: "bg-destructive/10", Icon: XCircle },
};

export function MissionIntegrityCard({ companyId, companyName }: MissionIntegrityCardProps) {
  const { data: stances } = useQuery({
    queryKey: ["mission-stances", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("stance_topic, stance_summary")
        .eq("company_id", companyId);
      return data || [];
    },
  });

  const { data: enforcements } = useQuery({
    queryKey: ["mission-enforcements", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("accountability_signals")
        .select("signal_type, description, headline")
        .eq("company_id", companyId)
        .limit(50);
      return data || [];
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["mission-donations", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_executives")
        .select("name, total_donations")
        .eq("company_id", companyId)
        .not("total_donations", "is", null);
      return (data || []).map((d) => ({
        recipient_name: d.name,
        amount: Number(d.total_donations) || 0,
      }));
    },
  });

  if (!stances && !enforcements) return null;

  const result: MissionIntegrityResult = computeMissionIntegrity(
    stances || [],
    (enforcements || []).map((e) => ({
      signal_type: e.signal_type,
      description: e.description || undefined,
      headline: e.headline,
    })),
    donations || [],
  );

  // Don't render if no stances exist and no enforcements
  if (result.stanceCount === 0 && result.enforcementCount === 0) return null;

  const gradeConfig = GRADE_CONFIG[result.grade] || GRADE_CONFIG.C;
  const GradeIcon = gradeConfig.Icon;

  return (
    <div className="border border-border/40 bg-card">
      <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded flex items-center justify-center text-lg font-black", gradeConfig.bg, gradeConfig.color)}>
            {result.grade}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Mission Integrity</p>
            <p className="text-xs text-muted-foreground">
              Score: {result.score}/100 -- Does {companyName} walk the talk?
            </p>
          </div>
        </div>
        <GradeIcon className={cn("w-5 h-5", gradeConfig.color)} />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-px bg-border/20">
        <div className="bg-card px-4 py-3 text-center">
          <p className="text-lg font-bold text-foreground">{result.stanceCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Public Stances</p>
        </div>
        <div className="bg-card px-4 py-3 text-center">
          <p className="text-lg font-bold text-foreground">{result.enforcementCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enforcement Actions</p>
        </div>
        <div className="bg-card px-4 py-3 text-center">
          <p className="text-lg font-bold text-foreground">{result.conflicts.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contradictions</p>
        </div>
      </div>

      {/* Conflicts */}
      {result.conflicts.length > 0 && (
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contradictions Found</p>
          {result.conflicts.map((c, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Badge
                className={cn(
                  "text-[9px] font-bold mt-0.5 shrink-0",
                  c.severity === "high" ? "bg-destructive/10 text-destructive" :
                  c.severity === "medium" ? "bg-civic-yellow/10 text-civic-yellow" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {c.severity.toUpperCase()}
              </Badge>
              <div>
                <p className="text-xs font-medium text-foreground">They say: "{c.claim}"</p>
                <p className="text-xs text-muted-foreground">Record shows: {c.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.conflicts.length === 0 && result.stanceCount > 0 && (
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground">
            No direct contradictions found between stated values and public enforcement record.
            This does not mean alignment is confirmed -- it means no conflicts surfaced in available data.
          </p>
        </div>
      )}

      {result.stanceCount === 0 && (
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Transparency gap: {companyName} has no public stances on record.
            Companies that don't state their values publicly can't be measured against them.
          </p>
        </div>
      )}
    </div>
  );
}
