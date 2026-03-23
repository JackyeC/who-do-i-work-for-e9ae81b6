import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Briefcase, Users, Gift, GripVertical, Building2, Calendar, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Status = "researching" | "applied" | "interviewing" | "offer_rejected";

interface TrackerApp {
  id: string;
  company: string;
  role: string;
  status: Status;
  appliedDate: string;
  integrityScore: number;
  notes: string;
}

const INITIAL_APPS: TrackerApp[] = [
  { id: "1", company: "Patagonia", role: "Senior Product Manager", status: "researching", appliedDate: "Mar 14, 2026", integrityScore: 92, notes: "Strong mission alignment — B Corp certified" },
  { id: "2", company: "Khan Academy", role: "Curriculum Designer", status: "applied", appliedDate: "Mar 16, 2026", integrityScore: 96, notes: "Non-profit, education-first culture" },
  { id: "3", company: "Costco", role: "Regional Operations Lead", status: "applied", appliedDate: "Mar 12, 2026", integrityScore: 84, notes: "Above-industry wages, low turnover" },
];

const COLUMNS: { status: Status; label: string; icon: typeof Briefcase; accent: string }[] = [
  { status: "researching", label: "Researching", icon: Shield, accent: "text-[hsl(var(--civic-blue))]" },
  { status: "applied", label: "Applied", icon: Briefcase, accent: "text-primary" },
  { status: "interviewing", label: "Interviewing", icon: Users, accent: "text-[hsl(var(--civic-gold))]" },
  { status: "offer_rejected", label: "Offer / Rejected", icon: Gift, accent: "text-[hsl(var(--civic-green))]" },
];

function IntegrityDot({ score }: { score: number }) {
  const color = score >= 85
    ? "bg-[hsl(var(--civic-green))]"
    : score >= 65
      ? "bg-[hsl(var(--civic-gold))]"
      : "bg-[hsl(var(--civic-red))]";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      {score}
    </span>
  );
}

export default function Tracker() {
  const [apps, setApps] = useState<TrackerApp[]>(INITIAL_APPS);
  const [modalOpen, setModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", role: "", date: "", notes: "", score: "" });

  const counts = {
    total: apps.length,
    interviewing: apps.filter(a => a.status === "interviewing").length,
    offer: apps.filter(a => a.status === "offer_rejected").length,
  };

  const handleAdd = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    const app: TrackerApp = {
      id: crypto.randomUUID(),
      company: form.company.trim(),
      role: form.role.trim(),
      status: "researching",
      appliedDate: form.date
        ? new Date(form.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      integrityScore: form.score ? Math.min(100, Math.max(0, parseInt(form.score))) : 0,
      notes: form.notes.trim(),
    };
    setApps(prev => [app, ...prev]);
    setForm({ company: "", role: "", date: "", notes: "", score: "" });
    setModalOpen(false);
    toast.success("Application added to tracker");
  };

  const handleDrop = (status: Status) => {
    if (!draggedId) return;
    setApps(prev => prev.map(a => a.id === draggedId ? { ...a, status } : a));
    setDraggedId(null);
  };

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  return (
    <>
      <Helmet><title>My Application Tracker — WDIWF</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
              My Application Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every application. One place.
            </p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Company</Label>
                  <Input placeholder="e.g. Patagonia" value={form.company} onChange={e => update("company", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input placeholder="e.g. Product Manager" value={form.role} onChange={e => update("role", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Date Applied</Label>
                  <Input type="date" value={form.date} onChange={e => update("date", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Integrity Score (0–100)</Label>
                  <Input type="number" min={0} max={100} placeholder="e.g. 85" value={form.score} onChange={e => update("score", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Optional notes..." value={form.notes} onChange={e => update("notes", e.target.value)} className="mt-1" rows={3} />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!form.company.trim() || !form.role.trim()}>
                  Add to Researching
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: "Total Applications", value: counts.total, icon: Briefcase, accent: "text-foreground" },
            { label: "Active Interviews", value: counts.interviewing, icon: Users, accent: "text-[hsl(var(--civic-gold))]" },
            { label: "Offers Received", value: counts.offer, icon: Gift, accent: "text-[hsl(var(--civic-green))]" },
          ].map(s => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-5 h-5", s.accent)} />
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Kanban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col, ci) => {
            const colApps = apps.filter(a => a.status === col.status);
            return (
              <motion.div
                key={col.status}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-border/40 bg-card/50 p-3 min-h-[320px]"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(col.status)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <col.icon className={cn("w-4 h-4", col.accent)} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                    {colApps.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {colApps.map(app => (
                    <Card
                      key={app.id}
                      draggable
                      onDragStart={() => setDraggedId(app.id)}
                      className={cn(
                        "cursor-grab active:cursor-grabbing border-border/40 hover:border-border transition-colors",
                        draggedId === app.id && "opacity-50"
                      )}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{app.role}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" /> {app.company}
                            </p>
                          </div>
                          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        </div>
                        {app.notes && (
                          <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">{app.notes}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {app.appliedDate}
                          </span>
                          {app.integrityScore > 0 && <IntegrityDot score={app.integrityScore} />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colApps.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center py-8">No applications here yet</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
