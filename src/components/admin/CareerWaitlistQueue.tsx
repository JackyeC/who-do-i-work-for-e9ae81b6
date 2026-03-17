import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export function CareerWaitlistQueue() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-career-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "approved") update.approved_at = new Date().toISOString();
      const { error } = await supabase.from("career_waitlist").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-career-waitlist"] });
      toast.success(`User ${status}`);
    },
  });

  const pending = entries.filter((e) => e.status === "pending");
  const approved = entries.filter((e) => e.status === "approved");

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-civic-green/10 text-civic-green border-civic-green/20 text-[9px]">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-[9px]">Rejected</Badge>;
    return <Badge variant="outline" className="text-[9px]"><Clock className="w-2.5 h-2.5 mr-1" />Pending</Badge>;
  };

  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
        <Users className="w-4.5 h-4.5 text-primary" /> Career Waitlist
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {pending.length} pending · {approved.length} approved
      </p>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4 text-center">No waitlist entries yet</p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 bg-muted/30 rounded-xl border border-border/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{entry.email}</span>
                  {statusBadge(entry.status)}
                </div>
                <span className="text-[10px] text-muted-foreground">{timeAgo(entry.created_at)}</span>
              </div>
              {entry.reason && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">"{entry.reason}"</p>
              )}
              {entry.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-civic-green/30 text-civic-green hover:bg-civic-green/10"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: entry.id, status: "approved" })}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: entry.id, status: "rejected" })}
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
