import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { SourceLabel, type SourceTier } from "@/components/ui/source-label";
import {
  ChevronDown, ExternalLink, DollarSign, Calendar, ArrowRight,
  Eye, Zap, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceRecord } from "@/components/dossier/EmployerReportDrawer";
import { ShareReceiptButton } from "@/components/dossier/ShareReceiptButton";

interface SignalRevealCardProps {
  title: string;
  explanation: string;
  tier: SourceTier;
  records: EvidenceRecord[];
  /** If true, the card expands inline to reveal evidence */
  hasEvidence: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

/** Derive a plain-language "so what" for each category */
function getCategoryInsight(category: string, records: EvidenceRecord[]): string {
  const total = records.reduce((s, r) => s + (r.amount ?? 0), 0);
  const count = records.length;
  const isSummaryOnly = records.every(r =>
    r.eventType === "PAC Total" || r.eventType === "Lobbying Total" ||
    r.eventType === "Party Allocation"
  );

  switch (category) {
    case "Political Spending":
      if (isSummaryOnly && count <= 3) {
        return `${formatCurrency(total)} in political spending on record. We have the party breakdown — recipient-level receipts are being indexed from FEC filings.`;
      }
      return total > 500_000
        ? `${formatCurrency(total)} directed to political candidates and committees. That's significant influence worth understanding before you join.`
        : `${formatCurrency(total)} in political contributions on record.${count > 3 ? " See exactly where it went." : ""}`;
    case "Lobbying":
      if (isSummaryOnly) {
        return `${formatCurrency(total)} in lobbying expenditures on record. Filing-level detail — which firms, which issues — is being pulled from Senate LDA records.`;
      }
      return total > 1_000_000
        ? `${formatCurrency(total)} spent shaping policy. This company is actively influencing the rules you'll work under.`
        : `${formatCurrency(total)} in lobbying spend. Worth knowing what they're pushing for.`;
    case "Enforcement & EEOC":
      return count > 1
        ? `${count} enforcement actions found. A pattern — not just an incident.`
        : `An enforcement filing on record. One data point, but worth reading.`;
    case "Issue Signals":
      return `${count} signal${count !== 1 ? "s" : ""} flagged across policy and labor categories. Dig into what was detected.`;
    case "Government Contracts":
      return total > 0
        ? `${formatCurrency(total)} in federal contracts. Public money means public accountability.`
        : `${count} government contract${count !== 1 ? "s" : ""} on record.`;
    default:
      return `${count} record${count !== 1 ? "s" : ""} found. Click to review the evidence.`;
  }
}

export function SignalRevealCard({ title, explanation, tier, records, hasEvidence }: SignalRevealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const category = records[0]?.category || "";

  if (!hasEvidence) {
    return (
      <div className="bg-card border border-border/60 rounded-lg p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{explanation}</p>
          </div>
          <SourceLabel tier={tier} className="shrink-0 mt-0.5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-300 overflow-hidden",
        expanded
          ? "bg-card border-primary/30 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.15)]"
          : "bg-card border-border hover:border-primary/30 cursor-pointer"
      )}
    >
      {/* ── Clickable header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3.5 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-sm font-medium transition-colors",
              expanded ? "text-primary" : "text-foreground group-hover:text-primary"
            )}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{explanation}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SourceLabel tier={tier} className="mt-0.5" />
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
              expanded
                ? "bg-primary/10 rotate-180"
                : "bg-muted/50 group-hover:bg-primary/10"
            )}>
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-colors",
                expanded ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </div>
          </div>
        </div>

        {!expanded && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3" />
            Reveal {records.length} record{records.length !== 1 ? "s" : ""}
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* ── Expanded reveal panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-4">
              {/* Insight callout */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mb-3 p-3 rounded-md bg-primary/[0.04] border border-primary/10"
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed font-medium">
                    {getCategoryInsight(category, records)}
                  </p>
                </div>
              </motion.div>

              {/* Itemized records with staggered reveal */}
              <div className="space-y-0 border border-border/40 rounded-md overflow-hidden">
                {records.map((record, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "p-3 bg-background/50",
                      i < records.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono uppercase tracking-wider shrink-0 bg-muted/30">
                            {record.eventType}
                          </Badge>
                          {record.date && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-foreground leading-relaxed mt-1">{record.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">
                            {record.sourceName}
                          </span>
                          {record.sourceUrl && (
                            <a
                              href={record.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              View source <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      {record.amount != null && record.amount > 0 && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.25, type: "spring", stiffness: 200 }}
                          className="text-sm font-bold text-foreground tabular-nums shrink-0 flex items-center gap-0.5"
                        >
                          <DollarSign className="w-3 h-3 text-primary/60" />
                          {formatCurrency(record.amount)}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* "Still indexing" notice when records are summary-only */}
              {records.every(r =>
                r.eventType === "PAC Total" || r.eventType === "Lobbying Total" ||
                r.eventType === "Party Allocation"
              ) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + records.length * 0.08, duration: 0.3 }}
                  className="mt-3 p-3 rounded-md bg-muted/30 border border-border/30"
                >
                  <div className="flex items-start gap-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Recipient-level detail is being indexed</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        We have the aggregate totals and party split. Individual recipients, filing dates, and committee details are being pulled from FEC and Senate LDA source records. Check back soon.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Record count footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + records.length * 0.08, duration: 0.3 }}
                className="mt-2 flex items-center justify-between"
              >
                <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">
                  {records.length} public record{records.length !== 1 ? "s" : ""} · Verify at source
                </span>
                <ShareReceiptButton
                  title={title}
                  description={getCategoryInsight(category, records)}
                  source={records[0]?.sourceName || category}
                  amount={records.reduce((s, r) => s + (r.amount ?? 0), 0) || null}
                  date={records[0]?.date}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
