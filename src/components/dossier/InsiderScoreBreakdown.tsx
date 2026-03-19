import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InsiderScorePill } from "@/components/InsiderScorePill";

interface InsiderScoreBreakdownProps {
  companyId: string;
  companyName: string;
  insiderScore: number | null | undefined;
}

interface BreakdownRow {
  label: string;
  value: string | number | null;
  verificationStatus: "verified" | "pending" | "stale" | "cross-verified";
  tier?: string;
}

const VERIFICATION_BADGE: Record<string, { label: string; className: string }> = {
  "cross-verified": {
    label: "Cross-Verified",
    className: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20",
  },
  verified: {
    label: "Verified",
    className: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20",
  },
  pending: {
    label: "Pending",
    className: "text-muted-foreground bg-muted/50 border-border",
  },
  stale: {
    label: "Stale",
    className: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/20",
  },
};

export function InsiderScoreBreakdown({ companyId, companyName, insiderScore }: InsiderScoreBreakdownProps) {
  const [explainerOpen, setExplainerOpen] = useState(false);

  const { data: interlocks } = useQuery({
    queryKey: ["insider-interlocks", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("board_interlocks")
        .select("id")
        .eq("company_a_id", companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const interlockCount = interlocks?.length ?? null;

  const rows: BreakdownRow[] = [
    {
      label: "Leadership overlap",
      value: null,
      verificationStatus: "pending",
    },
    {
      label: "Board interlocks",
      value: interlockCount !== null ? `${interlockCount} shared board relationship${interlockCount !== 1 ? "s" : ""}` : null,
      verificationStatus: interlockCount !== null ? "verified" : "pending",
    },
    {
      label: "Educational concentration",
      value: null,
      verificationStatus: "pending",
    },
    {
      label: "Related party disclosures",
      value: null,
      verificationStatus: "pending",
    },
    {
      label: "Network density estimate",
      value: null,
      verificationStatus: "pending",
      tier: "Tier 4 — commercial enrichment, not verified",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <InsiderScorePill score={insiderScore} />
      </div>

      <div className="space-y-1">
        {rows.map((row) => {
          const badge = VERIFICATION_BADGE[row.verificationStatus];
          return (
            <div
              key={row.label}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-border/30 bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{row.label}</span>
                {row.tier && (
                  <span className="ml-2 text-[10px] text-muted-foreground italic">{row.tier}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {row.value ?? "Data pending"}
                </span>
                <Badge variant="outline" className={`text-[9px] ${badge.className}`}>
                  {badge.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible explainer */}
      <div className="border border-border/30 rounded-lg overflow-hidden">
        <button
          onClick={() => setExplainerOpen(!explainerOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground">What is the Insider Score?</span>
          {explainerOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        {explainerOpen && (
          <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
            Every company runs a background check on candidates. WDIWF checks whether the people already inside got there on merit — or on who they know. This score is sourced from SEC proxy statements, ProPublica's nonprofit explorer, and public board disclosures. It is a transparency metric, not a character assessment.
          </div>
        )}
      </div>
    </div>
  );
}
