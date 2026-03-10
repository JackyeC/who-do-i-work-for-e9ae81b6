import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Circle, GraduationCap, Users, Building2, Wrench,
  Plus, Trash2, Sparkles, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  text: string;
  type: "skill" | "course" | "connect" | "company" | "project";
  completed: boolean;
}

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  skill: { icon: Wrench, color: "text-primary", label: "Skill" },
  course: { icon: GraduationCap, color: "text-[hsl(var(--civic-gold))]", label: "Course" },
  connect: { icon: Users, color: "text-[hsl(var(--civic-blue))]", label: "Network" },
  company: { icon: Building2, color: "text-[hsl(var(--civic-green))]", label: "Company" },
  project: { icon: Sparkles, color: "text-accent", label: "Project" },
};

export function CareerChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<ChecklistItem["type"]>("skill");
  const [loading, setLoading] = useState(true);

  // Load from SMART goals table (reuse existing infra)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("career_smart_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (data) {
        setItems(data.map(g => ({
          id: g.id,
          text: g.title,
          type: (g.specific as ChecklistItem["type"]) || "skill",
          completed: g.status === "done",
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStatus = item.completed ? "active" : "done";
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    await supabase.from("career_smart_goals").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const addItem = async () => {
    if (!newText.trim() || !user) return;
    const { data, error } = await supabase.from("career_smart_goals").insert({
      user_id: user.id,
      title: newText.trim(),
      specific: newType,
      status: "active",
      sort_order: items.length,
    }).select().single();

    if (data) {
      setItems(prev => [...prev, { id: data.id, text: data.title, type: newType, completed: false }]);
      setNewText("");
      toast.success("Added to your checklist!");
    }
  };

  const removeItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("career_smart_goals").delete().eq("id", id);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading your checklist...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Career Progress
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedCount} of {items.length} milestones completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-primary">{progress}%</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Add New Item */}
      <div className="flex gap-2">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as ChecklistItem["type"])}
          className="rounded-md border border-input bg-background px-3 py-2 text-xs"
        >
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <Input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a milestone..."
          className="text-sm"
          onKeyDown={e => e.key === "Enter" && addItem()}
        />
        <Button size="sm" onClick={addItem} className="gap-1 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* Checklist Items */}
      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete the Career Discovery flow to auto-generate your checklist, or add items manually above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const meta = TYPE_META[item.type] || TYPE_META.skill;
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                  item.completed ? "bg-muted/30 border-border" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <button onClick={() => toggleItem(item.id)} className="shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--civic-green))]" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-primary transition" />
                  )}
                </button>
                <Icon className={cn("w-4 h-4 shrink-0", meta.color)} />
                <span className={cn(
                  "flex-1 text-sm",
                  item.completed ? "line-through text-muted-foreground" : "text-foreground"
                )}>
                  {item.text}
                </span>
                <Badge variant="outline" className="text-[10px] shrink-0">{meta.label}</Badge>
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
