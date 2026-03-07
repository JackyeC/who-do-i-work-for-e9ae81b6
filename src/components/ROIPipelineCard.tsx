import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import {
  ArrowRight, DollarSign, Users, Landmark, FileText,
  Loader2, Search, Radar, ShieldCheck, ShieldX, CheckCircle2,
} from "lucide-react";

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
  moneyIn: { label: string; amount: number; type: string }[];
  network: { label: string; role: string; type: string }[];
  benefitsOut: { label: string; amount: number; type: string }[];
  linkages: { source: string; target: string; description: string; confidence: number }[];
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

function PipelineColumn({ title, icon: Icon, items, color }: {
  title: string;
  icon: React.ElementType;
  items: { label: string; amount?: number; type?: string; role?: string }[];
  color: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-center gap-2 mb-3 text-sm font-semibold", color)}>
          <Icon className="w-4 h-4" />
          {title}
        </div>
        <div className="p-4 rounded-lg border border-dashed border-border text-center">
          <p className="text-xs text-muted-foreground">No evidence yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className={cn("flex items-center gap-2 mb-3 text-sm font-semibold", color)}>
        <Icon className="w-4 h-4" />
        {title}
        <Badge variant="secondary" className="text-xs ml-auto">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
            {item.amount !== undefined && item.amount > 0 && (
              <div className="text-lg font-bold text-foreground">{formatCurrency(item.amount)}</div>
            )}
            {item.role && (
              <div className="text-xs text-muted-foreground">{item.role}</div>
            )}
            {item.type && (
              <Badge variant="outline" className="text-xs mt-1">{item.type}</Badge>
            )}
          </div>
        ))}
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

  const roiRatio = data.totalSpending > 0
    ? `${(data.totalBenefits / data.totalSpending).toFixed(1)}x`
    : "—";

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
          <div className="text-xl font-bold text-foreground">{showValues ? roiRatio : "—"}</div>
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

/* ─── Main component ─── */

interface ROIPipelineCardProps {
  data: ROIPipelineData;
  isSearching?: boolean;
  onTriggerScan?: () => void;
  autoScanning?: boolean;
  hasBeenScanned?: boolean;
}

export function ROIPipelineCard({
  data,
  isSearching = false,
  onTriggerScan,
  autoScanning = false,
  hasBeenScanned = false,
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
              No influence scan has been run yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-5">
              Run a Company Intelligence Scan to trace entity linkages through PAC filings, lobbying disclosures, and contract awards.
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
              <PipelineColumn title="Influence Network" icon={Users} items={data.network.map(n => ({ label: n.label, role: n.role, type: n.type }))} color="text-accent-foreground" />
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
            <p className="text-xs text-muted-foreground max-w-sm mb-5">
              The intelligence scan completed but found no entity linkages connecting political spending to government benefits for this company. This may change as new data becomes available.
            </p>
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
              <PipelineColumn title="Influence Network" icon={Users} items={data.network.map(n => ({ label: n.label, role: n.role, type: n.type }))} color="text-accent-foreground" />
              <FlowArrow />
              <PipelineColumn title="Benefits Out" icon={Landmark} items={data.benefitsOut} color="text-primary" />
            </div>
          </>
        )}

        {/* Linkage chain — show for results and partial */}
        {(state === "results" || state === "partial") && data.linkages.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <FileText className="w-4 h-4" />
              Connection Chain
              <Badge variant="secondary" className="text-xs ml-auto">{data.linkages.length} links</Badge>
            </div>
            <div className="space-y-2">
              {data.linkages.map((link, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      link.confidence >= 0.8 ? "bg-primary" : link.confidence >= 0.5 ? "bg-accent-foreground" : "bg-destructive"
                    )} />
                    <span className="text-muted-foreground w-8">{(link.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-foreground font-medium">{link.source}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{link.target}</span>
                  <span className="text-muted-foreground">— {link.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer — only for states with data */}
        {(state === "results" || state === "partial" || state === "no_evidence") && (
          <div className="flex items-center justify-between mt-4 border-t border-border pt-3">
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
        )}
      </CardContent>
    </Card>
  );
}
