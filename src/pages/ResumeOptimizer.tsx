import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, FileText, Target, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  Heart, ArrowRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnalysisResult {
  atsScore: number;
  keywordsPresent: string[];
  keywordsMissing: string[];
  bulletRewrites: { original: string; optimized: string; reason: string }[];
  skillsGap: string[];
  valuesCheck: { present: string[]; missing: string[]; overall: string };
}

const MOCK_RESULT: AnalysisResult = {
  atsScore: 72,
  keywordsPresent: ["product strategy", "agile", "stakeholder management", "data-driven", "roadmap"],
  keywordsMissing: ["sustainability", "B Corp", "environmental impact", "cross-functional leadership", "OKRs"],
  bulletRewrites: [
    {
      original: "Managed product roadmap for mobile app with 2M users",
      optimized: "Led cross-functional product roadmap for sustainability-focused mobile platform serving 2M+ users, driving 23% engagement increase through values-aligned feature prioritization",
      reason: "Adds sustainability context, quantifies impact, and mirrors Patagonia's mission-driven language.",
    },
    {
      original: "Worked with engineering team to ship features on time",
      optimized: "Partnered with engineering and sustainability teams to deliver purpose-driven features on cadence, balancing business goals with environmental accountability metrics",
      reason: "Elevates from task description to strategic collaboration, incorporating company values language.",
    },
    {
      original: "Conducted user research and analyzed feedback",
      optimized: "Designed and executed mixed-methods user research programs, translating community feedback into product decisions aligned with organizational mission and stakeholder impact goals",
      reason: "Transforms passive activity into leadership behavior; adds values and impact framing.",
    },
  ],
  skillsGap: ["Sustainability metrics", "B Corp reporting", "Environmental compliance"],
  valuesCheck: {
    present: ["Collaboration", "Impact-driven work", "User advocacy"],
    missing: ["Environmental commitment", "Community engagement", "Purpose over profit"],
    overall: "Your resume reflects strong collaboration and impact values, but doesn't yet speak the language of mission-driven organizations. Adding sustainability and purpose framing will significantly improve alignment.",
  },
};

export default function ResumeOptimizer() {
  usePageSEO({ title: "Resume Optimizer — Who Do I Work For?" });
  const [file, setFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult(MOCK_RESULT);
      setAnalyzing(false);
    }, 2500);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-civic-green" : score >= 60 ? "text-civic-yellow" : "text-civic-red";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Resume Optimizer — Who Do I Work For?</title>
      </Helmet>

      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">
          You deserve to know exactly who you work for.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Resume Optimizer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Go beyond keywords. Optimize for ATS, skills, and values alignment.
          </p>
        </div>

        {!result ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* File upload */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Upload Your Resume</label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      file ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-primary/30"
                    )}
                    onClick={() => document.getElementById("resume-upload")?.click()}
                  >
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Drop your resume here or click to browse</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">PDF or Word — max 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Job URL */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Target Role</label>
                  <Input
                    placeholder="Paste job listing URL or enter job title + company"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!file || !jobUrl || analyzing}
                  className="w-full gap-2"
                  size="lg"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analyzing ? "Analyzing..." : "Optimize for This Role"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
            {/* ATS Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardContent className="p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">ATS Score</p>
                  <p className={cn("text-4xl font-mono font-bold", scoreColor(result.atsScore))}>{result.atsScore}</p>
                  <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                  <Progress value={result.atsScore} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Keywords</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-civic-green font-medium mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Present ({result.keywordsPresent.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.keywordsPresent.map(k => (
                          <Badge key={k} variant="secondary" className="text-xs bg-civic-green/10 text-civic-green border-civic-green/20">{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-civic-red font-medium mb-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Missing ({result.keywordsMissing.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.keywordsMissing.map(k => (
                          <Badge key={k} variant="secondary" className="text-xs bg-civic-red/10 text-civic-red border-civic-red/20">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for detailed sections */}
            <Tabs defaultValue="rewrites">
              <TabsList>
                <TabsTrigger value="rewrites">Bullet Rewrites</TabsTrigger>
                <TabsTrigger value="skills">Skills Gap</TabsTrigger>
                <TabsTrigger value="values">Values Check</TabsTrigger>
              </TabsList>

              <TabsContent value="rewrites" className="space-y-4 mt-4">
                {result.bulletRewrites.map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Before</p>
                          <p className="text-sm text-foreground/60 leading-relaxed bg-muted/30 rounded p-3">{item.original}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-primary mb-1">After</p>
                          <p className="text-sm text-foreground leading-relaxed bg-primary/[0.04] border border-primary/10 rounded p-3">{item.optimized}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                        {item.reason}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="skills" className="mt-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-3">Skills present in the job listing but missing from your resume:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsGap.map(s => (
                        <Badge key={s} variant="outline" className="text-xs gap-1">
                          <AlertTriangle className="w-3 h-3 text-civic-yellow" /> {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="values" className="mt-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="bg-primary/[0.04] border border-primary/10 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/80 leading-relaxed">{result.valuesCheck.overall}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-civic-green font-medium mb-2">Values Reflected</p>
                        {result.valuesCheck.present.map(v => (
                          <p key={v} className="text-sm text-foreground/70 flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3 h-3 text-civic-green" /> {v}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-civic-yellow font-medium mb-2">Values to Add</p>
                        {result.valuesCheck.missing.map(v => (
                          <p key={v} className="text-sm text-foreground/70 flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3 h-3 text-civic-yellow" /> {v}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Button variant="outline" onClick={() => { setResult(null); setFile(null); setJobUrl(""); }}>
              Analyze Another Resume
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
