import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Save, Plus, Trash2, FileText, Loader2, Eye, ArrowLeft,
  ChevronDown, ChevronUp, GripVertical
} from "lucide-react";

const REPORT_TYPES = ["intelligence_report", "weekly_brief", "issue_audit", "company_alignment_report", "legislative_watch", "policy_alert"];
const STATUSES = ["draft", "published", "archived"];
const CONFIDENCE = ["high", "medium", "low"];
const VERIFICATIONS = ["fully_verified", "partially_verified", "analysis_with_linked_evidence", "limited_evidence", "unverified"];
const CLAIM_TYPES = ["factual_claim", "analytical_claim", "causal_claim", "pattern_claim", "forecast", "warning", "open_question"];
const SOURCE_TYPES = ["FEC_filing", "lobbying_disclosure", "government_contract", "public_statement", "bill_text", "agency_notice", "corporate_filing", "nonprofit_filing", "court_filing", "news_report", "third_party_summary", "internal_analysis"];
const ENTITY_TYPES = ["company", "organization", "lobbying_group", "trade_association", "PAC", "executive", "board_member", "legislator", "government_agency", "legislation", "court_case"];
const EVENT_TYPES = ["deadline", "hearing", "vote", "filing_release", "policy_statement", "markup", "bill_introduction", "public_comment_period", "court_decision", "lobbying_release"];
const ACTION_TYPES = ["spreadsheet_update", "entity_flag", "monitor_request", "donor_pull", "followup_scan", "watchlist_add", "manual_review", "content_update"];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isNew = !id || id === "new";

  const [report, setReport] = useState<any>({
    title: "", subtitle: "", slug: "", executive_summary: "", full_report_text: "",
    author_name: "Jackye Clayton", author_slug: "jackye-clayton",
    report_type: "intelligence_report", status: "draft",
    primary_issue_category: "", issue_categories_json: [],
    confidence_level: "medium", verification_status: "analysis_with_linked_evidence",
    featured_image_url: "", hero_quote: "",
  });
  const [sections, setSections] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [evidenceLinks, setEvidenceLinks] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [legislation, setLegislation] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [alignment, setAlignment] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("report");

  // Load existing report
  const { isLoading: loading } = useQuery({
    queryKey: ["edit-report", id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const [rRes, sRes, cRes, eRes, enRes, lRes, evRes, aRes, acRes, fRes] = await Promise.all([
        supabase.from("policy_reports" as any).select("*").eq("id", id).single(),
        supabase.from("report_sections" as any).select("*").eq("report_id", id).order("section_order"),
        supabase.from("report_claims" as any).select("*").eq("report_id", id).order("claim_order"),
        supabase.from("report_evidence_links" as any).select("*").eq("report_id", id),
        supabase.from("report_entities" as any).select("*").eq("report_id", id),
        supabase.from("report_legislation" as any).select("*").eq("report_id", id),
        supabase.from("report_events" as any).select("*").eq("report_id", id).order("event_date"),
        supabase.from("report_company_alignment" as any).select("*").eq("report_id", id),
        supabase.from("report_actions" as any).select("*").eq("report_id", id).order("action_order"),
        supabase.from("report_followups" as any).select("*").eq("report_id", id),
      ]);
      if (rRes.data) setReport(rRes.data);
      setSections(sRes.data || []);
      setClaims(cRes.data || []);
      setEvidenceLinks(eRes.data || []);
      setEntities(enRes.data || []);
      setLegislation(lRes.data || []);
      setEvents(evRes.data || []);
      setAlignment(aRes.data || []);
      setActions(acRes.data || []);
      setFollowups(fRes.data || []);
      return rRes.data;
    },
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const slug = report.slug || slugify(report.title);
      const payload = { ...report, slug, publication_date: report.publication_date || (report.status === "published" ? new Date().toISOString() : null) };
      delete payload.id; delete payload.created_at; delete payload.updated_at;

      let reportId = id;
      if (isNew) {
        const { data, error } = await supabase.from("policy_reports" as any).insert(payload).select("id").single();
        if (error) throw error;
        reportId = (data as any).id;
      } else {
        const { error } = await supabase.from("policy_reports" as any).update(payload).eq("id", id);
        if (error) throw error;
      }

      // Save sub-entities - delete and re-insert for simplicity
      const tables = [
        { name: "report_sections", data: sections },
        { name: "report_claims", data: claims },
        { name: "report_evidence_links", data: evidenceLinks },
        { name: "report_entities", data: entities },
        { name: "report_legislation", data: legislation },
        { name: "report_events", data: events },
        { name: "report_company_alignment", data: alignment },
        { name: "report_actions", data: actions },
        { name: "report_followups", data: followups },
      ];

      for (const t of tables) {
        await supabase.from(t.name as any).delete().eq("report_id", reportId);
        if (t.data.length > 0) {
          const rows = t.data.map((row: any) => {
            const { id: rowId, created_at, updated_at, ...rest } = row;
            return { ...rest, report_id: reportId };
          });
          await supabase.from(t.name as any).insert(rows);
        }
      }

      toast({ title: "Report saved", description: report.status === "published" ? "Report is now live." : "Draft saved." });
      qc.invalidateQueries({ queryKey: ["intelligence-reports"] });
      if (isNew) navigate(`/admin/reports/${reportId}`, { replace: true });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Sign in required</p></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const TABS = [
    { key: "report", label: "Report" },
    { key: "sections", label: `Sections (${sections.length})` },
    { key: "claims", label: `Claims (${claims.length})` },
    { key: "evidence", label: `Evidence (${evidenceLinks.length})` },
    { key: "entities", label: `Entities (${entities.length})` },
    { key: "legislation", label: `Legislation (${legislation.length})` },
    { key: "events", label: `Events (${events.length})` },
    { key: "alignment", label: `Alignment (${alignment.length})` },
    { key: "actions", label: `Actions (${actions.length})` },
    { key: "followups", label: `Follow-ups (${followups.length})` },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/reports")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-display font-bold">{isNew ? "New Report" : "Edit Report"}</h1>
            <Badge variant={report.status === "published" ? "default" : "secondary"} className="capitalize">{report.status}</Badge>
          </div>
          <div className="flex gap-2">
            {!isNew && report.status === "published" && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/intelligence/${report.slug}`, "_blank")} className="gap-1">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto mb-6 pb-2 border-b border-border">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-md whitespace-nowrap transition-colors",
                activeTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Title</label><Input value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value, slug: slugify(e.target.value) })} /></div>
              <div><label className="text-xs font-medium mb-1 block">Slug</label><Input value={report.slug} onChange={(e) => setReport({ ...report, slug: e.target.value })} /></div>
            </div>
            <div><label className="text-xs font-medium mb-1 block">Subtitle</label><Input value={report.subtitle || ""} onChange={(e) => setReport({ ...report, subtitle: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Type</label>
                <Select value={report.report_type} onValueChange={(v) => setReport({ ...report, report_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={report.status} onValueChange={(v) => setReport({ ...report, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Primary Issue</label>
                <Input value={report.primary_issue_category || ""} onChange={(e) => setReport({ ...report, primary_issue_category: e.target.value })} placeholder="e.g. ai_bias" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Confidence</label>
                <Select value={report.confidence_level} onValueChange={(v) => setReport({ ...report, confidence_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONFIDENCE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Verification</label>
                <Select value={report.verification_status} onValueChange={(v) => setReport({ ...report, verification_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VERIFICATIONS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium mb-1 block">Author</label><Input value={report.author_name} onChange={(e) => setReport({ ...report, author_name: e.target.value })} /></div>
            <div><label className="text-xs font-medium mb-1 block">Hero Quote</label><Input value={report.hero_quote || ""} onChange={(e) => setReport({ ...report, hero_quote: e.target.value })} /></div>
            <div><label className="text-xs font-medium mb-1 block">Executive Summary</label><Textarea value={report.executive_summary || ""} onChange={(e) => setReport({ ...report, executive_summary: e.target.value })} rows={5} /></div>
            <div><label className="text-xs font-medium mb-1 block">Issue Categories (JSON array)</label><Input value={JSON.stringify(report.issue_categories_json || [])} onChange={(e) => { try { setReport({ ...report, issue_categories_json: JSON.parse(e.target.value) }); } catch {} }} /></div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === "sections" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setSections([...sections, { section_order: sections.length, section_title: "", section_summary: "", full_section_text: "", confidence_level: "medium", verification_status: "analysis_with_linked_evidence" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Section</Button>
            {sections.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Section {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSections(sections.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                  <Input placeholder="Section title" value={s.section_title} onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], section_title: e.target.value }; setSections(u); }} />
                  <Input placeholder="Subtitle (optional)" value={s.section_subtitle || ""} onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], section_subtitle: e.target.value }; setSections(u); }} />
                  <Textarea placeholder="Summary" value={s.section_summary || ""} onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], section_summary: e.target.value }; setSections(u); }} rows={3} />
                  <Textarea placeholder="Full section text" value={s.full_section_text || ""} onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], full_section_text: e.target.value }; setSections(u); }} rows={6} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Issue category" value={s.issue_category || ""} onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], issue_category: e.target.value }; setSections(u); }} />
                    <Select value={s.confidence_level || "medium"} onValueChange={(v) => { const u = [...sections]; u[i] = { ...u[i], confidence_level: v }; setSections(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONFIDENCE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                    <Select value={s.verification_status || "analysis_with_linked_evidence"} onValueChange={(v) => { const u = [...sections]; u[i] = { ...u[i], verification_status: v }; setSections(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VERIFICATIONS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === "claims" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setClaims([...claims, { claim_order: claims.length, claim_title: "", claim_text: "", claim_type: "factual_claim", confidence_level: "medium", verification_status: "analysis_with_linked_evidence", evidence_required: true }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Claim</Button>
            {claims.map((c, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Claim {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setClaims(claims.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <Input placeholder="Claim title" value={c.claim_title} onChange={(e) => { const u = [...claims]; u[i] = { ...u[i], claim_title: e.target.value }; setClaims(u); }} />
                  <Textarea placeholder="Claim text" value={c.claim_text} onChange={(e) => { const u = [...claims]; u[i] = { ...u[i], claim_text: e.target.value }; setClaims(u); }} rows={3} />
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={c.claim_type} onValueChange={(v) => { const u = [...claims]; u[i] = { ...u[i], claim_type: v }; setClaims(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                    <Select value={c.confidence_level} onValueChange={(v) => { const u = [...claims]; u[i] = { ...u[i], confidence_level: v }; setClaims(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONFIDENCE.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                    <Select value={c.verification_status} onValueChange={(v) => { const u = [...claims]; u[i] = { ...u[i], verification_status: v }; setClaims(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VERIFICATIONS.map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setEvidenceLinks([...evidenceLinks, { source_name: "", source_type: "news_report", source_url: "", source_title: "", evidence_excerpt: "", verification_status: "unverified", confidence_score: "medium" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Evidence</Button>
            {evidenceLinks.map((e, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Evidence {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setEvidenceLinks(evidenceLinks.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Source name" value={e.source_name} onChange={(ev) => { const u = [...evidenceLinks]; u[i] = { ...u[i], source_name: ev.target.value }; setEvidenceLinks(u); }} />
                    <Select value={e.source_type} onValueChange={(v) => { const u = [...evidenceLinks]; u[i] = { ...u[i], source_type: v }; setEvidenceLinks(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Input placeholder="Source URL" value={e.source_url || ""} onChange={(ev) => { const u = [...evidenceLinks]; u[i] = { ...u[i], source_url: ev.target.value }; setEvidenceLinks(u); }} />
                  <Textarea placeholder="Evidence excerpt" value={e.evidence_excerpt || ""} onChange={(ev) => { const u = [...evidenceLinks]; u[i] = { ...u[i], evidence_excerpt: ev.target.value }; setEvidenceLinks(u); }} rows={2} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Entities Tab */}
        {activeTab === "entities" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setEntities([...entities, { entity_name_snapshot: "", entity_type: "company", relationship_description: "", confidence_level: "medium" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Entity</Button>
            {entities.map((e, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Entity {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setEntities(entities.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Entity name" value={e.entity_name_snapshot} onChange={(ev) => { const u = [...entities]; u[i] = { ...u[i], entity_name_snapshot: ev.target.value }; setEntities(u); }} />
                    <Select value={e.entity_type} onValueChange={(v) => { const u = [...entities]; u[i] = { ...u[i], entity_type: v }; setEntities(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Input placeholder="Relationship description" value={e.relationship_description || ""} onChange={(ev) => { const u = [...entities]; u[i] = { ...u[i], relationship_description: ev.target.value }; setEntities(u); }} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legislation Tab */}
        {activeTab === "legislation" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setLegislation([...legislation, { bill_name: "", bill_number: "", legislative_body: "", jurisdiction: "", current_status: "", description: "", source_url: "" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Legislation</Button>
            {legislation.map((l, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Legislation {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setLegislation(legislation.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Bill name" value={l.bill_name} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], bill_name: e.target.value }; setLegislation(u); }} />
                    <Input placeholder="Bill number (e.g. H.R. 7567)" value={l.bill_number || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], bill_number: e.target.value }; setLegislation(u); }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Body (e.g. U.S. House)" value={l.legislative_body || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], legislative_body: e.target.value }; setLegislation(u); }} />
                    <Input placeholder="Jurisdiction" value={l.jurisdiction || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], jurisdiction: e.target.value }; setLegislation(u); }} />
                    <Input placeholder="Status" value={l.current_status || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], current_status: e.target.value }; setLegislation(u); }} />
                  </div>
                  <Textarea placeholder="Description" value={l.description || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], description: e.target.value }; setLegislation(u); }} rows={2} />
                  <Input placeholder="Source URL" value={l.source_url || ""} onChange={(e) => { const u = [...legislation]; u[i] = { ...u[i], source_url: e.target.value }; setLegislation(u); }} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setEvents([...events, { event_title: "", event_type: "deadline", event_date: "", event_description: "", source_url: "", confidence_level: "medium" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Event</Button>
            {events.map((e, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Event {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setEvents(events.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <Input placeholder="Event title" value={e.event_title} onChange={(ev) => { const u = [...events]; u[i] = { ...u[i], event_title: ev.target.value }; setEvents(u); }} />
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={e.event_type} onValueChange={(v) => { const u = [...events]; u[i] = { ...u[i], event_type: v }; setEvents(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                    <Input type="date" value={e.event_date || ""} onChange={(ev) => { const u = [...events]; u[i] = { ...u[i], event_date: ev.target.value }; setEvents(u); }} />
                    <Select value={e.confidence_level || "medium"} onValueChange={(v) => { const u = [...events]; u[i] = { ...u[i], confidence_level: v }; setEvents(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONFIDENCE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Textarea placeholder="Description" value={e.event_description || ""} onChange={(ev) => { const u = [...events]; u[i] = { ...u[i], event_description: ev.target.value }; setEvents(u); }} rows={2} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alignment Tab */}
        {activeTab === "alignment" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setAlignment([...alignment, { entity_name_snapshot: "", alignment_theme: "", alignment_summary: "", dirty_receipt_label: "", evidence_note: "", confidence_level: "medium", verification_status: "analysis_with_linked_evidence" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Alignment</Button>
            {alignment.map((a, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Alignment {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setAlignment(alignment.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Company/Entity name" value={a.entity_name_snapshot} onChange={(e) => { const u = [...alignment]; u[i] = { ...u[i], entity_name_snapshot: e.target.value }; setAlignment(u); }} />
                    <Input placeholder="Alignment theme" value={a.alignment_theme || ""} onChange={(e) => { const u = [...alignment]; u[i] = { ...u[i], alignment_theme: e.target.value }; setAlignment(u); }} />
                  </div>
                  <Input placeholder="Dirty Receipt label" value={a.dirty_receipt_label || ""} onChange={(e) => { const u = [...alignment]; u[i] = { ...u[i], dirty_receipt_label: e.target.value }; setAlignment(u); }} />
                  <Textarea placeholder="Summary" value={a.alignment_summary || ""} onChange={(e) => { const u = [...alignment]; u[i] = { ...u[i], alignment_summary: e.target.value }; setAlignment(u); }} rows={2} />
                  <Input placeholder="Evidence note" value={a.evidence_note || ""} onChange={(e) => { const u = [...alignment]; u[i] = { ...u[i], evidence_note: e.target.value }; setAlignment(u); }} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === "actions" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setActions([...actions, { action_order: actions.length, action_title: "", action_description: "", action_type: "manual_review", priority_level: "medium" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Action</Button>
            {actions.map((a, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Action {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setActions(actions.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <Input placeholder="Action title" value={a.action_title} onChange={(e) => { const u = [...actions]; u[i] = { ...u[i], action_title: e.target.value }; setActions(u); }} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={a.action_type} onValueChange={(v) => { const u = [...actions]; u[i] = { ...u[i], action_type: v }; setActions(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
                    <Select value={a.priority_level || "medium"} onValueChange={(v) => { const u = [...actions]; u[i] = { ...u[i], priority_level: v }; setActions(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["high", "medium", "low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Textarea placeholder="Description" value={a.action_description || ""} onChange={(e) => { const u = [...actions]; u[i] = { ...u[i], action_description: e.target.value }; setActions(u); }} rows={2} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Follow-ups Tab */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setFollowups([...followups, { prompt_text: "", status: "open", priority_level: "medium", related_issue_category: "" }])} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Follow-up</Button>
            {followups.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Follow-up {i + 1}</span><Button variant="ghost" size="sm" onClick={() => setFollowups(followups.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div>
                  <Textarea placeholder="Investigative prompt" value={f.prompt_text} onChange={(e) => { const u = [...followups]; u[i] = { ...u[i], prompt_text: e.target.value }; setFollowups(u); }} rows={2} />
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={f.status} onValueChange={(v) => { const u = [...followups]; u[i] = { ...u[i], status: v }; setFollowups(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["open", "in_progress", "completed", "archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    <Select value={f.priority_level || "medium"} onValueChange={(v) => { const u = [...followups]; u[i] = { ...u[i], priority_level: v }; setFollowups(u); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["high", "medium", "low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                    <Input placeholder="Issue category" value={f.related_issue_category || ""} onChange={(e) => { const u = [...followups]; u[i] = { ...u[i], related_issue_category: e.target.value }; setFollowups(u); }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
