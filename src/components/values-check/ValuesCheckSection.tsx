import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Shield, AlertTriangle, Info, ChevronDown, ChevronUp,
  Filter, Crosshair, Heart, Hammer, Leaf, Rainbow, Vote,
  Scale, Users, Globe, BookOpen, Stethoscope, ShoppingCart,
  DollarSign, Megaphone, Building2, UserCheck, Link2, Target,
  TrendingUp, ArrowRight, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ValuesSignalCard } from "./ValuesSignalCard";
import { ValuesEmptyState } from "./ValuesEmptyState";

export const ISSUE_AREAS = [
  { key: "gun_policy", label: "Gun Policy", icon: Crosshair, color: "text-destructive" },
  { key: "reproductive_rights", label: "Reproductive Rights", icon: Heart, color: "text-[hsl(var(--civic-red))]" },
  { key: "labor_rights", label: "Labor Rights", icon: Hammer, color: "text-[hsl(var(--civic-blue))]" },
  { key: "climate", label: "Climate", icon: Leaf, color: "text-[hsl(var(--civic-green))]" },
  { key: "civil_rights", label: "Civil Rights", icon: Scale, color: "text-primary" },
  { key: "lgbtq_rights", label: "LGBTQ+ Rights", icon: Rainbow, color: "text-[hsl(var(--civic-yellow))]" },
  { key: "voting_rights", label: "Voting Rights", icon: Vote, color: "text-primary" },
  { key: "immigration", label: "Immigration", icon: Globe, color: "text-[hsl(var(--civic-blue))]" },
  { key: "education", label: "Education", icon: BookOpen, color: "text-[hsl(var(--civic-green))]" },
  { key: "healthcare", label: "Healthcare", icon: Stethoscope, color: "text-[hsl(var(--civic-red))]" },
  { key: "consumer_protection", label: "Consumer Protection", icon: ShoppingCart, color: "text-[hsl(var(--civic-yellow))]" },
] as const;

export const SIGNAL_CATEGORIES = [
  { key: "political_giving", label: "Political Giving", icon: DollarSign, description: "PAC and individual contributions to candidates and committees" },
  { key: "lobbying", label: "Lobbying Activity", icon: Megaphone, description: "Federal and state lobbying expenditures and registered issues" },
  { key: "outside_spending", label: "Outside Spending / Influence", icon: Target, description: "Super PACs, dark money, and indirect political channels" },
  { key: "executive_activity", label: "Executive / Leadership", icon: UserCheck, description: "Personal political donations by senior leadership" },
  { key: "trade_association", label: "Trade Associations", icon: Building2, description: "Memberships in industry groups that engage in political advocacy" },
  { key: "ownership_link", label: "Ownership / Entity Links", icon: Link2, description: "Parent companies, subsidiaries, and corporate affiliations" },
  { key: "issue_alignment", label: "Issue Alignment", icon: Scale, description: "Public stances compared to actual spending patterns" },
] as const;

export interface ValuesCheckSignal {
  id: string;
  issue_area: string;
  signal_category: string;
  signal_title: string;
  signal_description: string | null;
  source_name: string;
  source_type: string | null;
  source_url: string | null;
  related_person_name: string | null;
  related_entity_name: string | null;
  matched_entity_type: string | null;
  amount: number | null;
  year: number | null;
  confidence_score: number;
  confidence_label: string;
  verification_status: string;
  evidence_json: any;
}

interface ValuesCheckSectionProps {
  companyName: string;
  companyId: string;
  signals: ValuesCheckSignal[];
  isLoading?: boolean;
  onGenerateSignals?: () => void;
  isGenerating?: boolean;
}

function getConfidenceBadge(label: string) {
  const map: Record<string, { text: string; className: string }> = {
    high: { text: "Strong evidence", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
    medium: { text: "Some evidence", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
    low: { text: "Weak evidence", className: "bg-muted text-muted-foreground border-border" },
  };
  return map[label] || map.medium;
}

function getVerificationBadge(status: string) {
  const map: Record<string, { text: string; className: string }> = {
    verified: { text: "Verified — primary records", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
    cross_checked: { text: "Verified — primary records", className: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" },
    partially_verified: { text: "Partial evidence", className: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" },
    third_party: { text: "Third-party — pending verification", className: "bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/30" },
    unverified: { text: "Limited evidence", className: "bg-muted text-muted-foreground border-border" },
  };
  return map[status] || map.unverified;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function ValuesCheckSection({
  companyName,
  companyId,
  signals,
  isLoading,
  onGenerateSignals,
  isGenerating,
}: ValuesCheckSectionProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [issueFilterExpanded, setIssueFilterExpanded] = useState(false);

  // When filtering by issue, include "general" signals too (they apply to everything)
  const filteredSignals = useMemo(() => {
    if (!selectedIssue) return signals;
    return signals.filter(
      (s) => s.issue_area === selectedIssue || s.issue_area === "general"
    );
  }, [signals, selectedIssue]);

  const signalsByCategory = useMemo(() => {
    const grouped: Record<string, ValuesCheckSignal[]> = {};
    for (const s of filteredSignals) {
      if (!grouped[s.signal_category]) grouped[s.signal_category] = [];
      grouped[s.signal_category].push(s);
    }
    return grouped;
  }, [filteredSignals]);

  // Count only issue-specific signals (not general)
  const issueAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of signals) {
      if (s.issue_area !== "general") {
        counts[s.issue_area] = (counts[s.issue_area] || 0) + 1;
      }
    }
    return counts;
  }, [signals]);

  const generalSignalCount = useMemo(
    () => signals.filter((s) => s.issue_area === "general").length,
    [signals]
  );

  // Build intelligence summary stats
  const summaryStats = useMemo(() => {
    const totalDonations = signals
      .filter((s) => s.signal_category === "political_giving")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalLobbying = signals
      .filter((s) => s.signal_category === "lobbying")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    const execCount = new Set(
      signals
        .filter((s) => s.signal_category === "executive_activity")
        .map((s) => s.related_person_name)
    ).size;
    const uniqueRecipients = new Set(
      signals
        .filter((s) => s.signal_category === "political_giving" && s.related_person_name)
        .map((s) => s.related_person_name)
    ).size;
    const flaggedCategories = Object.keys(issueAreaCounts).length;

    return { totalDonations, totalLobbying, execCount, uniqueRecipients, flaggedCategories };
  }, [signals, issueAreaCounts]);

  const overallStrength = useMemo(() => {
    if (signals.length === 0) return "none";
    const avg = signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length;
    if (avg >= 0.7) return "strong";
    if (avg >= 0.4) return "moderate";
    return "limited";
  }, [signals]);

  const strengthConfig: Record<string, { text: string; color: string; bg: string }> = {
    none: { text: "No signals found", color: "text-muted-foreground", bg: "bg-muted/30" },
    limited: { text: "Limited evidence", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/5" },
    moderate: { text: "Moderate evidence", color: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/5" },
    strong: { text: "Strong evidence", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/5" },
  };

  const activeIssues = ISSUE_AREAS.filter((ia) => issueAreaCounts[ia.key] > 0);
  const categoriesWithSignals = SIGNAL_CATEGORIES.filter(
    (cat) => signalsByCategory[cat.key]?.length > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      id="values-check"
    >
      <Card className="overflow-hidden border-[hsl(var(--civic-gold-muted))]/30 shadow-luxury">
        {/* Gold accent stripe */}
        <div className="h-1 bg-gradient-to-r from-[hsl(var(--civic-gold))] via-[hsl(var(--civic-gold-muted))] to-transparent" />

        <CardContent className="p-0">
          {/* Header */}
          <div className="p-7 pb-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-[hsl(var(--civic-gold-light))] flex items-center justify-center shrink-0 border border-primary/10">
                <Eye className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground font-display tracking-tight">
                  Values Check
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  Where does {companyName}'s money go — and does it align with what matters to you?
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge variant="outline" className={cn("text-xs font-medium", strengthConfig[overallStrength].color)}>
                  {strengthConfig[overallStrength].text}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {signals.length} record{signals.length !== 1 ? "s" : ""} analyzed
                </span>
              </div>
            </div>
          </div>

          {/* Intelligence Summary — what we actually found */}
          {signals.length > 0 && (
            <>
              <div className="px-7 pb-5">
                <div className={cn("rounded-xl border p-4 space-y-3", strengthConfig[overallStrength].bg, "border-border/40")}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    What We Found
                  </p>

                  {/* Key stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {summaryStats.totalDonations > 0 && (
                      <div className="bg-card rounded-lg p-3 border border-border/30">
                        <DollarSign className="w-4 h-4 text-primary mb-1" />
                        <p className="text-lg font-bold text-foreground font-data">{formatAmount(summaryStats.totalDonations)}</p>
                        <p className="text-[10px] text-muted-foreground">Political donations</p>
                      </div>
                    )}
                    {summaryStats.totalLobbying > 0 && (
                      <div className="bg-card rounded-lg p-3 border border-border/30">
                        <Megaphone className="w-4 h-4 text-primary mb-1" />
                        <p className="text-lg font-bold text-foreground font-data">{formatAmount(summaryStats.totalLobbying)}</p>
                        <p className="text-[10px] text-muted-foreground">Lobbying spend</p>
                      </div>
                    )}
                    {summaryStats.uniqueRecipients > 0 && (
                      <div className="bg-card rounded-lg p-3 border border-border/30">
                        <Users className="w-4 h-4 text-primary mb-1" />
                        <p className="text-lg font-bold text-foreground font-data">{summaryStats.uniqueRecipients}</p>
                        <p className="text-[10px] text-muted-foreground">Recipients funded</p>
                      </div>
                    )}
                    {summaryStats.execCount > 0 && (
                      <div className="bg-card rounded-lg p-3 border border-border/30">
                        <UserCheck className="w-4 h-4 text-primary mb-1" />
                        <p className="text-lg font-bold text-foreground font-data">{summaryStats.execCount}</p>
                        <p className="text-[10px] text-muted-foreground">Exec donors tracked</p>
                      </div>
                    )}
                  </div>

                  {/* Narrative summary */}
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {summaryStats.totalDonations > 0 || summaryStats.totalLobbying > 0 ? (
                      <>
                        {companyName} has a documented political footprint.{" "}
                        {summaryStats.totalDonations > 0 && (
                          <>PAC and individual donations total <span className="font-semibold text-foreground">{formatAmount(summaryStats.totalDonations)}</span> across {summaryStats.uniqueRecipients} recipient{summaryStats.uniqueRecipients !== 1 ? "s" : ""}. </>
                        )}
                        {summaryStats.totalLobbying > 0 && (
                          <>Lobbying expenditures total <span className="font-semibold text-foreground">{formatAmount(summaryStats.totalLobbying)}</span>. </>
                        )}
                        {summaryStats.flaggedCategories > 0 && (
                          <>{summaryStats.flaggedCategories} policy area{summaryStats.flaggedCategories !== 1 ? "s" : ""} ({activeIssues.map(i => i.label).join(", ")}) {summaryStats.flaggedCategories === 1 ? "has" : "have"} specific signals — filter below to explore. </>
                        )}
                        {generalSignalCount > 0 && summaryStats.flaggedCategories === 0 && (
                          <>Signals are currently categorized as general political activity. Use the issue filter to see how they may connect to topics you care about.</>
                        )}
                      </>
                    ) : (
                      <>We found {signals.length} record{signals.length !== 1 ? "s" : ""} of political and policy-related activity. Explore the signals below to understand {companyName}'s civic footprint.</>
                    )}
                  </p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Issue Area Filter */}
          <div className="p-7">
            <button
              onClick={() => setIssueFilterExpanded(!issueFilterExpanded)}
              className="w-full flex items-center justify-between group cursor-pointer mb-1"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Filter by Issue
                </p>
                {selectedIssue && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                    {ISSUE_AREAS.find(i => i.key === selectedIssue)?.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeIssues.length > 0 && !issueFilterExpanded && (
                  <span className="text-[10px] text-muted-foreground">{activeIssues.length} issue{activeIssues.length !== 1 ? "s" : ""} detected</span>
                )}
                {issueFilterExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {issueFilterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3 mt-3">
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border transition-all",
                        !selectedIssue
                          ? "border-primary/30 bg-primary/5 text-foreground font-medium"
                          : "border-border/40 text-muted-foreground hover:border-primary/15"
                      )}
                    >
                      All signals
                    </button>
                    <span className="text-[10px] text-muted-foreground">or pick an issue:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {ISSUE_AREAS.map((issue) => {
                      const Icon = issue.icon;
                      const count = issueAreaCounts[issue.key] || 0;
                      const isSelected = selectedIssue === issue.key;
                      return (
                        <button
                          key={issue.key}
                          onClick={() => setSelectedIssue(isSelected ? null : issue.key)}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 relative",
                            isSelected
                              ? "border-primary/30 bg-primary/5 shadow-sm"
                              : count > 0
                                ? "border-border/40 bg-card hover:border-primary/15 hover:bg-primary/[0.02]"
                                : "border-border/20 bg-muted/20 opacity-60 hover:opacity-80"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0", count > 0 ? issue.color : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", count > 0 ? "text-foreground" : "text-muted-foreground")}>{issue.label}</span>
                          {count > 0 && (
                            <span className="absolute top-1.5 right-2 text-[9px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explain general signals */}
                  {generalSignalCount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      <Info className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {generalSignalCount} signal{generalSignalCount !== 1 ? "s are" : " is"} not tied to a specific issue (e.g., total lobbying spend, executive donations).
                      {selectedIssue ? " These are included in your filtered view for context." : " These appear under every issue filter."}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Signal Evidence by Category */}
          <div className="p-7 space-y-6">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              {selectedIssue
                ? `Signals related to ${ISSUE_AREAS.find(i => i.key === selectedIssue)?.label || selectedIssue}`
                : "All Signals by Category"}
            </p>

            {filteredSignals.length === 0 ? (
              <ValuesEmptyState
                hasAnySignals={signals.length > 0}
                selectedIssue={selectedIssue ? ISSUE_AREAS.find(i => i.key === selectedIssue)?.label : null}
                onGenerate={onGenerateSignals}
                isGenerating={isGenerating}
              />
            ) : (
              categoriesWithSignals.map((cat) => {
                const catSignals = signalsByCategory[cat.key];
                if (!catSignals || catSignals.length === 0) return null;
                const CatIcon = cat.icon;
                // Separate issue-specific vs general signals
                const specificSignals = selectedIssue
                  ? catSignals.filter(s => s.issue_area === selectedIssue)
                  : catSignals.filter(s => s.issue_area !== "general");
                const generalSignals = catSignals.filter(s => s.issue_area === "general");

                return (
                  <div key={cat.key}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                        <CatIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{cat.label}</h3>
                        <span className="text-[10px] text-muted-foreground">{cat.description}</span>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground">{catSignals.length} record{catSignals.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="space-y-2.5 ml-10">
                      {/* Issue-specific signals first */}
                      {specificSignals.map((signal) => (
                        <ValuesSignalCard
                          key={signal.id}
                          signal={signal}
                          getConfidenceBadge={getConfidenceBadge}
                          getVerificationBadge={getVerificationBadge}
                        />
                      ))}

                      {/* General signals with a subtle label */}
                      {generalSignals.length > 0 && specificSignals.length > 0 && (
                        <p className="text-[10px] text-muted-foreground ml-1 mt-2 mb-1">
                          General activity (applies across all issues):
                        </p>
                      )}
                      {generalSignals.map((signal) => (
                        <ValuesSignalCard
                          key={signal.id}
                          signal={signal}
                          getConfidenceBadge={getConfidenceBadge}
                          getVerificationBadge={getVerificationBadge}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Issue Tags Summary */}
          {activeIssues.length > 0 && (
            <>
              <Separator />
              <div className="p-7">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                  Issue Areas with Direct Signals
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeIssues.map((issue) => {
                    const Icon = issue.icon;
                    return (
                      <button
                        key={issue.key}
                        onClick={() => {
                          setSelectedIssue(issue.key);
                          setIssueFilterExpanded(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card hover:border-primary/20 hover:bg-primary/[0.03] transition-all text-xs font-medium text-foreground"
                      >
                        <Icon className={cn("w-3 h-3", issue.color)} />
                        {issue.label}
                        <span className="text-[9px] text-muted-foreground ml-0.5">({issueAreaCounts[issue.key]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* CTA + Methodology */}
          <div className="p-7 space-y-5">
            {onGenerateSignals && signals.length === 0 && (
              <Button
                onClick={onGenerateSignals}
                disabled={isGenerating}
                variant="premium"
                size="lg"
                className="w-full gap-2"
              >
                <Shield className="w-4 h-4" />
                {isGenerating ? "Mapping Values Signals..." : "Generate Values Check"}
              </Button>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/30">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">How this works:</span> We pull from FEC campaign finance filings, Senate LDA lobbying disclosures, state-level contribution records, and corporate entity databases.
                  Each signal is tagged with its source and evidence strength. No moral judgments — just receipts.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  "General" signals (like total lobbying spend) apply across all issues. Issue-specific signals are mapped using keyword analysis of recipient names, lobbied topics, and organizational descriptions.
                </p>
              </div>
            </div>

            {/* Limited evidence warning */}
            {signals.length > 0 && overallStrength === "limited" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-semibold text-foreground">Limited public records found.</span>{" "}
                  This doesn't mean there's nothing — it means available public databases don't contain strong matches yet.
                  As more records are scanned, this section will update automatically.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
