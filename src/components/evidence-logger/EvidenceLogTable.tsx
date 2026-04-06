import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface EvidenceLogTableProps {
  refreshKey: number;
}

export function EvidenceLogTable({ refreshKey }: EvidenceLogTableProps) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["evidence-logs", user?.id, refreshKey],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("personal_work_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("incident_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("personal_work_logs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry removed.");
      refetch();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="border border-border/30 bg-card px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">No incidents logged yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Your evidence log is empty. Start documenting above.</p>
      </div>
    );
  }

  return (
    <div className="border border-border/40 bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/20 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Date</th>
            <th className="px-4 py-2 text-left font-medium">Participants</th>
            <th className="px-4 py-2 text-left font-medium">Account</th>
            <th className="px-4 py-2 text-left font-medium">Policy</th>
            <th className="px-4 py-2 text-left font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/10 hover:bg-muted/20">
              <td className="px-4 py-3 whitespace-nowrap text-foreground">
                {format(new Date(log.incident_date), "MMM d, yyyy")}
                {log.incident_time && (
                  <span className="block text-[10px] text-muted-foreground">{log.incident_time}</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{log.participants || "---"}</td>
              <td className="px-4 py-3 text-foreground max-w-xs">
                <p className="line-clamp-2">{log.rewritten_text || log.verbatim_quote}</p>
                {log.rewritten_text && (
                  <span className="text-[9px] text-primary font-medium">Evidence-rewritten</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate">{log.related_policy || "---"}</td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
