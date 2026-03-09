import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Search, Network, CheckCircle2, AlertTriangle, 
  Info, ChevronDown, ChevronUp 
} from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface EntityRelationship {
  name: string;
  type: string;
  confidence: number;
}

interface ScanCoverageData {
  canonical_name: string;
  total_search_names: number;
  aliases_generated?: number;
  ai_entities_discovered?: number;
  parent_company?: string | null;
  trade_associations?: number;
  relationships?: EntityRelationship[];
}

interface ModuleStatus {
  status: string;
  label: string;
  phase: string;
  signalsFound?: number;
  sourcesScanned?: number;
}

interface ScanCoveragePanelProps {
  resolutionLog: ScanCoverageData | null;
  moduleStatuses: Record<string, ModuleStatus>;
  totalSignals: number;
  totalSources: number;
  scanStatus: string | null;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent_company: "Parent Company",
  subsidiary: "Subsidiary",
  brand_name: "Brand Name",
  pac_name: "PAC Name",
  trade_association: "Trade Association",
  affiliate: "Affiliate",
  executive_linked_entity: "Executive-Linked",
  alias: "Alias",
  legal_variant: "Legal Variant",
  ticker: "Ticker Symbol",
  direct_company: "Direct Match",
};

const CATEGORY_CHECKS = [
  { key: "opensecrets", label: "OpenSecrets Org Profiles", modules: ["opensecrets"] },
  { key: "political", label: "Political Spending (FEC)", modules: ["fec_campaign_finance"] },
  { key: "lobbying", label: "Lobbying Disclosure (Senate LDA)", modules: ["lobbying_disclosure"] },
  { key: "contracts", label: "Government Benefits (USASpending)", modules: ["federal_contracts", "agency_contracts"] },
  { key: "corporate_structure", label: "Corporate Structure (OpenCorporates)", modules: ["opencorporates"] },
  { key: "sec", label: "SEC / EDGAR", modules: ["sec_edgar"] },
  { key: "workplace", label: "Workplace Enforcement (DOL)", modules: ["workplace_enforcement"] },
  { key: "worker", label: "Worker Intelligence", modules: ["ai_hr_scan", "worker_benefits", "pay_equity", "worker_sentiment"] },
  { key: "ideology", label: "Ideology & Social", modules: ["ideology", "social"] },
  { key: "ai", label: "AI Accountability", modules: ["ai_accountability"] },
];

function getCategoryStatus(modules: string[], moduleStatuses: Record<string, ModuleStatus>) {
  let signalsFound = 0;
  let sourcesChecked = 0;
  let hasCompleted = false;
  let hasFailed = false;

  for (const modKey of modules) {
    const mod = moduleStatuses[modKey];
    if (!mod) continue;
    if (mod.status === "completed_with_signals" || mod.status === "completed_no_signals") {
      hasCompleted = true;
      signalsFound += mod.signalsFound || 0;
      sourcesChecked += mod.sourcesScanned || 0;
    }
    if (mod.status === "failed" || mod.status === "no_sources_found") {
      hasFailed = true;
    }
  }

  return { signalsFound, sourcesChecked, hasCompleted, hasFailed };
}

export function ScanCoveragePanel({
  resolutionLog,
  moduleStatuses,
  totalSignals,
  totalSources,
  scanStatus,
}: ScanCoveragePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!scanStatus || scanStatus === "queued" || scanStatus === "in_progress") return null;

  const relationships = resolutionLog?.relationships || [];
  const entityCount = resolutionLog?.total_search_names || 1;
  const hasResults = totalSignals > 0;
  const isPartial = Object.values(moduleStatuses).some(
    m => m.status === "completed_with_signals"
  ) && Object.values(moduleStatuses).some(
    m => m.status === "failed" || m.status === "no_sources_found" || m.status === "completed_no_signals"
  );

  return (
    <Card className="border border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Scan Coverage & Entity Resolution
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {entityCount} entities checked
                </Badge>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Entity Resolution Summary */}
            {resolutionLog && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  Entities Checked
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Canonical name */}
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-foreground">{resolutionLog.canonical_name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">Primary</Badge>
                  </div>
                  {/* Parent company */}
                  {resolutionLog.parent_company && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                      <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                      <span className="text-xs text-foreground">{resolutionLog.parent_company}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">Parent</Badge>
                    </div>
                  )}
                  {/* Related entities */}
                  {relationships
                    .filter(r => r.type !== "legal_variant")
                    .slice(0, 8)
                    .map((rel, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          rel.confidence >= 0.8 ? "bg-primary" : rel.confidence >= 0.5 ? "bg-yellow-500" : "bg-muted-foreground"
                        )} />
                        <span className="text-xs text-foreground truncate">{rel.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                          {RELATIONSHIP_LABELS[rel.type] || rel.type}
                        </Badge>
                      </div>
                    ))}
                </div>
                {relationships.filter(r => r.type === "legal_variant").length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    + {relationships.filter(r => r.type === "legal_variant").length} legal name variants also checked
                  </p>
                )}
              </div>
            )}

            {/* Category-by-category results */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Network className="w-3.5 h-3.5" />
                Data Source Coverage
              </div>
              <div className="space-y-1.5">
                {CATEGORY_CHECKS.map(cat => {
                  const { signalsFound, sourcesChecked, hasCompleted, hasFailed } = getCategoryStatus(cat.modules, moduleStatuses);
                  return (
                     <div key={cat.key} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50">
                       <span className="text-xs text-foreground">{cat.label}</span>
                       <div className="flex items-center gap-2">
                         {hasCompleted && signalsFound > 0 && (
                           <span className="text-xs text-primary font-medium">
                             {signalsFound} match{signalsFound !== 1 ? "es" : ""} found
                           </span>
                         )}
                         {hasCompleted && signalsFound === 0 && (
                           <span className="text-xs text-muted-foreground">No records found yet</span>
                         )}
                         {hasFailed && !hasCompleted && (
                           <span className="text-xs text-destructive">Check failed</span>
                         )}
                         {!hasCompleted && !hasFailed && (
                           <span className="text-xs text-muted-foreground/60">Not checked</span>
                         )}
                         {hasCompleted ? (
                           <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                         ) : hasFailed ? (
                           <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                         ) : null}
                       </div>
                     </div>
                  );
                })}
              </div>
            </div>

            {/* Status explanation */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {!hasResults && (
                    <>No verified influence pipeline evidence was found in the checked sources for this company or its currently known related entities. We checked available public sources and OpenSecrets organization profiles — partial results will appear whenever evidence is found.</>
                  )}
                  {hasResults && isPartial && (
                    <>This company has partial verified evidence. Some pipeline categories returned results, while others did not produce confirmed matches yet. Third-party summaries may be available for cross-reference.</>
                  )}
                  {hasResults && !isPartial && (
                    <>Evidence was found across checked data sources. Results are linked to the primary company entity through verified corporate relationships and cross-checked against primary records where possible.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
