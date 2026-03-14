/**
 * NARRATIVE POWER INTELLIGENCE — Main Section Component
 * 
 * Maps who shapes the narrative around a company or industry.
 * Tracks PR firms, influencers, advocacy groups, think tanks,
 * media outlets, and coordinated messaging networks.
 * 
 * Evidence integrity: All signals must be sourced.
 * Unverified claims are labeled "Allegation."
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, Info } from "lucide-react";
import { NarrativePowerScore } from "./NarrativePowerScore";
import { NarrativeSignalCard } from "./NarrativeSignalCard";
import { cn } from "@/lib/utils";

type SortOption = "recent" | "confidence";
type SignalFilter = "all" | "influencer_campaign" | "media_amplification" | "pr_narrative_campaign" | "advocacy_messaging" | "propaganda_network";

const SIGNAL_FILTER_LABELS: Record<SignalFilter, string> = {
  all: "All",
  influencer_campaign: "Influencer",
  media_amplification: "Media",
  pr_narrative_campaign: "PR Campaign",
  advocacy_messaging: "Advocacy",
  propaganda_network: "Propaganda",
};

const CONFIDENCE_ORDER: Record<string, number> = { verified: 3, investigative_reporting: 2, allegation: 1 };

interface NarrativePowerSectionProps {
  companyName: string;
  companyId?: string;
}

export function NarrativePowerSection({ companyName, companyId }: NarrativePowerSectionProps) {
  const [sort, setSort] = useState<SortOption>("confidence");
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("all");

  const { data: signals, isLoading } = useQuery({
    queryKey: ["narrative-power", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("narrative_power_signals")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("confidence_level", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Compute score inputs
  const scoreInputs = useMemo(() => {
    if (!signals || signals.length === 0) return null;
    const allIntermediaries = signals.flatMap(s => s.intermediaries || []);
    const uniqueActors = new Set(signals.map(s => s.actor_type));
    return {
      signalCount: signals.length,
      verifiedCount: signals.filter(s => s.confidence_level === "verified").length,
      intermediaryCount: new Set(allIntermediaries).size,
      uniqueActorTypes: uniqueActors.size,
    };
  }, [signals]);

  // Filtered/sorted signals
  const filtered = useMemo(() => {
    if (!signals) return [];
    let result = [...signals];

    if (signalFilter !== "all") {
      result = result.filter(s => s.signal_type === signalFilter);
    }

    result.sort((a, b) => {
      if (sort === "confidence") {
        return (CONFIDENCE_ORDER[b.confidence_level] || 0) - (CONFIDENCE_ORDER[a.confidence_level] || 0);
      }
      return (b.date_range_start || "").localeCompare(a.date_range_start || "");
    });

    return result;
  }, [signals, signalFilter, sort]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 shimmer-skeleton rounded-lg" />
        <div className="h-24 shimmer-skeleton rounded-lg" />
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-border bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          No narrative power signals detected for {companyName}. This section will populate as intelligence is gathered.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Score card */}
      {scoreInputs && <NarrativePowerScore {...scoreInputs} />}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Narrative signals are documented from investigative journalism, court filings, government reports, and financial disclosures.
          All signals include source citations. Unverified claims are labeled accordingly.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Filter</span>
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="font-mono text-[10px] bg-card border border-border rounded-sm px-2 py-1 text-foreground"
        >
          <option value="confidence">Strongest Evidence</option>
          <option value="recent">Most Recent</option>
        </select>

        <div className="flex items-center gap-1">
          {(Object.entries(SIGNAL_FILTER_LABELS) as [SignalFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSignalFilter(key)}
              className={cn(
                "font-mono text-[10px] tracking-wider px-2 py-1 border rounded-sm transition-colors whitespace-nowrap",
                signalFilter === key
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Signal cards */}
      <div className="space-y-3">
        {filtered.map(signal => (
          <NarrativeSignalCard
            key={signal.id}
            signalType={signal.signal_type}
            signalTitle={signal.signal_title}
            actorName={signal.actor_name}
            actorType={signal.actor_type}
            actorDescription={signal.actor_description}
            narrativeTarget={signal.narrative_target}
            narrativeMethod={signal.narrative_method}
            evidenceSource={signal.evidence_source}
            evidenceDescription={signal.evidence_description}
            evidenceUrls={signal.evidence_urls || []}
            confidenceLevel={signal.confidence_level}
            dateRangeStart={signal.date_range_start}
            dateRangeEnd={signal.date_range_end}
            intermediaries={signal.intermediaries || []}
            narrativeChain={signal.narrative_chain}
          />
        ))}
      </div>
    </div>
  );
}
