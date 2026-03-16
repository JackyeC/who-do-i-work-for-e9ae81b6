import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Building2, GitBranch, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EntityResolutionReportProps {
  companyId: string;
  companyName: string;
  parentCompany?: string | null;
  secCik?: string | null;
  ticker?: string | null;
  className?: string;
}

function confidenceColor(pct: number): string {
  if (pct >= 90) return "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/8";
  if (pct >= 70) return "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/8";
  return "text-destructive border-destructive/30 bg-destructive/8";
}

export function EntityResolutionReport({
  companyId,
  companyName,
  parentCompany,
  secCik,
  ticker,
  className,
}: EntityResolutionReportProps) {
  const [expanded, setExpanded] = useState(false);

  // Fetch subsidiaries / corporate structure
  const { data: subsidiaries } = useQuery({
    queryKey: ["entity-resolution-subs", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_corporate_structure")
        .select("entity_name, entity_type, jurisdiction, source_name, confidence")
        .eq("company_id", companyId)
        .limit(20);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Compute match confidence based on available identity signals
  const matchMethods: string[] = [];
  if (secCik) matchMethods.push("SEC EDGAR (CIK)");
  if (ticker) matchMethods.push("Stock Ticker");
  if (parentCompany) matchMethods.push("Parent Company Match");
  if ((subsidiaries?.length || 0) > 0) matchMethods.push("OpenCorporates Registry");
  if (matchMethods.length === 0) matchMethods.push("Name-based search");

  const matchConfidence = Math.min(
    99,
    60 + (secCik ? 15 : 0) + (ticker ? 10 : 0) + ((subsidiaries?.length || 0) > 0 ? 10 : 0) + (parentCompany ? 5 : 0)
  );

  const color = confidenceColor(matchConfidence);

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-[10px] hover:opacity-80 transition-opacity"
      >
        <Badge variant="outline" className={cn("text-[10px] gap-1 cursor-help", color)}>
          <ShieldCheck className="w-3 h-3" />
          Entity Match: {matchConfidence}%
        </Badge>
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-border/60 bg-card p-3 text-xs space-y-3 max-w-sm">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            Entity Resolution Report
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Search Name</span>
              <span className="text-foreground font-medium">{companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matched Entity</span>
              <span className="text-foreground font-medium">{companyName}</span>
            </div>
            {parentCompany && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parent Company</span>
                <span className="text-foreground font-medium">{parentCompany}</span>
              </div>
            )}
            {secCik && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SEC CIK</span>
                <a
                  href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${secCik}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono"
                >
                  {secCik}
                </a>
              </div>
            )}
            {ticker && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticker</span>
                <span className="font-mono text-foreground">{ticker}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match Methods</span>
              <span className="text-foreground text-right">{matchMethods.join(" + ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match Confidence</span>
              <Badge variant="outline" className={cn("text-[9px]", color)}>{matchConfidence}%</Badge>
            </div>
          </div>

          {(subsidiaries?.length || 0) > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                Subsidiaries Included ({subsidiaries!.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {subsidiaries!.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <Building2 className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{s.entity_name}</span>
                    {s.jurisdiction && <span className="text-muted-foreground ml-auto shrink-0">{s.jurisdiction}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
