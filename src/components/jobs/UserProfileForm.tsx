import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2, Plus, X, Upload, FileText } from "lucide-react";

export function UserProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    resume_url: "",
    linkedin_url: "",
    target_job_titles: "",
    min_salary: "",
    skills: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, bio, resume_url, linkedin_url, target_job_titles, min_salary, skills")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: (data as any).full_name || "",
            bio: data.bio || "",
            resume_url: data.resume_url || "",
            linkedin_url: data.linkedin_url || "",
            target_job_titles: (data.target_job_titles || []).join(", "),
            min_salary: data.min_salary?.toString() || "",
            skills: (data as any).skills || [],
          });
        }
        setLoading(false);
      });
  }, [user]);

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm((f) => ({ ...f, skills: [...f.skills, skill] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const titles = form.target_job_titles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        bio: form.bio || null,
        resume_url: form.resume_url || null,
        linkedin_url: form.linkedin_url || null,
        target_job_titles: titles,
        min_salary: form.min_salary ? parseInt(form.min_salary) : null,
        skills: form.skills,
      } as any)
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Professional Profile
        </CardTitle>
        <CardDescription>
          Your info powers auto-fill when applying to jobs. It's stored securely and never shared without your consent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="Jane Doe"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea
            id="bio"
            placeholder="Brief professional summary..."
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="resume_url">Resume URL</Label>
            <Input
              id="resume_url"
              type="url"
              placeholder="https://drive.google.com/your-resume"
              value={form.resume_url}
              onChange={(e) => setForm((f) => ({ ...f, resume_url: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/you"
              value={form.linkedin_url}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titles">Target Job Titles</Label>
            <Input
              id="titles"
              placeholder="Engineer, Product Manager, Designer"
              value={form.target_job_titles}
              onChange={(e) => setForm((f) => ({ ...f, target_job_titles: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Minimum Salary ($)</Label>
            <Input
              id="salary"
              type="number"
              placeholder="75000"
              value={form.min_salary}
              onChange={(e) => setForm((f) => ({ ...f, min_salary: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button type="button" size="icon" variant="outline" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
}
