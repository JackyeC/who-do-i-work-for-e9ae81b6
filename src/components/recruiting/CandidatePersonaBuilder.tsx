import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, X, Sparkles, Target, AlertTriangle, Heart, Briefcase } from "lucide-react";

const CAREER_STAGES = ["Entry Level", "Mid-Career", "Senior", "Executive", "Career Changer"];
const MOTIVATORS = ["Autonomy", "Meaningful Work", "Compensation", "Growth", "Stability", "Innovation", "Social Impact", "Work-Life Balance"];
const VALUES_OPTIONS = ["Transparency", "Environmental Responsibility", "Diversity & Inclusion", "Worker Rights", "Corporate Governance", "Pay Equity", "AI Ethics", "Community Investment"];
const RISK_SIGNALS = ["Political Misalignment", "AI Hiring Bias", "Layoff History", "DEI Rollbacks", "Pay Inequity", "Union Busting", "Dark Money Ties", "Environmental Violations"];

interface Persona {
  id: string;
  title: string;
  skills: string[];
  careerStage: string;
  motivators: string[];
  values: string[];
  riskSignals: string[];
  notes: string;
}

export function CandidatePersonaBuilder() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [newSkill, setNewSkill] = useState("");

  const createNew = () => {
    const p: Persona = {
      id: crypto.randomUUID(),
      title: "",
      skills: [],
      careerStage: "",
      motivators: [],
      values: [],
      riskSignals: [],
      notes: "",
    };
    setEditing(p);
  };

  const addSkill = () => {
    if (newSkill.trim() && editing) {
      setEditing({ ...editing, skills: [...editing.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const toggleItem = (field: "motivators" | "values" | "riskSignals", item: string) => {
    if (!editing) return;
    const list = editing[field];
    setEditing({
      ...editing,
      [field]: list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    });
  };

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    setPersonas((prev) => {
      const idx = prev.findIndex((p) => p.id === editing.id);
      if (idx >= 0) return prev.map((p, i) => (i === idx ? editing : p));
      return [...prev, editing];
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Candidate Persona Builder</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define ideal candidate profiles based on skills, values, and motivations
          </p>
        </div>
        <Button onClick={createNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Persona
        </Button>
      </div>

      {editing && (
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg">
              {editing.title || "New Persona"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Persona Title</label>
              <Input
                placeholder="e.g. Mission-driven Engineer"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>

            {/* Career Stage */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Career Stage</label>
              <Select value={editing.careerStage} onValueChange={(v) => setEditing({ ...editing, careerStage: v })}>
                <SelectTrigger><SelectValue placeholder="Select career stage" /></SelectTrigger>
                <SelectContent>
                  {CAREER_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Key Skills</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button variant="outline" size="sm" onClick={addSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setEditing({ ...editing, skills: editing.skills.filter((x) => x !== s) })}>
                    {s} <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Motivators */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Motivators
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOTIVATORS.map((m) => (
                  <Badge
                    key={m}
                    variant={editing.motivators.includes(m) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleItem("motivators", m)}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Values */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-primary" /> Values Alignment
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VALUES_OPTIONS.map((v) => (
                  <Badge
                    key={v}
                    variant={editing.values.includes(v) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleItem("values", v)}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk Signals */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Potential Risk Signals
              </label>
              <p className="text-xs text-muted-foreground mb-2">Employer behaviors that would concern this candidate</p>
              <div className="flex flex-wrap gap-1.5">
                {RISK_SIGNALS.map((r) => (
                  <Badge
                    key={r}
                    variant={editing.riskSignals.includes(r) ? "destructive" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleItem("riskSignals", r)}
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Notes</label>
              <Textarea
                placeholder="Context about this persona..."
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={save}>Save Persona</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Personas */}
      {personas.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {personas.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {p.title}
                    </h3>
                    {p.careerStage && (
                      <Badge variant="secondary" className="mt-1 text-xs">{p.careerStage}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ ...p })}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPersonas((prev) => prev.filter((x) => x.id !== p.id))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {p.skills.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {p.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {p.motivators.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Motivators</p>
                    <div className="flex flex-wrap gap-1">
                      {p.motivators.map((m) => <Badge key={m} className="text-xs bg-primary/10 text-primary border-primary/20">{m}</Badge>)}
                    </div>
                  </div>
                )}

                {p.values.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Values</p>
                    <div className="flex flex-wrap gap-1">
                      {p.values.map((v) => <Badge key={v} className="text-xs bg-accent text-accent-foreground">{v}</Badge>)}
                    </div>
                  </div>
                )}

                {p.riskSignals.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Risk Signals</p>
                    <div className="flex flex-wrap gap-1">
                      {p.riskSignals.map((r) => <Badge key={r} variant="destructive" className="text-xs">{r}</Badge>)}
                    </div>
                  </div>
                )}

                {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !editing && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No personas yet. Create your first candidate persona to define the ideal talent profile.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
