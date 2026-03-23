import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Briefcase, ExternalLink, Loader2, Building2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function JobApprovalQueue() {
  const queryClient = useQueryClient();

  const { data: pendingJobs, isLoading } = useQuery({
    queryKey: ["admin-pending-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select("id, title, location, work_mode, source_platform, created_at, company_id, is_active, url, admin_approved, companies(name, slug, logo_url, vetted_status)")
        .eq("admin_approved", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = async (jobId: string, approve: boolean) => {
    const { error } = await supabase
      .from("company_jobs")
      .update({ admin_approved: approve, is_active: approve })
      .eq("id", jobId);
    if (error) {
      toast.error("Action failed: " + error.message);
      return;
    }
    toast.success(approve ? "Job approved" : "Job rejected");
    queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Job Post Approval
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review employer-submitted job posts before they appear on the board.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !pendingJobs?.length ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-6 text-center">
            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendingJobs.map((job: any) => (
            <Card key={job.id} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(job.companies as any)?.name || "Unknown"} · {job.location || "Remote"} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="destructive" onClick={() => handleAction(job.id, false)} className="text-xs gap-1 h-7 px-2">
                    <X className="w-3 h-3" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => handleAction(job.id, true)} className="text-xs gap-1 h-7 px-2">
                    <Check className="w-3 h-3" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
