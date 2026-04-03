import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, X, Eye, Clock, ExternalLink, Building2,
  AlertTriangle, Landmark, Users, Loader2, ChevronDown, ChevronUp,
  ShieldCheck, Briefcase, BookOpen, Mail, FileText, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Shared ─── */

function EmptyQueue({ text }: { text: string }) {
  return (
    <div className="py-6 text-center">
      <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, count, defaultOpen = true, children }: {
  title: string;
  icon: typeof Building2;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors w-full text-left p-4"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        {title}
        {count !== undefined && count > 0 && (
          <Badge variant="outline" className="text-xs font-mono ml-1">{count}</Badge>
        )}
        <span className="flex-1" />
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border/40 p-4">{children}</div>}
    </div>
  );
}

/* ─── Pending Reviews (inline, max 5) ─── */

function PendingReviewsSection() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["founder-queue-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_company_reviews")
        .select("*")
        .in("status", ["pending", "reviewing"])
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: totalCount } = useQuery({
    queryKey: ["founder-queue-reviews-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("pending_company_reviews")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "reviewing"]);
      return count ?? 0;
    },
  });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [jackyeTake, setJackyeTake] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAction = async (id: string, action: "approve" | "reject" | "publish", companyName: string) => {
    setSaving(true);
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (action === "approve") {
        updates.status = "approved";
        updates.reviewed_at = new Date().toISOString();
        if (jackyeTake.trim()) updates.jackye_take = jackyeTake.trim();
      } else if (action === "reject") {
        updates.status = "rejected";
        updates.reviewed_at = new Date().toISOString();
      } else if (action === "publish") {
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { data: newCo, error: coErr } = await supabase
          .from("companies")
          .insert({ name: companyName, slug, industry: "Pending Classification", state: "National", creation_source: "perplexity_research" })
          .select("id")
          .single();
        if (coErr) throw coErr;
        updates.status = "published";
        updates.published_company_id = newCo.id;
        updates.reviewed_at = new Date().toISOString();
        if (jackyeTake.trim()) updates.jackye_take = jackyeTake.trim();
      }
      const { error } = await supabase.from("pending_company_reviews").update(updates).eq("id", id);
      if (error) throw error;
      toast.success(`Review ${action === "publish" ? "published" : action + "d"}`);
      queryClient.invalidateQueries({ queryKey: ["founder-queue-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["founder-queue-reviews-count"] });
      setExpanded(null);
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  if (!reviews?.length) return <EmptyQueue text="No company reviews pending. AI drafts will appear here when users request unknown companies." />;

  return (
    <div className="space-y-2">
      {reviews.map((r: any) => (
        <div key={r.id} className="border border-border/30 rounded-xl overflow-hidden">
          <div
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => { setExpanded(expanded === r.id ? null : r.id); setJackyeTake(r.jackye_take || ""); }}
          >
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.company_name}</p>
              <p className="text-xs text-muted-foreground">{r.requester_email || "System"} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
            </div>
            <Badge variant="outline" className={cn("text-xs shrink-0",
              r.status === "pending" ? "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20" : "bg-primary/10 text-primary border-primary/20"
            )}>{r.status}</Badge>
            {expanded === r.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          {expanded === r.id && (
            <div className="border-t border-border/30 p-3 space-y-3 bg-muted/10">
              {r.ai_summary && <p className="text-xs text-muted-foreground leading-relaxed">{r.ai_summary}</p>}
              {Array.isArray(r.ai_citations) && r.ai_citations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.ai_citations.slice(0, 5).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                      Source [{i + 1}] <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, "reject", r.company_name)} disabled={saving} className="text-xs gap-1 h-7 px-2">
                  <X className="w-3 h-3" /> Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "approve", r.company_name)} disabled={saving} className="text-xs gap-1 h-7 px-2">
                  <Check className="w-3 h-3" /> Approve
                </Button>
                <Button size="sm" onClick={() => handleAction(r.id, "publish", r.company_name)} disabled={saving} className="text-xs gap-1 h-7 px-2 ml-auto">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />} Publish
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {(totalCount ?? 0) > 5 && (
        <p className="text-xs text-muted-foreground text-center pt-1">Showing 5 of {totalCount} — open full admin panel to see all.</p>
      )}
    </div>
  );
}

/* ─── Certification Queue (inline, max 5) ─── */

function CertificationSection() {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<Record<string, Set<string>>>({});

  const { data: pending, isLoading } = useQuery({
    queryKey: ["founder-queue-cert"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, industry, vetted_status, created_at, creation_source")
        .eq("vetted_status", "unverified")
        .not("creation_source", "is", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const toggleCheck = (companyId: string, cId: string) => {
    setChecklist((prev) => {
      const s = new Set(prev[companyId] || []);
      s.has(cId) ? s.delete(cId) : s.add(cId);
      return { ...prev, [companyId]: s };
    });
  };

  const handleAction = async (id: string, status: "verified" | "certified") => {
    if (status === "certified" && (checklist[id]?.size ?? 0) < 3) {
      toast.error("Complete all 3 criteria before certifying.");
      return;
    }
    const { error } = await supabase.from("companies").update({ vetted_status: status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "certified" ? "Gold Shield granted" : "Company verified");
    queryClient.invalidateQueries({ queryKey: ["founder-queue-cert"] });
  };

  if (isLoading) return <Skeleton className="h-12" />;
  if (!pending?.length) return <EmptyQueue text="No certification requests pending." />;

  const criteria = [
    { id: "identity", label: "Identity Linkage" },
    { id: "disclosure", label: "Documented Disclosure" },
    { id: "non-interference", label: "Non-Interference Agreement" },
  ];

  return (
    <div className="space-y-2">
      {pending.map((co) => {
        const checked = checklist[co.id] || new Set();
        return (
          <div key={co.id} className="border border-border/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{co.name}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatDistanceToNow(new Date(co.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex flex-wrap gap-3 pl-5">
              {criteria.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={checked.has(c.id)} onChange={() => toggleCheck(co.id, c.id)} className="w-3 h-3 rounded border-border accent-primary" />
                  <span className={checked.has(c.id) ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-1.5 pl-5">
              <Button size="sm" variant="outline" onClick={() => handleAction(co.id, "verified")} className="text-xs gap-1 h-7 px-2">
                <Check className="w-3 h-3" /> Verify
              </Button>
              <Button size="sm" onClick={() => handleAction(co.id, "certified")} disabled={checked.size < 3} className="text-xs gap-1 h-7 px-2">
                <ShieldCheck className="w-3 h-3" /> Certify
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Job Approval (inline, max 5) ─── */

function JobApprovalSection() {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["founder-queue-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select("id, title, location, created_at, url, companies(name)")
        .eq("admin_approved", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = async (id: string, approve: boolean) => {
    const { error } = await supabase.from("company_jobs").update({ admin_approved: approve, is_active: approve }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Job approved" : "Job rejected");
    queryClient.invalidateQueries({ queryKey: ["founder-queue-jobs"] });
  };

  if (isLoading) return <Skeleton className="h-12" />;
  if (!jobs?.length) return <EmptyQueue text="No jobs pending approval." />;

  return (
    <div className="space-y-2">
      {jobs.map((job: any) => (
        <div key={job.id} className="border border-border/30 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground">{(job.companies as any)?.name || "Unknown"} · {job.location || "Remote"} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
          </div>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" /></a>}
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="destructive" onClick={() => handleAction(job.id, false)} className="text-xs gap-1 h-7 px-2"><X className="w-3 h-3" /></Button>
            <Button size="sm" onClick={() => handleAction(job.id, true)} className="text-xs gap-1 h-7 px-2"><Check className="w-3 h-3" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Waitlist (inline, max 5) ─── */

function WaitlistSection() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["founder-queue-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_waitlist")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "approved") update.approved_at = new Date().toISOString();
    const { error } = await supabase.from("career_waitlist").update(update).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`User ${status}`);
    queryClient.invalidateQueries({ queryKey: ["founder-queue-waitlist"] });
  };

  if (isLoading) return <Skeleton className="h-12" />;
  if (!entries.length) return <EmptyQueue text="No waitlist entries pending." />;

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="border border-border/30 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{e.email}</p>
            {e.reason && <p className="text-xs text-muted-foreground line-clamp-1">"{e.reason}"</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" onClick={() => handleAction(e.id, "approved")} className="text-xs gap-1 h-7 px-2 border-civic-green/30 text-civic-green hover:bg-civic-green/10">
              <Check className="w-3 h-3" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAction(e.id, "rejected")} className="text-xs gap-1 h-7 px-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <X className="w-3 h-3" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Tab ─── */

export function ReviewQueueTab() {
  const { data: counts } = useQuery({
    queryKey: ["founder-queue-all-counts"],
    queryFn: async () => {
      const [reviews, certs, jobs, waitlist] = await Promise.all([
        supabase.from("pending_company_reviews").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("vetted_status", "unverified").not("creation_source", "is", null),
        supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("admin_approved", false).eq("is_active", true),
        supabase.from("career_waitlist").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        reviews: reviews.count ?? 0,
        certs: certs.count ?? 0,
        jobs: jobs.count ?? 0,
        waitlist: waitlist.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Company Reviews" icon={BookOpen} count={counts?.reviews} defaultOpen={true}>
        <PendingReviewsSection />
      </CollapsibleSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CollapsibleSection title="Employer Certification" icon={ShieldCheck} count={counts?.certs} defaultOpen={true}>
          <CertificationSection />
        </CollapsibleSection>
        <CollapsibleSection title="Job Approval" icon={Briefcase} count={counts?.jobs} defaultOpen={true}>
          <JobApprovalSection />
        </CollapsibleSection>
      </div>

      <CollapsibleSection title="Career Waitlist" icon={Users} count={counts?.waitlist} defaultOpen={false}>
        <WaitlistSection />
      </CollapsibleSection>
    </div>
  );
}
