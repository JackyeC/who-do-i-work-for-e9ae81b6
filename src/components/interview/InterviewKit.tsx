import { useState } from "react";
import {
  BookOpen, MessageSquare, HelpCircle, ChevronDown, AlertTriangle,
  CheckCircle2, Target, Lightbulb, PenLine, Sparkles,
} from "lucide-react";

// ── Theme tokens ──
const amber = "#f0c040";
const cream = "#f0ebe0";
const muted = "#b8b4a8";
const dimmed = "#7a7590";
const cardBg = "rgba(255,255,255,0.025)";
const cardBorder = "1px solid rgba(255,255,255,0.08)";
const accentBg = "rgba(240,192,64,0.10)";
const accentBorder = "1px solid rgba(240,192,64,0.20)";

// ── Sub-components ──
function KitSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: cardBg, border: cardBorder }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: accentBg }}>
          {icon}
        </div>
        <h3 className="font-sans font-bold" style={{ fontSize: 16, color: cream }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: amber }} />
      <span className="text-sm leading-relaxed" style={{ color: cream }}>{children}</span>
    </div>
  );
}

// ── Data ──
interface PracticeQuestion {
  question: string;
  whyTheyAsk: string;
  howToFrame: string;
}

const ABOUT_YOU: PracticeQuestion[] = [
  {
    question: "Walk me through your career journey and what brought you here.",
    whyTheyAsk: "They want to understand your narrative arc and whether this role fits your trajectory, not just your resume.",
    howToFrame: "Lead with the thread that connects your moves — values, growth, impact. Don't recite your resume. End with why this company and this role is the logical next step for you.",
  },
  {
    question: "What motivates you in your work beyond compensation?",
    whyTheyAsk: "They're gauging mission alignment and intrinsic motivation, especially for values-driven roles.",
    howToFrame: "Be honest about what energizes you. Reference specific things from their mission or culture signals that resonate. Avoid generic answers like 'I love helping people' — get specific.",
  },
  {
    question: "Tell me about a time your personal values influenced a professional decision.",
    whyTheyAsk: "They're testing whether your values are performative or operational — do they actually shape your choices?",
    howToFrame: "Pick a moment where your values created a tension or a tradeoff. Show the decision, the cost, and what you learned. Honesty lands better than polish here.",
  },
];

const ABOUT_ROLE: PracticeQuestion[] = [
  {
    question: "What's your approach to solving a problem you haven't encountered before?",
    whyTheyAsk: "They want to see how you handle ambiguity and whether you default to structure or improvisation.",
    howToFrame: "Walk through your framework: how you gather context, who you consult, how you decide when you have enough information to act. Use a real example that shows composure under uncertainty.",
  },
  {
    question: "Describe a project where you had to influence without authority.",
    whyTheyAsk: "Most roles require cross-functional collaboration. They want evidence you can move things forward without a title.",
    howToFrame: "Focus on the relationship-building and communication strategy, not just the outcome. Show that you understand organizational dynamics, not just deliverables.",
  },
  {
    question: "How do you prioritize when everything feels urgent?",
    whyTheyAsk: "They're assessing your judgment, not your time management. Can you distinguish urgent from important?",
    howToFrame: "Share your actual system — whether it's impact/effort matrices, stakeholder alignment, or something else. Then give a specific example where your prioritization saved the team from a bad decision.",
  },
  {
    question: "What would you want to understand about our operations in your first 30 days?",
    whyTheyAsk: "They're testing whether you're a listener or a fixer. The best hires listen first.",
    howToFrame: "Show intellectual curiosity about their specific context. Reference something from their company signals — a recent change, a growth area, a cultural nuance — and explain why that's where you'd start listening.",
  },
];

const CULTURE_FIT: PracticeQuestion[] = [
  {
    question: "What kind of management style helps you do your best work?",
    whyTheyAsk: "They're checking compatibility with the hiring manager's style and the team's operating norms.",
    howToFrame: "Be direct about what you need — autonomy, regular check-ins, clear expectations. Then flip it: ask what style the team operates under. This shows self-awareness and signals you're evaluating fit, too.",
  },
  {
    question: "How do you handle disagreement with a colleague or manager?",
    whyTheyAsk: "Conflict resolution reveals character. They want to know if you're a collaborator or a avoider.",
    howToFrame: "Use a real example where you disagreed respectfully and the outcome was better for it. Avoid the trap of 'I've never really had conflict' — it's not believable and it's not what they want to hear.",
  },
  {
    question: "What does mission alignment mean to you in practice, not just in theory?",
    whyTheyAsk: "For mission-driven orgs, this is the real interview. They want to know if you'll stay when it gets hard.",
    howToFrame: "Connect it to something specific about their organization. Reference a signal, a program, a decision they've made. Show that you've done the research and that alignment isn't just a talking point for you.",
  },
];

const QUESTIONS_TO_ASK = [
  { q: "How does the product team interface with clinical staff?", note: "Shows domain awareness" },
  { q: "What does success look like in the first 90 days?", note: "Signals you're already planning" },
  { q: "How has the culture changed since the Series B?", note: "Tests culture honesty" },
  { q: "What's the biggest unresolved tension on this team right now?", note: "Surfaces real culture signals" },
  { q: "Where is the company investing resources that won't pay off for 2-3 years?", note: "Shows strategic thinking" },
  { q: "How does leadership respond when the mission and profitability conflict?", note: "Tests mission/values consistency" },
  { q: "If I talked to someone who left this team recently, what would they say?", note: "Surfaces retention signals" },
];

// ── Main Component ──
export function InterviewKit() {
  const [activeTab, setActiveTab] = useState<"prep" | "practice" | "questions">("prep");

  const tabs = [
    { key: "prep" as const, label: "Prep Guide", icon: BookOpen },
    { key: "practice" as const, label: "Practice Questions", icon: HelpCircle },
    { key: "questions" as const, label: "Questions to Ask", icon: MessageSquare },
  ];

  return (
    <div className="w-full max-w-[640px] mx-auto space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: cardBorder }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active ? accentBg : "transparent",
                color: active ? amber : dimmed,
                border: active ? accentBorder : "1px solid transparent",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "prep" && <PrepGuide />}
      {activeTab === "practice" && <PracticeQuestions />}
      {activeTab === "questions" && <QuestionsToAsk />}
    </div>
  );
}

// ── PREP GUIDE ──
function PrepGuide() {
  return (
    <div className="space-y-5">
      <KitSection icon={<Target className="w-4.5 h-4.5" style={{ color: amber }} />} title="Company Background">
        <div className="space-y-2">
          <Bullet>Series B health tech company ($42M raised) — growing 40% YoY with 180 employees</Bullet>
          <Bullet>Patient-centric product suite serving 200+ healthcare systems nationwide</Bullet>
          <Bullet>VP of Product (Jordan Kim) has been there 8 years — strong signal of leadership stability</Bullet>
          <Bullet>Glassdoor trending up (4.3 → 4.5 over 12 months) — culture investments are landing</Bullet>
        </div>
      </KitSection>

      <KitSection icon={<Lightbulb className="w-4.5 h-4.5" style={{ color: amber }} />} title="Role Context">
        <p className="text-sm leading-relaxed mb-4" style={{ color: muted }}>
          This hire solves a specific problem: the product team needs someone who can bridge clinical user needs with the engineering roadmap as they scale post-Series B. They're not hiring for maintenance — they're hiring for growth.
        </p>
        <div className="space-y-2">
          <Bullet>The role was created (not backfilled) — signal of expansion, not replacement</Bullet>
          <Bullet>Reports directly to VP of Product — short feedback loop, high visibility</Bullet>
          <Bullet>Cross-functional with Engineering + Design (expect panel interview)</Bullet>
        </div>
      </KitSection>

      <KitSection icon={<CheckCircle2 className="w-4.5 h-4.5" style={{ color: amber }} />} title="What They Value in Interviews">
        <div className="space-y-2">
          <Bullet><strong style={{ color: cream }}>Patient-first framing</strong> — they want to hear how you think about end-user impact, not just feature shipping</Bullet>
          <Bullet><strong style={{ color: cream }}>Structured thinking</strong> — expect a product case study in round 2; prepare frameworks</Bullet>
          <Bullet><strong style={{ color: cream }}>Collaboration signals</strong> — they weight "how you work with others" as heavily as "what you've shipped"</Bullet>
        </div>
      </KitSection>

      <KitSection icon={<AlertTriangle className="w-4.5 h-4.5" style={{ color: "#f59e0b" }} />} title="Red Flags to Watch For">
        <div className="space-y-2">
          <Bullet>If they can't articulate what success looks like at 90 days — the role may not be well-defined yet</Bullet>
          <Bullet>If the panel interview feels competitive rather than collaborative — team dynamics may be strained</Bullet>
          <Bullet>If they deflect questions about post-Series B culture changes — growth may be outpacing culture</Bullet>
        </div>
      </KitSection>

      <KitSection icon={<Sparkles className="w-4.5 h-4.5" style={{ color: amber }} />} title="How to Close Strong">
        <div className="space-y-2">
          <Bullet>Reiterate your understanding of their specific challenge: scaling patient experience while maintaining quality</Bullet>
          <Bullet>Reference something specific from the conversation that reinforced your interest — don't be generic</Bullet>
          <Bullet>Ask about timeline and next steps confidently — "What does the rest of the process look like?"</Bullet>
          <Bullet>Send a same-day thank you that references one specific insight from the conversation</Bullet>
        </div>
      </KitSection>
    </div>
  );
}

// ── PRACTICE QUESTIONS ──
function PracticeQuestions() {
  return (
    <div className="space-y-8">
      <QuestionCategory title="About You" subtitle="Values, career narrative, motivation" questions={ABOUT_YOU} startIndex={1} />
      <QuestionCategory title="About the Role" subtitle="Skills, experience, approach" questions={ABOUT_ROLE} startIndex={4} />
      <QuestionCategory title="Culture Fit" subtitle="How you work, what you need, mission alignment" questions={CULTURE_FIT} startIndex={8} />
    </div>
  );
}

function QuestionCategory({ title, subtitle, questions, startIndex }: {
  title: string; subtitle: string; questions: PracticeQuestion[]; startIndex: number;
}) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="font-sans font-bold text-sm" style={{ color: cream }}>{title}</h4>
        <p className="text-xs" style={{ color: dimmed }}>{subtitle}</p>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard key={i} question={q} number={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ question, number }: { question: PracticeQuestion; number: number }) {
  const [expanded, setExpanded] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: cardBorder }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: accentBg, color: amber }}
        >
          {number}
        </span>
        <span className="text-sm font-medium leading-relaxed flex-1" style={{ color: cream }}>
          "{question.question}"
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 mt-1 transition-transform"
          style={{ color: dimmed, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {/* Why they ask */}
          <div className="pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: dimmed }}>
              Why they ask this
            </p>
            <p className="text-xs leading-relaxed" style={{ color: muted }}>{question.whyTheyAsk}</p>
          </div>

          {/* How to frame */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: amber }}>
              How to frame your answer
            </p>
            <p className="text-xs leading-relaxed" style={{ color: cream }}>{question.howToFrame}</p>
          </div>

          {/* Practice */}
          {!practicing ? (
            <button
              onClick={() => setPracticing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: accentBg, color: amber, border: accentBorder }}
            >
              <PenLine className="w-3 h-3" />
              Practice
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type or paste your practice answer here…"
                rows={4}
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: cream,
                  caretColor: amber,
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs" style={{ color: dimmed }}>
                  {answer.length > 0 ? `${answer.split(/\s+/).filter(Boolean).length} words` : "Your answers stay private"}
                </p>
                <button
                  onClick={() => setPracticing(false)}
                  className="text-xs font-medium"
                  style={{ color: dimmed }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── QUESTIONS TO ASK ──
function QuestionsToAsk() {
  return (
    <div className="space-y-5">
      <KitSection icon={<MessageSquare className="w-4.5 h-4.5" style={{ color: amber }} />} title="Your Strategic Questions">
        <ol className="space-y-4">
          {QUESTIONS_TO_ASK.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: accentBg, color: amber }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <span className="text-sm leading-relaxed block" style={{ color: cream }}>
                  "{item.q}"
                </span>
                <span className="text-xs font-medium mt-1 block" style={{ color: dimmed }}>
                  {item.note}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </KitSection>

      <div className="rounded-xl p-4 text-center" style={{ background: "rgba(240,192,64,0.04)", border: accentBorder }}>
        <p className="text-xs italic leading-relaxed" style={{ color: muted }}>
          "The questions you ask reveal as much as your answers. Choose ones that matter to you."
        </p>
      </div>
    </div>
  );
}
