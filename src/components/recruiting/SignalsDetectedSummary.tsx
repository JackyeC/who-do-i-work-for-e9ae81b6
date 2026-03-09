import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ExternalLink, DollarSign, Landmark, Users, FileText, Scale, Building2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectedSignal {
  label: string;
  category: string;
  icon: React.ReactNode;
  sourceUrl?: string;
  sourceLabel?: string;
}

interface Props {
  companyId: string;
  companyName: string;
}

export function SignalsDetectedSummary({ companyId, companyName }: Props) {
  const [signals, setSignals] = useState<DetectedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      setLoading(true);
      const detected: DetectedSignal[] = [];

      const [companyRes, contractsRes, warnRes, lobbyRes, stancesRes, darkMoneyRes, revDoorRes, ideologyRes] = await Promise.all([
        supabase.from("companies").select("total_pac_spending, lobbying_spend, government_contracts, subsidies_received").eq("id", companyId).maybeSingle(),
        supabase.from("company_agency_contracts").select("id, agency_name, source").eq("company_id", companyId).limit(3),
        supabase.from("company_warn_notices").select("id, source_url, notice_date").eq("company_id", companyId).limit(3),
        supabase.from("company_state_lobbying").select("id, state, source").eq("company_id", companyId).limit(3),
        supabase.from("company_public_stances").select("id, topic").eq("company_id", companyId).limit(3),
        supabase.from("company_dark_money").select("id, source").eq("company_id", companyId).limit(1),
        supabase.from("company_revolving_door").select("id").eq("company_id", companyId).limit(1),
        supabase.from("company_ideology_flags").select("id, evidence_url").eq("company_id", companyId).limit(1),
      ]);

      const company = companyRes.data;

      if (company?.total_pac_spending && company.total_pac_spending > 0) {
        detected.push({
          label: "Political spending activity",
          category: "Political",
          icon: <DollarSign className="w-3.5 h-3.5" />,
          sourceUrl: `https://www.fec.gov/data/committees/?search=${encodeURIComponent(companyName)}`,
          sourceLabel: "FEC Filings",
        });
      }

      if (contractsRes.data && contractsRes.data.length > 0) {
        detected.push({
          label: "Government contract dependency",
          category: "Financial",
          icon: <Landmark className="w-3.5 h-3.5" />,
          sourceUrl: `https://www.usaspending.gov/search/?hash=&filters=%7B%22keyword%22%3A%22${encodeURIComponent(companyName)}%22%7D`,
          sourceLabel: "USASpending.gov",
        });
      }

      if (revDoorRes.data && revDoorRes.data.length > 0) {
        detected.push({
          label: "Leadership structure change",
          category: "Governance",
          icon: <Building2 className="w-3.5 h-3.5" />,
          sourceUrl: `https://www.opensecrets.org/revolving/search-result.php?search=${encodeURIComponent(companyName)}`,
          sourceLabel: "OpenSecrets",
        });
      }

      if (warnRes.data && warnRes.data.length > 0) {
        detected.push({
          label: "Workforce restructuring",
          category: "Workforce",
          icon: <Users className="w-3.5 h-3.5" />,
          sourceUrl: warnRes.data[0]?.source_url || `https://www.google.com/search?q=${encodeURIComponent(companyName + " WARN notice layoff")}`,
          sourceLabel: "WARN Act Records",
        });
      }

      if (company?.lobbying_spend && company.lobbying_spend > 0) {
        detected.push({
          label: "Industry policy involvement",
          category: "Policy",
          icon: <Scale className="w-3.5 h-3.5" />,
          sourceUrl: `https://lda.senate.gov/filings/public/filing/search/?registrant=${encodeURIComponent(companyName)}`,
          sourceLabel: "Senate LDA",
        });
      }

      if (stancesRes.data && stancesRes.data.length > 0) {
        detected.push({
          label: `Public commitments on ${stancesRes.data.map(s => s.topic).slice(0, 2).join(", ")}`,
          category: "Stance",
          icon: <FileText className="w-3.5 h-3.5" />,
        });
      }

      if (darkMoneyRes.data && darkMoneyRes.data.length > 0) {
        detected.push({
          label: "Dark money organization connections",
          category: "Political",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          sourceUrl: darkMoneyRes.data[0]?.source || undefined,
          sourceLabel: "Public records",
        });
      }

      if (ideologyRes.data && ideologyRes.data.length > 0) {
        detected.push({
          label: "Ideology or controversy flags",
          category: "Controversy",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          sourceUrl: ideologyRes.data[0]?.evidence_url || undefined,
          sourceLabel: "Source",
        });
      }

      setSignals(detected);
      setLoading(false);
    };

    detect();
  }, [companyId, companyName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Signals Detected
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Public signals identified for {companyName}. Each links to its underlying data source.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5">{s.category}</Badge>
              </div>
            </div>
            {s.sourceUrl && (
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                {s.sourceLabel || "Source"} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2 italic">
          This platform reports signals detected from publicly available data sources. No conclusions are drawn. Interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}
