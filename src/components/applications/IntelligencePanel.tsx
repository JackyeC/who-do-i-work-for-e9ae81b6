import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, ExternalLink, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IntelligencePanelProps {
  companyId: string;
  companyName: string;
}

export function ApplicationIntelligencePanel({ companyId, companyName }: IntelligencePanelProps) {
  // Fetch company basics
  const { data: company } = useQuery({
    queryKey: ["company-intelligence-brief", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, civic_footprint_score, employer_clarity_score, career_intelligence_score")
        .eq("id", companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch recent WARN notices
  const { data: warnNotices = [] } = useQuery({
    queryKey: ["app-warn-notices", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_warn_notices")
        .select("notice_date, employees_affected, location_state")
        .eq("company_id", companyId)
        .order("notice_date", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch community signals summary
  const { data: communitySignals = [] } = useQuery({
    queryKey: ["app-community-signals", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_community_signals")
        .select("source, signal_type, label, value, numeric_value")
        .eq("company_id", companyId)
        .in("signal_type", ["overall_rating", "accreditation", "complaints"]);
      return data || [];
    },
    enabled: !!companyId,
  });

  const slug = company?.slug || companyName?.toLowerCase().replace(/\s+/g, "-");
  const clarityScore = company?.employer_clarity_score;
  const civicScore = company?.civic_footprint_score;

  const isConcerning = (clarityScore != null && clarityScore < 3) || (civicScore != null && civicScore < 40);

  return (
    <Card className={isConcerning ? "border-destructive/30 bg-destructive/5" : "border-border/40"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Employer Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConcerning && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive leading-relaxed">
              This employer has signals that warrant caution. Review the full dossier before proceeding.
            </p>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-2">
          {clarityScore != null && (
            <div className="rounded-lg border border-border/40 p-3 text-center">
              <p className="text-xl font-bold font-mono text-foreground">{clarityScore.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Clarity Score</p>
            </div>
          )}
          {civicScore != null && (
            <div className="rounded-lg border border-border/40 p-3 text-center">
              <p className="text-xl font-bold font-mono text-foreground">{civicScore}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Civic Footprint</p>
            </div>
          )}
        </div>

        {/* WARN notices */}
        {warnNotices.length > 0 && (
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Layoff Signals</p>
            {warnNotices.map((w: any, i: number) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                {w.notice_date}: {w.employees_affected} workers affected ({w.location_state})
              </p>
            ))}
          </div>
        )}

        {/* Community signals */}
        {communitySignals.length > 0 && (
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Community Data</p>
            <div className="space-y-1">
              {communitySignals.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{s.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" asChild>
          <Link to={`/dossier/${slug}`}>
            <Building2 className="w-3.5 h-3.5" />
            View Full Dossier
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
