import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { WorkplaceDNAShareCard } from "@/components/quiz/WorkplaceDNAShareCard";
import { supabase } from "@/integrations/supabase/client";
import { syncDreamJobProfileRemote } from "@/domain/career/sync-dream-job-profile";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, AlertTriangle, Scan, ChevronRight, Eye } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────
type PersonaKey =
  | "job_seeker"
  | "recruiter"
  | "executive"
  | "researcher"
  | "sales"
  | "marketing"
  | "investor"
  | "journalist"
  | "career_changer";

type NepotismConcern = "high" | "medium" | "low";
type TrustLevel = "skeptic" | "balanced" | "believer";
type DataOrientation = "instinct" | "mixed" | "data";

interface Scores {
  job_seeker: number;
  recruiter: number;
  executive: number;
  researcher: number;
  sales: number;
  marketing: number;
  investor: number;
  journalist: number;
  career_changer: number;
}

interface MetaFlags {
  nepotism_concern: NepotismConcern;
  trust_level: TrustLevel;
  data_orientation: DataOrientation;
}

interface Signal {
  label: string;
  text: string;
}

interface PersonaProfile {
  name: string;
  subtitle: string;
  signals: [Signal, Signal, Signal];
}

interface TileQuestion {
  type: "tiles";
  question: string;
  answers: [string, string, string, string];
}

interface SliderQuestion {
  type: "slider";
  question: string;
  leftLabel: string;
  rightLabel: string;
}

type QuizQuestion = TileQuestion | SliderQuestion;

// ─── QUESTIONS ───────────────────────────────────────────
const QUESTIONS: QuizQuestion[] = [
  {
    type: "tiles",
    question: "Why are you looking at this company right now?",
    answers: [
      "I'm considering working there",
      "I work in recruiting or talent",
      "I'm researching it — for work, study, or a story",
      "I work there — or I make decisions there",
    ],
  },
  {
    type: "tiles",
    question:
      "The last time a company disappointed you — what was the thing you missed?",
    answers: [
      "The culture was nothing like what they described",
      "The stability wasn't there — layoffs, chaos, restructuring",
      "The leadership didn't reflect the values they claimed",
      "The numbers didn't add up — comp, growth, ROI",
    ],
  },
  {
    type: "tiles",
    question: "When you research a company, where do you usually start?",
    answers: [
      "Glassdoor, Reddit, employee reviews",
      "LinkedIn — who works there, who left, who got promoted",
      "News, lawsuits, regulatory filings",
      "Their own site, investor relations, annual reports",
    ],
  },
  {
    type: "tiles",
    question:
      "Have you ever felt like the real decisions at a company were made by a network you couldn't see — and couldn't join?",
    answers: [
      "Yes — and I want to know how to spot it before I commit",
      "Yes — I've seen it from the inside and it cost people",
      "I suspect it but I don't know how to verify it",
      "I want data on this — not just gut feeling",
    ],
  },
  {
    type: "slider",
    question:
      "How much do you trust what a company says publicly about itself?",
    leftLabel: "Not at all — I verify everything",
    rightLabel: "Mostly — I give benefit of the doubt",
  },
  {
    type: "tiles",
    question: "What's riding on getting this right for you?",
    answers: [
      "My next job — I need to make the right call",
      "My pipeline — I'm selling to or partnering with this company",
      "My research — I need citation-ready, defensible data",
      "My organization — I need to know what our talent sees",
    ],
  },
  {
    type: "tiles",
    question:
      "Would it change your decision about a company if you knew the leadership team mostly hired from the same 3 schools, the same previous company, or their own personal network?",
    answers: [
      "Absolutely — that's a red flag I need to see",
      "It depends — I'd want to understand the pattern",
      "Not necessarily — good networks produce good hires",
      "I want this data regardless — it reveals power structure",
    ],
  },
];

// ─── PERSONA PROFILES ────────────────────────────────────
const PERSONA_PROFILES: Record<PersonaKey, PersonaProfile> = {
  job_seeker: {
    name: "The Informed Candidate",
    subtitle:
      "You don't apply blind. You want to know what you're walking into before you ever say yes — culture, comp, values, and whether the offer is real.",
    signals: [
      {
        label: "Integrity Gap score",
        text: "See the distance between what they claim and what the data shows — before you interview.",
      },
      {
        label: "Comp transparency",
        text: "Know the salary range before you waste time on a role that won't pay what you're worth.",
      },
      {
        label: "Ghost posting detection",
        text: "Find out if the role is real — or just keeping the pipeline warm.",
      },
    ],
  },
  recruiter: {
    name: "The Talent Mirror",
    subtitle:
      "You already know what great looks like. What you need is the unfiltered view of what candidates are finding about your company before you ever get on the phone.",
    signals: [
      {
        label: "Candidate perception report",
        text: "See your company the way a skeptical, well-researched candidate sees it.",
      },
      {
        label: "Glassdoor trajectory",
        text: "Is your employer brand trending up or quietly falling? Know before your competitor does.",
      },
      {
        label: "Offer decline patterns",
        text: "The data on why candidates ghost at the offer stage — and what they found first.",
      },
    ],
  },
  executive: {
    name: "The Reckoner",
    subtitle:
      "You've seen the employer brand deck. Now see the audit. What talent finds before they apply is already shaping who says yes — and who says nothing at all.",
    signals: [
      {
        label: "Integrity Gap on your own org",
        text: "What the public record says about your company vs. what your comms team publishes.",
      },
      {
        label: "Peer benchmarking",
        text: "How your signals stack up against the companies competing for the same talent.",
      },
      {
        label: "Talent risk indicators",
        text: "The leading signals of retention problems — before they show up in the exit interview.",
      },
    ],
  },
  researcher: {
    name: "The Pattern Hunter",
    subtitle:
      "The data is public. The picture isn't. You're here to connect the dots that others miss — and to do it in a way that holds up.",
    signals: [
      {
        label: "Lobbying & PAC flows",
        text: "Follow the money from company treasury to political influence — sourced from FEC and LDA.gov.",
      },
      {
        label: "Institutional link networks",
        text: "Map connections between companies, foundations, and political organizations.",
      },
      {
        label: "Cross-company labor trends",
        text: "BLS wage data, WARN Act filings, and NLRB complaints aggregated by sector.",
      },
    ],
  },
  sales: {
    name: "The Deal Auditor",
    subtitle:
      "Before you pitch, partner, or close — you need to know if this company is stable, who really makes decisions, and whether the opportunity is real.",
    signals: [
      {
        label: "Financial stability signals",
        text: "USAspending contracts, SEC filings, and funding signals that tell you if the budget is real.",
      },
      {
        label: "Leadership network map",
        text: "Who actually makes procurement decisions — and who they know.",
      },
      {
        label: "Procurement influence",
        text: "Government contractor status and lobbying spend that affect how deals get made.",
      },
    ],
  },
  marketing: {
    name: "The Brand Auditor",
    subtitle:
      "The employer brand deck says one thing. The public record says another. Your job is to close that gap before a candidate finds it first.",
    signals: [
      {
        label: "Employer brand vs. public record",
        text: "Side-by-side: what your careers page claims vs. what Glassdoor, OSHA, and NLRB show.",
      },
      {
        label: "Narrative risk score",
        text: "When over 80% of press coverage comes from one political perspective, candidates notice.",
      },
      {
        label: "Glassdoor vs. careers page gap",
        text: "The delta between your curated culture story and what employees actually report.",
      },
    ],
  },
  investor: {
    name: "The Signal Reader",
    subtitle:
      "Talent signals predict company health before financials do. You're looking for what the org chart, the turnover, and the culture actually reveal.",
    signals: [
      {
        label: "Leadership stability index",
        text: "C-suite and board churn rates — a leading indicator of strategic risk.",
      },
      {
        label: "Workforce health score",
        text: "Headcount trends, WARN Act filings, and hiring velocity vs. industry baseline.",
      },
      {
        label: "Executive network concentration",
        text: "The Connected Dots — how concentrated is this leadership team's hiring network?",
      },
    ],
  },
  journalist: {
    name: "The Accountability Auditor",
    subtitle:
      "Follow the money. Follow the hires. Follow the board. You need citation-ready data from primary sources — and you need to see what connects.",
    signals: [
      {
        label: "FEC & PAC filing access",
        text: "Direct links to raw filings. Every dollar sourced, every donation linked.",
      },
      {
        label: "Board interlock data",
        text: "Who sits on whose board — and what decisions they approved for each other.",
      },
      {
        label: "Institutional link network map",
        text: "Connections between companies and political/ideological organizations, sourced from ProPublica and SPLC.",
      },
    ],
  },
  career_changer: {
    name: "The Navigator",
    subtitle:
      "You're moving into new territory and you don't have the map yet. You need to know what's real before you commit to an industry or a company you're still learning.",
    signals: [
      {
        label: "Industry stability benchmarks",
        text: "Is this sector growing or contracting? BLS data and WARN Act trends by industry.",
      },
      {
        label: "Entry-level mobility data",
        text: "Do people actually move up here — or is the ladder pulled up after the first hire?",
      },
      {
        label: "Culture vs. claims gap",
        text: "What new hires report in their first 6 months vs. what the job listing promised.",
      },
    ],
  },
};

// ─── SCORING HELPERS ─────────────────────────────────────
const NEPOTISM_PERSONAS: PersonaKey[] = [
  "journalist",
  "researcher",
  "investor",
  "job_seeker",
];

function applyQ1(idx: number, s: Scores) {
  if (idx === 0) { s.job_seeker += 3; s.career_changer += 2; }
  else if (idx === 1) { s.recruiter += 4; }
  else if (idx === 2) { s.researcher += 3; s.journalist += 2; s.investor += 2; }
  else if (idx === 3) { s.executive += 4; s.marketing += 2; }
}
function applyQ2(idx: number, s: Scores) {
  if (idx === 0) { s.job_seeker += 2; s.marketing += 1; }
  else if (idx === 1) { s.investor += 2; s.career_changer += 1; }
  else if (idx === 2) { s.executive += 2; s.journalist += 2; }
  else if (idx === 3) { s.investor += 3; s.sales += 2; }
}
function applyQ3(idx: number, s: Scores) {
  if (idx === 0) { s.job_seeker += 2; s.career_changer += 2; }
  else if (idx === 1) { s.recruiter += 3; s.journalist += 2; }
  else if (idx === 2) { s.journalist += 3; s.researcher += 3; s.investor += 2; }
  else if (idx === 3) { s.investor += 3; s.executive += 2; s.sales += 2; }
}
function applyQ4(idx: number, s: Scores, m: MetaFlags) {
  if (idx === 0) { m.nepotism_concern = "high"; s.job_seeker += 1; }
  else if (idx === 1) { m.nepotism_concern = "high"; s.recruiter += 2; s.executive += 2; }
  else if (idx === 2) { m.nepotism_concern = "medium"; }
  else if (idx === 3) { m.nepotism_concern = "high"; s.researcher += 2; s.investor += 1; }
}
function applyQ5(val: number, s: Scores, m: MetaFlags) {
  if (val <= 30) { m.trust_level = "skeptic"; s.journalist += 1; s.researcher += 1; }
  else if (val <= 60) { m.trust_level = "balanced"; }
  else { m.trust_level = "believer"; s.career_changer += 1; }
}
function applyQ6(idx: number, s: Scores) {
  if (idx === 0) { s.job_seeker += 3; s.career_changer += 2; }
  else if (idx === 1) { s.sales += 4; }
  else if (idx === 2) { s.researcher += 3; s.journalist += 3; }
  else if (idx === 3) { s.executive += 3; s.recruiter += 2; s.marketing += 3; }
}
function applyQ7(idx: number, s: Scores, m: MetaFlags) {
  if (idx === 0) {
    if (m.nepotism_concern !== "high") m.nepotism_concern = "high";
    s.job_seeker += 1;
  } else if (idx === 1) {
    if (m.nepotism_concern === "low") m.nepotism_concern = "medium";
  } else if (idx === 2) {
    m.nepotism_concern = "low";
  } else if (idx === 3) {
    s.researcher += 2; s.journalist += 1; s.investor += 1;
    m.data_orientation = "data";
  }
}

function getSliderLabel(val: number): string {
  if (val <= 20) return "Show me everything they're hiding";
  if (val <= 40) return "Trust but verify";
  if (val <= 60) return "Balanced — context matters";
  if (val <= 80) return "Mostly positive until proven otherwise";
  return "I tend to take companies at their word";
}

function resolvePersonas(
  scores: Scores,
  nepotism: NepotismConcern
): { primary: PersonaKey; secondary: PersonaKey } {
  const entries = (Object.entries(scores) as [PersonaKey, number][]).sort(
    (a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      // tie-break: favor higher nepotism_concern personas
      const aHasNep = NEPOTISM_PERSONAS.includes(a[0]) ? 1 : 0;
      const bHasNep = NEPOTISM_PERSONAS.includes(b[0]) ? 1 : 0;
      if (nepotism === "high") return bHasNep - aHasNep;
      return 0;
    }
  );
  return { primary: entries[0][0], secondary: entries[1][0] };
}

// ─── WELCOME BACK INTERSTITIAL ───────────────────────────
function WelcomeBackInterstitial({
  profileName,
  onViewResults,
  onRetake,
}: {
  profileName: string;
  onViewResults: () => void;
  onRetake: () => void;
}) {
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown display
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    // Auto-advance after 3s
    autoTimerRef.current = setTimeout(onViewResults, 3000);
    return () => {
      clearInterval(interval);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [onViewResults]);

  const handleRetake = () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    onRetake();
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: "#0a0a0e", fontFamily: "'DM Sans', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-[400px] px-6"
      >
        <div className="text-4xl mb-4 font-black">W?</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#f5f0e8" }}>
          Welcome back, {profileName}.
        </h2>
        <p className="text-sm mb-6" style={{ color: "rgba(245,240,232,0.55)" }}>
          Your intelligence profile is ready.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
              onViewResults();
            }}
            className="px-6 py-3 text-sm font-mono tracking-wider uppercase font-bold transition-all hover:opacity-90 rounded-sm"
            style={{
              background: "hsl(var(--primary))",
              color: "#0a0a0e",
              boxShadow: "0 0 20px rgba(201,168,76,0.25)",
            }}
          >
            View My Results{countdown > 0 ? ` (${countdown}s)` : ""}
          </button>
          <button
            onClick={handleRetake}
            className="px-6 py-3 text-xs font-mono tracking-wider uppercase border transition-opacity hover:opacity-80"
            style={{ borderColor: "rgba(245,240,232,0.12)", color: "rgba(245,240,232,0.45)" }}
          >
            Start fresh instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────
const TOTAL_QUESTIONS = 7;

export default function Quiz() {
  const [step, setStep] = useState(0); // 0-6 = questions, 7 = results
  const [answers, setAnswers] = useState<(number | null)[]>([
    null, null, null, null, null, null, null,
  ]);
  const [sliderVal, setSliderVal] = useState(50);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [result, setResult] = useState<{
    primary: PersonaKey;
    secondary: PersonaKey;
    meta: MetaFlags;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [savedProfile, setSavedProfile] = useState<{ primary: PersonaKey; secondary: PersonaKey; meta: MetaFlags } | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Detect returning visitor — auth-aware: DB profile takes priority over localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Wait for auth to settle first
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;

        // If logged in, check DB for quiz results first
        if (user) {
          const { data: dbResult } = await (supabase as any)
            .from("wdiwf_quiz_results")
            .select("result_profile, result_secondary, meta_flags")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (dbResult?.result_profile && dbResult?.result_secondary && dbResult?.meta_flags) {
            const dbProfile = {
              primary: dbResult.result_profile as PersonaKey,
              secondary: dbResult.result_secondary as PersonaKey,
              meta: dbResult.meta_flags as MetaFlags,
            };
            setSavedProfile(dbProfile);
            setShowWelcomeBack(true);
            setCheckingProfile(false);
            return;
          }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem("workDnaProfile");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.primary && parsed.secondary && parsed.meta) {
              setSavedProfile(parsed);
              setShowWelcomeBack(true);
            }
          } catch {}
        }
      } catch {
        // Auth check failed — fall back to localStorage silently
        const saved = localStorage.getItem("workDnaProfile");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.primary && parsed.secondary && parsed.meta) {
              setSavedProfile(parsed);
              setShowWelcomeBack(true);
            }
          } catch {}
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isResults = step === TOTAL_QUESTIONS;
  const progressPct = isResults ? 100 : (step / TOTAL_QUESTIONS) * 100;

  const canAdvance = useMemo(() => {
    if (isResults) return false;
    const q = QUESTIONS[step];
    if (q.type === "slider") return true;
    return answers[step] !== null;
  }, [step, answers, isResults]);

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectAnswer = useCallback(
    (idx: number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = idx;
        return next;
      });
      // Auto-advance after 400ms for tile questions (not the last question)
      const q = QUESTIONS[step];
      if (q.type === "tiles" && step < TOTAL_QUESTIONS - 1) {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = setTimeout(() => {
          setDirection("left");
          setStep((s) => s + 1);
        }, 400);
      }
    },
    [step]
  );

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const computeResults = useCallback(() => {
    const s: Scores = {
      job_seeker: 0, recruiter: 0, executive: 0, researcher: 0,
      sales: 0, marketing: 0, investor: 0, journalist: 0, career_changer: 0,
    };
    const m: MetaFlags = {
      nepotism_concern: "low",
      trust_level: "balanced",
      data_orientation: "mixed",
    };

    applyQ1(answers[0]!, s);
    applyQ2(answers[1]!, s);
    applyQ3(answers[2]!, s);
    applyQ4(answers[3]!, s, m);
    applyQ5(sliderVal, s, m);
    applyQ6(answers[5]!, s);
    applyQ7(answers[6]!, s, m);

    const { primary, secondary } = resolvePersonas(s, m.nepotism_concern);

    const profileData = { primary, secondary, meta: m };
    localStorage.setItem("workDnaProfile", JSON.stringify(profileData));
    localStorage.setItem("wdiwf_persona", primary);
    localStorage.setItem("wdiwf_nepotism_flag", m.nepotism_concern);
    localStorage.setItem("wdiwf_trust", m.trust_level);

    setResult({ primary, secondary, meta: m });

    void (async () => {
      // Save quiz results to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from("wdiwf_quiz_results").insert({
          user_id: user?.id ?? null,
          answers,
          slider_value: sliderVal,
          result_profile: primary,
          result_secondary: secondary,
          scores: s,
          meta_flags: m,
        });
      } catch (e) {
        console.warn("Quiz result save failed", e);
      }

      // Sync dream job profile if logged in
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncDreamJobProfileRemote(supabase, user.id);
        }
      } catch (e) {
        console.warn("Dream job profile sync failed", e);
      }
    })();
  }, [answers, sliderVal]);

  const advance = useCallback(() => {
    if (!canAdvance) return;
    setDirection("left");
    if (step === TOTAL_QUESTIONS - 1) {
      computeResults();
    }
    setStep((s) => s + 1);
  }, [canAdvance, step, computeResults]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    setDirection("right");
    setStep((s) => s - 1);
  }, [step]);

  const reset = useCallback(() => {
    localStorage.removeItem("workDnaProfile");
    localStorage.removeItem("wdiwf_persona");
    localStorage.removeItem("wdiwf_nepotism_flag");
    localStorage.removeItem("wdiwf_trust");
    setDirection("right");
    setStep(0);
    setAnswers([null, null, null, null, null, null, null]);
    setSliderVal(50);
    setResult(null);
  }, []);

  const copyProfile = useCallback(async () => {
    if (!result) return;
    const name = PERSONA_PROFILES[result.primary].name;
    const shareText = `I'm ${name}. I audit before I apply. wdiwf.jackyeclayton.com/join`;

    const showCopyToast = (message: string) => {
      let toast = document.getElementById('share-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        Object.assign(toast.style, {
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: '#f0c040', color: '#0a0a0e', fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: '600', padding: '10px 24px', borderRadius: '50px',
          zIndex: '9999', whiteSpace: 'nowrap', pointerEvents: 'none',
          transition: 'opacity 0.3s ease', opacity: '0',
        });
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.opacity = '1';
      setTimeout(() => { toast!.style.opacity = '0'; }, 2500);
    };

    try {
      await navigator.clipboard.writeText(shareText);
      showCopyToast('Copied to clipboard ✓');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = shareText;
        Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopyToast('Copied to clipboard ✓');
      } catch {
        showCopyToast('Copy this: ' + shareText);
      }
    }
  }, [result]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canAdvance && !isResults) advance();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canAdvance, advance, isResults]);

  // Loading shimmer while checking for existing profile
  if (checkingProfile) {
    return (
      <div
        className="fixed inset-0 overflow-hidden flex items-center justify-center"
        style={{ background: "#0a0a0e", fontFamily: "'DM Sans', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#C9A84C",
              animation: "spin 0.6s linear infinite",
            }}
          />
          <motion.p
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: "rgba(245,240,232,0.5)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
          >
            Loading your profile…
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Welcome-back interstitial for returning visitors — auto-advances after 2s
  if (showWelcomeBack && savedProfile) {
    const profileName = PERSONA_PROFILES[savedProfile.primary]?.name || "Your Profile";
    const goToResults = () => {
      setResult(savedProfile);
      setStep(TOTAL_QUESTIONS);
      setShowWelcomeBack(false);
    };
    return (
      <WelcomeBackInterstitial
        profileName={profileName}
        onViewResults={goToResults}
        onRetake={() => { setShowWelcomeBack(false); reset(); }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#0a0a0e", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Grain overlay */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 50, opacity: 0.04 }}
      >
        <filter id="quizGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#quizGrain)" />
      </svg>

      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0" style={{ zIndex: 60 }}>
        {!isResults && (
          <>
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{
                textAlign: "center",
                padding: "10px 0 6px",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: "hsl(var(--muted-foreground))",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Question {step + 1} of {TOTAL_QUESTIONS}
            </div>
            <div
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={TOTAL_QUESTIONS}
              aria-label={`Quiz progress: question ${step + 1} of ${TOTAL_QUESTIONS}`}
              style={{ height: 3, background: "rgba(255,255,255,0.05)" }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "hsl(var(--primary))",
                  transition: "width 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
                  boxShadow: progressPct >= 100 ? "0 0 16px 4px hsl(var(--primary) / 0.5)" : "none",
                }}
              />
            </div>
          </>
        )}
        {isResults && (
          <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ height: "100%", width: "100%", background: "hsl(var(--primary))" }} />
          </div>
        )}
      </div>

      {/* Slide track */}
      <div
        className="flex h-full"
        style={{
          width: `${(TOTAL_QUESTIONS + 1) * 100}vw`,
          transform: `translateX(-${step * 100}vw)`,
          transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Question screens */}
        {QUESTIONS.map((q, qIdx) => (
          <div
            key={qIdx}
            className="flex flex-col items-center justify-center px-6"
            style={{ width: "100vw", minHeight: "100vh" }}
          >
            <div className="w-full" style={{ maxWidth: 640 }}>
              {/* Question text */}
              <h2
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(24px, 4vw, 36px)",
                  color: "#f0ebe0",
                  lineHeight: 1.3,
                  marginBottom: 40,
                  textAlign: "center",
                }}
              >
                {q.question}
              </h2>

              {q.type === "tiles" ? (
                <TileGrid
                  answers={(q as TileQuestion).answers}
                  selected={answers[qIdx]}
                  onSelect={selectAnswer}
                />
              ) : (
                <SliderInput
                  value={sliderVal}
                  onChange={setSliderVal}
                  leftLabel={(q as SliderQuestion).leftLabel}
                  rightLabel={(q as SliderQuestion).rightLabel}
                />
              )}

              {/* Buttons */}
              <div
                className="flex items-center justify-center gap-3 mt-10"
                style={{ minHeight: 52 }}
              >
                {qIdx > 0 && (
                  <button
                    onClick={goBack}
                    aria-label="Go to previous question"
                    className="quiz-focus-ring"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "hsl(var(--muted-foreground))",
                      borderRadius: 50,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(240,192,64,0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.07)")
                    }
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={advance}
                  disabled={!canAdvance}
                  aria-label={qIdx === TOTAL_QUESTIONS - 1 ? "See my profile" : "Go to next question"}
                  className="quiz-focus-ring"
                  style={{
                    background: canAdvance ? "#f0c040" : "rgba(240,192,64,0.25)",
                    color: "#0a0a0e",
                    borderRadius: 50,
                    padding: "14px 36px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: canAdvance ? "pointer" : "not-allowed",
                    border: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s, opacity 0.2s",
                    opacity: canAdvance ? 1 : 0.5,
                  }}
                >
                  {qIdx === TOTAL_QUESTIONS - 1 ? "See my profile" : "Next →"}
                </button>
              </div>
              {/* Reset link on first question screen */}
              {qIdx === 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={reset}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(245,240,232,0.35)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
                  >
                    Already took the quiz? Reset and start over.
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Results screen */}
        <div
          className="flex flex-col items-center justify-center px-6"
          style={{ width: "100vw", minHeight: "calc(100vh - 100px)", paddingTop: 100 }}
        >
          {result && <ResultsScreen result={result} onReset={reset} onCopy={copyProfile} />}
        </div>
      </div>
    </div>
  );
}

// ─── TILE GRID ───────────────────────────────────────────
function TileGrid({
  answers,
  selected,
  onSelect,
}: {
  answers: string[];
  selected: number | null;
  onSelect: (idx: number) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % answers.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + answers.length) % answers.length;
    } else {
      return;
    }
    onSelect(next);
    const container = e.currentTarget.parentElement;
    const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[next]?.focus();
  };

  return (
    <div
      className="grid gap-4"
      role="radiogroup"
      aria-label="Choose one answer"
      style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
    >
      {answers.map((text, idx) => {
        const isSelected = selected === idx;
        return (
          <button
            key={idx}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (selected === null && idx === 0) ? 0 : -1}
            onClick={() => onSelect(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="text-left quiz-focus-ring active:scale-[0.97]"
            style={{
              background: isSelected
                ? "rgba(240,192,64,0.12)"
                : "#1a1826",
              border: `1px solid ${
                isSelected
                  ? "#f0c040"
                  : "rgba(255,255,255,0.07)"
              }`,
              borderRadius: 14,
              padding: "20px 22px",
              color: isSelected ? "#f0ebe0" : "#7a7590",
              fontSize: 14,
              lineHeight: 1.55,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition:
                "border-color 0.2s, background 0.2s, transform 0.15s, color 0.2s, box-shadow 0.3s",
              transform: isSelected ? "scale(1.02)" : "scale(1)",
              boxShadow: isSelected
                ? "0 0 12px 2px rgba(240,192,64,0.15)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = "rgba(240,192,64,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              }
            }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

// ─── SLIDER INPUT ────────────────────────────────────────
function SliderInput({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="w-full" style={{ maxWidth: 520, margin: "0 auto" }}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Trust level: ${getSliderLabel(value)}`}
        aria-valuetext={getSliderLabel(value)}
        className="quiz-slider quiz-focus-ring w-full"
        style={{
          WebkitAppearance: "none",
          appearance: "none",
          height: 3,
          background: `linear-gradient(to right, #f0c040 ${value}%, rgba(255,255,255,0.07) ${value}%)`,
          borderRadius: 2,
          outline: "none",
        }}
      />
      <div
        className="flex justify-between mt-3"
        style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
      >
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <p
        className="text-center mt-6"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontStyle: "italic",
          fontSize: 18,
          color: "#f0c040",
          minHeight: 28,
        }}
      >
        {getSliderLabel(value)}
      </p>
    </div>
  );
}

// ─── DOSSIER MODULE SHIMMER ──────────────────────────────
function DossierShimmer({ label, delay = 0 }: { label: string; delay?: number }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800 + delay * 600);
    return () => clearTimeout(t);
  }, [delay]);

  if (loaded) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 5,
      background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.06) 50%, transparent 100%)",
      backgroundSize: "200% 100%",
      animation: "dossierShimmer 1.5s ease infinite",
      borderRadius: 12, pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute", bottom: 8, right: 12,
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, color: "rgba(201,168,76,0.5)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <Scan size={10} /> Scanning…
      </div>
    </div>
  );
}

// ─── SOURCE BADGE ────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "rgba(201,168,76,0.55)",
      fontFamily: "'DM Sans', sans-serif",
      background: "rgba(201,168,76,0.06)",
      border: "1px solid rgba(201,168,76,0.12)",
      borderRadius: 4, padding: "2px 8px",
    }}>
      <Eye size={8} /> Source: {source}
    </span>
  );
}

// ─── BLURRED SECTION ─────────────────────────────────────
function BlurredSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: "relative", borderRadius: 12,
      background: "#161514",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "20px 22px", overflow: "hidden",
    }}>
      <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(10,10,14,0.6)",
        backdropFilter: "blur(2px)",
        borderRadius: 12,
      }}>
        <Lock size={24} style={{ color: "#C9A84C", marginBottom: 8 }} />
        <span style={{
          fontSize: 13, fontWeight: 600, color: "#f0ebe0",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 11, color: "hsl(var(--muted-foreground))",
          fontFamily: "'DM Sans', sans-serif", marginTop: 2,
        }}>
          Requires Intelligence Dossier access
        </span>
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN (Intelligence Dossier) ───────────────
function ResultsScreen({
  result,
  onReset,
  onCopy,
}: {
  result: {
    primary: PersonaKey;
    secondary: PersonaKey;
    meta: MetaFlags;
  };
  onReset: () => void;
  onCopy: () => void;
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();
  const profile = PERSONA_PROFILES[result.primary];
  const secondaryProfile = PERSONA_PROFILES[result.secondary];
  const showNepotism = result.meta.nepotism_concern === "high";
  const userName = user?.user_metadata?.full_name?.split(" ")[0]
    || user?.user_metadata?.name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || null;

  // Alignment summary based on meta
  const alignmentVerdict = useMemo(() => {
    if (result.meta.trust_level === "skeptic") return "You question everything — and that's your edge.";
    if (result.meta.data_orientation === "data") return "You follow the receipts, not the branding.";
    if (result.meta.nepotism_concern === "high") return "You see the hidden networks others miss.";
    return "You know what matters — now you need the data to prove it.";
  }, [result.meta]);

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: 620 }}>
      {/* Personalized greeting */}
      {userName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: 13, color: "hsl(var(--muted-foreground))",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 20, letterSpacing: "0.02em",
          }}
        >
          {userName}, here is what we found.
        </motion.p>
      )}

      {/* ── 1. PRIMARY CAREER SIGNAL (Hero Insight) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #161514 0%, #1a1917 100%)",
          border: "1px solid #C9A84C",
          borderRadius: 14,
          padding: "28px 24px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold glow effect */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 120, height: 120,
          background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Shield size={24} style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#C9A84C",
              fontFamily: "'DM Sans', sans-serif",
              display: "block", marginBottom: 6,
            }}>
              Primary Career Signal
            </span>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700, fontSize: 28,
              color: "#f0ebe0", lineHeight: 1.15,
              marginBottom: 8,
            }}>
              {profile.name}
            </h2>
            <p style={{
              fontSize: 14, color: "hsl(var(--muted-foreground))",
              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
            }}>
              {alignmentVerdict}
            </p>
          </div>
        </div>

        <div style={{
          marginTop: 16, paddingTop: 16,
          borderTop: "1px solid rgba(201,168,76,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: 12, color: "hsl(var(--muted-foreground))",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Secondary signal: <span style={{ color: "#f0ebe0" }}>{secondaryProfile.name}</span>
          </span>
          <SourceBadge source="Work DNA Analysis" />
        </div>
      </motion.div>

      {/* ── 2. SIGNALS TO WATCH (with shimmer) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ width: "100%", marginBottom: 24 }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "hsl(var(--muted-foreground))",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Your Intelligence Signals
          </span>
          <SourceBadge source="Behavioral Model" />
        </div>

        <div className="flex flex-col gap-3">
          {profile.signals.map((sig, i) => (
            <div key={i} style={{ position: "relative" }}>
              <DossierShimmer label={sig.label} delay={i} />
              <SignalChip signal={sig} delay={0.4 + i * 0.12} />
            </div>
          ))}
          {showNepotism && (
            <div style={{ position: "relative" }}>
              <DossierShimmer label="Connected Dots" delay={3} />
              <SignalChip
                signal={{
                  label: "Connected Dots",
                  text: "You flagged hidden networks as a priority. Every company audit will surface this signal first.",
                }}
                delay={0.85}
                dotColor="#ff6b35"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 3. POLITICAL DNA (partially visible) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          width: "100%",
          background: "#161514",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "20px 22px",
          marginBottom: 16,
          position: "relative",
        }}
      >
        <DossierShimmer label="Political DNA" delay={4} />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#C9A84C",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Political DNA Preview
          </span>
          <SourceBadge source="FEC Filings" />
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 8,
          background: "rgba(201,168,76,0.06)",
          border: "1px solid rgba(201,168,76,0.12)",
        }}>
          <AlertTriangle size={18} style={{ color: "#C9A84C", flexShrink: 0 }} />
          <div>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#f0ebe0",
              fontFamily: "'DM Sans', sans-serif", display: "block",
            }}>
              {result.meta.trust_level === "skeptic"
                ? "TRUST LEVEL: SKEPTIC"
                : result.meta.trust_level === "balanced"
                ? "TRUST LEVEL: BALANCED"
                : "TRUST LEVEL: BELIEVER"}
            </span>
            <span style={{
              fontSize: 12, color: "hsl(var(--muted-foreground))",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {result.meta.data_orientation === "data"
                ? "You'll want receipts for every claim."
                : result.meta.data_orientation === "instinct"
                ? "You read between the lines — we'll give you the lines."
                : "A blend of instinct and evidence shapes your decisions."}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── 4. BLURRED PAYWALL SECTIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="w-full flex flex-col gap-3"
        style={{ marginBottom: 24 }}
      >
        <BlurredSection title="Leadership Network">
          <div style={{ padding: 8 }}>
            <p style={{ fontSize: 13, color: "#f0ebe0", marginBottom: 8 }}>Board Connections: 12 detected</p>
            <p style={{ fontSize: 13, color: "#f0ebe0", marginBottom: 8 }}>Political Network Ties: 4 flagged</p>
            <p style={{ fontSize: 13, color: "#f0ebe0" }}>Revolving Door Signals: 2 active</p>
          </div>
        </BlurredSection>

        <BlurredSection title="Executive Pay Gap Analysis">
          <div style={{ padding: 8 }}>
            <p style={{ fontSize: 13, color: "#f0ebe0", marginBottom: 8 }}>CEO-to-Median Ratio: 287:1</p>
            <p style={{ fontSize: 13, color: "#f0ebe0", marginBottom: 8 }}>Industry Benchmark: 198:1</p>
            <p style={{ fontSize: 13, color: "#f0ebe0" }}>Pay Equity Grade: C+</p>
          </div>
        </BlurredSection>
      </motion.div>

      {/* ── 5. UNLOCK CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="w-full flex flex-col items-center"
        style={{ marginBottom: 32 }}
      >
        <a
          href="/login"
          className="quiz-focus-ring"
          aria-label="Unlock the full intelligence dossier"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", maxWidth: 420,
            background: "#C9A84C",
            color: "#0a0a0e",
            borderRadius: 50,
            padding: "16px 36px",
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "box-shadow 0.3s ease, transform 0.15s ease",
            boxShadow: "0 0 20px 4px rgba(201,168,76,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 30px 8px rgba(201,168,76,0.35)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 20px 4px rgba(201,168,76,0.2)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Unlock the Full Intelligence Dossier
          <ChevronRight size={18} />
        </a>

        <p style={{
          fontSize: 11, color: "hsl(var(--muted-foreground))",
          fontFamily: "'DM Sans', sans-serif",
          marginTop: 10, textAlign: "center",
        }}>
          Create a free account to save results and access full company scans.
        </p>
      </motion.div>

      {/* ── 6. SECONDARY ACTIONS ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.95 }}
        className="flex flex-col sm:flex-row items-center gap-3"
        style={{ marginBottom: 16 }}
      >
        <button
          onClick={() => setShowShareModal(true)}
          className="quiz-focus-ring"
          aria-label="Share your Workplace DNA"
          style={{
            background: "#221f30",
            border: "1px solid rgba(201,168,76,0.3)",
            color: "#C9A84C",
            borderRadius: 50,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
        >
          Share your DNA →
        </button>
        <button
          onClick={onCopy}
          className="quiz-focus-ring"
          aria-label="Copy profile text to clipboard"
          style={{
            background: "#221f30",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#f0ebe0",
            borderRadius: 50,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
        >
          Copy my profile
        </button>
      </motion.div>

      {/* Browse / retake */}
      <a
        href="/browse"
        className="quiz-focus-ring"
        aria-label="Browse companies"
        style={{
          fontSize: 13, color: "hsl(var(--muted-foreground))",
          textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        Or browse companies first →
      </a>

      <button
        onClick={onReset}
        className="quiz-focus-ring"
        aria-label="Retake the quiz"
        style={{
          marginTop: 16, background: "none", border: "none",
          color: "rgba(245,240,232,0.4)", fontSize: 12,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.4)")}
      >
        ← Retake the quiz
      </button>

      {/* Share Modal */}
      {showShareModal && result && (
        <WorkplaceDNAShareCard
          archetypeName={PERSONA_PROFILES[result.primary].name}
          archetypeSubtitle={PERSONA_PROFILES[result.primary].subtitle}
          signals={PERSONA_PROFILES[result.primary].signals}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// ─── SIGNAL CHIP ─────────────────────────────────────────
function SignalChip({
  signal,
  delay,
  dotColor = "#f0c040",
}: {
  signal: Signal;
  delay: number;
  dotColor?: string;
}) {
  return (
    <div
      style={{
        background: "#1a1826",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        animation: `quizFadeUp 0.6s ease ${delay}s both`,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <div>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#f0c040",
            display: "block",
            marginBottom: 2,
          }}
        >
          {signal.label}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.5,
          }}
        >
          {signal.text}
        </span>
      </div>
    </div>
  );
}
