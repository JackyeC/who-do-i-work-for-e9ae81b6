import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, ChevronDown, Lightbulb, MessageSquare, ArrowRight, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface NormalizedQuestion {
  id: string;
  question: string;
  category: string;
  tip: string;
  userAnswer: string;
  feedback: string | null;
  score: number | null;
  strengths: string | null;
  improvements: string | null;
}

const FALLBACK_QUESTIONS = [
  "Tell me about your experience and why you want this role.",
  "Describe a time you helped a customer solve a problem.",
  "How would you handle competing priorities during a busy shift?",
];

/** Normalize interview data from any shape the AI might return */
function normalizeInterviewData(raw: any): NormalizedQuestion[] {
  if (!raw) return [];

  // Find the questions array from various possible shapes
  let sourceQuestions: any[] = [];
  if (Array.isArray(raw?.questions)) {
    sourceQuestions = raw.questions;
  } else if (Array.isArray(raw?.interviewQuestions)) {
    sourceQuestions = raw.interviewQuestions;
  } else if (Array.isArray(raw?.data?.questions)) {
    sourceQuestions = raw.data.questions;
  }

  const normalized = sourceQuestions
    .map((item: any, index: number) => {
      let questionText = "";
      if (typeof item === "string") {
        questionText = item;
      } else if (item?.question) {
        questionText = item.question;
      } else if (item?.prompt) {
        questionText = item.prompt;
      } else if (item?.text) {
        questionText = item.text;
      }

      return {
        id: `q-${index + 1}`,
        question: questionText.trim(),
        category: (typeof item === "object" && item?.category) || `Question ${index + 1}`,
        tip: (typeof item === "object" && item?.tip) || "",
        userAnswer: "",
        feedback: null,
        score: null,
        strengths: null,
        improvements: null,
      } as NormalizedQuestion;
    })
    .filter((q) => q.question.length > 0);

  // Inject fallback questions if none were valid
  if (normalized.length === 0) {
    return FALLBACK_QUESTIONS.map((text, i) => ({
      id: `fallback-${i + 1}`,
      question: text,
      category: "General",
      tip: "",
      userAnswer: "",
      feedback: null,
      score: null,
      strengths: null,
      improvements: null,
    }));
  }

  return normalized;
}

interface PrepQuestion {
  question: string;
  category: string;
  tip: string;
}

const PREP_QUESTIONS: PrepQuestion[] = [
  {
    question: "Tell me about a time you had to make a decision that balanced business goals with personal values.",
    category: "Behavioral",
    tip: "Lead with the tension — name the competing priorities clearly. Then walk through your reasoning. Interviewers want to see that you can hold complexity without defaulting to 'whatever the boss says.'",
  },
  {
    question: "How do you approach building consensus across teams with competing priorities?",
    category: "Leadership",
    tip: "Focus on the process, not the outcome. Who Do I Work For-aligned candidates show they listen before persuading. Mention how you surface hidden objections — that signals emotional intelligence.",
  },
  {
    question: "Describe a project where the right thing to do conflicted with the fastest thing to do.",
    category: "Integrity",
    tip: "This is a values litmus test. Don't sanitize it. Share the real trade-off and what you chose. If you chose speed, own it — and say what you'd do differently. Honesty beats polish.",
  },
  {
    question: "What does accountability look like to you — both from leadership and from yourself?",
    category: "Culture",
    tip: "Ask yourself: does this company actually practice accountability, or just talk about it? Use your Who Do I Work For dossier to compare their stated values to employee reviews. Your answer should signal you expect reciprocity.",
  },
  {
    question: "Ask them about the gap between their careers page and their employee reviews — they will tell you everything.",
    category: "Integrity Flip",
    tip: "This is your power move. Frame it respectfully: 'I noticed your careers page emphasizes X, but some reviews mention Y — can you help me understand that gap?' Watch how they respond. Defensiveness is a signal. Curiosity is a green flag.",
  },
];

export default function MockInterview() {
  const { user } = useAuth();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Interview flow states
  const [mode, setMode] = useState<"setup" | "interview" | "review">("setup");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const startInterview = async () => {
    if (!company.trim() || !role.trim()) {
      toast.error("Enter both company and role to start.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("job-questions", {
        body: { company: company.trim(), role: role.trim(), count: 5 },
      });
      if (error) throw error;
      const qs = (data?.questions || []).map((q: any) => ({
        ...q,
        userAnswer: "",
        feedback: null,
        score: null,
        strengths: null,
        improvements: null,
      }));
      if (qs.length === 0) throw new Error("No questions generated");
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswer("");
      setMode("interview");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const q = questions[currentIdx];
      const { data, error } = await supabase.functions.invoke("ask-jackye-chat", {
        body: {
          messages: [
            {
              role: "system",
              content:
                "You are an expert interview coach. Evaluate the candidate's answer. Return JSON with: score (0-100), feedback (2-3 specific sentences), strengths (1-2 things they did well), improvements (1-2 specific suggestions).",
            },
            {
              role: "user",
              content: `Interview for ${role} at ${company}.\n\nQuestion: ${q.question}\nCandidate's Answer: ${answer}\n\nEvaluate this answer. Return valid JSON: {"score": number, "feedback": string, "strengths": string, "improvements": string}`,
            },
          ],
        },
      });
      if (error) throw error;

      // Parse AI response
      const responseText = data?.reply || data?.content || data?.message || "";
      let evaluation;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { score: 70, feedback: responseText, strengths: "", improvements: "" };
      } catch {
        evaluation = { score: 70, feedback: responseText, strengths: "", improvements: "" };
      }

      const updated = [...questions];
      updated[currentIdx] = {
        ...updated[currentIdx],
        userAnswer: answer,
        feedback: evaluation.feedback,
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      };
      setQuestions(updated);
      setAnswer("");
    } catch (err: any) {
      toast.error("Failed to evaluate. Try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswer("");
    }
  };

  const finishInterview = () => {
    setMode("review");
  };

  const resetAll = () => {
    setMode("setup");
    setCompany("");
    setRole("");
    setQuestions([]);
    setCurrentIdx(0);
    setAnswer("");
    setOpenIdx(null);
  };

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const answeredCount = questions.filter((q) => q.feedback !== null).length;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const averageScore =
    answeredCount > 0
      ? Math.round(
          questions.filter((q) => q.score !== null).reduce((sum: number, q: any) => sum + q.score, 0) /
            answeredCount
        )
      : 0;

  const scoreColor = (score: number) => {
    if (score >= 80) return "hsl(142, 70%, 45%)";
    if (score >= 60) return "hsl(43, 85%, 50%)";
    return "hsl(0, 70%, 55%)";
  };

  return (
    <>
      <Helmet>
        <title>Mock Interview — Who Do I Work For</title>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
              Mock Interview
            </h1>
            <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
              <Shield className="w-3 h-3 mr-1" /> AI-powered interview prep
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "setup" && "Practice with AI-generated questions tailored to your target role. Get real-time feedback on your answers."}
            {mode === "interview" && `Interviewing for ${role} at ${company} — Question ${currentIdx + 1} of ${questions.length}`}
            {mode === "review" && "Review your performance and identify areas for improvement."}
          </p>
        </motion.div>

        {/* ─── SETUP MODE ─── */}
        {mode === "setup" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="border-border/40">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Company Name
                      </label>
                      <Input
                        placeholder="e.g. Patagonia"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        disabled={generating}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Role Title
                      </label>
                      <Input
                        placeholder="e.g. Senior Product Manager"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={generating}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={startInterview}
                    disabled={!company.trim() || !role.trim() || generating}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating Questions…
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" /> Start Interview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Practice Tips (formerly the static PREP_QUESTIONS) */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
                Practice Tips
              </h2>
              <div className="space-y-3">
                {PREP_QUESTIONS.map((q, i) => (
                  <Collapsible
                    key={i}
                    open={openIdx === i}
                    onOpenChange={(open) => setOpenIdx(open ? i : null)}
                  >
                    <Card
                      className={cn(
                        "border-border/40 transition-colors",
                        openIdx === i && "border-[hsl(var(--civic-gold))]/30"
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer select-none">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono text-muted-foreground"
                                >
                                  {q.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground/60 tabular-nums">
                                  Tip {i + 1}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground leading-relaxed">
                                {q.question}
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
                                openIdx === i && "rotate-180"
                              )}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4">
                          <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3">
                            <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5 mb-1.5">
                              <Lightbulb className="w-3 h-3" /> Who Do I Work For Coaching Tip
                            </p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{q.tip}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ─── INTERVIEW MODE ─── */}
        {mode === "interview" && currentQ && (
          <>
            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Progress: {answeredCount} of {questions.length} answered
                  </span>
                  <span className="tabular-nums">{Math.round(progressPct)}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </motion.div>

            {/* Question card */}
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="border-[hsl(var(--civic-gold))]/20">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
                      {currentQ.category || `Question ${currentIdx + 1}`}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Q{currentIdx + 1} of {questions.length}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-foreground leading-relaxed">
                    {currentQ.question}
                  </p>

                  {/* Answer area — only show if not yet answered */}
                  {currentQ.feedback === null ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your answer here… Be specific and use examples."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={evaluating}
                        className="min-h-[140px] text-sm"
                      />
                      <Button
                        onClick={submitAnswer}
                        disabled={!answer.trim() || evaluating}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {evaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Evaluating…
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" /> Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Feedback display */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {/* User's answer */}
                      <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {currentQ.userAnswer}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-3">
                        <div
                          className="text-2xl font-extrabold tabular-nums"
                          style={{ color: scoreColor(currentQ.score ?? 0) }}
                        >
                          {currentQ.score ?? "—"}/100
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={currentQ.score ?? 0}
                            className="h-2.5"
                          />
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3 space-y-2">
                        <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" /> Feedback
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {currentQ.feedback}
                        </p>
                      </div>

                      {/* Strengths & Improvements */}
                      {(currentQ.strengths || currentQ.improvements) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentQ.strengths && (
                            <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                              <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {currentQ.strengths}
                              </p>
                            </div>
                          )}
                          {currentQ.improvements && (
                            <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
                              <p className="text-xs font-medium text-orange-400 mb-1">To Improve</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {currentQ.improvements}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex items-center gap-3 pt-1">
                        {!isLastQuestion ? (
                          <Button onClick={goNext} className="flex-1 gap-2" size="lg">
                            <ArrowRight className="w-4 h-4" /> Next Question
                          </Button>
                        ) : (
                          <Button onClick={finishInterview} className="flex-1 gap-2" size="lg">
                            <CheckCircle className="w-4 h-4" /> Finish Interview
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Question thumbnails for navigation */}
            <div className="flex items-center gap-2 justify-center">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIdx(i);
                    setAnswer("");
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-mono font-bold transition-all",
                    i === currentIdx
                      ? "bg-[hsl(var(--civic-gold))] text-primary-foreground"
                      : q.feedback !== null
                      ? "bg-[hsl(var(--civic-gold))]/20 text-[hsl(var(--civic-gold))]"
                      : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Start over */}
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
                <RotateCcw className="w-3 h-3" /> Start Over
              </Button>
            </div>
          </>
        )}

        {/* ─── REVIEW MODE ─── */}
        {mode === "review" && (
          <>
            {/* Overall score */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="border-[hsl(var(--civic-gold))]/20">
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">Overall Score</p>
                  <div
                    className="text-5xl font-extrabold tabular-nums"
                    style={{ color: scoreColor(averageScore) }}
                  >
                    {averageScore}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <Progress value={averageScore} className="h-3 max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {role} at {company} — {answeredCount} question{answeredCount !== 1 ? "s" : ""}{" "}
                    answered
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Per-question review */}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.08,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Card className="border-border/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono text-muted-foreground"
                            >
                              {q.category || `Q${i + 1}`}
                            </Badge>
                            {q.score !== null && (
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{ color: scoreColor(q.score) }}
                              >
                                {q.score}/100
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      {q.userAnswer && (
                        <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Your Answer
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {q.userAnswer}
                          </p>
                        </div>
                      )}

                      {q.feedback && (
                        <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3">
                          <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5 mb-1">
                            <Lightbulb className="w-3 h-3" /> Feedback
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{q.feedback}</p>
                        </div>
                      )}

                      {(q.strengths || q.improvements) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.strengths && (
                            <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                              <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {q.strengths}
                              </p>
                            </div>
                          )}
                          {q.improvements && (
                            <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
                              <p className="text-xs font-medium text-orange-400 mb-1">To Improve</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {q.improvements}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!q.userAnswer && (
                        <p className="text-xs text-muted-foreground italic">Skipped</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 justify-center"
            >
              <Button onClick={resetAll} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="w-3 h-3" /> New Interview
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
