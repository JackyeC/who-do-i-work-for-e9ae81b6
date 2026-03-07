import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { ArrowRight, DollarSign, Users, Landmark, FileText, Loader2, Search, Radar } from "lucide-react";

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

function PipelineColumn({ title, icon: Icon, items, color }: {
  title: string;
  icon: React.ElementType;
  items: { label: string; amount?: number; type?: string; role?: string }[];
  color: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className={cn("flex items-center gap-2 mb-3 text-sm font-semibold", color)}>
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
            {item.amount !== undefined && (
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

interface ROIPipelineCardProps {
  data: ROIPipelineData;
  isSearching?: boolean;
  onTriggerScan?: () => void;
  autoScanning?: boolean;
}

export function ROIPipelineCard({ data, isSearching = false, onTriggerScan, autoScanning = false }: ROIPipelineCardProps) {
  const roiRatio = data.totalSpending > 0
    ? (data.totalBenefits / data.totalSpending).toFixed(1)
    : "N/A";

  const isEmpty = data.moneyIn.length === 0 && data.network.length === 0 && data.benefitsOut.length === 0;
  const scanning = isSearching || autoScanning;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Influence Pipeline — Money In → Network → Benefits Out
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tracing the flow from political spending through influence networks to government benefits.
          Each connection is rated by confidence level.
        </p>
      </CardHeader>
      <CardContent>
        {isEmpty && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-6 border border-border">
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Scanning Federal Records…</div>
                  <div className="text-xs text-muted-foreground">
                    Tracing entity linkages through PAC filings, lobbying disclosures, and contract awards. This runs automatically when no data exists.
                  </div>
                </div>
              </>
            ) : (
              <>
                <Radar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">No influence pipeline data found</div>
                  <div className="text-xs text-muted-foreground">
                    No entity linkages were detected. Run a scan to search PAC filings, lobbying disclosures, and contract awards.
                  </div>
                </div>
                {onTriggerScan && (
                  <Button size="sm" onClick={onTriggerScan} className="gap-1.5 shrink-0">
                    <Search className="w-3.5 h-3.5" />
                    Scan Now
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Money In</div>
            <div className="text-xl font-bold text-destructive">{formatCurrency(data.totalSpending)}</div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="text-center px-4 py-2 bg-card rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">ROI</div>
              <div className="text-xl font-bold text-foreground">{roiRatio}x</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Benefits Out</div>
            <div className="text-xl font-bold text-primary">{formatCurrency(data.totalBenefits)}</div>
          </div>
        </div>

        {/* Pipeline flow */}
        {!isEmpty && (
          <div className="flex flex-col md:flex-row gap-4">
            <PipelineColumn
              title="Money In"
              icon={DollarSign}
              items={data.moneyIn}
              color="text-destructive"
            />
            <FlowArrow />
            <PipelineColumn
              title="Influence Network"
              icon={Users}
              items={data.network.map(n => ({ label: n.label, role: n.role, type: n.type }))}
              color="text-yellow-600"
            />
            <FlowArrow />
            <PipelineColumn
              title="Benefits Out"
              icon={Landmark}
              items={data.benefitsOut}
              color="text-primary"
            />
          </div>
        )}

        {/* Linkage chain */}
        {data.linkages.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <FileText className="w-4 h-4" />
              Connection Chain
            </div>
            <div className="space-y-2">
              {data.linkages.map((link, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      link.confidence >= 0.8 ? "bg-primary" : link.confidence >= 0.5 ? "bg-yellow-500" : "bg-destructive"
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

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
          Pipeline analysis connects political spending to government outcomes through documented relationships. 
          Confidence scores reflect evidence quality: ≥80% = direct filings, 50-79% = inferred, &lt;50% = unverified.
        </p>
      </CardContent>
    </Card>
  );
}
