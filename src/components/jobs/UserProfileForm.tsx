import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2 } from "lucide-react";

export function UserProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    resume_url: "",
    linkedin_url: "",
    target_job_titles: "",
    min_salary: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("bio, resume_url, linkedin_url, target_job_titles, min_salary")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            bio: data.bio || "",
            resume_url: data.resume_url || "",
            linkedin_url: data.linkedin_url || "",
            target_job_titles: (data.target_job_titles || []).join(", "),
            min_salary: data.min_salary?.toString() || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

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
        bio: form.bio || null,
        resume_url: form.resume_url || null,
        linkedin_url: form.linkedin_url || null,
        target_job_titles: titles,
        min_salary: form.min_salary ? parseInt(form.min_salary) : null,
      })
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
          Your info is stored locally for auto-fill when applying to jobs. It's never shared without your consent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
}
