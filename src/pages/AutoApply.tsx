import { useState, useCallback, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";
import { InterviewKit } from "@/components/interview/InterviewKit";
import { Helmet } from "react-helmet-async";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  GripVertical,
  X,
  Briefcase,
  Heart,
  ShieldAlert,
  FileText,
} from "lucide-react";

/* ── constants ── */
const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "Government",
  "Retail & E-Commerce",
  "Manufacturing",
  "Media & Entertainment",
  "Energy & Utilities",
  "Legal",
  "Nonprofit",
  "Real Estate",
  "Consulting",
  "Transportation & Logistics",
];

const VALUES = [
  "Work-life balance",
  "Mission-driven work",
  "Growth opportunities",
  "Team culture",
  "Compensation",
  "Flexibility",
  "Diversity & inclusion",
  "Stability",
  "Innovation",
];

const LOCATION_OPTIONS = ["Remote", "Hybrid", "On-site", "Open to relocation"];

/* ── types ── */
interface FormData {
  jobTitles: string[];
  industries: string[];
  locationPrefs: string[];
  salaryRange: [number, number];
  valuesRanking: string[];
  blockedCompanies: string[];
  blockedIndustries: string[];
  minIntegrityScore: number;
  resumeFile: File | null;
}

const INITIAL: FormData = {
  jobTitles: [],
  industries: [],
  locationPrefs: [],
  salaryRange: [50000, 150000],
  valuesRanking: [...VALUES],
  blockedCompanies: [],
  blockedIndustries: [],
  minIntegrityScore: 60,
  resumeFile: null,
};

/* ── small reusable bits ── */
const sectionBg = "rgba(255,255,255,0.02)";
const sectionBorder = "1px solid rgba(255,255,255,0.08)";
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f0ebe0",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  fontFamily: "'DM Sans', sans-serif",
};

function TagInput({
  tags,
  setTags,
  placeholder,
}: {
  tags: string[];
  setTags: (t: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setValue("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(240,192,64,0.12)", color: "#f0c040", border: "1px solid rgba(240,192,64,0.25)" }}
          >
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 h-[44px] px-4 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(240,192,64,0.12)", color: "#f0c040", border: "1px solid rgba(240,192,64,0.25)" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  setSelected,
}: {
  options: string[];
  selected: string[];
  setSelected: (s: string[]) => void;
}) {
  const toggle = (o: string) =>
    setSelected(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className="px-3 py-2 rounded-full text-xs font-medium transition-all"
            style={{
              background: active ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.04)",
              border: active ? "1px solid rgba(240,192,64,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: active ? "#f0c040" : "#b8b4a8",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ── drag-to-rank ── */
function RankList({ items, setItems }: { items: string[]; setItems: (i: string[]) => void }) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const copy = [...items];
    const [removed] = copy.splice(dragItem.current, 1);
    copy.splice(dragOver.current, 0, removed);
    setItems(copy);
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => (dragItem.current = i)}
          onDragEnter={() => (dragOver.current = i)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing select-none"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: sectionBorder,
          }}
        >
          <span
            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(240,192,64,0.12)", color: "#f0c040" }}
          >
            {i + 1}
          </span>
          <GripVertical className="w-4 h-4 shrink-0" style={{ color: "#7a7590" }} />
          <span className="text-sm" style={{ color: "#f0ebe0" }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── slider ── */
function Slider({
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#f0c040]"
        style={{ height: 6 }}
      />
      <div className="flex justify-between text-xs mt-1" style={{ color: "#7a7590" }}>
        <span>{format(min)}</span>
        <span className="font-semibold" style={{ color: "#f0c040" }}>
          {format(value)}
        </span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function DualSlider({
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm" style={{ color: "#f0ebe0" }}>
        <span>{format(value[0])}</span>
        <span style={{ color: "#7a7590" }}>to</span>
        <span>{format(value[1])}</span>
      </div>
      <div className="space-y-2">
        <label className="text-xs" style={{ color: "#7a7590" }}>Min</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, value[1] - step), value[1]]);
          }}
          className="w-full accent-[#f0c040]"
        />
        <label className="text-xs" style={{ color: "#7a7590" }}>Max</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([value[0], Math.max(v, value[0] + step)]);
          }}
          className="w-full accent-[#f0c040]"
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */

const STEP_META = [
  { label: "Your Aligned Role", icon: Briefcase },
  { label: "Your Values", icon: Heart },
  { label: "Non-Negotiables", icon: ShieldAlert },
  { label: "Upload Resume", icon: FileText },
];

export default function AutoApply() {
  const { isLoaded, isSignedIn } = useClerkWithFallback();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [done, setDone] = useState(false);
  const [showKit, setShowKit] = useState(false);

  usePageSEO({
    title: "Apply When It Counts™ — WDIWF",
    description: "Configure your AI job search agent. Tell us your aligned role, values, and non-negotiables.",
    path: "/auto-apply",
  });

  const update = useCallback(
    <K extends keyof FormData>(key: K, val: FormData[K]) => setForm((f) => ({ ...f, [key]: val })),
    []
  );

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/join" replace />;

  const next = () => {
    if (step < 3) setStep(step + 1);
    else setDone(true);
  };
  const back = () => step > 0 && setStep(step - 1);

  const formatSalary = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  /* ── step content ── */
  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Job title(s) you're targeting
            </label>
            <TagInput tags={form.jobTitles} setTags={(t) => update("jobTitles", t)} placeholder="e.g. Product Manager" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Industry / sector
            </label>
            <MultiSelect options={INDUSTRIES} selected={form.industries} setSelected={(s) => update("industries", s)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Location preference
            </label>
            <MultiSelect options={LOCATION_OPTIONS} selected={form.locationPrefs} setSelected={(s) => update("locationPrefs", s)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Target salary range
            </label>
            <DualSlider
              min={30000}
              max={300000}
              step={5000}
              value={form.salaryRange}
              onChange={(v) => update("salaryRange", v)}
              format={formatSalary}
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#b8b4a8" }}>
            What matters most to you in a workplace? Drag to rank — #1 is your highest priority.
          </p>
          <RankList items={form.valuesRanking} setItems={(i) => update("valuesRanking", i)} />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Companies you will NOT work for <span style={{ color: "#7a7590" }}>(optional)</span>
            </label>
            <TagInput
              tags={form.blockedCompanies}
              setTags={(t) => update("blockedCompanies", t)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Industries you will NOT work in
            </label>
            <MultiSelect
              options={INDUSTRIES}
              selected={form.blockedIndustries}
              setSelected={(s) => update("blockedIndustries", s)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#b8b4a8" }}>
              Minimum company integrity score required
            </label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={form.minIntegrityScore}
              onChange={(v) => update("minIntegrityScore", v)}
              format={(v) => `${v}`}
            />
          </div>
        </div>
      );
    }

    // step 3
    return (
      <div className="space-y-5">
        <div
          className="rounded-2xl p-8 flex flex-col items-center justify-center text-center"
          style={{ background: sectionBg, border: sectionBorder, minHeight: 180 }}
        >
          {form.resumeFile ? (
            <div className="space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: "#f0c040" }} />
              <p className="text-sm font-semibold" style={{ color: "#f0ebe0" }}>
                {form.resumeFile.name}
              </p>
              <button
                onClick={() => update("resumeFile", null)}
                className="text-xs underline"
                style={{ color: "#7a7590" }}
              >
                Remove and choose another
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(240,192,64,0.10)" }}
              >
                <Upload className="w-6 h-6" style={{ color: "#f0c040" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#f0ebe0" }}>
                Click to upload your resume
              </p>
              <p className="text-xs" style={{ color: "#7a7590" }}>
                PDF or Word doc
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) update("resumeFile", file);
                }}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-center leading-relaxed" style={{ color: "#7a7590" }}>
          We use this to apply on your behalf. We never share it without your permission.
        </p>
      </div>
    );
  };

  /* ── done screen ── */

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center px-6 py-16" style={{ background: "#0a0a0e" }}>
        <Helmet><title>Agent Ready — WDIWF</title></Helmet>
        <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
          <filter id="aa-grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#aa-grain)" />
        </svg>
        <div className="relative z-[1] max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(240,192,64,0.12)", border: "2px solid rgba(240,192,64,0.30)" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "#f0c040" }} />
          </div>
          <h1
            className="font-sans mb-3"
            style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-2px", color: "#f0ebe0" }}
          >
            Your agent applied. Here's your Interview Kit.
          </h1>
          <p className="text-base mb-8" style={{ color: "#b8b4a8", lineHeight: 1.7 }}>
            We'll send your first dossier within 24 hours.
          </p>

          {/* Summary */}
          <div className="rounded-2xl p-6 text-left space-y-4 mb-8" style={{ background: sectionBg, border: sectionBorder }}>
            <SummaryRow label="Targeting" value={form.jobTitles.length ? form.jobTitles.join(", ") : "Not set"} />
            <SummaryRow label="Industries" value={form.industries.length ? form.industries.join(", ") : "Any"} />
            <SummaryRow label="Location" value={form.locationPrefs.length ? form.locationPrefs.join(", ") : "Any"} />
            <SummaryRow label="Salary range" value={`${formatSalary(form.salaryRange[0])} – ${formatSalary(form.salaryRange[1])}`} />
            <SummaryRow label="Top value" value={form.valuesRanking[0]} />
            <SummaryRow label="Min integrity" value={`${form.minIntegrityScore}/100`} />
            <SummaryRow label="Resume" value={form.resumeFile ? form.resumeFile.name : "Not uploaded"} />
          </div>

          {/* Interview Kit CTA */}
          {!showKit && (
            <button
              onClick={() => setShowKit(true)}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#f0c040", color: "#0a0a0e" }}
            >
              Prepare for This Interview →
            </button>
          )}
        </div>

        {/* Interview Kit — full width below */}
        {showKit && (
          <div className="relative z-[1] w-full mt-12">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[3px] font-semibold mb-2" style={{ color: "#f0c040" }}>
                Interview Kit
              </p>
              <h2
                className="font-sans"
                style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#f0ebe0" }}
              >
                You're prepared. They won't be ready for you.
              </h2>
            </div>
            <InterviewKit />
          </div>
        )}
      </div>
    );
  }

  /* ── wizard ── */
  const StepIcon = STEP_META[step].icon;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16" style={{ background: "#0a0a0e" }}>
      <Helmet><title>Set Up Your Job Search Agent — WDIWF</title></Helmet>
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
        <filter id="aa-grain2"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#aa-grain2)" />
      </svg>

      <div className="relative z-[1] max-w-lg w-full">
        {/* Header */}
        <p className="text-xs uppercase tracking-[3px] font-semibold mb-2 text-center" style={{ color: "#f0c040" }}>
          Job Search Agent
        </p>
        <h1
          className="font-sans text-center mb-8"
          style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#f0ebe0" }}
        >
          Set Up Your Job Search Agent
        </h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_META.map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full h-1 rounded-full transition-all"
                style={{ background: i <= step ? "#f0c040" : "rgba(255,255,255,0.08)" }}
              />
              <span className="text-[10px] font-medium" style={{ color: i <= step ? "#f0c040" : "#7a7590" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: sectionBorder }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(240,192,64,0.10)" }}
            >
              <StepIcon className="w-5 h-5" style={{ color: "#f0c040" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: "#f0c040" }}>
                Step {step + 1} of 4
              </p>
              <h2 className="font-sans font-bold" style={{ fontSize: 18, color: "#f0ebe0" }}>
                {STEP_META[step].label}
              </h2>
            </div>
          </div>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={back}
              className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: "#7a7590" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={next}
            className="h-12 px-8 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "#f0c040", color: "#0a0a0e" }}
          >
            {step === 3 ? "Launch Agent" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium shrink-0" style={{ color: "#7a7590" }}>
        {label}
      </span>
      <span className="text-sm text-right" style={{ color: "#f0ebe0" }}>
        {value}
      </span>
    </div>
  );
}
