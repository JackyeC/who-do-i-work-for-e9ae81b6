import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, ChevronDown, Lightbulb, MessageSquare, ArrowRight, CheckCircle, RotateCcw, Loader2, Volume2, VolumeX, AlertTriangle, Mic, MicOff, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { speakRobot, stopSpeaking, VOICE_PRESETS, type VoicePreset } from "@/lib/robot-voice";
import { useSpeechRecognition, type MicStatus } from "@/hooks/useSpeechRecognition";

// ── Types ──

type InterviewState = "setup" | "loading" | "asking" | "recording" | "reviewing" | "complete" | "error";

interface QuestionItem {
  id: string;
  text: string;
  category: string;
  tip: string;
}

interface RubricScore {
  clarity: number;
  relevance: number;
  specificity: number;
  confidence: number;
  structure: number;
}

interface AnswerItem {
  questionId: string;
  questionText: string;
  answerText: string;
  transcript: string;
  mode: "typed" | "voice";
  feedback: string | null;
  score: number | null;
  strengths: string[] | null;
  improvements: string[] | null;
  rubric: RubricScore | null;
  sampleAnswer: string | null;
  coachingNote: string | null;
}

interface Session {
  role: string;
  company: string;
  interviewType: string;
  startedAt: string;
  currentIndex: number;
  questions: QuestionItem[];
  answers: AnswerItem[];
  scoreSummary: { average: number; answered: number; total: number } | null;
}

// ── Constants ──

const FALLBACK_QUESTIONS: QuestionItem[] = [
  { id: "fallback-1", text: "Tell me about your experience and why you want this role.", category: "General", tip: "" },
  { id: "fallback-2", text: "Describe a time you helped a customer solve a problem.", category: "General", tip: "" },
  { id: "fallback-3", text: "How would you handle competing priorities during a busy shift?", category: "General", tip: "" },
];

const PREP_QUESTIONS = [
  { question: "Tell me about a time you had to make a decision that balanced business goals with personal values.", category: "Behavioral", tip: "Lead with the tension — name the competing priorities clearly. Then walk through your reasoning." },
  { question: "How do you approach building consensus across teams with competing priorities?", category: "Leadership", tip: "Focus on the process, not the outcome. Show you listen before persuading." },
  { question: "Describe a project where the right thing to do conflicted with the fastest thing to do.", category: "Integrity", tip: "This is a values litmus test. Share the real trade-off and what you chose." },
  { question: "What does accountability look like to you — both from leadership and from yourself?", category: "Culture", tip: "Use your Who Do I Work For dossier to compare their stated values to employee reviews." },
  { question: "Ask them about the gap between their careers page and their employee reviews — they will tell you everything.", category: "Integrity Flip", tip: "Frame it respectfully: 'I noticed your careers page emphasizes X, but some reviews mention Y — can you help me understand that gap?'" },
];

// ── Normalizer ──

function normalizeInterviewData(raw: any, role: string, company: string): { questions: QuestionItem[] } {
  if (!raw) return { questions: [] };

  let source: any[] = [];
  if (Array.isArray(raw?.questions)) source = raw.questions;
  else if (Array.isArray(raw?.interviewQuestions)) source = raw.interviewQuestions;
  else if (Array.isArray(raw?.data?.questions)) source = raw.data.questions;

  const questions = source
    .map((item: any, i: number): QuestionItem | null => {
      let text = "";
      if (typeof item === "string") text = item;
      else if (item?.question) text = item.question;
      else if (item?.prompt) text = item.prompt;
      else if (item?.text) text = item.text;
      text = text.trim();
      if (!text) return null;
      return {
        id: `q-${i + 1}`,
        text,
        category: (typeof item === "object" && item?.category) || `Question ${i + 1}`,
        tip: (typeof item === "object" && item?.tip) || "",
      };
    })
    .filter((q): q is QuestionItem => q !== null);

  return { questions };
}

function createEmptySession(): Session {
  return {
    role: "",
    company: "",
    interviewType: "ai-generated",
    startedAt: "",
    currentIndex: 0,
    questions: [],
    answers: [],
    scoreSummary: null,
  };
}

function computeScoreSummary(answers: AnswerItem[], total: number): Session["scoreSummary"] {
  const scored = answers.filter((a) => a.score !== null);
  if (scored.length === 0) return { average: 0, answered: 0, total };
  const avg = Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length);
  return { average: avg, answered: scored.length, total };
}

const MIC_STATUS_CONFIG: Record<MicStatus, { label: string; className: string }> = {
  idle: { label: "Idle", className: "bg-muted/40 text-muted-foreground" },
  listening: { label: "Listening", className: "bg-primary/10 text-primary animate-pulse" },
  processing: { label: "Processing", className: "bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))]" },
  ready: { label: "Ready", className: "bg-green-500/10 text-green-500" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive" },
};

function MicStatusPill({ status }: { status: MicStatus }) {
  const config = MIC_STATUS_CONFIG[status];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider", config.className)}>
      {config.label}
    </span>
  );
}

// ── Component ──

export default function MockInterview() {
  const { user } = useAuth();
  const [state, setState] = useState<InterviewState>("setup");
  const [session, setSession] = useState<Session>(createEmptySession);
  const [errorMessage, setErrorMessage] = useState("");

  // Setup form
  const [companyInput, setCompanyInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Active interview
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [voicePreset, setVoicePreset] = useState<VoicePreset>("strict");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [practiceMode, setPracticeMode] = useState<"text" | "voice">("text");

  const speech = useSpeechRecognition();

  // Sync speech final text into the answer field in voice mode
  useEffect(() => {
    if (practiceMode === "voice" && speech.finalText) {
      setAnswer(speech.finalText);
    }
  }, [speech.finalText, practiceMode]);

  // Auto-fallback to text mode if speech unsupported or mic denied
  useEffect(() => {
    if (practiceMode === "voice" && !speech.supported) {
      setPracticeMode("text");
      toast.error("Voice practice works best in Chrome.");
    }
  }, [practiceMode, speech.supported]);

  useEffect(() => {
    if (speech.micStatus === "error" && speech.errorMessage.includes("denied")) {
      setPracticeMode("text");
      toast.error(speech.errorMessage);
    }
  }, [speech.micStatus, speech.errorMessage]);

  const currentQuestion = session.questions[session.currentIndex] ?? null;
  const currentAnswer = session.answers.find((a) => a.questionId === currentQuestion?.id) ?? null;

  // Auto-speak on question change
  useEffect(() => {
    if (state !== "asking" || !voiceEnabled || !currentQuestion) return;
    speakRobot(currentQuestion.text, voicePreset);
    return () => stopSpeaking();
  }, [state, session.currentIndex, voicePreset, voiceEnabled]);

  // Stop recognition on question change
  useEffect(() => {
    if (state !== "asking" && state !== "recording") {
      speech.stopListening();
      speech.resetTranscript();
    }
  }, [state]);

  // Skip invalid questions
  useEffect(() => {
    if (state !== "asking" && state !== "recording") return;
    if (!currentQuestion?.text) {
      const nextValid = session.questions.findIndex((q, i) => i > session.currentIndex && q.text);
      if (nextValid >= 0) {
        setSession((s) => ({ ...s, currentIndex: nextValid }));
      } else {
        finishInterview();
      }
    }
  }, [session.currentIndex, state]);

  const startInterview = async () => {
    if (!companyInput.trim() || !roleInput.trim()) {
      toast.error("Enter both company and role to start.");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("job-questions", {
        body: { company: companyInput.trim(), role: roleInput.trim(), count: 5 },
      });
      if (error) throw error;

      console.log("[MockInterview] Raw API payload:", JSON.stringify(data, null, 2));

      const { questions } = normalizeInterviewData(data, roleInput.trim(), companyInput.trim());
      console.log("[MockInterview] Normalized questions:", questions);

      const finalQuestions = questions.length > 0 ? questions : FALLBACK_QUESTIONS;

      setSession({
        role: roleInput.trim(),
        company: companyInput.trim(),
        interviewType: questions.length > 0 ? "ai-generated" : "fallback",
        startedAt: new Date().toISOString(),
        currentIndex: 0,
        questions: finalQuestions,
        answers: [],
        scoreSummary: null,
      });
      setAnswer("");
      setState("asking");
    } catch (err: any) {
      console.error("[MockInterview] Generation failed:", err);
      setErrorMessage(err.message || "Failed to generate questions.");
      setState("error");
    }
  };

  const useFallbackQuestions = () => {
    setSession({
      role: roleInput.trim() || "this role",
      company: companyInput.trim() || "this company",
      interviewType: "fallback",
      startedAt: new Date().toISOString(),
      currentIndex: 0,
      questions: FALLBACK_QUESTIONS,
      answers: [],
      scoreSummary: null,
    });
    setAnswer("");
    setState("asking");
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    setEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("ask-jackye-chat", {
        body: {
          messages: [
            { role: "system", content: `You are an expert interview coach. Evaluate the candidate's answer across 5 categories: clarity, relevance, specificity, confidence, structure. Each scored 1-5. Return JSON:
{"score": number (0-100 overall), "rubric": {"clarity": number, "relevance": number, "specificity": number, "confidence": number, "structure": number}, "strengths": ["strength 1", "strength 2"], "improvements": ["improvement 1", "improvement 2"], "sampleAnswer": "a stronger sample answer under 120 words", "coachingNote": "one short coaching note", "feedback": "2-3 sentence summary"}` },
            { role: "user", content: `Interview for ${session.role} at ${session.company}.\n\nQuestion: ${currentQuestion.text}\nCandidate's Answer: ${answer}\n\nEvaluate this answer. Return valid JSON only.` },
          ],
        },
      });
      if (error) throw error;

      const responseText = data?.reply || data?.content || data?.message || "";
      let evaluation: any;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        evaluation = {};
      }

      const rubric: RubricScore = {
        clarity: evaluation.rubric?.clarity ?? 3,
        relevance: evaluation.rubric?.relevance ?? 3,
        specificity: evaluation.rubric?.specificity ?? 3,
        confidence: evaluation.rubric?.confidence ?? 3,
        structure: evaluation.rubric?.structure ?? 3,
      };

      const newAnswer: AnswerItem = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answerText: answer,
        transcript: practiceMode === "voice" ? speech.finalText : answer,
        mode: practiceMode === "voice" ? "voice" : "typed",
        feedback: evaluation.feedback || responseText || "No feedback available.",
        score: evaluation.score ?? Math.round(Object.values(rubric).reduce((a, b) => a + b, 0) / 5 * 20),
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 2) : null,
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements.slice(0, 2) : null,
        rubric,
        sampleAnswer: evaluation.sampleAnswer || null,
        coachingNote: evaluation.coachingNote || null,
      };

      setSession((s) => {
        const updatedAnswers = [...s.answers.filter((a) => a.questionId !== currentQuestion.id), newAnswer];
        return { ...s, answers: updatedAnswers };
      });
      setAnswer("");
      setState("reviewing");
    } catch (err: any) {
      toast.error("Failed to evaluate. Try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const goNext = () => {
    if (session.currentIndex < session.questions.length - 1) {
      speech.stopListening();
      speech.resetTranscript();
      setSession((s) => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setAnswer("");
      setState("asking");
    }
  };

  const finishInterview = useCallback(() => {
    setSession((s) => ({
      ...s,
      scoreSummary: computeScoreSummary(s.answers, s.questions.length),
    }));
    setState("complete");
  }, []);

  const resetAll = () => {
    setState("setup");
    setSession(createEmptySession());
    setCompanyInput("");
    setRoleInput("");
    setAnswer("");
    setOpenIdx(null);
    setErrorMessage("");
  };

  const isLastQuestion = session.currentIndex === session.questions.length - 1;
  const answeredCount = session.answers.filter((a) => a.feedback !== null).length;
  const progressPct = session.questions.length > 0 ? (answeredCount / session.questions.length) * 100 : 0;

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
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-display">Mock Interview</h1>
            <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
              <Shield className="w-3 h-3 mr-1" /> AI-powered interview prep
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {state === "setup" && "Practice with AI-generated questions tailored to your target role. Get feedback after you submit each answer."}
            {state === "loading" && "Generating your interview questions…"}
            {state === "error" && "Something went wrong. You can retry or use practice questions."}
            {(state === "asking" || state === "recording") && `Interviewing for ${session.role} at ${session.company} — Question ${session.currentIndex + 1} of ${session.questions.length}`}
            {state === "reviewing" && `Reviewing your answer to question ${session.currentIndex + 1}`}
            {state === "complete" && "Review your performance and identify areas for improvement."}
          </p>
        </motion.div>

        {/* Practice banner */}
        {(state === "asking" || state === "recording" || state === "reviewing") && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-start gap-3">
            <Shield className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-destructive tracking-wide uppercase font-mono">Practice Mode Only</p>
              <p className="text-xs text-foreground/60 mt-0.5">Not designed for use during a live interview. Answer in your own words — this tool is here to help you practice, not perform for you.</p>
            </div>
          </div>
        )}

        {/* ─── SETUP ─── */}
        {state === "setup" && (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="border-border/40">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                      <Input placeholder="e.g. Patagonia" value={companyInput} onChange={(e) => setCompanyInput(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Role Title</label>
                      <Input placeholder="e.g. Senior Product Manager" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={startInterview} disabled={!companyInput.trim() || !roleInput.trim()} className="w-full gap-2" size="lg">
                    <MessageSquare className="w-4 h-4" /> Start Interview
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-gold))]" /> Practice Tips
              </h2>
              <div className="space-y-3">
                {PREP_QUESTIONS.map((q, i) => (
                  <Collapsible key={i} open={openIdx === i} onOpenChange={(open) => setOpenIdx(open ? i : null)}>
                    <Card className={cn("border-border/40 transition-colors", openIdx === i && "border-[hsl(var(--civic-gold))]/30")}>
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer select-none">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">{q.category}</Badge>
                                <span className="text-xs text-muted-foreground/60 tabular-nums">Tip {i + 1}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200", openIdx === i && "rotate-180")} />
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

        {/* ─── LOADING ─── */}
        {state === "loading" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-border/40">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Generating interview questions for <span className="font-semibold text-foreground">{roleInput}</span> at <span className="font-semibold text-foreground">{companyInput}</span>…</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── ERROR ─── */}
        {state === "error" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-destructive/30">
              <CardContent className="p-6 space-y-4 text-center">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm text-foreground font-medium">Failed to generate questions</p>
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
                <div className="flex items-center gap-3 justify-center">
                  <Button onClick={startInterview} variant="default" size="sm" className="gap-2">
                    <RotateCcw className="w-3 h-3" /> Retry
                  </Button>
                  <Button onClick={useFallbackQuestions} variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="w-3 h-3" /> Use Practice Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── ASKING / RECORDING ─── */}
        {(state === "asking" || state === "recording") && currentQuestion && (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress: {answeredCount} of {session.questions.length} answered</span>
                  <span className="tabular-nums">{Math.round(progressPct)}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </motion.div>

            {/* Voice controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopSpeaking(); }}
                  className={cn("p-1.5 rounded-md border transition-colors", voiceEnabled ? "border-primary/30 bg-primary/10 text-primary" : "border-border/40 bg-muted/30 text-muted-foreground")}
                  title={voiceEnabled ? "Mute interviewer" : "Unmute interviewer"}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">AI Interviewer Voice:</span>
              </div>
              <div className="flex items-center gap-1">
                {(Object.entries(VOICE_PRESETS) as [VoicePreset, typeof VOICE_PRESETS[VoicePreset]][]).map(([key, preset]) => (
                  <button key={key} onClick={() => setVoicePreset(key)} className={cn("px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider border transition-all", voicePreset === key ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-card text-muted-foreground border-border/40 hover:border-primary/40")}>
                    {preset.label}
                  </button>
                ))}
              </div>
              {voiceEnabled && (
                <button onClick={() => { if (currentQuestion?.text) speakRobot(currentQuestion.text, voicePreset); }} className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors">
                  ▶ Replay
                </button>
              )}
            </div>

            {/* Session intro */}
            {session.currentIndex === 0 && !currentAnswer && (
              <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-center">
                <p className="text-sm text-foreground/70 italic">"Answer in your own words. This tool is here to help you practice, not perform for you."</p>
              </div>
            )}

            {/* Question card */}
            <motion.div key={session.currentIndex} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="border-[hsl(var(--civic-gold))]/20">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
                      {currentQuestion.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">Q{session.currentIndex + 1} of {session.questions.length}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground leading-relaxed min-h-[2em] rounded-lg bg-muted/20 p-3 border border-border/30">
                    {currentQuestion.text}
                  </p>

                  {/* Practice mode toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Answer Mode:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setPracticeMode("text"); speech.stopListening(); speech.resetTranscript(); }}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider border transition-all flex items-center gap-1", practiceMode === "text" ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-card text-muted-foreground border-border/40 hover:border-primary/40")}
                      >
                        <Type className="w-3 h-3" /> Text
                      </button>
                      <button
                        onClick={() => {
                          if (!speech.supported) {
                            toast.error("Voice practice works best in Chrome.");
                            return;
                          }
                          setPracticeMode("voice");
                        }}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider border transition-all flex items-center gap-1", practiceMode === "voice" ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-card text-muted-foreground border-border/40 hover:border-primary/40")}
                      >
                        <Mic className="w-3 h-3" /> Voice
                      </button>
                    </div>
                    {/* Mic status pill */}
                    {practiceMode === "voice" && (
                      <MicStatusPill status={speech.micStatus} />
                    )}
                  </div>

                  {/* Voice mode UI */}
                  {practiceMode === "voice" && (
                    <div className="space-y-3">
                      {speech.errorMessage && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                          <p className="text-xs text-destructive">{speech.errorMessage}</p>
                        </div>
                      )}

                      {/* Live transcript display */}
                      <div className="rounded-lg bg-muted/20 border border-border/30 p-3 min-h-[80px]">
                        {speech.finalText || speech.interimText ? (
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {speech.finalText}
                            {speech.interimText && <span className="text-muted-foreground italic"> {speech.interimText}</span>}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">
                            {speech.micStatus === "listening" ? "Listening… speak your answer" : "Press Start Recording to begin"}
                          </p>
                        )}
                      </div>

                      {/* Mic controls */}
                      <div className="flex items-center gap-2">
                        {speech.micStatus === "idle" || speech.micStatus === "ready" || speech.micStatus === "error" ? (
                          <Button onClick={() => speech.startListening()} variant="default" size="sm" className="gap-2">
                            <Mic className="w-3.5 h-3.5" /> Start Recording
                          </Button>
                        ) : speech.micStatus === "listening" ? (
                          <Button onClick={() => speech.stopListening()} variant="destructive" size="sm" className="gap-2">
                            <MicOff className="w-3.5 h-3.5" /> Stop Recording
                          </Button>
                        ) : null}
                        {(speech.finalText || speech.interimText) && (
                          <Button onClick={() => { speech.resetTranscript(); setAnswer(""); }} variant="outline" size="sm" className="gap-2">
                            <RotateCcw className="w-3 h-3" /> Retry
                          </Button>
                        )}
                      </div>

                      {/* Editable transcript area */}
                      {speech.finalText && speech.micStatus !== "listening" && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Edit transcript before submitting:</p>
                          <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            disabled={evaluating}
                            className="min-h-[100px] text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text mode UI */}
                  {practiceMode === "text" && (
                    <Textarea
                      placeholder="Type your answer here… Be specific and use examples."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={evaluating}
                      className="min-h-[140px] text-sm"
                    />
                  )}

                  {/* Submit (shared) */}
                  <Button onClick={() => { speech.stopListening(); submitAnswer(); }} disabled={!answer.trim() || evaluating || speech.micStatus === "listening"} className="w-full gap-2" size="lg">
                    {evaluating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Submit Answer</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Question nav dots */}
            <div className="flex items-center gap-2 justify-center">
              {session.questions.map((q, i) => {
                const hasAnswer = session.answers.some((a) => a.questionId === q.id && a.feedback !== null);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSession((s) => ({ ...s, currentIndex: i }));
                      setAnswer("");
                      setState("asking");
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-mono font-bold transition-all",
                      i === session.currentIndex ? "bg-[hsl(var(--civic-gold))] text-primary-foreground" : hasAnswer ? "bg-[hsl(var(--civic-gold))]/20 text-[hsl(var(--civic-gold))]" : "bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
                <RotateCcw className="w-3 h-3" /> Start Over
              </Button>
            </div>
          </>
        )}

        {/* ─── REVIEWING (single answer feedback) ─── */}
        {state === "reviewing" && currentQuestion && currentAnswer && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-[hsl(var(--civic-gold))]/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
                    {currentQuestion.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">Q{session.currentIndex + 1} of {session.questions.length}</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">{currentQuestion.text}</p>

                <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{currentAnswer.answerText}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-2xl font-extrabold tabular-nums" style={{ color: scoreColor(currentAnswer.score ?? 0) }}>
                    {currentAnswer.score ?? "—"}/100
                  </div>
                  <div className="flex-1">
                    <Progress value={currentAnswer.score ?? 0} className="h-2.5" />
                  </div>
                </div>

                {currentAnswer.feedback && (
                  <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3 space-y-2">
                    <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5"><Lightbulb className="w-3 h-3" /> Feedback</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{currentAnswer.feedback}</p>
                  </div>
                )}

                {(currentAnswer.strengths || currentAnswer.improvements) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentAnswer.strengths && (
                      <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                        <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{currentAnswer.strengths}</p>
                      </div>
                    )}
                    {currentAnswer.improvements && (
                      <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
                        <p className="text-xs font-medium text-orange-400 mb-1">To Improve</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{currentAnswer.improvements}</p>
                      </div>
                    )}
                  </div>
                )}

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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── COMPLETE ─── */}
        {state === "complete" && (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="border-[hsl(var(--civic-gold))]/20">
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">Overall Score</p>
                  <div className="text-5xl font-extrabold tabular-nums" style={{ color: scoreColor(session.scoreSummary?.average ?? 0) }}>
                    {session.scoreSummary?.average ?? 0}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <Progress value={session.scoreSummary?.average ?? 0} className="h-3 max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {session.role} at {session.company} — {session.scoreSummary?.answered ?? 0} question{(session.scoreSummary?.answered ?? 0) !== 1 ? "s" : ""} answered
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-3">
              {session.questions.map((q, i) => {
                const a = session.answers.find((ans) => ans.questionId === q.id);
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                    <Card className="border-border/40">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-xs font-mono text-muted-foreground">{q.category}</Badge>
                              {a?.score != null && (
                                <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(a.score) }}>{a.score}/100</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed">{q.text}</p>
                          </div>
                        </div>

                        {a?.answerText && (
                          <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{a.answerText}</p>
                          </div>
                        )}

                        {a?.feedback && (
                          <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3">
                            <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5 mb-1"><Lightbulb className="w-3 h-3" /> Feedback</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{a.feedback}</p>
                          </div>
                        )}

                        {a && (a.strengths || a.improvements) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {a.strengths && (
                              <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                                <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                                <p className="text-sm text-foreground/80 leading-relaxed">{a.strengths}</p>
                              </div>
                            )}
                            {a.improvements && (
                              <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
                                <p className="text-xs font-medium text-orange-400 mb-1">To Improve</p>
                                <p className="text-sm text-foreground/80 leading-relaxed">{a.improvements}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {!a && <p className="text-xs text-muted-foreground italic">Skipped</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-3 justify-center">
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
