import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare, Loader2, CheckCircle2, AlertTriangle, Sparkles,
  ArrowRight, RotateCcw, Target, Heart, Lightbulb, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewQuestion {
  id: number;
  question: string;
  category: "behavioral" | "technical" | "culture" | "integrity";
  companySpecific?: boolean;
}

const QUESTIONS: InterviewQuestion[] = [
  { id: 1, question: "Tell me about a time you had to make a difficult decision that balanced business goals with personal values.", category: "behavioral" },
  { id: 2, question: "How do you approach building consensus across teams with competing priorities?", category: "behavioral" },
  { id: 3, question: "Describe a project where the right thing to do conflicted with the fastest thing to do. What happened?", category: "behavioral" },
  { id: 4, question: "Walk me through how you'd design a product feature that serves both revenue goals and user wellbeing.", category: "technical" },
  { id: 5, question: "Ask them about the gap between their careers page and their employee reviews — they will tell you everything.", category: "integrity", companySpecific: true },
  { id: 6, question: "How do you measure success beyond traditional KPIs?", category: "technical" },
  { id: 7, question: "What's your approach to giving feedback that might challenge leadership?", category: "culture" },
  { id: 8, question: "What does accountability look like to you — both from leadership and from yourself?", category: "culture" },
];

const FLIP_QUESTIONS = [
  "What does this role look like when it's going well — and who defines that?",
  "Can you share a time the company changed direction based on employee feedback?",
  "How does the team handle disagreement with leadership decisions?",
];

interface Feedback {
  clarity: number;
  specificity: number;
  valuesAlignment: number;
  strengths: string[];
  improvements: string[];
}

const MOCK_FEEDBACK: Feedback = {
  clarity: 82,
  specificity: 68,
  valuesAlignment: 90,
  strengths: [
    "Strong connection between personal experience and values",
    "Concrete example with measurable outcome",
    "Authentic voice — doesn't sound rehearsed",
  ],
  improvements: [
    "Add a specific metric or timeline to strengthen credibility",
    "Consider naming the value explicitly (e.g., 'integrity over speed')",
    "The closing could tie back to the role you're interviewing for",
  ],
};

export default function MockInterview() {
  usePageSEO({ title: "Mock Interview — Who Do I Work For?" });
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{ question: string; answer: string; feedback: Feedback }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const activeQuestions = QUESTIONS.slice(0, 5);

  const handleStart = () => setStarted(true);

  const handleSubmitAnswer = () => {
    setLoading(true);
    setTimeout(() => {
      setShowFeedback(true);
      setLoading(false);
    }, 1500);
  };

  const handleNext = () => {
    setAnswers(prev => [...prev, { question: activeQuestions[currentQ].question, answer, feedback: MOCK_FEEDBACK }]);
    setAnswer("");
    setShowFeedback(false);
    if (currentQ + 1 >= activeQuestions.length) {
      setShowSummary(true);
    } else {
      setCurrentQ(prev => prev + 1);
    }
  };

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono", score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400")}>{score}</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet><title>Interview Summary — Who Do I Work For?</title></Helmet>
        <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
          <p className="text-xs text-muted-foreground italic text-center">You deserve to know exactly who you work for.</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <h1 className="text-2xl font-bold font-display text-foreground">Session Summary</h1>
          <p className="text-sm text-muted-foreground">
            {company} — {jobTitle} • {answers.length} questions answered
          </p>
          <div className="space-y-4">
            {answers.map((a, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">{a.question}</p>
                  <p className="text-sm text-foreground/60 leading-relaxed">{a.answer}</p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <ScoreBar label="Clarity" score={a.feedback.clarity} />
                    <ScoreBar label="Specificity" score={a.feedback.specificity} />
                    <ScoreBar label="Values" score={a.feedback.valuesAlignment} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Flip questions */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-primary" /> Questions to Flip Back on Them
              </h3>
              <div className="space-y-2">
                {FLIP_QUESTIONS.map((q, i) => (
                  <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-1" /> {q}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => { setStarted(false); setCurrentQ(0); setAnswers([]); setShowSummary(false); }} variant="outline" className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> Start New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Mock Interview — Who Do I Work For?</title></Helmet>
      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">You deserve to know exactly who you work for.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {!started ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">Mock Interview</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Practice with company-specific questions. Get feedback on clarity, specificity, and values alignment.
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Job Title</label>
                    <Input placeholder="e.g. Senior Product Manager" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Company</label>
                    <Input placeholder="e.g. Patagonia" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Interview Type</label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="culture">Culture Fit</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleStart} disabled={!jobTitle || !company || !interviewType} className="w-full gap-2" size="lg">
                  <MessageSquare className="w-4 h-4" /> Start Interview
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} className="space-y-5">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <Progress value={((currentQ + 1) / activeQuestions.length) * 100} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground font-mono">{currentQ + 1}/{activeQuestions.length}</span>
              </div>

              {/* Question */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    {activeQuestions[currentQ].companySpecific && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20 shrink-0 mt-0.5">
                        <Target className="w-3 h-3 mr-0.5" /> Company-specific
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-medium text-foreground mt-2 leading-relaxed">
                    {activeQuestions[currentQ].question}
                  </p>
                </CardContent>
              </Card>

              {/* Answer area */}
              <Textarea
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[150px]"
                disabled={showFeedback}
              />

              {!showFeedback ? (
                <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || loading} className="w-full gap-2" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Evaluating..." : "Get Feedback"}
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <ScoreBar label="Clarity" score={MOCK_FEEDBACK.clarity} />
                        <ScoreBar label="Specificity" score={MOCK_FEEDBACK.specificity} />
                        <ScoreBar label="Values" score={MOCK_FEEDBACK.valuesAlignment} />
                      </div>

                      <div>
                        <p className="text-xs text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> What was strong
                        </p>
                        {MOCK_FEEDBACK.strengths.map((s, i) => (
                          <p key={i} className="text-sm text-foreground/70 ml-4 mb-0.5">• {s}</p>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs text-amber-400 font-medium mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> What to improve
                        </p>
                        {MOCK_FEEDBACK.improvements.map((s, i) => (
                          <p key={i} className="text-sm text-foreground/70 ml-4 mb-0.5">• {s}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={handleNext} className="w-full gap-2" size="lg">
                    {currentQ + 1 >= activeQuestions.length ? "View Summary" : "Next Question"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
