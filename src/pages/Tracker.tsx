import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Briefcase, Users, Gift, Archive, GripVertical, Building2, Shield, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Status = "applied" | "interviewing" | "offer" | "archived";

interface TrackerApp {
  id: string;
  company: string;
  role: string;
  status: Status;
  appliedDate: string;
  integrityScore: number;
  notes?: string;
}

const INITIAL_APPS: TrackerApp[] = [
  { id: "1", company: "Patagonia", role: "Senior Product Manager", status: "interviewing", appliedDate: "Mar 12", integrityScore: 92 },
  { id: "2", company: "Khan Academy", role: "Curriculum Designer", status: "applied", appliedDate: "Mar 14", integrityScore: 96 },
  { id: "3", company: "Salesforce", role: "ML Engineer — Responsible AI", status: "applied", appliedDate: "Mar 10", integrityScore: 78 },
  { id: "4", company: "Mercy Corps", role: "Program Officer", status: "offer", appliedDate: "Feb 28", integrityScore: 85 },
  { id: "5", company: "Stripe", role: "Product Analytics Lead", status: "interviewing", appliedDate: "Mar 8", integrityScore: 88 },
  { id: "6", company: "Mozilla", role: "Staff Engineer — Privacy", status: "archived", appliedDate: "Feb 15", integrityScore: 91 },
  { id: "7", company: "Warby Parker", role: "Brand Strategist", status: "applied", appliedDate: "Mar 16", integrityScore: 83 },
];

const COLUMNS: { status: Status; label: string; icon: typeof Briefcase; color: string }[] = [
  { status: "applied", label: "Applied", icon: Briefcase, color: "text-blue-500" },
  { status: "interviewing", label: "Interviewing", icon: Users, color: "text-amber-500" },
  { status: "offer", label: "Offer", icon: Gift, color: "text-emerald-500" },
  { status: "archived", label: "Archived", icon: Archive, color: "text-muted-foreground" },
];

function IntegrityDot({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-500" : score >= 65 ? "bg-amber-500" : "bg-red-500";
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
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  usePageSEO({
    title: "Application Tracker — WDIWF",
    description: "Track your job applications from applied to offer with integrity scores.",
    path: "/tracker",
  });

  const counts = {
    applied: apps.filter(a => a.status === "applied").length,
    interviewing: apps.filter(a => a.status === "interviewing").length,
    offer: apps.filter(a => a.status === "offer").length,
    total: apps.length,
  };

  const handleAdd = () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    const app: TrackerApp = {
      id: crypto.randomUUID(),
      company: newCompany.trim(),
      role: newRole.trim(),
      status: "applied",
      appliedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      integrityScore: Math.floor(Math.random() * 30 + 65),
    };
    setApps(prev => [app, ...prev]);
    setNewCompany("");
    setNewRole("");
    setModalOpen(false);
  };

  const handleDrop = (status: Status) => {
    if (!draggedId) return;
    setApps(prev => prev.map(a => a.id === draggedId ? { ...a, status } : a));
    setDraggedId(null);
  };

  return (
    <>
      <Helmet><title>Application Tracker — WDIWF</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Application Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Drag cards between columns to update status.</p>
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
                <Input placeholder="Company name" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
                <Input placeholder="Role / Job title" value={newRole} onChange={e => setNewRole(e.target.value)} />
                <Button onClick={handleAdd} className="w-full">Add to Applied</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Total", value: counts.total, icon: Briefcase, accent: "text-foreground" },
            { label: "Applied", value: counts.applied, icon: Briefcase, accent: "text-blue-500" },
            { label: "Interviews", value: counts.interviewing, icon: Users, accent: "text-amber-500" },
            { label: "Offers", value: counts.offer, icon: Gift, accent: "text-emerald-500" },
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
                transition={{ delay: ci * 0.06, duration: 0.4 }}
                className="rounded-xl border border-border/40 bg-card/50 p-3 min-h-[320px]"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(col.status)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <col.icon className={cn("w-4 h-4", col.color)} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">{colApps.length}</Badge>
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
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {app.appliedDate}
                          </span>
                          <IntegrityDot score={app.integrityScore} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colApps.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center py-8">Drop here</p>
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
