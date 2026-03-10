import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Briefcase, Wrench, Heart, Sparkles, FileText, Loader2, CheckCircle } from "lucide-react";
import { VALUES_LENSES } from "@/lib/valuesLenses";

const WORK_STYLES = ["Remote", "Hybrid", "In-Office", "Flexible Hours", "Async-First", "Travel-Heavy"];
const LIFESTYLE_PREFS = ["Work-life balance", "High compensation", "Location flexibility", "Short commute", "Sabbatical support", "Family-friendly", "Growth over comfort"];

interface ProfileData {
  jobTitle: string;
  yearsExperience: string;
  industries: string[];
  responsibilities: string;
  technicalSkills: string[];
  softSkills: string[];
  workStyles: string[];
  lifestylePrefs: string[];
  values: string[];
}

interface Props {
  onComplete: (data: ProfileData) => void;
}

export function ProfileInputStep({ onComplete }: Props) {
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState("");
  const [techSkillInput, setTechSkillInput] = useState("");
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [workStyles, setWorkStyles] = useState<string[]>([]);
  const [lifestylePrefs, setLifestylePrefs] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const addTag = (value: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  };

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleResumeSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setResumeFile(selected);
  }, []);

  const handleResumeUpload = async () => {
    if (!resumeFile || !user) return;
    setUploading(true);
    try {
      const ext = resumeFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("career_docs").upload(filePath, resumeFile);
      if (uploadError) throw uploadError;

      const { data: doc, error: insertError } = await supabase
        .from("user_documents")
        .insert({ user_id: user.id, document_type: "resume" as any, file_path: filePath, original_filename: resumeFile.name })
        .select().single();
      if (insertError) throw insertError;

      toast.success("Resume uploaded! Analyzing...");
      const { data: parseResult } = await supabase.functions.invoke("parse-career-document", { body: { documentId: doc.id } });

      // Auto-fill form fields from parsed resume data
      const parsed = parseResult?.parsed;
      if (parsed) {
        if (parsed.job_titles?.length > 0 && !jobTitle) {
          setJobTitle(parsed.job_titles[0]);
        }
        if (parsed.years_experience && !yearsExperience) {
          const yrs = parsed.years_experience;
          if (yrs <= 2) setYearsExperience("0-2");
          else if (yrs <= 5) setYearsExperience("3-5");
          else if (yrs <= 10) setYearsExperience("6-10");
          else if (yrs <= 15) setYearsExperience("11-15");
          else if (yrs <= 20) setYearsExperience("16-20");
          else setYearsExperience("20+");
        }
        if (parsed.industries?.length > 0 && industries.length === 0) {
          setIndustries(parsed.industries);
        }
        if (parsed.skills?.length > 0) {
          const techKeywords = /python|java|sql|react|node|aws|docker|kubernetes|typescript|javascript|html|css|git|api|cloud|data|machine learning|ai|excel|tableau|salesforce|sap|figma|sketch/i;
          const parsedTech: string[] = [];
          const parsedSoft: string[] = [];
          parsed.skills.forEach((s: string) => {
            if (techKeywords.test(s)) parsedTech.push(s);
            else parsedSoft.push(s);
          });
          if (parsedTech.length > 0 && technicalSkills.length === 0) setTechnicalSkills(parsedTech);
          if (parsedSoft.length > 0 && softSkills.length === 0) setSoftSkills(parsedSoft);
        }
        toast.success("Resume parsed — fields auto-filled!");
      } else {
        toast.success("Resume uploaded successfully!");
      }
      setResumeUploaded(true);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    onComplete({
      jobTitle, yearsExperience, industries, responsibilities,
      technicalSkills, softSkills, workStyles, lifestylePrefs, values,
    });
  };

  const isValid = jobTitle && yearsExperience;

  return (
    <div className="space-y-6">
      {/* Resume Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Upload Your Resume
          </CardTitle>
          <p className="text-xs text-muted-foreground">Optional — lets the AI auto-extract your skills and experience.</p>
        </CardHeader>
        <CardContent>
          {resumeUploaded ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="w-4 h-4" /> Resume uploaded and analyzed
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleResumeSelect} className="hidden" id="resume-upload" />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  {resumeFile ? (
                    <p className="text-sm font-medium text-foreground">{resumeFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">Click to select your resume</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT — Max 10MB</p>
                    </>
                  )}
                </label>
              </div>
              {resumeFile && (
                <Button onClick={handleResumeUpload} disabled={uploading} size="sm" className="w-full">
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Analyzing..." : "Upload & Analyze"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Where You Are Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Current Job Title</Label>
              <Input placeholder="e.g. Senior Recruiter" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Years of Experience</Label>
              <Select value={yearsExperience} onValueChange={setYearsExperience}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["0-2", "3-5", "6-10", "11-15", "16-20", "20+"].map(v => (
                    <SelectItem key={v} value={v}>{v} years</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Industries Worked In</Label>
            <div className="flex gap-2">
              <Input placeholder="Type and press Enter" value={industryInput}
                onChange={e => setIndustryInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(industryInput, industries, setIndustries, setIndustryInput))} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {industries.map(i => (
                <Badge key={i} variant="secondary" className="cursor-pointer text-xs" onClick={() => setIndustries(industries.filter(x => x !== i))}>
                  {i} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Key Responsibilities</Label>
            <Textarea placeholder="Describe your main responsibilities..." value={responsibilities} onChange={e => setResponsibilities(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Your Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Technical Skills</Label>
            <Input placeholder="Type and press Enter" value={techSkillInput}
              onChange={e => setTechSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(techSkillInput, technicalSkills, setTechnicalSkills, setTechSkillInput))} />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {technicalSkills.map(s => (
                <Badge key={s} variant="secondary" className="cursor-pointer text-xs" onClick={() => setTechnicalSkills(technicalSkills.filter(x => x !== s))}>
                  {s} ×
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Soft Skills</Label>
            <Input placeholder="Type and press Enter" value={softSkillInput}
              onChange={e => setSoftSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(softSkillInput, softSkills, setSoftSkills, setSoftSkillInput))} />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {softSkills.map(s => (
                <Badge key={s} variant="secondary" className="cursor-pointer text-xs" onClick={() => setSoftSkills(softSkills.filter(x => x !== s))}>
                  {s} ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Style & Lifestyle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Work Style & Lifestyle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Preferred Work Style</Label>
            <div className="flex flex-wrap gap-2">
              {WORK_STYLES.map(ws => (
                <Badge key={ws} variant={workStyles.includes(ws) ? "default" : "outline"} className="cursor-pointer text-xs"
                  onClick={() => toggleItem(ws, workStyles, setWorkStyles)}>
                  {ws}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lifestyle Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_PREFS.map(lp => (
                <Badge key={lp} variant={lifestylePrefs.includes(lp) ? "default" : "outline"} className="cursor-pointer text-xs"
                  onClick={() => toggleItem(lp, lifestylePrefs, setLifestylePrefs)}>
                  {lp}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            What Matters to You
          </CardTitle>
          <p className="text-xs text-muted-foreground">Select the values that are most important to you in an employer.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VALUES_LENSES.map(lens => {
              const Icon = lens.icon;
              const isSelected = values.includes(lens.key);
              return (
                <button key={lens.key} onClick={() => toggleItem(lens.key, values, setValues)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                    isSelected ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/30 text-muted-foreground'
                  }`}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : ''}`} />
                  <span className="truncate">{lens.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!isValid} className="gap-2">
          Continue <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
