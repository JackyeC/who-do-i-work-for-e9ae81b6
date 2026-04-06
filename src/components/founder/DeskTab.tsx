import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, Eye, Pencil, Trash2, Send, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTIONS = ["draft", "live", "archived"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  c_suite: "C-Suite",
  tech_stack: "AI / Tech",
  paycheck: "Money",
  fine_print: "Policy",
  daily_grind: "Work",
};
const HEAT_COLORS: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-amber-500/20 text-amber-700",
  low: "bg-muted text-muted-foreground",
};

interface SignalStoryRow {
  id: string;
  company_name: string | null;
  category: string;
  signal_type: string;
  headline: string;
  heat_level: string;
  source_name: string | null;
  source_url: string | null;
  receipt: string | null;
  jrc_take: string | null;
  why_it_matters_applicants: string | null;
  why_it_matters_employees: string | null;
  why_it_matters_execs: string | null;
  before_you_say_yes: string | null;
  published_at: string | null;
  status: string;
  created_at: string;
}

export function DeskTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("draft");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<SignalStoryRow>>({});

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["desk-signal-stories", filter],
    queryFn: async () => {
      const q = (supabase as any)
        .from("signal_stories")
        .select("*")
        .eq("status", filter)
        .order("created_at", { ascending: false })
        .limit(100);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SignalStoryRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await (supabase as any)
        .from("signal_stories")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desk-signal-stories"] });
      queryClient.invalidateQueries({ queryKey: ["signal-stories"] });
      toast({ title: "Updated" });
      setEditingId(null);
      setEditFields({});
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("signal_stories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desk-signal-stories"] });
      toast({ title: "Deleted" });
    },
  });

  const triggerDraftRun = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("draft-work-signals");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desk-signal-stories"] });
      toast({ title: "Draft pipeline triggered", description: "New stories being drafted from recent news." });
    },
    onError: (e: any) => toast({ title: "Pipeline error", description: e.message, variant: "destructive" }),
  });

  const publishAll = useMutation({
    mutationFn: async () => {
      const draftIds = stories.filter(s => s.status === "draft").map(s => s.id);
      if (!draftIds.length) return;
      for (const id of draftIds) {
        const { error } = await (supabase as any)
          .from("signal_stories")
          .update({ status: "live", published_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desk-signal-stories"] });
      queryClient.invalidateQueries({ queryKey: ["signal-stories"] });
      toast({ title: "All drafts published" });
    },
  });

  const startEdit = (story: SignalStoryRow) => {
    setEditingId(story.id);
    setEditFields({
      headline: story.headline,
      receipt: story.receipt || "",
      jrc_take: story.jrc_take || "",
      heat_level: story.heat_level,
      category: story.category,
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-muted/30 rounded-md p-0.5">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === s ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => triggerDraftRun.mutate()}
            disabled={triggerDraftRun.isPending}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggerDraftRun.isPending ? "animate-spin" : ""}`} />
            Run Draft Pipeline
          </Button>
          {filter === "draft" && stories.length > 0 && (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => publishAll.mutate()}
              disabled={publishAll.isPending}
            >
              <Send className="w-3.5 h-3.5" />
              Publish All ({stories.length})
            </Button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{stories.length} stories · {filter}</p>

      {/* Stories */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : stories.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No {filter} stories. {filter === "draft" && "Run the draft pipeline to generate new stories."}
        </div>
      ) : (
        <div className="space-y-2">
          {stories.map((story) => {
            const isExpanded = expandedId === story.id;
            const isEditing = editingId === story.id;

            return (
              <div key={story.id} className="border border-border rounded-lg bg-card">
                {/* Header row */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : story.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_LABELS[story.category] || story.category}
                      </Badge>
                      <Badge className={`text-[10px] ${HEAT_COLORS[story.heat_level] || ""}`}>
                        {story.heat_level}
                      </Badge>
                      {story.company_name && (
                        <span className="text-[10px] text-muted-foreground">{story.company_name}</span>
                      )}
                    </div>
                    {isEditing ? (
                      <Input
                        value={editFields.headline || ""}
                        onChange={e => setEditFields(prev => ({ ...prev, headline: e.target.value }))}
                        className="text-sm font-medium"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground line-clamp-2">{story.headline}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {story.source_name} · {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Receipt</label>
                          <Textarea
                            value={editFields.receipt || ""}
                            onChange={e => setEditFields(prev => ({ ...prev, receipt: e.target.value }))}
                            rows={3}
                            className="text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">JRC Take</label>
                          <Textarea
                            value={editFields.jrc_take || ""}
                            onChange={e => setEditFields(prev => ({ ...prev, jrc_take: e.target.value }))}
                            rows={3}
                            className="text-xs mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={editFields.heat_level || "medium"}
                            onValueChange={v => setEditFields(prev => ({ ...prev, heat_level: v }))}
                          >
                            <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={editFields.category || "daily_grind"}
                            onValueChange={v => setEditFields(prev => ({ ...prev, category: v }))}
                          >
                            <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => updateMutation.mutate({
                              id: story.id,
                              updates: editFields,
                            })}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="w-3 h-3 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => { setEditingId(null); setEditFields({}); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {story.receipt && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">THE RECEIPT</p>
                            <p className="text-xs text-foreground">{story.receipt}</p>
                          </div>
                        )}
                        {story.jrc_take && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">JRC TAKE</p>
                            <p className="text-xs text-foreground">{story.jrc_take}</p>
                          </div>
                        )}
                        {story.source_url && (
                          <a href={story.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                            Source →
                          </a>
                        )}
                      </>
                    )}

                    {/* Action buttons */}
                    {!isEditing && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => startEdit(story)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        {story.status === "draft" && (
                          <Button
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => updateMutation.mutate({
                              id: story.id,
                              updates: { status: "live", published_at: new Date().toISOString() },
                            })}
                          >
                            <Eye className="w-3 h-3" /> Publish
                          </Button>
                        )}
                        {story.status === "live" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1"
                            onClick={() => updateMutation.mutate({
                              id: story.id,
                              updates: { status: "archived" },
                            })}
                          >
                            <Eye className="w-3 h-3" /> Archive
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 text-destructive ml-auto"
                          onClick={() => {
                            if (confirm("Delete this story permanently?")) {
                              deleteMutation.mutate(story.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
