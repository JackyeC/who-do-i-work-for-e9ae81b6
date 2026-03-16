import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, ShieldCheck, Info } from "lucide-react";

interface HighRiskConnectionCardProps {
  companyId: string;
  companyName: string;
}

export function HighRiskConnectionCard({ companyId, companyName }: HighRiskConnectionCardProps) {
  const { data: flaggedOrgs, isLoading } = useQuery({
    queryKey: ["flagged-orgs", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_flagged_orgs")
        .select("*")
        .eq("company_id", companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  if (isLoading) return null;

  const hasFlags = flaggedOrgs && flaggedOrgs.length > 0;

  if (!hasFlags) {
    return (
      <Card className="border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/5">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--civic-green))]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-[hsl(var(--civic-green))]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No Extremist Associations Found in Public Record</p>
            <p className="text-xs text-muted-foreground mt-1">
              No documented connections to SPLC/ADL-flagged organizations detected for {companyName}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {flaggedOrgs.map((org) => (
        <Card key={org.id} className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-foreground">⚠️ High-Risk Connection</p>
                  <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                    {org.confidence} Confidence
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">{org.org_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Relationship: <span className="font-medium text-foreground">{org.relationship}</span>
                </p>
                {org.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{org.description}</p>
                )}
                {org.source && (
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" asChild>
                    <a href={org.source} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" /> View Source
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Jackye Insight */}
      <div className="p-3 bg-muted/40 border border-border/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Strategic Context:</span>{" "}
            A documented association does not necessarily imply endorsement. However, institutional ties to flagged organizations
            are a material factor in evaluating employer alignment. Sources include SPLC, ADL, and public records.
          </p>
        </div>
      </div>
    </div>
  );
}
