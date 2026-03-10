import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Target, Plus, Loader2, CheckCircle2, Circle,
  Sparkles, Pencil, Trash2, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartGoalsSectionProps {
  trackId: string;
  userId: string;
  targetRole: string;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", icon: Circle, color: "text-muted-foreground" },
  { value: "in_progress", label: "In Progress", icon: Loader2, color: "text-primary" },
  { value: "completed", label: "Done", icon: CheckCircle2, color: "text-[hsl(var(--civic-green))]" },
];

export function SmartGoalsSection({ trackId, userId, targetRole }: SmartGoalsSectionProps) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["smart-goals", trackId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("career_smart_goals")
        .select("*")
        .eq("track_id", trackId)
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const addGoal = useMutation({
    mutationFn: async ({ title, description, isAi = false }: { title: string; description?: string; isAi?: boolean }) => {
      const { error } = await (supabase as any)
        .from("career_smart_goals")
        .insert({
          user_id: userId,
          track_id: trackId,
          title,
          description: description || null,
          is_ai_generated: isAi,
          sort_order: (goals?.length || 0),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-goals", trackId] });
      setNewTitle("");
      setNewDescription("");
      setShowAdd(false);
    },
    onError: () => toast.error("Failed to add goal"),
  });

  const updateGoalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("career_smart_goals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smart-goals", trackId] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("career_smart_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-goals", trackId] });
      toast.success("Goal removed");
    },
  });

  const generateGoals = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-smart-goals", {
        body: { track_id: trackId, target_role: targetRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["smart-goals", trackId] });
      toast.success("AI generated SMART goals for this path!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate goals");
    } finally {
      setGenerating(false);
    }
  };

  const completedCount = (goals || []).filter((g: any) => g.status === "completed").length;
  const totalCount = (goals || []).length;

  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
          <p className="text-sm font-semibold text-foreground font-display">SMART Goals</p>
          {totalCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {completedCount}/{totalCount} done
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={generateGoals}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Suggest
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading goals...</p>
      ) : (goals || []).length === 0 ? (
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            No goals yet. Click <strong>AI Suggest</strong> to generate SMART goals, or add your own.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(goals || []).map((goal: any) => {
            const statusConfig = STATUS_OPTIONS.find(s => s.value === goal.status) || STATUS_OPTIONS[0];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={goal.id}
                className={cn(
                  "flex items-start gap-2 p-3 rounded-lg border transition-all",
                  goal.status === "completed"
                    ? "bg-[hsl(var(--civic-green))]/5 border-[hsl(var(--civic-green))]/20"
                    : "bg-card border-border/50 hover:border-border"
                )}
              >
                {/* Status toggle */}
                <button
                  onClick={() => {
                    const nextStatus = goal.status === "not_started"
                      ? "in_progress"
                      : goal.status === "in_progress"
                      ? "completed"
                      : "not_started";
                    updateGoalStatus.mutate({ id: goal.id, status: nextStatus });
                  }}
                  className={cn("mt-0.5 shrink-0", statusConfig.color)}
                >
                  <StatusIcon className={cn("w-4 h-4", goal.status === "in_progress" && "animate-spin")} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    goal.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {goal.is_ai_generated && (
                      <span className="text-[9px] text-primary/60 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI suggested
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground capitalize">{statusConfig.label}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteGoal.mutate(goal.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add goal form */}
      {showAdd && (
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
          <Input
            placeholder="Goal title (e.g., Complete AWS certification)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Details (optional) — What makes this SMART? Specific, Measurable, Achievable, Relevant, Time-bound"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!newTitle.trim()}
              onClick={() => addGoal.mutate({ title: newTitle, description: newDescription })}
            >
              Add Goal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
