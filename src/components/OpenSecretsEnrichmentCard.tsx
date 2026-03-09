import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck, ShieldAlert, Info, Globe } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";

const VERIFICATION_LABELS: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  cross_checked_primary_source: { label: "Verified against primary records", color: "text-primary", icon: ShieldCheck },
  partially_verified: { label: "Partial evidence found", color: "text-yellow-500", icon: ShieldAlert },
  unverified_opensecrets_only: { label: "Third-party summary — pending verification", color: "text-muted-foreground", icon: Info },
  failed_match: { label: "Match confidence low — review recommended", color: "text-destructive", icon: ShieldAlert },
};

interface OpenSecretsEnrichmentCardProps {
  data: any;
}

export function OpenSecretsEnrichmentCard({ data }: OpenSecretsEnrichmentCardProps) {
  if (!data) return null;

  const verStatus = VERIFICATION_LABELS[data.verification_status] || VERIFICATION_LABELS.unverified_opensecrets_only;
  const VerIcon = verStatus.icon;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            OpenSecrets Profile Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              <VerIcon className={`w-3 h-3 mr-1 ${verStatus.color}`} />
              {verStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {data.contributions_total != null && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">Campaign Finance</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(data.contributions_total)}</div>
            </div>
          )}
          {data.lobbying_total != null && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">Lobbying</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(data.lobbying_total)}</div>
            </div>
          )}
          {data.outside_spending_total != null && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">Outside Spending</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(data.outside_spending_total)}</div>
            </div>
          )}
        </div>

        {data.party_split_json && (
          <div className="flex items-center gap-4 text-xs">
            {data.party_split_json.democrat_pct != null && (
              <span className="text-primary">Democrat: {data.party_split_json.democrat_pct}%</span>
            )}
            {data.party_split_json.republican_pct != null && (
              <span className="text-destructive">Republican: {data.party_split_json.republican_pct}%</span>
            )}
          </div>
        )}

        {data.industry_label && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{data.industry_label}</Badge>
          </div>
        )}

        {data.issue_tags && data.issue_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.issue_tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-[10px] capitalize">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            {data.source_note || "Data from OpenSecrets.org public organization profiles."}
          </p>
          {data.profile_url && (
            <a
              href={data.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {data.cross_check_results && Object.keys(data.cross_check_results).length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-foreground">Cross-check results:</p>
            {Object.entries(data.cross_check_results).map(([source, result]: [string, any]) => (
              <div key={source} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground capitalize">{source}</span>
                <Badge variant={result.status === 'consistent' ? 'success' : 'warning'} className="text-[10px]">
                  {result.status === 'consistent' ? 'Consistent' : 'Divergent'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
