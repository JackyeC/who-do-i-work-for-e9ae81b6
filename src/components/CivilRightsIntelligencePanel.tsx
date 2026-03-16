import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SignalFreshness, REFRESH_CADENCES } from "@/components/SignalFreshness";
import { Scale, AlertTriangle, DollarSign, FileText, Megaphone, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface CivilRightsIntelligencePanelProps {
  companyId: string;
  companyName: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-[hsl(var(--civic-red))]/10", text: "text-[hsl(var(--civic-red))]", label: "High" },
  medium: { bg: "bg-[hsl(var(--civic-yellow))]/10", text: "text-[hsl(var(--civic-yellow))]", label: "Medium" },
  low: { bg: "bg-[hsl(var(--civic-green))]/10", text: "text-[hsl(var(--civic-green))]", label: "Low" },
};

export function CivilRightsIntelligencePanel({ companyId, companyName }: CivilRightsIntelligencePanelProps) {
  // Fetch all civil rights-related data in parallel
  const { data: stances } = useQuery({
    queryKey: ["cr-stances", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("*")
        .eq("company_id", companyId);
      // Filter to civil rights topics
      const keywords = ["civil rights", "equality", "diversity", "lgbtq", "discrimination", "dei", "inclusion", "voting", "racial", "gender"];
      return (data || []).filter(s =>
        keywords.some(kw => (s.topic || "").toLowerCase().includes(kw))
      );
    },
    enabled: !!companyId,
  });

  const { data: donations } = useQuery({
    queryKey: ["cr-donations", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("issue_signals")
        .select("*")
        .eq("entity_id", companyId)
        .in("issue_category", ["civil_rights", "equality", "lgbtq", "voting_rights", "discrimination"]);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: lobbying } = useQuery({
    queryKey: ["cr-lobbying", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("entity_linkages")
        .select("target_entity_name, description, amount, evidence_url, created_at")
        .eq("company_id", companyId)
        .eq("link_type", "lobbying_on_bill");
      // Filter to civil rights keywords
      const keywords = ["civil", "equality", "discrimination", "voting", "rights", "dei"];
      return (data || []).filter((l: any) => {
        const desc = ((l.description || "") + " " + (l.target_entity_name || "")).toLowerCase();
        return keywords.some(kw => desc.includes(kw));
      });
    },
    enabled: !!companyId,
  });

  const { data: civilRightsSignals } = useQuery({
    queryKey: ["cr-signals", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("civil_rights_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: contradictions } = useQuery({
    queryKey: ["cr-contradictions", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contradiction_signals")
        .select("*")
        .eq("company_id", companyId);
      // Filter to civil rights-related contradictions
      const keywords = ["civil rights", "equality", "diversity", "lgbtq", "discrimination"];
      return (data || []).filter((c: any) =>
        keywords.some(kw => (c.topic || "").toLowerCase().includes(kw))
      );
    },
    enabled: !!companyId,
  });

  // Check if we have any data at all
  const hasData = (stances?.length || 0) + (donations?.length || 0) + (lobbying?.length || 0) + (civilRightsSignals?.length || 0) + (contradictions?.length || 0) > 0;

  if (!hasData) return null;

  // Build evidence rows
  type EvidenceRow = {
    icon: typeof Scale;
    category: string;
    finding: string;
    severity: string;
    lastUpdated: string | null;
    sourceUrl: string | null;
    refreshCadence: string;
  };

  const rows: EvidenceRow[] = [];

  // Corporate Statements
  for (const stance of (stances || []).slice(0, 3)) {
    rows.push({
      icon: Megaphone,
      category: "Corporate Statement",
      finding: `${stance.topic}: ${stance.public_position || "Position stated"}`,
      severity: stance.gap === "direct-conflict" ? "high" : stance.gap === "mixed" ? "medium" : "low",
      lastUpdated: null,
      sourceUrl: null,
      refreshCadence: REFRESH_CADENCES.sentiment,
    });
  }

  // Political Donations
  const totalDonationAmount = (donations || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
  if ((donations || []).length > 0) {
    rows.push({
      icon: DollarSign,
      category: "Political Donations",
      finding: `${(donations || []).length} donation(s) to civil-rights-related policy areas` +
        (totalDonationAmount > 0 ? ` totaling $${totalDonationAmount.toLocaleString()}` : ""),
      severity: "medium",
      lastUpdated: (donations as any)?.[0]?.created_at || null,
      sourceUrl: (donations as any)?.[0]?.source_url || null,
      refreshCadence: REFRESH_CADENCES.pac,
    });
  }

  // Lobbying Activity
  if ((lobbying || []).length > 0) {
    const totalLobbying = (lobbying || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
    rows.push({
      icon: FileText,
      category: "Lobbying Activity",
      finding: `${(lobbying || []).length} lobbying record(s) on civil rights legislation` +
        (totalLobbying > 0 ? ` ($${totalLobbying.toLocaleString()})` : ""),
      severity: "medium",
      lastUpdated: (lobbying as any)?.[0]?.created_at || null,
      sourceUrl: (lobbying as any)?.[0]?.evidence_url || null,
      refreshCadence: REFRESH_CADENCES.lobbying,
    });
  } else {
    rows.push({
      icon: FileText,
      category: "Lobbying Activity",
      finding: "No disclosed lobbying on civil rights legislation",
      severity: "low",
      lastUpdated: null,
      sourceUrl: null,
      refreshCadence: REFRESH_CADENCES.lobbying,
    });
  }

  // Legal / Enforcement
  const enforcementSignals = (civilRightsSignals || []).filter(s =>
    ["eeoc_enforcement", "civil_rights_litigation", "discrimination_lawsuit"].includes(s.signal_type)
  );
  if (enforcementSignals.length > 0) {
    const totalSettlement = enforcementSignals.reduce((sum, s) => sum + (s.settlement_amount || 0), 0);
    rows.push({
      icon: Scale,
      category: "Legal / Enforcement",
      finding: `${enforcementSignals.length} enforcement action(s)` +
        (totalSettlement > 0 ? `, $${totalSettlement.toLocaleString()} in settlements` : "") +
        `. Sources: ${[...new Set(enforcementSignals.map(s => s.source_name))].join(", ")}`,
      severity: enforcementSignals.length >= 3 ? "high" : "medium",
      lastUpdated: enforcementSignals[0]?.created_at || null,
      sourceUrl: enforcementSignals[0]?.source_url || null,
      refreshCadence: REFRESH_CADENCES.civil_rights,
    });
  }

  // HRC Score
  const hrcSignals = (civilRightsSignals || []).filter(s => s.signal_type === "hrc_cei_score");
  if (hrcSignals.length > 0) {
    const score = hrcSignals[0];
    rows.push({
      icon: Shield,
      category: "HRC Equality Index",
      finding: `Score: ${score.hrc_score ?? "N/A"}/100` +
        (score.description ? ` — ${score.description}` : ""),
      severity: (score.hrc_score ?? 0) >= 80 ? "low" : (score.hrc_score ?? 0) >= 50 ? "medium" : "high",
      lastUpdated: score.created_at || null,
      sourceUrl: score.source_url || null,
      refreshCadence: REFRESH_CADENCES.esg,
    });
  }

  // Contradiction signals
  for (const c of (contradictions || []).slice(0, 3)) {
    rows.push({
      icon: AlertTriangle,
      category: "Mismatch Detected",
      finding: `${c.public_statement} ↔ ${c.spending_reality}`,
      severity: c.severity || "medium",
      lastUpdated: c.created_at || null,
      sourceUrl: c.spending_source_url || null,
      refreshCadence: "",
    });
  }

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Civil Rights Intelligence
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Evidence-based alignment check — statements, spending, lobbying, and enforcement records
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs w-[160px]">Data Type</TableHead>
                <TableHead className="text-xs">Finding</TableHead>
                <TableHead className="text-xs w-[100px] text-right">Freshness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const sev = SEVERITY_STYLES[row.severity] || SEVERITY_STYLES.low;
                const Icon = row.icon;
                return (
                  <TableRow key={i} className="group">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", sev.bg)}>
                          <Icon className={cn("w-3.5 h-3.5", sev.text)} />
                        </div>
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">{row.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-start gap-2">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{row.finding}</p>
                        {row.sourceUrl && (
                          <a
                            href={row.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Source →
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <SignalFreshness
                        lastUpdated={row.lastUpdated}
                        refreshCadence={row.refreshCadence}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Contradiction summary banner */}
        {(contradictions || []).length > 0 && (
          <div className="mx-4 mb-4 mt-2 p-3 rounded-lg bg-[hsl(var(--civic-red))]/5 border border-[hsl(var(--civic-red))]/15">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--civic-red))]" />
              <span className="text-xs font-semibold text-foreground">
                {(contradictions || []).length} Alignment Mismatch{(contradictions || []).length !== 1 ? "es" : ""} Detected
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Documented gaps between {companyName}'s public statements and verified spending, lobbying, or enforcement records. 
              All findings link to primary sources — no subjective labels applied.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
