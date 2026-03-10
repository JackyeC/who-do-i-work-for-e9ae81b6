import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, HelpCircle, Shield, DollarSign, Megaphone, FileText } from "lucide-react";
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
  const navigate = useNavigate();
  const [textFilter, setTextFilter] = useState("");
  const lensInfo = VALUES_LENSES.find((l) => l.key === lensKey);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && textFilter.trim()) {
      navigate(`/search?q=${encodeURIComponent(textFilter.trim())}`);
    }
  };

  const { data: signals, isLoading: loadingSignals } = useQuery({
    queryKey: ["values-lens-signals", lensKey],
    queryFn: async () => {
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
    gun_policy: "gun_policy",
    education: "education",
    faith_christian: "faith_christian",
    israel_mideast: "israel_mideast",
  };

  const mappedIssue = issueMapping[lensKey] || lensKey;

  const { data: issueSignals } = useQuery({
    queryKey: ["issue-signals-for-lens", mappedIssue],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("issue_signals")
        .select("id, entity_id, entity_name_snapshot, issue_category, signal_type, signal_subtype, source_dataset, description, source_url, confidence_score, amount, transaction_date, created_at")
        .eq("issue_category", mappedIssue)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  // Fetch scan status for this issue category
  const { data: scanStatus } = useQuery({
    queryKey: ["issue-scan-status", mappedIssue],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("issue_scan_status")
        .select("*")
        .eq("issue_category", mappedIssue)
        .maybeSingle();
      return data;
    },
  });

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

  const results = useMemo(() => {
    if (!companies) return [];
    const map = new Map<string, { company: any; signals: any[]; evidence: any[]; hasConflict: boolean }>();

    for (const c of companies) {
      map.set(c.id, { company: c, signals: [], evidence: [], hasConflict: false });
    }

    for (const s of (signals || []) as any[]) {
      const entry = map.get(s.company_id);
      if (entry) entry.signals.push(s);
    }

    for (const s of (issueSignals || []) as any[]) {
      const entry = map.get(s.entity_id);
      if (entry) {
        // Map source_dataset to readable labels
        const sourceLabels: Record<string, string> = {
          campaign_finance: "FEC Filing",
          fec_direct: "FEC Filing",
          congress_legislation: "Congress.gov",
          lobbying_disclosure: "Senate LDA",
          government_contract: "USASpending",
          issue_legislation_map: "Legislation Link",
          ideology_scan: "Ideology Scan",
          company_signal_scan: "Signal Scan",
          known_corporate_actions: "Public Record",
          company_profile: "Company Profile",
          public_stance_analysis: "Public Stance",
        };
        const sourceLabel = sourceLabels[s.source_dataset] || s.source_dataset;

        // Map signal_type to neutral display labels
        const typeLabels: Record<string, string> = {
          legislation_sponsorship: "Legislative Donation Link",
          committee_assignment: "Committee Influence",
          pac_disbursement: "PAC Disbursement",
          pac_donation: "Campaign Contribution",
          pac_activity: "PAC Activity",
          lobbying_issue: "Lobbying Activity Detected",
          government_contract: "Federal Contract Relationship",
          agency_contract: "Agency Contract Link",
          keyword_match: "Policy Influence Signal",
          ideology_flag: "Ideology Connection",
          public_stance: "Public Position",
          corporate_policy_action: "Corporate Policy Action",
          legislation_link: "Legislative Connection",
          signal_scan: "Signal Detected",
          company_description: "Industry Signal",
        };
        const typeLabel = typeLabels[s.signal_type] || s.signal_type?.replace(/_/g, " ");

        entry.signals.push({
          id: s.id,
          signal_label: s.description,
          signal_summary: `${typeLabel} · Source: ${sourceLabel}`,
          signal_direction: "informational_signal",
          confidence_level: s.confidence_score || "medium",
          evidence_url: s.source_url,
          signal_type: s.signal_type,
          evidence_text: s.amount ? `$${Number(s.amount).toLocaleString()}` : undefined,
        });
      }
    }

    for (const e of (evidence || []) as any[]) {
      const entry = map.get(e.entity_id);
      if (entry) entry.evidence.push(e);
    }

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
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        {lensInfo && (
          <div className="flex items-center gap-2">
            <lensInfo.icon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground font-display">{lensInfo.label}</h2>
          </div>
        )}
      </div>

      {/* Plain language explainer */}
      {lensInfo && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/40 mb-6 max-w-2xl">
          <p className="text-sm text-foreground font-medium mb-1">{lensInfo.description}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {"plainExplainer" in lensInfo ? (lensInfo as any).plainExplainer : ""}
          </p>
        </div>
      )}

      {/* Search filter */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Search a company or filter results… (Enter to search)"
          className="pl-10"
        />
      </div>
      {textFilter.trim() && results.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          No results here for "{textFilter}" — press <strong>Enter</strong> to search for this company.
        </p>
      )}

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
          <p className="text-sm text-muted-foreground">Looking through public records...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-8">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Scanning records for {lensInfo?.label}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We are scanning campaign finance records, lobbying disclosures, and government contracts for this issue area.
            </p>
          </div>

          {/* Scan progress stats */}
          {scanStatus && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{scanStatus.companies_scanned || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Companies Scanned</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{scanStatus.records_analyzed || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Records Analyzed</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-foreground">
                  {scanStatus.last_scan_at ? new Date(scanStatus.last_scan_at).toLocaleDateString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last Updated</p>
              </div>
            </div>
          )}

          {/* Data source methodology */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <h4 className="text-sm font-semibold text-foreground">How this works</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We trace money from corporate PACs to politicians, then map those politicians to the legislation they sponsor. Here's the pipeline:
            </p>

            <div className="grid gap-3">
              {[
                {
                  icon: DollarSign,
                  title: "Step 1: Follow the money",
                  desc: "We query FEC records for PAC donations and individual executive contributions to political candidates.",
                },
                {
                  icon: FileText,
                  title: "Step 2: Map to legislation",
                  desc: "For each recipient politician, we pull their sponsored bills from Congress.gov and map bill policy areas to this issue.",
                },
                {
                  icon: Megaphone,
                  title: "Step 3: Check lobbying filings",
                  desc: "We search Senate lobbying disclosures for issue-specific lobbying activity by the company or its agents.",
                },
                {
                  icon: Shield,
                  title: "Step 4: Link government contracts",
                  desc: "USASpending data reveals federal contracts with agencies relevant to this policy area.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground pt-3 border-t border-border">
              <strong className="text-foreground">Important:</strong> We show what the records say. We don't tell you what to think about it. That part is up to you.
            </p>
          </div>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={onBack}>Browse other topics</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} compan{results.length !== 1 ? "ies" : "y"} with public records on {lensInfo?.label}
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
