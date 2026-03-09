import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, ArrowLeft, Info, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { VALUES_LENSES, type ValuesLensKey } from "@/lib/valuesLenses";
import { ValuesCompanyCard } from "./ValuesCompanyCard";
import { ValueConflictAlert } from "./ValueConflictAlert";

interface Props {
  lensKey: ValuesLensKey;
  onBack: () => void;
}

export function ValuesLensResults({ lensKey, onBack }: Props) {
  const [textFilter, setTextFilter] = useState("");
  const lensInfo = VALUES_LENSES.find((l) => l.key === lensKey);

  // Fetch signals for this lens from both tables
  const { data: signals, isLoading: loadingSignals } = useQuery({
    queryKey: ["values-lens-signals", lensKey],
    queryFn: async () => {
      // Query company_values_signals using values_lens OR value_category
      const { data, error } = await (supabase as any)
        .from("company_values_signals")
        .select("*")
        .or(`values_lens.eq.${lensKey},value_category.eq.${lensKey}`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error("Signals error:", error);
      return data || [];
    },
  });

  // Fetch evidence for this lens
  const { data: evidence, isLoading: loadingEvidence } = useQuery({
    queryKey: ["values-lens-evidence", lensKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_values_evidence")
        .select("*")
        .eq("values_lens", lensKey)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error("Evidence error:", error);
      return data || [];
    },
  });

  // Also pull from issue_signals for backward compat
  const issueMapping: Record<string, string> = {
    labor_rights: "labor_rights",
    environment_climate: "climate",
    lgbtq_rights: "lgbtq_rights",
    reproductive_rights: "reproductive_rights",
    voting_rights: "voting_rights",
    consumer_protection: "consumer_protection",
    healthcare: "healthcare",
    immigration: "immigration",
    dei_equity: "civil_rights",
  };

  const mappedIssue = issueMapping[lensKey];

  const { data: issueSignals } = useQuery({
    queryKey: ["issue-signals-for-lens", mappedIssue],
    enabled: !!mappedIssue,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("issue_signals")
        .select("id, entity_id, entity_name_snapshot, issue_category, signal_type, signal_subtype, source_dataset, description, source_url, confidence_score, amount, transaction_date, created_at")
        .eq("issue_category", mappedIssue)
        .limit(500);
      return data || [];
    },
  });

  // Get all unique company IDs
  const companyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of (signals || []) as any[]) ids.add(s.company_id);
    for (const e of (evidence || []) as any[]) ids.add(e.entity_id);
    for (const s of (issueSignals || []) as any[]) ids.add(s.entity_id);
    return Array.from(ids);
  }, [signals, evidence, issueSignals]);

  const { data: companies } = useQuery({
    queryKey: ["values-lens-companies", companyIds],
    enabled: companyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state")
        .in("id", companyIds);
      return data || [];
    },
  });

  // Also check for value conflicts (public stances vs spending)
  const { data: publicStances } = useQuery({
    queryKey: ["values-stances", companyIds],
    enabled: companyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("*")
        .in("company_id", companyIds);
      return data || [];
    },
  });

  // Build results
  const results = useMemo(() => {
    if (!companies) return [];
    const map = new Map<string, { company: any; signals: any[]; evidence: any[]; hasConflict: boolean }>();

    for (const c of companies) {
      map.set(c.id, { company: c, signals: [], evidence: [], hasConflict: false });
    }

    // Add values signals
    for (const s of (signals || []) as any[]) {
      const entry = map.get(s.company_id);
      if (entry) entry.signals.push(s);
    }

    // Add issue signals as synthetic signals
    for (const s of (issueSignals || []) as any[]) {
      const entry = map.get(s.entity_id);
      if (entry) {
        entry.signals.push({
          id: s.id,
          signal_label: s.description,
          signal_direction: "informational_signal",
          confidence_level: s.confidence_score || "medium",
          evidence_url: s.source_url,
          signal_type: s.signal_type,
        });
      }
    }

    // Add evidence
    for (const e of (evidence || []) as any[]) {
      const entry = map.get(e.entity_id);
      if (entry) entry.evidence.push(e);
    }

    // Detect conflicts
    for (const stance of (publicStances || []) as any[]) {
      const entry = map.get(stance.company_id);
      if (entry && stance.gap === "large") {
        entry.hasConflict = true;
      }
    }

    let list = Array.from(map.values())
      .filter((e) => e.signals.length > 0 || e.evidence.length > 0)
      .sort((a, b) => (b.signals.length + b.evidence.length) - (a.signals.length + a.evidence.length));

    if (textFilter.trim()) {
      const q = textFilter.toLowerCase();
      list = list.filter((e) =>
        e.company.name?.toLowerCase().includes(q) ||
        e.company.industry?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [companies, signals, issueSignals, evidence, publicStances, textFilter]);

  // Build conflict alerts
  const conflictAlerts = useMemo(() => {
    if (!publicStances || !companies) return [];
    return (publicStances as any[])
      .filter((s: any) => s.gap === "large")
      .map((s: any) => {
        const c = (companies as any[]).find((c: any) => c.id === s.company_id);
        return {
          company_name: c?.name || "Unknown",
          company_slug: c?.slug || "",
          public_claim: s.public_position,
          conflicting_evidence: s.spending_reality,
          lens_label: lensInfo?.label || "",
        };
      });
  }, [publicStances, companies, lensInfo]);

  const isLoading = loadingSignals || loadingEvidence;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> All Lenses
        </Button>
        <Separator orientation="vertical" className="h-5" />
        {lensInfo && (
          <div className="flex items-center gap-2">
            <lensInfo.icon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground font-display">{lensInfo.label}</h2>
          </div>
        )}
      </div>

      {lensInfo && (
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          {lensInfo.description}. Companies listed below have documented public records connected to this values lens.
        </p>
      )}

      {/* Transparency note */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-muted/40 border border-border/40 mb-6 max-w-2xl">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This platform surfaces publicly documented signals connected to the values or issues you choose.
          It does not assign moral or legal judgments. Interpretation is left to the user.
        </p>
      </div>

      {/* Search filter */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          placeholder="Filter companies by name or industry..."
          className="pl-10"
        />
      </div>

      {/* Conflict alerts */}
      {conflictAlerts.length > 0 && (
        <div className="mb-6">
          <ValueConflictAlert conflicts={conflictAlerts} />
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Searching signals...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-8">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No documented signals yet for {lensInfo?.label}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Our system scans public records for evidence-backed signals. As companies are scanned and more data is ingested, results will appear here automatically.
            </p>
          </div>

          {/* Evidence methodology */}
          <div className="space-y-4 text-left">
            <h4 className="text-sm font-semibold text-foreground">How signals are detected</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Employer Reality Signals for this lens are generated when documented public records contain relevant keywords. The system searches across multiple evidence layers:
            </p>

            <div className="grid gap-3">
              {[
                { layer: "Money Trail", desc: "Campaign donations and PAC spending to politicians with documented positions on this issue", sources: "FEC filings, OpenSecrets" },
                { layer: "Influence Trail", desc: "Registered lobbying activity referencing this policy area in quarterly disclosure filings", sources: "Senate LDA filings, state lobbying registries" },
                { layer: "Policy Alignment", desc: "Support or opposition to specific legislation, bill sponsorship connections", sources: "Congress.gov, advocacy trackers" },
                { layer: "Corporate Actions", desc: "Public statements, corporate policy changes, advocacy group memberships", sources: "SEC filings, press releases, corporate policies" },
              ].map((item) => (
                <div key={item.layer} className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{item.layer}</span>
                    <span className="text-[10px] text-muted-foreground">{item.sources}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Strongest signal pattern:</strong> When money (PAC donations to bill sponsors), influence (registered lobbying on the issue), and policy alignment (legislative connections) all point in the same direction, that constitutes strong documented evidence.
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
              This platform reports signals detected from publicly available data sources. No conclusions are drawn. Interpretation is left to the user.
            </p>
          </div>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={onBack}>Browse other lenses</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} compan{results.length !== 1 ? "ies" : "y"} with {lensInfo?.label} signals
          </p>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {results.map(({ company, signals: sigs, evidence: evs, hasConflict }) => (
                <ValuesCompanyCard
                  key={company.id}
                  company={company}
                  signals={sigs}
                  evidence={evs}
                  lensLabel={lensInfo?.label || ""}
                  hasConflict={hasConflict}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
