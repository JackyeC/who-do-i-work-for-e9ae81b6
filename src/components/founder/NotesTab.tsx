import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUGGESTED_TAGS = ["product", "legal", "trust", "ux", "data", "press", "bug", "pricing"];

export function NotesTab() {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["founder-notes-full"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("founder_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as {
        id: string;
        note: string;
        week_label: string | null;
        created_at: string;
      }[];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const tagPrefix = selectedTag ? `[${selectedTag}] ` : "";
      const titlePrefix = title.trim() ? `${title.trim()}: ` : "";
      const fullNote = `${tagPrefix}${titlePrefix}${note.trim()}`;
      const weekLabel = new Date().toISOString().split("T")[0];
      const { error } = await (supabase as any)
        .from("founder_notes")
        .insert({ user_id: user.id, note: fullNote, week_label: `Week of ${weekLabel}` });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      setTitle("");
      setSelectedTag("");
      qc.invalidateQueries({ queryKey: ["founder-notes-full"] });
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });

  const filteredNotes = searchQuery
    ? notes.filter((n) => n.note.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  // Extract tag from note text if it starts with [tag]
  const parseTag = (text: string) => {
    const match = text.match(/^\[(\w+)\]\s*/);
    return match ? { tag: match[1], rest: text.slice(match[0].length) } : { tag: null, rest: text };
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-civic-yellow" /> New Note
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Log an observation, decision, or insight..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          {/* Tag selector */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-mono transition-colors border",
                  selectedTag === tag
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => addNote.mutate()}
            disabled={!note.trim() || addNote.isPending}
            className="gap-1.5"
          >
            {addNote.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Save Note
          </Button>
        </div>
      </div>

      {/* Search + Notes list */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-muted-foreground" /> Recent Notes
          </h3>
          <div className="flex-1" />
          <div className="relative max-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : filteredNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4">
            {searchQuery ? "No notes match your search." : "No notes yet — start logging your observations."}
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredNotes.map((n) => {
              const { tag, rest } = parseTag(n.note);
              return (
                <div key={n.id} className="p-3 bg-muted/20 rounded-xl border border-border/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {tag && (
                        <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">{tag}</Badge>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">{n.week_label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{rest}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
