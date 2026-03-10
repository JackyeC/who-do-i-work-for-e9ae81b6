import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { cleanEntityName } from "@/lib/entityUtils";
import {
  ArrowRight, DollarSign, Users, Landmark, FileText,
  Loader2, Search, Radar, ShieldCheck, ShieldX, CheckCircle2, Building2,
  ChevronDown, ChevronRight, ExternalLink, ShieldAlert, Info,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface LinkageNode {
  id: string;
  label: string;
  type: "spending" | "person" | "committee" | "contract" | "bill" | "outcome";
  amount?: number;
  confidence: number;
}

export interface LinkageEdge {
  from: string;
  to: string;
  label: string;
  amount?: number;
  linkType: string;
}

export interface ROIPipelineData {
  moneyIn: { label: string; amount: number; type: string; matched_entity_name?: string; matched_entity_type?: string; source_url?: string; evidence_type?: string }[];
  network: { label: string; role: string; type: string; source_url?: string; evidence_type?: string }[];
  benefitsOut: { label: string; amount: number; type: string; matched_entity_name?: string; matched_entity_type?: string; source_url?: string; evidence_type?: string }[];
  linkages: { source: string; target: string; description: string; confidence: number; source_url?: string; evidence_type?: string; source_name?: string }[];
  totalSpending: number;
  totalBenefits: number;
}

type PipelineState =
  | "not_scanned"
  | "scanning"
  | "partial"
  | "no_evidence"
  | "results";

function derivePipelineState(
  data: ROIPipelineData,
  scanning: boolean,
  hasBeenScanned: boolean,
): PipelineState {
  const hasMoneyIn = data.moneyIn.length > 0;
  const hasNetwork = data.network.length > 0;
  const hasBenefits = data.benefitsOut.length > 0;
  const hasAny = hasMoneyIn || hasNetwork || hasBenefits;

  if (scanning && hasAny) return "partial";
  if (scanning) return "scanning";
  if (hasAny) return "results";
  if (hasBeenScanned) return "no_evidence";
  return "not_scanned";
}

/* ─── Sub-components ─── */

function ConfidenceDot({ confidence }: { confidence?: number }) {
  const level = confidence ?? 0;
  const color = level >= 0.8 ? "bg-primary" : level >= 0.5 ? "bg-accent-foreground" : "bg-destructive";
  const label = level >= 0.8 ? "High" : level >= 0.5 ? "Medium" : "Low";
  return (
    <div className="flex items-center gap-1" title={`${label} confidence (${(level * 100).toFixed(0)}%)`}>
      <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
    </div>
  );
}

function PipelineColumn({ title, icon: Icon, items, color }: {
  title: string;
  icon: React.ElementType;
  items: { label: string; amount?: number; type?: string; role?: string; confidence?: number; matched_entity_name?: string; matched_entity_type?: string; source_url?: string; evidence_type?: string }[];
  color: string;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-center gap-2 mb-3 text-sm font-semibold", color)}>
          <Icon className="w-4 h-4" />
          {title}
        </div>
        <div className="p-4 rounded-lg border border-dashed border-border text-center">
          <p className="text-xs text-muted-foreground">No verified data yet</p>
        </div>
      </div>
    );
  }

  const MATCH_LABELS: Record<string, string> = {
    direct_company: "",
    parent_company: "Matched through parent company",
    subsidiary: "Matched through subsidiary",
    pac_name: "Matched through PAC",
    executive_linked: "Matched through executive-linked donation",
    brand_name: "Matched through brand name",
    trade_association: "Matched through trade association",
    affiliate: "Matched through affiliate",
  };

  const EVIDENCE_LABELS: Record<string, string> = {
    fec_filing: "Federal Election Commission filing",
    lobbying_disclosure: "Senate lobbying disclosure report",
    usaspending_contract: "Federal contract record (USASpending.gov)",
    sec_filing: "Securities and Exchange Commission filing",
    opencorporates: "Corporate registry record",
    dol_enforcement: "Department of Labor enforcement record",
    opensecrets: "Campaign finance profile (OpenSecrets)",
    ai_analysis: "AI-synthesized analysis of public records",
  };

  return (
    <div className="flex-1 min-w-0">
      <div className={cn("flex items-center gap-2 mb-3 text-sm font-semibold", color)}>
        <Icon className="w-4 h-4" />
        {title}
        <Badge variant="secondary" className="text-xs ml-auto">{items.length}</Badge>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((item, i) => {
          const isExpanded = expandedIdx === i;
          const confidenceLevel = item.confidence ?? 0;
          const confidenceLabel = confidenceLevel >= 0.8 ? "Strong evidence" : confidenceLevel >= 0.5 ? "Some evidence" : "Weak evidence";

          return (
            <Collapsible key={i} open={isExpanded} onOpenChange={() => setExpandedIdx(isExpanded ? null : i)}>
              <CollapsibleTrigger asChild>
                <button className="w-full text-left p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-1.5">
                    {item.confidence !== undefined && <ConfidenceDot confidence={item.confidence} />}
                    <div className="text-sm font-medium text-foreground truncate flex-1">{cleanEntityName(item.label)}</div>
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                  </div>
                  {item.amount !== undefined && item.amount > 0 && (
                    <div className="text-lg font-bold text-foreground">{formatCurrency(item.amount)}</div>
                  )}
                  {item.role && <div className="text-xs text-muted-foreground">{item.role}</div>}
                  {item.type && (
                    <Badge variant="outline" className="text-xs mt-1">{item.type.replace(/_/g, ' ')}</Badge>
                  )}
                  {item.matched_entity_type && item.matched_entity_type !== "direct_company" && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary">
                      <Building2 className="w-3 h-3" />
                      {MATCH_LABELS[item.matched_entity_type] || `Via ${cleanEntityName(item.matched_entity_name || "related entity")}`}
                    </div>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mx-1 mb-1 p-2.5 rounded-b-lg border border-t-0 border-border bg-card space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground">
                      Evidence strength: <span className={cn("font-semibold", confidenceLevel >= 0.8 ? "text-primary" : confidenceLevel >= 0.5 ? "text-accent-foreground" : "text-destructive")}>{confidenceLabel}</span>
                    </span>
                  </div>
                  {item.evidence_type && (
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">Source: <span className="font-medium text-foreground">{EVIDENCE_LABELS[item.evidence_type] || item.evidence_type.replace(/_/g, ' ')}</span></span>
                    </div>
                  )}
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      View original public record
                    </a>
                  )}
                  {!item.source_url && !item.evidence_type && (
                    <p className="text-[11px] text-muted-foreground italic">No direct source link available for this connection.</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center px-2 shrink-0 self-center">
      <div className="hidden md:flex flex-col items-center gap-1">
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
        <div className="w-px h-8 bg-border" />
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="md:hidden rotate-90">
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function SummaryBar({ data, state }: { data: ROIPipelineData; state: PipelineState }) {
  if (state === "not_scanned" || state === "scanning") return null;

  const hasBothSides = data.totalSpending > 0 && data.totalBenefits > 0;
  const roiRatio = hasBothSides
    ? `${(data.totalBenefits / data.totalSpending).toFixed(1)}x`
    : null;

  const showValues = state === "results" || state === "partial";

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Money In</div>
        <div className="text-xl font-bold text-destructive">
          {showValues && data.totalSpending > 0 ? formatCurrency(data.totalSpending) : "—"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="text-center px-4 py-2 bg-card rounded-lg border border-border">
          <div className="text-xs text-muted-foreground">ROI</div>
          {showValues && roiRatio ? (
            <div className="text-xl font-bold text-foreground">{roiRatio}</div>
          ) : showValues ? (
            <div className="text-xs text-muted-foreground italic">Insufficient verified data</div>
          ) : (
            <div className="text-xl font-bold text-foreground">—</div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Benefits Out</div>
        <div className="text-xl font-bold text-primary">
          {showValues && data.totalBenefits > 0 ? formatCurrency(data.totalBenefits) : "—"}
        </div>
      </div>
    </div>
  );
}

const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
  fec_filing: "Federal Election Commission filing",
  lobbying_disclosure: "Senate lobbying disclosure report",
  usaspending_contract: "Federal contract record (USASpending.gov)",
  sec_filing: "Securities and Exchange Commission filing",
  opencorporates: "Corporate registry record",
  dol_enforcement: "Department of Labor enforcement record",
  opensecrets: "Campaign finance profile (OpenSecrets)",
  ai_analysis: "AI-synthesized analysis of public records",
  congress_vote: "Congressional voting record",
};

function LinkageChain({ linkages }: { linkages: ROIPipelineData["linkages"] }) {
  const [expandedLink, setExpandedLink] = useState<number | null>(null);

  return (
    <div className="relative space-y-0">
      {linkages.map((link, i) => {
        const isHigh = link.confidence >= 0.8;
        const isMed = link.confidence >= 0.5;
        const confidenceColor = isHigh ? "text-primary" : isMed ? "text-accent-foreground" : "text-destructive";
        const confidenceBg = isHigh ? "bg-primary/10 border-primary/30" : isMed ? "bg-accent/20 border-accent/30" : "bg-destructive/10 border-destructive/30";
        const confidenceLabel = isHigh ? "Strong evidence" : isMed ? "Some evidence" : "Weak evidence";
        const dotColor = isHigh ? "bg-primary" : isMed ? "bg-accent-foreground" : "bg-destructive";
        const lineColor = isHigh ? "bg-primary/30" : isMed ? "bg-accent/30" : "bg-destructive/30";
        const isLast = i === linkages.length - 1;
        const isExpanded = expandedLink === i;

        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0 w-5">
              <div className={cn("w-3 h-3 rounded-full mt-3.5 shrink-0 ring-2 ring-background", dotColor)} />
              {!isLast && <div className={cn("w-0.5 flex-1 min-h-[16px]", lineColor)} />}
            </div>
            <div className="flex-1 mb-2">
              <Collapsible open={isExpanded} onOpenChange={() => setExpandedLink(isExpanded ? null : i)}>
                <CollapsibleTrigger asChild>
                  <button className={cn("w-full text-left p-3 rounded-lg border transition-colors hover:brightness-95", confidenceBg)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{link.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{link.target}</span>
                      <div className="ml-auto shrink-0">
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                      <span className={cn("text-[10px] font-medium uppercase tracking-wider", confidenceColor)}>
                        {confidenceLabel} · {(link.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 border border-t-0 border-border rounded-b-lg bg-card space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">
                        Confidence: <span className={cn("font-semibold", confidenceColor)}>{confidenceLabel} ({(link.confidence * 100).toFixed(0)}%)</span>
                      </span>
                    </div>
                    {link.evidence_type && (
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground">Evidence: <span className="font-medium text-foreground">{EVIDENCE_SOURCE_LABELS[link.evidence_type] || link.evidence_type.replace(/_/g, ' ')}</span></span>
                      </div>
                    )}
                    {link.source_name && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground">Data source: <span className="font-medium text-foreground">{link.source_name}</span></span>
                      </div>
                    )}
                    {link.source_url && (
                      <a href={link.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        View original public record
                      </a>
                    )}
                    {!link.source_url && !link.evidence_type && !link.source_name && (
                      <p className="text-[11px] text-muted-foreground italic">Source details will be available after primary-source verification completes.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ─── */

interface ROIPipelineCardProps {
  data: ROIPipelineData;
  isSearching?: boolean;
  onTriggerScan?: () => void;
  autoScanning?: boolean;
  hasBeenScanned?: boolean;
  enrichmentData?: any;
}

export function ROIPipelineCard({
  data,
  isSearching = false,
  onTriggerScan,
  autoScanning = false,
  hasBeenScanned = false,
  enrichmentData,
}: ROIPipelineCardProps) {
  const scanning = isSearching || autoScanning;
  const state = derivePipelineState(data, scanning, hasBeenScanned);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Influence Pipeline
          </CardTitle>
          {state === "results" && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Evidence found
            </Badge>
          )}
          {state === "no_evidence" && (
            <Badge variant="secondary">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Scanned — clean
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Money In → Influence Network → Benefits Out. Each connection rated by confidence level.
        </p>
      </CardHeader>

      <CardContent>
        {/* ── State: Not Scanned ── */}
        {state === "not_scanned" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Radar className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No verified pipeline data yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-5">
              No verified pipeline data has been generated for this company yet. We checked available public sources and will show partial results whenever evidence is found.
            </p>
            {onTriggerScan && (
              <Button onClick={onTriggerScan} className="gap-2">
                <Search className="w-4 h-4" />
                Run Company Intelligence Scan
              </Button>
            )}
          </div>
        )}

        {/* ── State: Scanning ── */}
        {state === "scanning" && (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">Scanning Federal Records…</div>
                <div className="text-xs text-muted-foreground">
                  Tracing entity linkages through PAC filings, lobbying disclosures, and contract awards.
                </div>
              </div>
            </div>
            <Progress className="h-1.5" />
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[{ label: "Money In", icon: DollarSign }, { label: "Network", icon: Users }, { label: "Benefits Out", icon: Landmark }].map(({ label, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg border border-dashed border-border text-center">
                  <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5">Searching…</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── State: Partial results (scanning with some data) ── */}
        {state === "partial" && (
          <>
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              <span className="text-xs font-medium text-foreground">Scan in progress — showing partial results as they arrive</span>
            </div>
            <SummaryBar data={data} state={state} />
            <div className="flex flex-col md:flex-row gap-4">
              <PipelineColumn title="Money In" icon={DollarSign} items={data.moneyIn} color="text-destructive" />
              <FlowArrow />
              <PipelineColumn title="Influence Network" icon={Users} items={data.network.map(n => ({ label: n.label, role: n.role, type: n.type, source_url: n.source_url, evidence_type: n.evidence_type }))} color="text-accent-foreground" />
              <FlowArrow />
              <PipelineColumn title="Benefits Out" icon={Landmark} items={data.benefitsOut} color="text-primary" />
            </div>
          </>
        )}

        {/* ── State: No evidence found (after scan) ── */}
        {state === "no_evidence" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShieldX className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No verified influence pipeline evidence found yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-2">
              The intelligence scan completed but found no entity linkages connecting political spending to government benefits for this company. This may change as new data becomes available.
            </p>
            {enrichmentData && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-4 max-w-sm">
                <p className="text-xs text-accent-foreground font-medium mb-1">Third-party summary data found</p>
                <p className="text-[11px] text-muted-foreground">
                  Primary-source verification is still in progress or incomplete. OpenSecrets profile data is available for reference.
                </p>
              </div>
            )}
            {onTriggerScan && (
              <Button variant="outline" size="sm" onClick={onTriggerScan} className="gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Re-scan
              </Button>
            )}
          </div>
        )}

        {/* ── State: Results found ── */}
        {state === "results" && (
          <>
            <SummaryBar data={data} state={state} />
            <div className="flex flex-col md:flex-row gap-4">
              <PipelineColumn title="Money In" icon={DollarSign} items={data.moneyIn} color="text-destructive" />
              <FlowArrow />
              <PipelineColumn title="Influence Network" icon={Users} items={data.network.map(n => ({ label: n.label, role: n.role, type: n.type, source_url: n.source_url, evidence_type: n.evidence_type }))} color="text-accent-foreground" />
              <FlowArrow />
              <PipelineColumn title="Benefits Out" icon={Landmark} items={data.benefitsOut} color="text-primary" />
            </div>
          </>
        )}

        {/* Linkage chain — show for results and partial */}
        {(state === "results" || state === "partial") && data.linkages.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <FileText className="w-4 h-4" />
              Connection Chain
              <Badge variant="secondary" className="text-xs ml-auto">{data.linkages.length} links</Badge>
            </div>
            <LinkageChain linkages={data.linkages} />
          </div>
        )}

        {/* Footer — only for states with data */}
        {(state === "results" || state === "partial" || state === "no_evidence") && (
          <div className="mt-4 border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Confidence: ≥80% = direct filings · 50-79% = inferred · &lt;50% = unverified
              </p>
              {onTriggerScan && state !== "no_evidence" && (
                <Button variant="ghost" size="sm" onClick={onTriggerScan} className="gap-1.5 text-xs h-7">
                  <Search className="w-3 h-3" />
                  Re-scan
                </Button>
              )}
            </div>
            {enrichmentData && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Building2 className="w-3 h-3 shrink-0" />
                <span>
                  {enrichmentData.verification_status === 'cross_checked_primary_source'
                    ? 'Verified against primary records'
                    : enrichmentData.verification_status === 'partially_verified'
                      ? 'Partial evidence found — some data cross-checked'
                      : 'Third-party summary available — primary verification pending'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
