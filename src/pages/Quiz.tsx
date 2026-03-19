import { useState, useCallback, useMemo, useEffect } from "react";

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
        label: "Reality Gap score",
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
        label: "Reality Gap on your own org",
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
        text: "The Insider Score — how concentrated is this leadership team's hiring network?",
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

  const isResults = step === TOTAL_QUESTIONS;
  const progressPct = isResults ? 100 : (step / TOTAL_QUESTIONS) * 100;

  const canAdvance = useMemo(() => {
    if (isResults) return false;
    const q = QUESTIONS[step];
    if (q.type === "slider") return true;
    return answers[step] !== null;
  }, [step, answers, isResults]);

  const selectAnswer = useCallback(
    (idx: number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = idx;
        return next;
      });
    },
    [step]
  );

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

    localStorage.setItem("wdiwf_persona", primary);
    localStorage.setItem("wdiwf_nepotism_flag", m.nepotism_concern);
    localStorage.setItem("wdiwf_trust", m.trust_level);

    setResult({ primary, secondary, meta: m });
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

      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 right-0"
        style={{ height: 3, background: "rgba(255,255,255,0.05)", zIndex: 60 }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "#f0c040",
            transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>

      {/* Slide track */}
      <div
        className="flex h-full"
        style={{
          width: `${(TOTAL_QUESTIONS + 1) * 100}vw`,
          transform: `translateX(-${step * 100}vw)`,
          transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
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
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#7a7590",
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
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
    >
      {answers.map((text, idx) => {
        const isSelected = selected === idx;
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className="text-left"
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
                "border-color 0.2s, background 0.2s, transform 0.2s, color 0.2s",
              transform: isSelected ? "scale(1.02)" : "scale(1)",
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
      <style>{`
        input.quiz-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #f0c040;
          cursor: pointer;
          box-shadow: 0 0 0 6px rgba(240,192,64,0.15), 0 0 16px rgba(240,192,64,0.2);
          transition: transform 0.15s;
          border: none;
        }
        input.quiz-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input.quiz-slider::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #f0c040;
          cursor: pointer;
          box-shadow: 0 0 0 6px rgba(240,192,64,0.15), 0 0 16px rgba(240,192,64,0.2);
          border: none;
        }
      `}</style>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="quiz-slider w-full"
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
        style={{ fontSize: 11, color: "#7a7590", fontFamily: "'DM Sans', sans-serif" }}
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

// ─── RESULTS SCREEN ──────────────────────────────────────
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
  const profile = PERSONA_PROFILES[result.primary];
  const secondaryProfile = PERSONA_PROFILES[result.secondary];
  const showNepotism = result.meta.nepotism_concern === "high";

  return (
    <div
      className="w-full flex flex-col items-center"
      style={{ maxWidth: 560 }}
    >
      {/* Badge */}
      <span
        style={{
          display: "inline-block",
          background: "rgba(240,192,64,0.12)",
          border: "1px solid rgba(240,192,64,0.3)",
          color: "#f0c040",
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 24,
          animation: "quizFadeUp 0.6s ease both",
        }}
      >
        Your Intelligence Profile
      </span>

      {/* Primary persona name */}
      <h1
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 56px)",
          letterSpacing: "-1.5px",
          color: "#f0ebe0",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: 16,
          animation: "quizFadeUp 0.6s ease 0.1s both",
        }}
      >
        {profile.name}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 16,
          color: "#7a7590",
          lineHeight: 1.7,
          maxWidth: 420,
          textAlign: "center",
          marginBottom: 12,
          fontFamily: "'DM Sans', sans-serif",
          animation: "quizFadeUp 0.6s ease 0.25s both",
        }}
      >
        {profile.subtitle}
      </p>

      {/* Secondary */}
      <p
        style={{
          fontSize: 13,
          color: "#7a7590",
          textAlign: "center",
          marginBottom: 36,
          fontFamily: "'DM Sans', sans-serif",
          animation: "quizFadeUp 0.6s ease 0.35s both",
        }}
      >
        You also think like{" "}
        <span style={{ color: "#f0ebe0" }}>{secondaryProfile.name}</span>
      </p>

      {/* Signals header */}
      <p
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "#7a7590",
          marginBottom: 14,
          fontFamily: "'DM Sans', sans-serif",
          animation: "quizFadeUp 0.6s ease 0.35s both",
        }}
      >
        Your signals to watch
      </p>

      {/* Signal chips */}
      <div className="w-full flex flex-col gap-3" style={{ maxWidth: 560 }}>
        {profile.signals.map((sig, i) => (
          <SignalChip key={i} signal={sig} delay={0.4 + i * 0.15} />
        ))}
        {showNepotism && (
          <SignalChip
            signal={{
              label: "Insider Score",
              text: "You flagged hidden networks as a priority. Every company audit will surface this signal first.",
            }}
            delay={0.85}
            dotColor="#ff6b35"
          />
        )}
      </div>

      {/* CTA buttons */}
      <div
        className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full sm:w-auto"
        style={{ animation: "quizFadeUp 0.6s ease 0.95s both", paddingBottom: 48 }}
      >
        <a
          href="/dashboard"
          style={{
            background: "#f0c040",
            color: "#0a0a0e",
            borderRadius: 50,
            padding: "14px 36px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "opacity 0.2s",
            display: "inline-block",
          }}
        >
          Run your first company audit →
        </a>
        <button
          onClick={onCopy}
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
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(240,192,64,0.3)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
          }
        >
          Share my profile
        </button>
      </div>

      {/* Early access link */}
      <a
        href="/join"
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "#7a7590",
          textDecoration: "none",
          fontFamily: "'DM Sans', sans-serif",
          animation: "quizFadeUp 0.6s ease 1.1s both",
          display: "inline-block",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        Launching April 1 — secure your spot →
      </a>

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          marginTop: 24,
          background: "none",
          border: "none",
          color: "#7a7590",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Start over
      </button>

      {/* Keyframe styles */}
      <style>{`
        @keyframes quizFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
            fontSize: 11,
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
            color: "#7a7590",
            lineHeight: 1.5,
          }}
        >
          {signal.text}
        </span>
      </div>
    </div>
  );
}
