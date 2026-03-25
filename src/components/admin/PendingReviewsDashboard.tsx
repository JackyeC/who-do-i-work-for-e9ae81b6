import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check, X, Eye, Clock, ExternalLink, User, Building2,
  AlertTriangle, Landmark, Users, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PendingReview {
  id: string;
  company_name: string;
  requested_by: string | null;
  requester_email: string | null;
  requester_note: string | null;
  ai_summary: string | null;
  ai_leadership: string | null;
  ai_political_activity: string | null;
  ai_controversies: string | null;
  ai_citations: string[];
  ai_model_used: string | null;
  jackye_take: string | null;
  status: string;
  reviewed_at: string | null;
  published_company_id: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20", icon: Clock },
  reviewing: { label: "Reviewing", color: "bg-civic-blue/10 text-civic-blue border-civic-blue/20", icon: Eye },
  approved: { label: "Approved", color: "bg-civic-green/10 text-civic-green border-civic-green/20", icon: Check },
  published: { label: "Published", color: "bg-primary/10 text-primary border-primary/20", icon: Building2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
};

function ReviewCard({ review, onUpdate }: { review: PendingReview; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [jackyeTake, setJackyeTake] = useState(review.jackye_take || "");
  const [saving, setSaving] = useState(false);

  const statusConfig = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  const handleAction = async (action: "approve" | "reject" | "publish") => {
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
        // Create the company in the main table
        const slug = review.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const { data: newCompany, error: companyErr } = await supabase
          .from("companies")
          .insert({
            name: review.company_name,
            slug,
            industry: "Pending Classification",
            state: "National",
            description: review.ai_summary,
            creation_source: "perplexity_research",
          })
          .select("id")
          .single();

        if (companyErr) throw companyErr;

        updates.status = "published";
        updates.published_company_id = newCompany.id;
        updates.reviewed_at = new Date().toISOString();
        if (jackyeTake.trim()) updates.jackye_take = jackyeTake.trim();
      }

      const { error } = await supabase
        .from("pending_company_reviews")
        .update(updates)
        .eq("id", review.id);

      if (error) throw error;
      toast.success(`Review ${action === "publish" ? "published" : action + "d"} successfully`);
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn(
      "border-border/40 transition-all",
      review.status === "pending" && "border-civic-yellow/20",
    )}>
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <StatusIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{review.company_name}</p>
            <p className="text-xs text-muted-foreground">
              Requested by {review.requester_email || "Unknown"} · {timeAgo}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border/40 p-4 space-y-4">
            {review.requester_note && (
              <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                <span className="font-medium">Requester note:</span> {review.requester_note}
              </div>
            )}

            {/* AI Research Sections */}
            {review.ai_summary && (
              <Section icon={Building2} title="Summary" content={review.ai_summary} />
            )}
            {review.ai_leadership && (
              <Section icon={Users} title="Leadership & Board" content={review.ai_leadership} />
            )}
            {review.ai_political_activity && (
              <Section icon={Landmark} title="Political Activity" content={review.ai_political_activity} />
            )}
            {review.ai_controversies && (
              <Section icon={AlertTriangle} title="Controversies" content={review.ai_controversies} />
            )}

            {/* Citations */}
            {review.ai_citations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Sources</p>
                <div className="flex flex-wrap gap-1">
                  {review.ai_citations.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      [{i + 1}] <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Analysis editor */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Strategic Analysis (Pro-gated)</p>
              <Textarea
                value={jackyeTake}
                onChange={e => setJackyeTake(e.target.value)}
                placeholder="Add your expert analysis here... This will be locked behind Pro."
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Model info */}
            <p className="text-xs text-muted-foreground">
              AI Model: {review.ai_model_used || "Unknown"} · Generated {timeAgo}
            </p>

            {/* Action buttons */}
            {(review.status === "pending" || review.status === "reviewing") && (
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction("reject")}
                  disabled={saving}
                  className="text-xs gap-1"
                >
                  <X className="w-3 h-3" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("approve")}
                  disabled={saving}
                  className="text-xs gap-1"
                >
                  <Check className="w-3 h-3" /> Approve Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction("publish")}
                  disabled={saving}
                  className="text-xs gap-1 ml-auto"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
                  Publish as Company
                </Button>
              </div>
            )}

            {review.status === "approved" && (
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  size="sm"
                  onClick={() => handleAction("publish")}
                  disabled={saving}
                  className="text-xs gap-1"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
                  Publish as Company
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
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

export function PendingReviewsDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["pending-reviews", activeTab],
    queryFn: async () => {
      const query = supabase
        .from("pending_company_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query.eq("status", activeTab);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data as PendingReview[]) ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["pending-reviews-counts"],
    queryFn: async () => {
      const statuses = ["pending", "reviewing", "approved", "published", "rejected"];
      const results: Record<string, number> = {};
      for (const s of statuses) {
        const { count } = await supabase
          .from("pending_company_reviews")
          .select("*", { count: "exact", head: true })
          .eq("status", s);
        results[s] = count ?? 0;
      }
      return results;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["pending-reviews-counts"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black text-foreground tracking-tight">
          Pending Company Reviews
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI-researched companies awaiting your expert review. Approve, edit, and publish.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <Card key={key} className="border-border/30">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-black tabular-nums">{counts?.[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent p-0 gap-1">
          <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-civic-yellow/10 data-[state=active]:text-civic-yellow">
            Pending {counts?.pending ? `(${counts.pending})` : ""}
          </TabsTrigger>
          <TabsTrigger value="reviewing" className="text-xs data-[state=active]:bg-civic-blue/10 data-[state=active]:text-civic-blue">
            Reviewing
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs data-[state=active]:bg-civic-green/10 data-[state=active]:text-civic-green">
            Approved
          </TabsTrigger>
          <TabsTrigger value="published" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Published
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !reviews?.length ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No {activeTab === "all" ? "" : activeTab} reviews yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              When users request unknown companies, AI drafts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
