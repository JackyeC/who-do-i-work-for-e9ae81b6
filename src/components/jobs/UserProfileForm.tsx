import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
  const { data: latestResume, refetch: refetchResume } = useQuery({
    queryKey: ["latest-resume-profile", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_documents")
        .select("id, file_path, original_filename, created_at")
        .eq("user_id", user!.id)
        .eq("document_type", "resume")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      // Get parsed skills count from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user!.id)
        .single();
      return data ? { ...data, parsed_skills_count: (profile as any)?.skills?.length || 0 } : null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("career_docs").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: doc, error: docError } = await supabase
        .from("user_documents")
        .insert({
          user_id: user.id,
          document_type: "resume",
          file_path: filePath,
          original_filename: file.name,
        })
        .select()
        .single();

      if (docError) throw docError;

      const { data: parseData, error: parseError } = await supabase.functions.invoke("parse-career-document", {
        body: { documentId: doc.id },
      });

      if (parseError) throw parseError;

      const parsed = parseData?.parsed;
      if (parsed) {
        setForm((f) => ({
          ...f,
          full_name: parsed.full_name || f.full_name,
          bio: parsed.professional_bio || f.bio,
          linkedin_url: parsed.linkedin_url || f.linkedin_url,
          skills: parsed.skills || f.skills,
          target_job_titles: (parsed.job_titles || []).join(", ") || f.target_job_titles,
        }));
      }

      toast({ title: "Resume parsed successfully", description: "Profile fields have been auto-filled" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
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
        {/* Resume Upload + Status */}
        <div className="space-y-3">
          <Label>Resume</Label>
          {latestResume ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{latestResume.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(latestResume.created_at).toLocaleDateString()}
                      {latestResume.parsed_skills_count != null && ` • ${latestResume.parsed_skills_count} skills extracted`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 text-xs">
                  Ready for Quick Apply
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={uploading}
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                <Upload className="w-3 h-3" />
                Replace Resume
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploading}
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Resume
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX • Max 20MB</p>
            </div>
          )}
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="w-3 h-3" />
            AI will extract your skills, experience, and job titles automatically
          </p>
        </div>
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
