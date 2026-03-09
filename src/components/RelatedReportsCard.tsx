import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, ArrowRight, Shield, Building2 } from "lucide-react";

interface RelatedReportsCardProps {
  companyName?: string;
  companyId?: string;
  issueCategory?: string;
}

export function RelatedReportsCard({ companyName, companyId, issueCategory }: RelatedReportsCardProps) {
  // Reports linked via company alignment
  const { data: alignmentReports } = useQuery({
    queryKey: ["related-reports-alignment", companyName, companyId],
    enabled: !!(companyName || companyId),
    queryFn: async () => {
      let query = supabase.from("report_company_alignment" as any).select("report_id, alignment_theme, alignment_summary, dirty_receipt_label, confidence_level, verification_status");
      if (companyId) query = query.eq("entity_id", companyId);
      else if (companyName) query = query.ilike("entity_name_snapshot", `%${companyName}%`);
      const { data } = await query.limit(20);
      return (data || []) as any[];
    },
  });

  // Reports linked via issue category
  const { data: issueReports } = useQuery({
    queryKey: ["related-reports-issue", issueCategory],
    enabled: !!issueCategory,
    queryFn: async () => {
      const { data } = await supabase
        .from("policy_reports" as any)
        .select("id, slug, title, subtitle, publication_date, report_type, confidence_level, verification_status, author_name")
        .eq("status", "published")
        .eq("primary_issue_category", issueCategory)
        .order("publication_date", { ascending: false })
        .limit(10);
      return (data || []) as any[];
    },
  });

  // Fetch report details for alignment links
  const reportIds = [...new Set((alignmentReports || []).map((a: any) => a.report_id))];
  const { data: reportDetails } = useQuery({
    queryKey: ["report-details-for-alignment", reportIds],
    enabled: reportIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("policy_reports" as any)
        .select("id, slug, title, subtitle, publication_date, report_type, confidence_level, verification_status, author_name")
        .eq("status", "published")
        .in("id", reportIds);
      return (data || []) as any[];
    },
  });

  const allReports = [
    ...(reportDetails || []).map((r: any) => ({
      ...r,
      alignment: (alignmentReports || []).find((a: any) => a.report_id === r.id),
    })),
    ...(issueReports || []).filter((r: any) => !reportIds.includes(r.id)).map((r: any) => ({ ...r, alignment: null })),
  ];

  if (allReports.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Related Intelligence Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allReports.map((r: any) => (
            <Link key={r.id} to={`/intelligence/${r.slug}`} className="block">
              <div className="p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                        {r.report_type?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{r.title}</h4>
                    {r.subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.subtitle}</p>}

                    {r.alignment && (
                      <div className="mt-2 p-2 rounded bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Building2 className="w-3 h-3 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">Company Alignment</span>
                          {r.alignment.dirty_receipt_label && (
                            <Badge variant="destructive" className="text-[9px]">{r.alignment.dirty_receipt_label}</Badge>
                          )}
                        </div>
                        {r.alignment.alignment_summary && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{r.alignment.alignment_summary}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {r.publication_date && (
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(r.publication_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        {r.verification_status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
