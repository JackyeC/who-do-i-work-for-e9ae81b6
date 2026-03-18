import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Circle, GraduationCap, Users, Building2, Wrench,
  Plus, Trash2, Sparkles, TrendingUp, ExternalLink, BookOpen, Award,
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

/** Generate a learning search URL based on item text and type */
function getLearningUrl(text: string, type: string): string | null {
  if (type === "connect" || type === "company") return null;

  // Extract key skill/topic from the text
  const cleaned = text
    .replace(/^(Master|Learn|Complete|Build|Obtain|Gain|Develop|Improve|Study|Enroll in|Take)\s+/i, "")
    .replace(/\s+(course|certification|certificate|class|training|experience|skills?)\s*$/i, "")
    .trim();

  const query = encodeURIComponent(cleaned);

  // Route to most relevant platform by type
  if (type === "course") {
    return `https://www.coursera.org/search?query=${query}`;
  }
  if (type === "skill") {
    return `https://www.linkedin.com/learning/search?keywords=${query}`;
  }
  // project and general
  return `https://www.coursera.org/search?query=${query}`;
}

const SPONSORED_RESOURCES = [
  {
    title: "Google Career Certificates",
    description: "Professional certificates in Data Analytics, IT Support, UX Design, and more — no degree required.",
    url: "https://grow.google/certificates/",
    platform: "Google",
    free: false,
    tag: "Popular",
  },
  {
    title: "LinkedIn Learning Free Courses",
    description: "Build in-demand skills with free courses in business, tech, and creative fields.",
    url: "https://www.linkedin.com/learning/",
    platform: "LinkedIn",
    free: true,
    tag: "Free Trial",
  },
  {
    title: "Coursera for Government & Policy",
    description: "University-level courses in public policy, law, and government from top institutions.",
    url: "https://www.coursera.org/browse/social-sciences/governance-and-society",
    platform: "Coursera",
    free: false,
    tag: "University",
  },
  {
    title: "freeCodeCamp",
    description: "Learn to code for free with thousands of hours of tutorials, projects, and certifications.",
    url: "https://www.freecodecamp.org/",
    platform: "freeCodeCamp",
    free: true,
    tag: "Free",
  },
  {
    title: "edX Professional Certificates",
    description: "Career-focused programs from Harvard, MIT, and industry leaders.",
    url: "https://www.edx.org/certificates/professional-certificate",
    platform: "edX",
    free: false,
    tag: "Certificates",
  },
];

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  { text: "Update your resume with recent accomplishments", type: "project", completed: false },
  { text: "Research 3 companies that match your values", type: "company", completed: false },
  { text: "Complete a skills assessment for your target role", type: "skill", completed: false },
  { text: "Enroll in one course to close your biggest skill gap", type: "course", completed: false },
  { text: "Reach out to 2 people in your target industry", type: "connect", completed: false },
  { text: "Run Career Discovery to map your career paths", type: "project", completed: false },
  { text: "Review 5 company civic footprint scores", type: "company", completed: false },
  { text: "Set up job alerts for your target roles", type: "skill", completed: false },
  { text: "Practice answering 'Why this company?' for your top pick", type: "project", completed: false },
  { text: "Upload your LinkedIn connections to find warm intros", type: "connect", completed: false },
];

export function CareerChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<ChecklistItem["type"]>("skill");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("career_smart_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        setItems(data.map(g => ({
          id: g.id,
          text: g.title,
          type: (g.specific as ChecklistItem["type"]) || "skill",
          completed: g.status === "done",
        })));
        setLoading(false);
      } else {
        const rows = DEFAULT_CHECKLIST.map((item, i) => ({
          user_id: user.id,
          title: item.text,
          specific: item.type,
          status: "active" as const,
          sort_order: i,
        }));
        const { data: inserted } = await supabase.from("career_smart_goals").insert(rows).select();
        if (inserted) {
          setItems(inserted.map(g => ({
            id: g.id,
            text: g.title,
            type: (g.specific as ChecklistItem["type"]) || "skill",
            completed: false,
          })));
        }
        setLoading(false);
      }
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
            const learningUrl = getLearningUrl(item.text, item.type);
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
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm",
                    item.completed ? "line-through text-muted-foreground" : "text-foreground"
                  )}>
                    {item.text}
                  </span>
                  {learningUrl && (
                    <a
                      href={learningUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 ml-2 text-xs text-primary hover:text-primary/80 transition font-medium"
                    >
                      <BookOpen className="w-3 h-3" />
                      Find courses
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
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

      {/* Sponsored Learning Resources */}
      <Card className="border-[hsl(var(--civic-gold))]/20 bg-[hsl(var(--civic-gold))]/[0.03]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
            <h3 className="text-sm font-bold text-foreground">Recommended Learning Resources</h3>
            <Badge variant="outline" className="text-[9px] ml-auto border-[hsl(var(--civic-gold))]/30 text-[hsl(var(--civic-gold))]">
              Curated
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Free and affordable platforms to build the skills you need. We earn nothing from these links — they're here because they work.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {SPONSORED_RESOURCES.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition flex-1">
                    {resource.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] shrink-0",
                      resource.free
                        ? "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {resource.tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {resource.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
                  <span>{resource.platform}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
