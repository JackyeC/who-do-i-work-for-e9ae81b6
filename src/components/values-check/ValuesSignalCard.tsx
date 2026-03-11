import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, MousePointerClick, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartyBadge } from "@/components/PartyBadge";
import { cleanEntityName } from "@/lib/entityUtils";
import { cn } from "@/lib/utils";
import { type ValuesCheckSignal, ISSUE_AREAS } from "./ValuesCheckSection";

function formatAmount(amount: number | null) {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function fecSearchUrl(name: string, type: "candidate" | "committee" | "contributor" = "candidate") {
  if (type === "contributor") {
    return `https://www.fec.gov/data/receipts/?contributor_name=${encodeURIComponent(name)}`;
  }
  return `https://www.fec.gov/data/candidates/?search=${encodeURIComponent(name)}`;
}

interface Props {
  signal: ValuesCheckSignal;
  getConfidenceBadge: (label: string) => { text: string; className: string };
  getVerificationBadge: (status: string) => { text: string; className: string };
  onExecutiveClick?: (executive: { id: string; name: string; title: string; total_donations: number }) => void;
}

export function ValuesSignalCard({ signal, getConfidenceBadge, getVerificationBadge, onExecutiveClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const conf = getConfidenceBadge(signal.confidence_label);
  const verif = getVerificationBadge(signal.verification_status);
  const issueInfo = ISSUE_AREAS.find((ia) => ia.key === signal.issue_area);

  // Parse recipients from evidence_json
  const recipients: { name: string; party: string; amount: number; donation_type?: string; entity_type?: string }[] = (() => {
    try {
      const ej = signal.evidence_json;
      if (ej && typeof ej === "object" && "recipients" in ej && Array.isArray((ej as any).recipients)) {
        return (ej as any).recipients;
      }
    } catch {}
    return [];
  })();

  const pacRecipients = recipients.filter(r => r.donation_type !== "Individual");
  const individualRecipients = recipients.filter(r => r.donation_type === "Individual");
  const hasDetail = recipients.length > 0 || signal.signal_description || signal.source_url;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all duration-200",
        expanded
          ? "border-primary/25 shadow-sm"
          : "border-border/40 hover:border-primary/20 hover:shadow-sm"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left cursor-pointer group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {signal.signal_title}
            </h4>
            {signal.amount && (
              <span className="text-xs font-bold text-primary font-data">
                {formatAmount(signal.amount)}
              </span>
            )}
          </div>

          {signal.signal_description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {signal.signal_description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {issueInfo && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                {issueInfo.label}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", conf.className)}>
              {conf.text}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", verif.className)}>
              {verif.text}
            </Badge>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="shrink-0 mt-1 flex flex-col items-center gap-0.5">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          {!expanded && hasDetail && (
            <span className="text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              details
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 border-t border-border/30 pt-3">
              {/* Full description */}
              {signal.signal_description && (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {signal.signal_description}
                </p>
              )}

              {/* PAC donation recipients — clickable to FEC */}
              {pacRecipients.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    Corporate PAC donations
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">PAC</Badge>
                  </p>
                  <div className="space-y-1">
                    {pacRecipients.map((r, i) => (
                      <a
                        key={`pac-${i}`}
                        href={fecSearchUrl(r.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-muted/40 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-colors cursor-pointer group/r"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-foreground truncate group-hover/r:text-primary transition-colors">{r.name}</span>
                          <PartyBadge party={r.party} entityType={r.entity_type} size="xs" />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {r.amount > 0 && (
                            <span className="text-[10px] font-bold text-primary">
                              {formatAmount(r.amount)}
                            </span>
                          )}
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/r:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual executive donations — clickable to open drawer */}
              {individualRecipients.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    Individual executive donations
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">Individual</Badge>
                  </p>
                  <div className="space-y-1">
                    {individualRecipients.map((r, i) => {
                      // Extract exec name from signal title (e.g. "Executive donations: Jamie Dimon")
                      const execName = signal.related_person_name || signal.signal_title?.replace(/^Executive donations:\s*/i, "") || "";
                      const canOpenDrawer = !!onExecutiveClick && !!execName;

                      return (
                        <div
                          key={`ind-${i}`}
                          className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-muted/40 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-colors cursor-pointer group/r"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canOpenDrawer) {
                              onExecutiveClick({
                                id: "",
                                name: execName,
                                title: signal.signal_description?.match(/\(([^)]+)\)/)?.[1] || "Executive",
                                total_donations: signal.amount || 0,
                              });
                            } else {
                              window.open(fecSearchUrl(r.name), "_blank");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-foreground truncate group-hover/r:text-primary transition-colors">{r.name}</span>
                            <PartyBadge party={r.party} entityType={r.entity_type} size="xs" />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {r.amount > 0 && (
                              <span className="text-[10px] font-bold text-primary">
                                {formatAmount(r.amount)}
                              </span>
                            )}
                            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/r:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {onExecutiveClick && (
                    <p className="text-[9px] text-muted-foreground mt-1">Click to see full donation breakdown & voting records</p>
                  )}
                </div>
              )}

              {/* Legacy: executive_activity recipients without donation_type */}
              {signal.signal_category === "executive_activity" && recipients.length > 0 && !recipients[0]?.donation_type && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Donated to:</p>
                  <div className="space-y-1">
                    {recipients.map((r, i) => (
                      <a
                        key={i}
                        href={fecSearchUrl(r.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-muted/40 hover:bg-primary/5 border border-transparent transition-colors cursor-pointer group/r"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-foreground truncate group-hover/r:text-primary transition-colors">{r.name}</span>
                          <PartyBadge party={r.party} size="xs" />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {r.amount > 0 && (
                            <span className="text-[10px] font-bold text-primary">
                              {formatAmount(r.amount)}
                            </span>
                          )}
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/r:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Source info */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground font-medium">Source:</span>
                  <p className="text-foreground mt-0.5">{signal.source_name}</p>
                </div>
                {signal.source_type && (
                  <div>
                    <span className="text-muted-foreground font-medium">Type:</span>
                    <p className="text-foreground mt-0.5 capitalize">{signal.source_type.replace(/_/g, " ")}</p>
                  </div>
                )}
                {signal.related_person_name && (
                  <div>
                    <span className="text-muted-foreground font-medium">Related Person:</span>
                    <p className="text-foreground mt-0.5">{signal.related_person_name}</p>
                  </div>
                )}
                {signal.related_entity_name && (
                  <div>
                    <span className="text-muted-foreground font-medium">Related Entity:</span>
                    <p className="text-foreground mt-0.5">{cleanEntityName(signal.related_entity_name)}</p>
                  </div>
                )}
                {signal.year && (
                  <div>
                    <span className="text-muted-foreground font-medium">Year:</span>
                    <p className="text-foreground mt-0.5">{signal.year}</p>
                  </div>
                )}
                {signal.matched_entity_type && (
                  <div>
                    <span className="text-muted-foreground font-medium">Match Type:</span>
                    <p className="text-foreground mt-0.5 capitalize">{signal.matched_entity_type.replace(/_/g, " ")}</p>
                  </div>
                )}
              </div>

              {/* Source messaging */}
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                Signal based on {signal.source_type === "campaign_finance" ? "campaign finance records" :
                  signal.source_type === "lobbying" ? "lobbying disclosures" :
                  signal.source_type === "executive_donation" ? "executive donation matching" :
                  signal.source_type === "trade_association" ? "related-entity or PAC matching" :
                  signal.source_type === "third_party_summary" ? "third-party organization summary data" :
                  signal.source_type === "public_stance" ? "public statements compared against political spending records" :
                  "public records"}.
              </p>

              {signal.source_url && (
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  View original filing <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
