import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, ArrowRight, Shield } from "lucide-react";

const VERIFICATION_LABELS: Record<string, { text: string; className: string }> = {
  fully_verified: { text: "Fully Verified", className: "border-civic-green/30 text-civic-green" },
  partially_verified: { text: "Partially Verified", className: "border-civic-yellow/30 text-civic-yellow" },
  analysis_with_linked_evidence: { text: "Analysis + Evidence", className: "border-civic-blue/30 text-civic-blue" },
  limited_evidence: { text: "Limited Evidence", className: "border-civic-yellow/30 text-civic-yellow" },
  unverified: { text: "Unverified", className: "border-civic-red/30 text-civic-red" },
};

interface Props {
  issueCategory: string;
  issueLabel: string;
}

export function IssueRelatedReports({ issueCategory, issueLabel }: Props) {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["issue-related-reports", issueCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_reports" as any)
        .select("id, title, subtitle, slug, publication_date, report_type, verification_status, confidence_level, primary_issue_category, author_name")
        .eq("status", "published")
        .or(`primary_issue_category.eq.${issueCategory},issue_categories_json.cs.["${issueCategory}"]`)
        .order("publication_date", { ascending: false })
        .limit(5);
      if (error) { console.error(error); return []; }
      return (data || []) as any[];
    },
  });

  // Also fetch top claims for this issue
  const { data: topClaims } = useQuery({
    queryKey: ["issue-top-claims", issueCategory],
    queryFn: async () => {
      const { data } = await supabase
        .from("report_claims" as any)
        .select("id, claim_title, claim_type, confidence_level, report_id")
        .eq("issue_category", issueCategory)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data || []) as any[];
    },
  });

  // Fetch linked legislation
  const { data: legislation } = useQuery({
    queryKey: ["issue-legislation", issueCategory],
    queryFn: async () => {
      const { data } = await supabase
        .from("report_legislation" as any)
        .select("id, bill_name, bill_number, current_status, jurisdiction, source_url")
        .eq("issue_category", issueCategory)
        .limit(6);
      return (data || []) as any[];
    },
  });

  // Fetch upcoming events
  const { data: events } = useQuery({
    queryKey: ["issue-events", issueCategory],
    queryFn: async () => {
      const { data } = await supabase
        .from("report_events" as any)
        .select("id, event_title, event_type, event_date, event_description")
        .eq("issue_category", issueCategory)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);
      return (data || []) as any[];
    },
  });

  const hasContent = (reports && reports.length > 0) || (topClaims && topClaims.length > 0) || (legislation && legislation.length > 0) || (events && events.length > 0);

  if (isLoading) return null;
  if (!hasContent) return null;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-border/40">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Related Intelligence Reports
      </h3>

      {/* Reports */}
      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r: any) => {
            const vStatus = VERIFICATION_LABELS[r.verification_status] || VERIFICATION_LABELS.unverified;
            return (
              <Link key={r.id} to={`/intelligence/${r.slug}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {r.publication_date ? new Date(r.publication_date).toLocaleDateString() : "Draft"}
                          </span>
                          <Badge variant="outline" className={`text-xs px-1.5 py-0 ${vStatus.className}`}>
                            <Shield className="w-2.5 h-2.5 mr-0.5" />{vStatus.text}
                          </Badge>
                          {r.author_name && <span className="text-xs text-muted-foreground">{r.author_name}</span>}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Top Claims */}
      {topClaims && topClaims.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Key Claims</h4>
          <div className="space-y-1.5">
            {topClaims.map((c: any) => (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-foreground">{c.claim_title}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0 capitalize">{c.claim_type?.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legislation */}
      {legislation && legislation.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Linked Legislation</h4>
          <div className="flex flex-wrap gap-2">
            {legislation.map((l: any) => (
              <Badge key={l.id} variant="secondary" className="text-xs gap-1">
                {l.bill_number || l.bill_name}
                {l.current_status && <span className="text-muted-foreground">· {l.current_status}</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {events && events.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Upcoming Events & Deadlines</h4>
          <div className="space-y-1.5">
            {events.map((e: any) => (
              <div key={e.id} className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{new Date(e.event_date).toLocaleDateString()}</span>
                <span className="text-muted-foreground">{e.event_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/intelligence" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
        View all Intelligence Reports <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
