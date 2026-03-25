import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, X, Building2, Landmark, Users, AlertTriangle,
  ExternalLink, Clock, ChevronDown, ChevronUp, Loader2, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface PendingReview {
  id: string;
  company_name: string;
  requester_email: string | null;
  ai_summary: string | null;
  ai_leadership: string | null;
  ai_political_activity: string | null;
  ai_controversies: string | null;
  ai_citations: any;
  ai_model_used: string | null;
  jackye_take: string | null;
  status: string;
  published_company_id: string | null;
  created_at: string;
}

function Section({ icon: Icon, title, content }: { icon: any; title: string; content: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-medium text-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function DraftCard({ review, onRefresh }: { review: PendingReview; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editSummary, setEditSummary] = useState(review.ai_summary || "");
  const [editLeadership, setEditLeadership] = useState(review.ai_leadership || "");
  const [editPolitical, setEditPolitical] = useState(review.ai_political_activity || "");
  const [editControversies, setEditControversies] = useState(review.ai_controversies || "");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handlePublish = async () => {
    setSaving(true);
    try {
      // Find or create the company
      const slug = review.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      let companyId = review.published_company_id;
      if (!companyId) {
        const { data: existing } = await supabase
          .from("companies")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          companyId = existing.id;
        } else {
          const { data: newCo, error: coErr } = await supabase
            .from("companies")
            .insert({
              name: review.company_name,
              slug,
              industry: "Pending Classification",
              state: "National",
              description: editSummary,
              creation_source: "perplexity_research",
              vetted_status: "unverified",
            })
            .select("id")
            .single();
          if (coErr) throw coErr;
          companyId = newCo.id;
        }
      }

      // Save to company_research as approved
      const { error: resErr } = await supabase
        .from("company_research" as any)
        .insert({
          company_id: companyId,
          research_summary: editSummary,
          leadership_notes: editLeadership,
          political_spending_notes: editPolitical,
          connection_chain: editControversies,
          source_model: review.ai_model_used || "perplexity/sonar",
          status: "approved",
          citations: review.ai_citations || [],
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        });
      if (resErr) throw resErr;

      // Update pending review
      await supabase
        .from("pending_company_reviews")
        .update({
          status: "published",
          published_company_id: companyId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      toast.success("Research published to company profile!");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("pending_company_reviews")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", review.id);
    if (error) toast.error(error.message);
    else { toast.success("Draft rejected"); onRefresh(); }
    setSaving(false);
  };

  return (
    <Card className={cn("border-border/40", review.status === "pending" && "border-civic-yellow/20")}>
      <CardContent className="p-0">
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{review.company_name}</p>
            <p className="text-xs text-muted-foreground">
              {review.requester_email || "System"} · {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs",
            review.status === "pending" ? "bg-civic-yellow/10 text-civic-yellow" : "bg-primary/10 text-primary"
          )}>
            {review.status}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="border-t border-border/40 p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Summary</label>
              <Textarea value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={3} className="text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Leadership & Board</label>
              <Textarea value={editLeadership} onChange={e => setEditLeadership(e.target.value)} rows={3} className="text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Political Spending</label>
              <Textarea value={editPolitical} onChange={e => setEditPolitical(e.target.value)} rows={3} className="text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Connection Chain / Red Flags</label>
              <Textarea value={editControversies} onChange={e => setEditControversies(e.target.value)} rows={3} className="text-xs" />
            </div>

            {Array.isArray(review.ai_citations) && review.ai_citations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.ai_citations.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                    Source [{i + 1}] <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}

            {(review.status === "pending" || review.status === "reviewing") && (
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={saving} className="text-xs gap-1">
                  <X className="w-3 h-3" /> Reject
                </Button>
                <Button size="sm" onClick={handlePublish} disabled={saving} className="text-xs gap-1 ml-auto">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Approve & Publish
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResearchPublishQueue() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-research-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_company_reviews")
        .select("*")
        .in("status", ["pending", "reviewing"])
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as PendingReview[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-research-queue"] });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Draft Research Review
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Edit AI-generated research, then approve to publish to company profiles.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !reviews?.length ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-6 text-center">
            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No drafts awaiting review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map(r => <DraftCard key={r.id} review={r} onRefresh={refresh} />)}
        </div>
      )}
    </div>
  );
}
