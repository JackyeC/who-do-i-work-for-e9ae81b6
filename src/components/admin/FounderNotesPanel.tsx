import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FounderNotesPanel() {
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["founder-notes"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("founder_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []) as { id: string; note: string; week_label: string | null; created_at: string }[];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const weekLabel = new Date().toISOString().split("T")[0];
      const { error } = await (supabase as any)
        .from("founder_notes")
        .insert({ user_id: user.id, note, week_label: `Week of ${weekLabel}` });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["founder-notes"] });
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });

  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <StickyNote className="w-4.5 h-4.5 text-civic-yellow" /> Founder Notes
      </h3>
      <div className="flex gap-2 mb-4">
        <Textarea
          placeholder="Log an observation, decision, or insight..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[60px] text-sm"
        />
        <Button
          size="sm"
          onClick={() => addNote.mutate()}
          disabled={!note.trim() || addNote.isPending}
          className="self-end"
        >
          {addNote.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {notes.map((n) => (
          <div key={n.id} className="p-2.5 bg-muted/30 rounded-xl border border-border/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-muted-foreground">{n.week_label}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{n.note}</p>
          </div>
        ))}
        {!isLoading && notes.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No notes yet — start logging your observations</p>
        )}
      </div>
    </div>
  );
}
