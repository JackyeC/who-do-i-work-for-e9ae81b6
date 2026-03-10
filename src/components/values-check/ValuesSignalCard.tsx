import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartyBadge } from "@/components/PartyBadge";
import { cleanEntityName } from "@/lib/entityUtils";
import { cn } from "@/lib/utils";
import { type ValuesCheckSignal, ISSUE_AREAS } from "./ValuesCheckSection";

function formatAmount(amount: number | null) {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

interface Props {
  signal: ValuesCheckSignal;
  getConfidenceBadge: (label: string) => { text: string; className: string };
  getVerificationBadge: (status: string) => { text: string; className: string };
}

export function ValuesSignalCard({ signal, getConfidenceBadge, getVerificationBadge }: Props) {
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

  // Group recipients by donation type for display
  const pacRecipients = recipients.filter(r => r.donation_type !== "Individual");
  const individualRecipients = recipients.filter(r => r.donation_type === "Individual");

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden hover:border-primary/15 transition-colors group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-foreground">{signal.signal_title}</h4>
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
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
              {/* Full description (not truncated) */}
              {signal.signal_description && (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {signal.signal_description}
                </p>
              )}

              {/* PAC donation recipients */}
              {pacRecipients.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    Corporate PAC donations
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">PAC</Badge>
                  </p>
                  <div className="space-y-1">
                    {pacRecipients.map((r, i) => (
                      <div key={`pac-${i}`} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-foreground truncate">{r.name}</span>
                          <PartyBadge party={r.party} entityType={r.entity_type} size="xs" />
                        </div>
                        {r.amount > 0 && (
                          <span className="text-[10px] font-bold text-primary shrink-0 ml-2">
                            {formatAmount(r.amount)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual executive donations */}
              {individualRecipients.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    Individual executive donations
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">Individual</Badge>
                  </p>
                  <div className="space-y-1">
                    {individualRecipients.map((r, i) => (
                      <div key={`ind-${i}`} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-foreground truncate">{r.name}</span>
                          <PartyBadge party={r.party} entityType={r.entity_type} size="xs" />
                        </div>
                        {r.amount > 0 && (
                          <span className="text-[10px] font-bold text-primary shrink-0 ml-2">
                            {formatAmount(r.amount)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy: executive_activity recipients without donation_type */}
              {signal.signal_category === "executive_activity" && recipients.length > 0 && !recipients[0]?.donation_type && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Donated to:</p>
                  <div className="space-y-1">
                    {recipients.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-foreground truncate">{r.name}</span>
                          <PartyBadge party={r.party} size="xs" />
                        </div>
                        {r.amount > 0 && (
                          <span className="text-[10px] font-bold text-primary shrink-0 ml-2">
                            {formatAmount(r.amount)}
                          </span>
                        )}
                      </div>
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
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
