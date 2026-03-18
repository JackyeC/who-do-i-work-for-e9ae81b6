import { useQuery } from "@tanstack/react-query";
import { Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { computePolicyScore, getSituationsFromStorage, type Situation } from "@/lib/policyScoreEngine";

interface Props {
  companyId: string;
  companyName: string;
}

export function PolicyScoreCard({ companyId, companyName }: Props) {
  const situations = getSituationsFromStorage();

  const { data: result, isLoading } = useQuery({
    queryKey: ["policy-score-card", companyId, situations],
    queryFn: async () => {
      const [stancesRes, linkagesRes, darkRes, tradeRes, lobbyRes, signalsRes] = await Promise.all([
        supabase.from("company_public_stances").select("topic, public_position, spending_reality, gap").eq("company_id", companyId),
        (supabase as any).from("entity_linkages").select("link_type, amount, description, source_entity_name, target_entity_name").eq("company_id", companyId),
        supabase.from("company_dark_money").select("name, org_type, estimated_amount").eq("company_id", companyId),
        supabase.from("company_trade_associations").select("name").eq("company_id", companyId),
        supabase.from("company_state_lobbying").select("state, lobbying_spend").eq("company_id", companyId),
        supabase.from("company_signal_scans").select("signal_category, signal_type, signal_value").eq("company_id", companyId),
      ]);

      return computePolicyScore({
        stances: stancesRes.data || [],
        linkages: linkagesRes.data || [],
        darkMoney: darkRes.data || [],
        tradeAssociations: tradeRes.data || [],
        lobbyingRecords: lobbyRes.data || [],
        signalScans: signalsRes.data || [],
      }, situations as Situation[]);
    },
  });

  if (isLoading || !result) return null;

  const scoreColor = result.total >= 70 ? "text-[hsl(var(--civic-green))]" : result.total >= 45 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive";

  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Policy Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{result.total}</span>
            <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>{result.grade}</Badge>
          </div>
        </div>
        <div className="space-y-1.5">
          {result.pillars.map(p => (
            <div key={p.key} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-24 shrink-0">{p.label}</span>
              <Progress value={p.score} className="h-1 flex-1" />
              <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{p.score}</span>
            </div>
          ))}
        </div>
        <Link
          to={`/policy-intelligence?company=${encodeURIComponent(companyName)}`}
          className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View full policy report <ChevronRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
