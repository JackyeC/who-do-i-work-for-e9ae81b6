import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Search, ExternalLink, Shield, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TalkingPoint {
  signal: string;
  severity: "high" | "medium" | "low";
  source: string;
  sourceUrl: string | null;
  script: string;
}

export function ResponseStudio() {
  const [companyQuery, setCompanyQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<TalkingPoint[]>([]);
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();

  const generate = async () => {
    if (!companyQuery.trim()) return;
    setLoading(true);
    setPoints([]);

    try {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", `%${companyQuery.trim()}%`)
        .limit(1);

      if (!companies || companies.length === 0) {
        toast({ title: "Company not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      const company = companies[0];
      setCompanyName(company.name);

      // Fetch flagged signals
      const [stancesRes, ideologyRes, contractsRes, issueRes] = await Promise.all([
        supabase.from("company_public_stances").select("topic, public_position, spending_reality, gap").eq("company_id", company.id),
        supabase.from("company_ideology_flags").select("org_name, category, description, severity, evidence_url").eq("company_id", company.id),
        supabase.from("company_agency_contracts").select("agency_name, contract_description, contract_value, controversy_flag, controversy_description, source").eq("company_id", company.id).eq("controversy_flag", true),
        (supabase as any).from("issue_signals").select("issue_category, signal_type, description, source_url, confidence_score, amount").eq("entity_id", company.id).eq("confidence_score", "high").limit(10),
      ]);

      const results: TalkingPoint[] = [];

      // Public stances with gaps
      for (const stance of (stancesRes.data || []) as any[]) {
        if (stance.gap === "large" || stance.gap === "medium") {
          results.push({
            signal: `Says "${stance.public_position}" on ${stance.topic}, but records show: "${stance.spending_reality}"`,
            severity: stance.gap === "large" ? "high" : "medium",
            source: "Public Stance Analysis",
            sourceUrl: null,
            script: `"I want to be transparent — ${company.name} has publicly stated their commitment to ${stance.topic}. Our research shows some gaps between that position and their actual spending patterns. Here's what the public records show, and I think it's important you have the full picture before making a decision."`,
          });
        }
      }

      // Ideology flags
      for (const flag of (ideologyRes.data || []) as any[]) {
        results.push({
          signal: `${flag.org_name}: ${flag.description || flag.category}`,
          severity: flag.severity === "high" ? "high" : "medium",
          source: "Ideology Scan",
          sourceUrl: flag.evidence_url,
          script: `"I should mention that ${company.name} has a documented connection to ${flag.org_name}. This is from public records — I believe in sharing facts so you can decide what matters to you."`,
        });
      }

      // Controversial contracts
      for (const contract of (contractsRes.data || []) as any[]) {
        results.push({
          signal: `Controversy: ${contract.controversy_description || contract.contract_description} with ${contract.agency_name}`,
          severity: "high",
          source: "USASpending.gov",
          sourceUrl: contract.source,
          script: `"${company.name} has a federal contract with ${contract.agency_name} that has raised some questions. The contract details are public record on USASpending.gov. I think it's worth reviewing so you can form your own opinion."`,
        });
      }

      // High-confidence issue signals
      for (const sig of (issueRes.data || []) as any[]) {
        results.push({
          signal: sig.description,
          severity: "medium",
          source: sig.signal_type?.replace(/_/g, " ") || "Signal",
          sourceUrl: sig.source_url,
          script: `"Our research shows a documented ${sig.issue_category?.replace(/_/g, " ")} signal for ${company.name}. This comes from verified public records${sig.amount ? ` involving $${Number(sig.amount).toLocaleString()}` : ""}. I'm sharing this so you have additional context from public records."`,
        });
      }

      setPoints(results);
    } catch (e) {
      toast({ title: "Error generating talking points", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Response Studio
          </CardTitle>
          <CardDescription>
            Generate evidence-based talking points for candidate conversations. Every script is backed by public records — facts over feelings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Enter company name..."
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>
            <Button onClick={generate} disabled={loading || !companyQuery.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Generate Talking Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {points.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {points.length} Talking Point{points.length !== 1 ? "s" : ""} for {companyName}
            </h3>
            <Badge variant="outline" className="text-xs gap-1">
              <Shield className="w-3 h-3" /> Facts Over Feelings
            </Badge>
          </div>

          {points.map((point, i) => {
            const SeverityIcon = point.severity === "high" ? AlertTriangle : point.severity === "medium" ? Shield : CheckCircle2;
            const severityColor = point.severity === "high" ? "text-destructive" : point.severity === "medium" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

            return (
              <Card key={i} className={cn(
                "border-l-4",
                point.severity === "high" ? "border-l-destructive" : point.severity === "medium" ? "border-l-yellow-500" : "border-l-green-500"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <SeverityIcon className={`w-4 h-4 mt-0.5 shrink-0 ${severityColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{point.signal}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{point.source}</Badge>
                        {point.sourceUrl && /^https?:\/\//.test(point.sourceUrl) && (
                          <a href={point.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                            <ExternalLink className="w-2.5 h-2.5" /> View Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-4 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Script</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyScript(point.script)}>
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-sm text-foreground italic leading-relaxed">{point.script}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && points.length === 0 && companyName && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Red Flags Found</h3>
            <p className="text-sm text-muted-foreground">No significant signals requiring candidate disclosure were found for {companyName}.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
