/**
 * Alignment Signals Panel
 * 
 * Shows a contradiction heatmap across policy areas with expandable evidence.
 * Neutral language only — "Potential alignment conflict detected" not "anti-X".
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignalFreshness } from "@/components/SignalFreshness";
import {
  AlertTriangle, CheckCircle2, HelpCircle, ChevronDown,
  ExternalLink, Shield, Scale, Flame, HardHat, Globe,
  Heart, ShoppingCart, Crosshair, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

type AlignmentStatus = "conflict" | "neutral" | "unknown";

interface PolicyLens {
  key: string;
  label: string;
  icon: React.ElementType;
  keywords: string[];
}

const POLICY_LENSES: PolicyLens[] = [
  { key: "civil_rights", label: "Civil Rights", icon: Scale, keywords: ["civil rights", "equality", "diversity", "lgbtq", "discrimination", "dei", "inclusion", "voting rights"] },
  { key: "labor", label: "Labor Rights", icon: HardHat, keywords: ["labor", "worker", "union", "wage", "osha", "nlrb"] },
  { key: "climate", label: "Climate", icon: Flame, keywords: ["climate", "environment", "sustainability", "carbon", "emissions", "epa", "net zero"] },
  { key: "immigration", label: "Immigration", icon: Globe, keywords: ["immigration", "h-1b", "visa", "border"] },
  { key: "healthcare", label: "Healthcare", icon: Heart, keywords: ["healthcare", "health", "insurance", "pharmaceutical"] },
  { key: "guns", label: "Guns", icon: Crosshair, keywords: ["gun", "firearm", "nra", "atf"] },
  { key: "consumer_protection", label: "Consumer Protection", icon: ShoppingCart, keywords: ["consumer", "ftc", "cfpb", "fda", "privacy"] },
];

function StatusIcon({ status }: { status: AlignmentStatus }) {
  if (status === "conflict") return <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-red))]" />;
  if (status === "neutral") return <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />;
  return <HelpCircle className="w-4 h-4 text-muted-foreground/40" />;
}

function StatusLabel({ status }: { status: AlignmentStatus }) {
  if (status === "conflict") return <span className="text-[hsl(var(--civic-red))] font-medium">Conflict detected</span>;
  if (status === "neutral") return <span className="text-[hsl(var(--civic-green))]">No conflict found</span>;
  return <span className="text-muted-foreground">Insufficient data</span>;
}

export function AlignmentSignalsPanel({ companyId, companyName }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: contradictions, isLoading } = useQuery({
    queryKey: ["alignment-contradictions", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contradiction_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Map contradictions to policy lenses
  const lensStatuses = POLICY_LENSES.map(lens => {
    const matching = (contradictions || []).filter((c: any) => {
      const topic = (c.topic || "").toLowerCase();
      return lens.keywords.some(kw => topic.includes(kw));
    });

    const status: AlignmentStatus = matching.length > 0 ? "conflict" : 
      (contradictions || []).length > 0 ? "neutral" : "unknown";

    const highestSeverity = matching.reduce((max: string, c: any) => {
      if (c.severity === "high") return "high";
      if (c.severity === "medium" && max !== "high") return "medium";
      return max;
    }, "low");

    return { ...lens, status, contradictions: matching, highestSeverity };
  });

  const conflictCount = lensStatuses.filter(l => l.status === "conflict").length;
  const hasAnyData = (contradictions || []).length > 0;

  if (isLoading) return null;

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Alignment Signals
          </CardTitle>
          {conflictCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />
              {conflictCount} area{conflictCount !== 1 ? "s" : ""} with conflicts
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Comparing {companyName}'s public positions against political spending, lobbying, and enforcement records.
          No intent is inferred — only documented evidence is shown.
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-1">
        {/* Heatmap grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {lensStatuses.map(lens => {
            const Icon = lens.icon;
            return (
              <button
                key={lens.key}
                onClick={() => lens.status !== "unknown" && setExpanded(expanded === lens.key ? null : lens.key)}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs",
                  lens.status === "conflict" && "border-[hsl(var(--civic-red))]/20 bg-[hsl(var(--civic-red))]/[0.04] hover:bg-[hsl(var(--civic-red))]/[0.08]",
                  lens.status === "neutral" && "border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/[0.04] hover:bg-[hsl(var(--civic-green))]/[0.08]",
                  lens.status === "unknown" && "border-border/20 bg-muted/20 opacity-50 cursor-default",
                  expanded === lens.key && "ring-1 ring-primary/30"
                )}
              >
                <Icon className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  lens.status === "conflict" ? "text-[hsl(var(--civic-red))]" :
                  lens.status === "neutral" ? "text-[hsl(var(--civic-green))]" :
                  "text-muted-foreground/40"
                )} />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{lens.label}</p>
                  <p className={cn(
                    "text-xs",
                    lens.status === "conflict" ? "text-[hsl(var(--civic-red))]" :
                    lens.status === "neutral" ? "text-[hsl(var(--civic-green))]" :
                    "text-muted-foreground/50"
                  )}>
                    {lens.status === "conflict" ? `⚠️ Conflict` :
                     lens.status === "neutral" ? "No conflict" : "Unknown"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded evidence section */}
        {expanded && (() => {
          const lens = lensStatuses.find(l => l.key === expanded);
          if (!lens || lens.contradictions.length === 0) return null;

          return (
            <div className="space-y-3 pt-2 border-t border-border/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <StatusIcon status={lens.status} />
                  {lens.label}
                </h4>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setExpanded(null)}>
                  Close
                </Button>
              </div>

              {lens.contradictions.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/20 space-y-2">
                  {/* Public position */}
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                      Public Position
                    </p>
                    <p className="text-xs text-foreground">{c.public_statement}</p>
                    {c.statement_source_url && (
                      <a href={c.statement_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                        Source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Political behavior */}
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                      Political / Lobbying Behavior
                    </p>
                    <p className="text-xs text-foreground">{c.spending_reality}</p>
                    {c.spending_source_url && (
                      <a href={c.spending_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                        Evidence <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Signal footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          c.severity === "high" ? "border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))]" :
                          c.severity === "medium" ? "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]" :
                          "border-border/30 text-muted-foreground"
                        )}
                      >
                        {c.severity === "high" ? "High confidence" : c.severity === "medium" ? "Medium confidence" : "Low confidence"}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Potential alignment conflict
                      </Badge>
                    </div>
                    {c.created_at && (
                      <SignalFreshness lastUpdated={c.created_at} compact />
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 pt-3 border-t border-border/10">
          <Info className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Alignment signals compare public statements against FEC filings, Senate LDA records, and enforcement data.
            A detected conflict does not imply wrongdoing — it indicates a documented gap between stated positions and financial behavior.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
