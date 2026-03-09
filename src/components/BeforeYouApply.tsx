import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, DollarSign, Users, Megaphone, Building2, Scale,
  Shield, AlertTriangle, ChevronDown, ChevronUp, Info,
  Crosshair, Heart, Hammer, Leaf, Rainbow, Vote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";

const ISSUE_LENSES = [
  { key: "gun_policy", label: "Gun Policy", icon: Crosshair, color: "text-destructive" },
  { key: "reproductive_rights", label: "Reproductive Rights", icon: Heart, color: "text-[hsl(var(--civic-red))]" },
  { key: "labor_rights", label: "Labor Rights", icon: Hammer, color: "text-[hsl(var(--civic-blue))]" },
  { key: "climate", label: "Climate", icon: Leaf, color: "text-[hsl(var(--civic-green))]" },
  { key: "lgbtq_protections", label: "LGBTQ+ Protections", icon: Rainbow, color: "text-[hsl(var(--civic-yellow))]" },
  { key: "voting_rights", label: "Voting Rights", icon: Vote, color: "text-primary" },
];

interface SignalSummary {
  pacSpending: number;
  executiveDonations: number;
  lobbyingSpend: number;
  tradeAssociationCount: number;
  publicStanceCount: number;
  hasDetailedData: boolean;
}

interface BeforeYouApplyProps {
  companyName: string;
  companyId: string;
  signals: SignalSummary;
  onReviewSignals?: () => void;
}

function SignalRow({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-colors group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors")}>
        <Icon className={cn("w-5 h-5", iconColor || "text-primary")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Source Serif 4', serif" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function BeforeYouApply({ companyName, companyId, signals, onReviewSignals }: BeforeYouApplyProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const evidenceLimited = !signals.hasDetailedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-[hsl(var(--civic-gold-muted))]/30 shadow-luxury">
        {/* Gold accent stripe */}
        <div className="h-1 bg-gradient-to-r from-[hsl(var(--civic-gold))] via-[hsl(var(--civic-gold-muted))] to-transparent" />

        <CardContent className="p-0">
          {/* Header */}
          <div className="p-7 pb-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-[hsl(var(--civic-gold-light))] flex items-center justify-center shrink-0 border border-primary/10">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
                  Before You Apply
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Work here with eyes open.
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">
              If this issue matters to you, review {companyName}'s political spending, executive donations,
              lobbying activity, trade association ties, and other public policy signals before making a career decision.
            </p>
          </div>

          <Separator />

          {/* Signal Summary */}
          <div className="p-7 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
              Values Signal Summary
            </p>

            <SignalRow
              icon={DollarSign}
              label="PAC Activity"
              value={signals.pacSpending > 0 ? formatCurrency(signals.pacSpending) : "None detected"}
              subtext="Corporate PAC contributions to political candidates"
              iconColor="text-[hsl(var(--civic-green))]"
            />
            <SignalRow
              icon={Users}
              label="Executive Donations"
              value={signals.executiveDonations > 0 ? formatCurrency(signals.executiveDonations) : "None detected"}
              subtext="Personal giving by company leadership"
              iconColor="text-[hsl(var(--civic-blue))]"
            />
            <SignalRow
              icon={Megaphone}
              label="Lobbying Activity"
              value={signals.lobbyingSpend > 0 ? formatCurrency(signals.lobbyingSpend) : "None detected"}
              subtext="Annual spending on federal and state lobbying"
              iconColor="text-[hsl(var(--civic-yellow))]"
            />
            <SignalRow
              icon={Building2}
              label="Trade Association Ties"
              value={signals.tradeAssociationCount > 0 ? `${signals.tradeAssociationCount} linked` : "None detected"}
              subtext="Industry groups that lobby on the company's behalf"
              iconColor="text-primary"
            />
            <SignalRow
              icon={Scale}
              label="Public Issue Alignment"
              value={signals.publicStanceCount > 0 ? `${signals.publicStanceCount} stances` : "None reviewed"}
              subtext="Where public statements align or conflict with spending"
              iconColor="text-[hsl(var(--civic-gold))]"
            />
          </div>

          <Separator />

          {/* Issue Lenses */}
          <div className="p-7">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between group cursor-pointer"
            >
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Issue Lenses
              </p>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                    {ISSUE_LENSES.map((issue) => {
                      const Icon = issue.icon;
                      const isSelected = selectedIssue === issue.key;
                      return (
                        <button
                          key={issue.key}
                          onClick={() => setSelectedIssue(isSelected ? null : issue.key)}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200",
                            isSelected
                              ? "border-primary/30 bg-primary/5 shadow-sm"
                              : "border-border/40 bg-card hover:border-primary/15 hover:bg-primary/[0.02]"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0", issue.color)} />
                          <span className="text-xs font-medium text-foreground">{issue.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedIssue && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-muted/50 border border-border/40"
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Review {companyName}'s full profile to see how their spending, donations, and affiliations
                        relate to <span className="font-semibold text-foreground">{ISSUE_LENSES.find(i => i.key === selectedIssue)?.label}</span>.
                        Scroll through the Money Trail, Say vs. Do, and Influence Network sections above for specific signals.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Limited evidence warning */}
          {evidenceLimited && (
            <div className="px-7 pt-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-semibold text-foreground">Limited evidence available.</span>{" "}
                  Some signal categories have not been fully scanned or may have insufficient public data. Review with caution.
                </p>
              </div>
            </div>
          )}

          {/* CTA + Explanation */}
          <div className="p-7 space-y-5">
            {onReviewSignals && (
              <Button
                onClick={onReviewSignals}
                variant="premium"
                size="lg"
                className="w-full gap-2"
              >
                <Shield className="w-4 h-4" />
                Review Values Signals
              </Button>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              This section is designed to help users make informed career decisions based on public records
              and values-related signals. It does not make legal or moral conclusions. It surfaces evidence for review.
            </p>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/30">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Signals shown here are based on public filings, political contribution records, lobbying disclosures,
                trade association links, executive activity, and related public data where available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
