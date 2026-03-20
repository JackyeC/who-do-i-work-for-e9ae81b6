import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, Briefcase, MessageSquare, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TrackedApp {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  integrityScore: number;
  status: "applied" | "interviewing" | "offer" | "archived";
  notes: string;
}

const COLUMNS: { key: TrackedApp["status"]; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { key: "interviewing", label: "Interviewing", color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  { key: "offer", label: "Offer", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { key: "archived", label: "Archived", color: "bg-muted text-muted-foreground border-border/30" },
];

const INITIAL_APPS: TrackedApp[] = [
  { id: "1", company: "Meridian Health Systems", role: "People Operations Manager", appliedDate: "Mar 15, 2026", integrityScore: 82, status: "interviewing", notes: "Phone screen scheduled for Mar 22" },
  { id: "2", company: "Lighthouse Education Partners", role: "Curriculum Design Lead", appliedDate: "Mar 12, 2026", integrityScore: 88, status: "applied", notes: "" },
  { id: "3", company: "Canopy Financial Group", role: "Senior Data Analyst", appliedDate: "Mar 10, 2026", integrityScore: 74, status: "offer", notes: "Offer letter received — reviewing with WDIWF dossier" },
  { id: "4", company: "Bloom Urban Agriculture", role: "Operations Manager", appliedDate: "Mar 8, 2026", integrityScore: 85, status: "applied", notes: "" },
  { id: "5", company: "TerraForge Manufacturing", role: "Sustainability Director", appliedDate: "Mar 5, 2026", integrityScore: 68, status: "archived", notes: "Passed — narrative gap concerns" },
];

function getScoreBadge(score: number) {
  if (score >= 70) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export function TrackerSection() {
  const [apps, setApps] = useState<TrackedApp[]>(INITIAL_APPS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApp, setNewApp] = useState({ company: "", role: "", date: "", notes: "" });

  const counts = {
    total: apps.length,
    interviews: apps.filter((a) => a.status === "interviewing").length,
    offers: apps.filter((a) => a.status === "offer").length,
  };

  const addApp = () => {
    if (!newApp.company || !newApp.role) return;
    setApps((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        company: newApp.company,
        role: newApp.role,
        appliedDate: newApp.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        integrityScore: 0,
        status: "applied",
        notes: newApp.notes,
      },
    ]);
    setNewApp({ company: "", role: "", date: "", notes: "" });
    setDialogOpen(false);
    toast.success("Application added to tracker");
  };

  return (
    <div className="space-y-6">
      {/* Motto */}
      <div className="text-center py-3">
        <p className="text-sm text-muted-foreground italic">"Quality over quantity. Every application here was worth sending."</p>
      </div>

      {/* Scorecard */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: counts.total, icon: Briefcase, color: "text-primary" },
          { label: "Active Interviews", value: counts.interviews, icon: MessageSquare, color: "text-amber-400" },
          { label: "Offers Received", value: counts.offers, icon: Trophy, color: "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-4 text-center">
            <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
            <p className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Add Application</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Application</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Company</Label><Input value={newApp.company} onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Meridian Health" className="mt-1" /></div>
              <div><Label>Role</Label><Input value={newApp.role} onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Product Manager" className="mt-1" /></div>
              <div><Label>Date Applied</Label><Input type="date" value={newApp.date} onChange={(e) => setNewApp((p) => ({ ...p, date: e.target.value }))} className="mt-1" /></div>
              <div><Label>Notes</Label><Textarea value={newApp.notes} onChange={(e) => setNewApp((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." className="mt-1" rows={3} /></div>
              <Button onClick={addApp} className="w-full">Add to Tracker</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] font-mono", col.color)}>{col.label}</Badge>
                <span className="text-xs text-muted-foreground">{colApps.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {colApps.map((app) => (
                  <div key={app.id} className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{app.role}</p>
                        <p className="text-xs text-muted-foreground">{app.company}</p>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{app.appliedDate}</span>
                      {app.integrityScore > 0 && (
                        <Badge variant="outline" className={cn("text-[9px] font-mono", getScoreBadge(app.integrityScore))}>
                          {app.integrityScore}
                        </Badge>
                      )}
                    </div>
                    {app.notes && <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{app.notes}</p>}
                  </div>
                ))}
                {colApps.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground/50">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
