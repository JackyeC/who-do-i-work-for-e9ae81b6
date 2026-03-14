import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { Wand2, Target, CheckCircle, XCircle, MessageSquare, ArrowRight, Loader2, Sparkles, AlertCircle, ClipboardPaste, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

export function ResumeTailor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [selectedJD, setSelectedJD] = useState<string>("");
  const [pastedJD, setPastedJD] = useState("");
  const [jdMode, setJdMode] = useState<"paste" | "select">("paste");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: docs } = useQuery({
    queryKey: ["user-documents-for-tailor", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const resumes = docs?.filter((d: any) => d.document_type === "resume") || [];
  const jobDescs = docs?.filter((d: any) => d.document_type === "job_description") || [];

  // Auto-select resume if only one exists
  useEffect(() => {
    if (resumes.length === 1 && !selectedResume) {
      setSelectedResume(resumes[0].id);
    }
  }, [resumes.length]);

  // Auto-select JD if only one exists and in select mode
  useEffect(() => {
    if (jobDescs.length === 1 && !selectedJD) {
      setSelectedJD(jobDescs[0].id);
    }
  }, [jobDescs.length]);

  // Default to select mode if they have uploaded JDs but no paste content
  useEffect(() => {
    if (jobDescs.length > 0 && !pastedJD) {
      setJdMode("select");
    }
  }, [jobDescs.length]);

  const hasValidJD = jdMode === "paste" ? pastedJD.trim().length >= 50 : !!selectedJD;

  const handleTailor = async () => {
    if (!selectedResume || !hasValidJD) return;
    if (jdMode === "paste" && pastedJD.length > 15000) {
      toast.error("Job description is too long (max 15,000 characters)");
      return;
    }
    setLoading(true);
    setAnalysis(null);

    try {
      const body: any = { resumeDocId: selectedResume };
      if (jdMode === "select") {
        body.jobDescDocId = selectedJD;
      } else {
        body.pastedJobDescription = pastedJD.trim();
      }

      const { data, error } = await supabase.functions.invoke("tailor-resume", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast.success("Resume analysis complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!resumes.length) {
    return (
      <EmptyState
        icon={Wand2}
        title="Upload a resume first"
        description="To tailor your resume, upload one in the Upload tab or start with Career Discovery which uploads your resume automatically."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" /> Resume Tailor
          </CardTitle>
          <CardDescription>
            Select your resume and provide a job description to get AI-powered gap analysis and tailoring suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resume Selection */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Your Resume</label>
            <Select value={selectedResume} onValueChange={setSelectedResume}>
              <SelectTrigger><SelectValue placeholder="Select resume" /></SelectTrigger>
              <SelectContent>
                {resumes.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.original_filename || "Resume"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Description - Tabs for paste vs select */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Target Job Description</label>
            <Tabs value={jdMode} onValueChange={(v) => setJdMode(v as "paste" | "select")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="paste" className="text-xs gap-1.5">
                  <ClipboardPaste className="w-3 h-3" /> Paste Text
                </TabsTrigger>
                <TabsTrigger value="select" className="text-xs gap-1.5">
                  <FileText className="w-3 h-3" /> Uploaded ({jobDescs.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="mt-2">
                <Textarea
                  value={pastedJD}
                  onChange={(e) => setPastedJD(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[140px] text-sm resize-y"
                  maxLength={15000}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {pastedJD.length > 0 && pastedJD.length < 50 ? "Paste at least 50 characters for a meaningful analysis" : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{pastedJD.length.toLocaleString()} / 15,000</p>
                </div>
              </TabsContent>
              <TabsContent value="select" className="mt-2">
                {jobDescs.length > 0 ? (
                  <Select value={selectedJD} onValueChange={setSelectedJD}>
                    <SelectTrigger><SelectValue placeholder="Select job description" /></SelectTrigger>
                    <SelectContent>
                      {jobDescs.map((j: any) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.parsed_signals?.role_title || j.original_filename || "Job Description"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No uploaded job descriptions yet</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/career-intelligence?tab=upload")} className="text-xs gap-1">
                      <AlertCircle className="w-3 h-3" /> Upload Job Description
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <Button onClick={handleTailor} disabled={!selectedResume || !hasValidJD || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Analyzing..." : "Analyze & Tailor"}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Match Score */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Match Score</span>
                <span className="text-2xl font-bold text-foreground">{analysis.match_score}%</span>
              </div>
              <Progress value={analysis.match_score} className="h-2" />
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={analysis.seniority_fit === "strong" ? "default" : analysis.seniority_fit === "moderate" ? "secondary" : "destructive"} className="text-xs capitalize">
                  {analysis.seniority_fit} seniority fit
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Skills Gap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-civic-green">
                  <CheckCircle className="w-4 h-4" /> Matched Skills ({analysis.matched_skills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {analysis.matched_skills?.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-destructive">
                  <XCircle className="w-4 h-4" /> Missing Skills ({analysis.missing_skills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {analysis.missing_skills?.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tailoring Suggestions */}
          {analysis.tailoring_suggestions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Tailoring Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.tailoring_suggestions.map((s: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{s.area}</Badge>
                    </div>
                    {s.current_language && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Current: </span>
                        <span className="text-foreground line-through opacity-60">{s.current_language}</span>
                      </div>
                    )}
                    <div className="text-xs flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{s.suggested_language}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{s.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Talking Points */}
          {analysis.talking_points?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Interview Talking Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.talking_points.map((tp: string, i: number) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                      {tp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center italic">
            This analysis detects signal patterns in your documents. It provides educational insights only — not legal, financial, or employment advice.
          </p>
        </div>
      )}
    </div>
  );
}
