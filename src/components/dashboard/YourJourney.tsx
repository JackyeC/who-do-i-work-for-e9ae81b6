import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STAGES = [
  { key: "saved", label: "Saved", note: "Ready when you are", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted-foreground) / 0.12)" },
  { key: "applied", label: "Applied", note: "You showed up", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { key: "screening", label: "Screening", note: "They're looking", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { key: "interview", label: "Interview", note: "You got this", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.12)" },
  { key: "offer", label: "Offer", note: "Coming soon", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
] as const;

type StageCounts = Record<string, number>;

const STATUS_MAP: Record<string, string> = {
  saved: "saved",
  applied: "applied",
  screening: "screening",
  interview: "interviewing",
  offer: "offer",
};

interface YourJourneyProps {
  onNavigate?: (tab: string) => void;
}

export function YourJourney({ onNavigate }: YourJourneyProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApp, setNewApp] = useState({ company: "", role: "", status: "applied", notes: "" });
  const [saving, setSaving] = useState(false);

  const { data: counts = {} } = useQuery<StageCounts>({
    queryKey: ["journey-stages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications_tracker")
        .select("status")
        .eq("user_id", user!.id);

      const result: StageCounts = {};
      for (const stage of STAGES) {
        const matchStatuses = [stage.key, STATUS_MAP[stage.key]].filter(Boolean);
        result[stage.key] = (data ?? []).filter((d) =>
          matchStatuses.includes(d.status?.toLowerCase())
        ).length;
      }
      return result;
    },
    enabled: !!user,
  });

  const handleStageClick = (stageKey: string) => {
    if (onNavigate) {
      onNavigate("app-tracker");
    }
  };

  const addApplication = async () => {
    if (!newApp.company || !newApp.role || !user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("applications_tracker")
        .insert({
          user_id: user.id,
          company_name: newApp.company,
          company_id: crypto.randomUUID(),
          job_title: newApp.role,
          status: newApp.status === "interview" ? "interviewing" : newApp.status,
          notes: newApp.notes || null,
          applied_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast.success("Application added!");
      setNewApp({ company: "", role: "", status: "applied", notes: "" });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["journey-stages"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to add application");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-2xl p-6 bg-card border border-border/30">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-foreground">Your Journey</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={newApp.company}
                    onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))}
                    placeholder="e.g. Meridian Health"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={newApp.role}
                    onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))}
                    placeholder="e.g. Product Manager"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={newApp.status} onValueChange={(v) => setNewApp((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newApp.notes}
                    onChange={(e) => setNewApp((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button onClick={addApplication} className="w-full" disabled={saving || !newApp.company || !newApp.role}>
                  {saving ? "Adding..." : "Add to Journey"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-start justify-between relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-5 right-5 h-px bg-border/40"
            style={{ zIndex: 0 }}
          />

          {STAGES.map((stage) => {
            const count = counts[stage.key] ?? 0;
            const hasCount = count > 0;

            return (
              <button
                key={stage.key}
                onClick={() => handleStageClick(stage.key)}
                className="flex flex-col items-center text-center relative z-10 group cursor-pointer"
                style={{ flex: 1 }}
                title={`View ${stage.label} applications`}
              >
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                  style={{
                    backgroundColor: hasCount ? stage.bg : "hsl(var(--muted) / 0.5)",
                    color: hasCount ? stage.color : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${hasCount ? stage.color : "hsl(var(--border))"}`,
                  }}
                >
                  {count}
                </div>

                {/* Label */}
                <span
                  className="text-xs font-semibold mt-2 transition-colors group-hover:text-foreground"
                  style={{ color: hasCount ? stage.color : "hsl(var(--muted-foreground))" }}
                >
                  {stage.label}
                </span>

                {/* Encouraging note */}
                <span className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                  {stage.note}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
