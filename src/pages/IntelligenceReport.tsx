import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WatchCompanyButton } from "@/components/WatchCompanyButton";
import { cn } from "@/lib/utils";
import {
  Shield, Calendar, User, FileText, ExternalLink, ChevronRight,
  AlertTriangle, CheckCircle2, HelpCircle, Scale, Gavel,
  Clock, Building2, Target, MessageSquare, ArrowUpRight,
  Loader2, BookOpen, Crosshair, Eye, Bookmark
} from "lucide-react";

const CONFIDENCE_BADGE: Record<string, { label: string; class: string }> = {
  high: { label: "High Confidence", class: "border-primary/30 text-primary bg-primary/5" },
  medium: { label: "Medium Confidence", class: "border-amber-500/30 text-amber-600 bg-amber-500/5" },
  low: { label: "Low Confidence", class: "border-orange-500/30 text-orange-600 bg-orange-500/5" },
};

const VERIFICATION_BADGE: Record<string, { label: string; icon: any; class: string }> = {
  fully_verified: { label: "Fully Verified", icon: CheckCircle2, class: "text-primary" },
  partially_verified: { label: "Partially Verified", icon: Shield, class: "text-amber-600" },
  analysis_with_linked_evidence: { label: "Analysis with Linked Evidence", icon: FileText, class: "text-blue-600" },
  limited_evidence: { label: "Limited Evidence", icon: AlertTriangle, class: "text-orange-600" },
  unverified: { label: "Unverified / Open Question", icon: HelpCircle, class: "text-muted-foreground" },
  verified_primary_source: { label: "Verified Primary Source", icon: CheckCircle2, class: "text-primary" },
  verified_secondary_source: { label: "Verified Secondary", icon: Shield, class: "text-amber-600" },
  third_party_summary: { label: "Third-Party Summary", icon: FileText, class: "text-blue-500" },
  partial_match: { label: "Partial Match", icon: AlertTriangle, class: "text-orange-500" },
};

const CLAIM_TYPE_LABEL: Record<string, string> = {
  factual_claim: "Factual Claim",
  analytical_claim: "Analytical Claim",
  causal_claim: "Causal Claim",
  pattern_claim: "Pattern",
  forecast: "Forecast",
  warning: "Warning",
  open_question: "Open Question",
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  intelligence_report: "Intelligence Report",
  weekly_brief: "Weekly Brief",
  issue_audit: "Issue Audit",
  company_alignment_report: "Company Alignment Report",
  legislative_watch: "Legislative Watch",
  policy_alert: "Policy Alert",
};

function ConfidenceBadge({ level }: { level: string }) {
  const config = CONFIDENCE_BADGE[level] || CONFIDENCE_BADGE.medium;
  return <Badge variant="outline" className={cn("text-[10px]", config.class)}>{config.label}</Badge>;
}

function VerificationBadge({ status }: { status: string }) {
  const config = VERIFICATION_BADGE[status] || VERIFICATION_BADGE.unverified;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", config.class)}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
}

export default function IntelligenceReport() {
  const { slug } = useParams();

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_reports" as any)
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const reportId = report?.id;

  const { data: sections } = useQuery({
    queryKey: ["report-sections", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_sections" as any).select("*").eq("report_id", reportId).order("section_order");
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: claims } = useQuery({
    queryKey: ["report-claims", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_claims" as any).select("*").eq("report_id", reportId).order("claim_order");
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: evidence } = useQuery({
    queryKey: ["report-evidence", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_evidence_links" as any).select("*").eq("report_id", reportId).order("created_at");
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: entities } = useQuery({
    queryKey: ["report-entities", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_entities" as any).select("*").eq("report_id", reportId);
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: legislation } = useQuery({
    queryKey: ["report-legislation", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_legislation" as any).select("*").eq("report_id", reportId);
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: events } = useQuery({
    queryKey: ["report-events", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_events" as any).select("*").eq("report_id", reportId).order("event_date");
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: alignment } = useQuery({
    queryKey: ["report-alignment", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_company_alignment" as any).select("*").eq("report_id", reportId);
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: actions } = useQuery({
    queryKey: ["report-actions", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_actions" as any).select("*").eq("report_id", reportId).order("action_order");
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  const { data: followups } = useQuery({
    queryKey: ["report-followups", reportId],
    queryFn: async () => {
      const { data } = await supabase.from("report_followups" as any).select("*").eq("report_id", reportId);
      return (data || []) as any[];
    },
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">Report not found.</p>
          <Link to="/intelligence"><Button variant="outline">Browse Reports</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const issueCategories: string[] = report.issue_categories_json || [];
  const sectionClaims = (sectionId: string) => (claims || []).filter((c: any) => c.section_id === sectionId);
  const sectionEvidence = (sectionId: string) => (evidence || []).filter((e: any) => e.section_id === sectionId);
  const claimEvidence = (claimId: string) => (evidence || []).filter((e: any) => e.claim_id === claimId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* A. Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3" />
          <div className="container mx-auto px-4 py-12 md:py-16 relative max-w-4xl">
            <Link to="/intelligence" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
              ← All Intelligence Reports
            </Link>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                {REPORT_TYPE_LABEL[report.report_type] || report.report_type}
              </Badge>
              {issueCategories.map((cat: string) => (
                <Badge key={cat} variant="outline" className="text-[10px] capitalize">
                  {cat.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight mb-3">
              {report.title}
            </h1>
            {report.subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-6">{report.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {report.author_name}
              </span>
              {report.publication_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(report.publication_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              )}
              <ConfidenceBadge level={report.confidence_level} />
              <VerificationBadge status={report.verification_status} />
            </div>

            {report.hero_quote && (
              <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/80 text-base mb-6">
                "{report.hero_quote}"
              </blockquote>
            )}

            {report.executive_summary && (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Executive Summary</h3>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.executive_summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* B. Section Navigation */}
        {sections && sections.length > 0 && (
          <nav className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="flex gap-1 overflow-x-auto py-2">
                {sections.map((s: any, i: number) => (
                  <a
                    key={s.id}
                    href={`#section-${s.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md whitespace-nowrap transition-colors"
                  >
                    {i + 1}. {s.section_title}
                  </a>
                ))}
                {(legislation?.length || 0) > 0 && <a href="#legislation" className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md whitespace-nowrap">Legislation</a>}
                {(events?.length || 0) > 0 && <a href="#timeline" className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md whitespace-nowrap">Timeline</a>}
                {(alignment?.length || 0) > 0 && <a href="#alignment" className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md whitespace-nowrap">Company Alignment</a>}
              </div>
            </div>
          </nav>
        )}

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* C. Structured Sections */}
          {sections?.map((section: any, i: number) => {
            const sClaims = sectionClaims(section.id);
            const sEvidence = sectionEvidence(section.id);
            return (
              <section key={section.id} id={`section-${section.id}`} className="mb-12">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{section.section_title}</h2>
                    {section.section_subtitle && <p className="text-sm text-muted-foreground mt-1">{section.section_subtitle}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <ConfidenceBadge level={section.confidence_level} />
                      <VerificationBadge status={section.verification_status} />
                    </div>
                  </div>
                </div>

                {section.section_summary && (
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-foreground leading-relaxed">{section.section_summary}</p>
                  </div>
                )}

                {section.full_section_text && (
                  <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{section.full_section_text}</p>
                  </div>
                )}

                {/* D. Claims in this section */}
                {sClaims.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" /> Key Claims ({sClaims.length})
                    </h4>
                    {sClaims.map((claim: any) => {
                      const cEvidence = claimEvidence(claim.id);
                      return (
                        <Card key={claim.id} className={cn(
                          "border-l-4",
                          claim.claim_type === "warning" ? "border-l-destructive" :
                          claim.claim_type === "open_question" ? "border-l-amber-500" :
                          claim.claim_type === "forecast" ? "border-l-blue-500" :
                          "border-l-primary"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="text-sm font-semibold text-foreground">{claim.claim_title}</h5>
                              <Badge variant="outline" className="text-[9px] shrink-0 capitalize">
                                {CLAIM_TYPE_LABEL[claim.claim_type] || claim.claim_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground/80 mb-2">{claim.claim_text}</p>
                            <div className="flex items-center gap-2">
                              <ConfidenceBadge level={claim.confidence_level} />
                              <VerificationBadge status={claim.verification_status} />
                            </div>
                            {/* E. Evidence for this claim */}
                            {cEvidence.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                                {cEvidence.map((ev: any) => (
                                  <div key={ev.id} className="flex items-start gap-2 text-xs">
                                    <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-medium text-foreground">{ev.source_name}</span>
                                      <span className="text-muted-foreground ml-1 capitalize">({ev.source_type?.replace(/_/g, " ")})</span>
                                      {ev.evidence_excerpt && <p className="text-muted-foreground mt-0.5 italic">"{ev.evidence_excerpt}"</p>}
                                      {ev.source_url && (
                                        <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline mt-0.5">
                                          View source <ArrowUpRight className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {cEvidence.length === 0 && claim.evidence_required && (
                              <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Evidence pending — labeled as analysis
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Section-level evidence */}
                {sEvidence.filter((e: any) => !e.claim_id).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Section Evidence
                    </h4>
                    <div className="space-y-2">
                      {sEvidence.filter((e: any) => !e.claim_id).map((ev: any) => (
                        <div key={ev.id} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/30 border border-border/50">
                          <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{ev.source_name}</span>
                            {ev.source_url && (
                              <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5">
                                source <ArrowUpRight className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {ev.evidence_excerpt && <p className="text-muted-foreground mt-0.5 italic">"{ev.evidence_excerpt}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
              </section>
            );
          })}

          {/* F. Legislation Block */}
          {legislation && legislation.length > 0 && (
            <section id="legislation" className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" /> Referenced Legislation ({legislation.length})
              </h2>
              <div className="grid gap-3">
                {legislation.map((leg: any) => (
                  <Card key={leg.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{leg.bill_name}</span>
                            {leg.bill_number && <Badge variant="outline" className="text-[10px]">{leg.bill_number}</Badge>}
                          </div>
                          {leg.description && <p className="text-xs text-muted-foreground mt-1">{leg.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            {leg.legislative_body && <span>{leg.legislative_body}</span>}
                            {leg.jurisdiction && <span>{leg.jurisdiction}</span>}
                            {leg.current_status && <Badge variant="secondary" className="text-[9px]">{leg.current_status}</Badge>}
                          </div>
                        </div>
                        {leg.source_url && (
                          <a href={leg.source_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                              <ExternalLink className="w-3 h-3" /> View
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* G. Timeline Block */}
          {events && events.length > 0 && (
            <section id="timeline" className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Timeline & Deadlines ({events.length})
              </h2>
              <div className="space-y-3">
                {events.map((evt: any) => (
                  <div key={evt.id} className="flex gap-4 items-start">
                    <div className="w-20 shrink-0 text-right">
                      <span className="text-xs font-mono text-primary">
                        {evt.event_date ? new Date(evt.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                      </span>
                    </div>
                    <div className="w-px bg-border self-stretch relative">
                      <div className="absolute top-1 -left-1 w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{evt.event_title}</span>
                        <Badge variant="outline" className="text-[9px] capitalize">{evt.event_type?.replace(/_/g, " ")}</Badge>
                      </div>
                      {evt.event_description && <p className="text-xs text-muted-foreground mt-1">{evt.event_description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* H. Company Alignment Table */}
          {alignment && alignment.length > 0 && (
            <section id="alignment" className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Company Alignment Audit ({alignment.length})
              </h2>
              <div className="space-y-3">
                {alignment.map((a: any) => (
                  <Card key={a.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground text-sm">{a.entity_name_snapshot}</span>
                            {a.alignment_theme && <Badge variant="secondary" className="text-[10px]">{a.alignment_theme}</Badge>}
                            {a.dirty_receipt_label && <Badge variant="destructive" className="text-[10px]">{a.dirty_receipt_label}</Badge>}
                          </div>
                          {a.alignment_summary && <p className="text-xs text-foreground/80">{a.alignment_summary}</p>}
                          {a.evidence_note && <p className="text-[11px] text-muted-foreground mt-1 italic">{a.evidence_note}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <ConfidenceBadge level={a.confidence_level} />
                            <VerificationBadge status={a.verification_status} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0 items-end">
                          {a.entity_id && (
                            <WatchCompanyButton companyId={a.entity_id} companyName={a.entity_name_snapshot || "Company"} size="sm" />
                          )}
                          {a.entity_id && (
                            <Link to={`/company/${a.entity_name_snapshot?.toLowerCase().replace(/\s+/g, "-")}`}>
                              <Button variant="ghost" size="sm" className="text-xs gap-1">
                                Profile <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* I. Action Items */}
          {actions && actions.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Action Items ({actions.length})
              </h2>
              <div className="space-y-2">
                {actions.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      a.priority_level === "high" ? "bg-destructive" : a.priority_level === "medium" ? "bg-amber-500" : "bg-muted-foreground"
                    )} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{a.action_title}</span>
                      {a.action_description && <p className="text-xs text-muted-foreground mt-0.5">{a.action_description}</p>}
                      <Badge variant="outline" className="text-[9px] mt-1 capitalize">{a.action_type?.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* J. Follow-up Questions */}
          {followups && followups.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Open Investigative Questions ({followups.length})
              </h2>
              <div className="space-y-2">
                {followups.map((f: any) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <HelpCircle className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      f.status === "completed" ? "text-primary" : f.status === "in_progress" ? "text-amber-500" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className="text-sm text-foreground">{f.prompt_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] capitalize">{f.status}</Badge>
                        <Badge variant="outline" className="text-[9px] capitalize">{f.priority_level} priority</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Linked Entities */}
          {entities && entities.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Referenced Entities ({entities.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {entities.map((e: any) => (
                  <Badge key={e.id} variant="secondary" className="text-xs gap-1.5 py-1">
                    <span className="text-[9px] text-muted-foreground capitalize">{e.entity_type?.replace(/_/g, " ")}</span>
                    {e.entity_name_snapshot}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* K. Transparency Note */}
          <Card className="border-primary/20 bg-primary/[0.02] mb-8">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Transparency Note</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This report combines structured public-record evidence with analytical interpretation.
                    Claims and summaries are labeled according to verification status. Raw evidence remains
                    separate from analysis. Where no evidence is linked, claims are visibly labeled as
                    analysis or open questions. Sources include FEC filings, lobbying disclosures, government
                    contracts, legislative records, and third-party summaries.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
