import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { DNAPanel, DEFAULT_DNA, type DNAValues } from "@/components/decision-engine/DNAPanel";
import { DecisionJobCard, type DemoJob } from "@/components/decision-engine/DecisionJobCard";
import { usePremium } from "@/hooks/use-premium";
import { useNavigate } from "react-router-dom";
import { SignupGate } from "@/components/SignupGate";
import { cn } from "@/lib/utils";

const DEMO_JOBS: DemoJob[] = [
  {
    id: 1, company: "7-Eleven", emoji: "🏪", role: "Senior Software Engineer", category: "tech",
    comp: "$145K–$175K", compTransparency: 0.85, hiringActivity: 0.75, workforceStability: 0.80,
    companyBehavior: 0.65, innovation: 0.55, employeeExperience: 0.70, ghost: false,
    proData: "Workday ATS: 3 active postings confirmed. Reddit r/cscareerquestions: 12 mentions in 30d — majority neutral. Glassdoor trajectory: ↑ 0.2 pts over 6 months.",
  },
  {
    id: 2, company: "Stripe", emoji: "⚡", role: "Staff Platform Engineer", category: "tech",
    comp: "Not Listed", compTransparency: 0.10, hiringActivity: 0.90, workforceStability: 0.85,
    companyBehavior: 0.80, innovation: 0.92, employeeExperience: 0.78, ghost: false,
    proData: "Greenhouse ATS: 5 matching roles. Recent layoff data: none detected. Reddit sentiment: 86% positive. 2 new signals found in past 24h.",
  },
  {
    id: 3, company: "Acme Logistics", emoji: "📦", role: "Head of Operations", category: "operations",
    comp: "$115K–$130K + bonus", compTransparency: 0.90, hiringActivity: 0.40, workforceStability: 0.30,
    companyBehavior: 0.35, innovation: 0.25, employeeExperience: 0.35, ghost: true,
    proData: "No ATS match found. Possible labor impacting. Last Glassdoor review: 9 months ago. LinkedIn headcount: dropped 18% YoY.",
  },
  {
    id: 4, company: "Salesforce", emoji: "☁️", role: "Enterprise Account Executive", category: "sales",
    comp: "$120K base + uncapped OTE", compTransparency: 0.95, hiringActivity: 0.85, workforceStability: 0.60,
    companyBehavior: 0.70, innovation: 0.75, employeeExperience: 0.58, ghost: false,
    proData: "Workday ATS confirmed. 8 open AE roles in this region. Quota attainment reports: ~62% of reps. Blind sentiment: mixed.",
  },
  {
    id: 5, company: "Notion", emoji: "📝", role: "People Ops Lead", category: "hr",
    comp: "$130K–$155K", compTransparency: 0.88, hiringActivity: 0.65, workforceStability: 0.82,
    companyBehavior: 0.90, innovation: 0.70, employeeExperience: 0.88, ghost: false,
    proData: "Greenhouse ATS: 2 People roles confirmed. Glassdoor: 4.4/5, trending up. Blind: overwhelmingly positive culture mentions. No recent reductions.",
  },
  {
    id: 6, company: "ShadowTech", emoji: "👻", role: "Growth Marketing Manager", category: "sales",
    comp: "Competitive (DOE)", compTransparency: 0.15, hiringActivity: 0.30, workforceStability: 0.20,
    companyBehavior: 0.10, innovation: 0.40, employeeExperience: 0.25, ghost: true,
    proData: "No ATS found. Crunchbase: last funding round 3 years ago, undisclosed. LinkedIn: 12 employees listed. High ghost risk.",
  },
];

const CATEGORIES = ["All", "Tech", "Operations", "Sales", "HR"];

export default function DecisionEngine() {
  const [dna, setDna] = useState<DNAValues>(DEFAULT_DNA);
  const [activeCategory, setActiveCategory] = useState("all");
  const { isPremium, isLoggedIn } = usePremium();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (activeCategory === "all") return DEMO_JOBS;
    return DEMO_JOBS.filter((j) => j.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <Helmet>
        <title>Decision Engine | TruthStack</title>
        <meta name="description" content="Truth-over-Vibes decision support engine. Calibrate your values, scan live jobs, and detect risk before you apply." />
      </Helmet>

      {/* Full-page dark wrapper with noise overlay */}
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] relative">
        {/* Noise overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <header className="relative z-10 px-6 sm:px-10 pt-8 pb-6 border-b border-[#2a2a3a] flex items-center justify-between">
          <div>
            <div className="font-['Syne',sans-serif] font-extrabold text-[22px] tracking-tight">
              Truth<span className="text-[#e8ff47]">Stack</span>
            </div>
            <div className="font-mono text-xs text-[#6b6b8a] tracking-[2px] uppercase mt-1">
              Truth-over-Vibes · Decision Support Engine
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className={cn(
                "font-mono text-xs px-3 py-1.5 rounded-full border tracking-wider transition-all",
                !isPremium
                  ? "bg-primary text-primary-foreground border-primary font-bold"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              FREE
            </button>
            <button
              onClick={() => { if (!isLoggedIn) navigate("/login"); else if (!isPremium) navigate("/pricing"); }}
              className={cn(
                "font-mono text-xs px-3 py-1.5 rounded-full border tracking-wider transition-all",
                isPremium
                  ? "bg-primary text-primary-foreground border-primary font-bold"
                  : "border-[#2a2a3a] text-[#9898b0] hover:border-[#e8ff47] hover:text-[#e8ff47]"
              )}
            >
              PRO ✦
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 px-6 sm:px-10 py-10 max-w-[1200px] mx-auto">
          <DNAPanel values={dna} onChange={setDna} />

          {/* Category filter */}
          <div className="flex gap-2.5 mb-8 flex-wrap">
            {CATEGORIES.map((c) => {
              const key = c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "font-mono text-xs px-4 py-2 rounded-lg border tracking-wider transition-all",
                    key === activeCategory
                      ? "bg-[#111118] border-[#e8ff47] text-[#e8ff47]"
                      : "border-[#2a2a3a] text-[#9898b0] hover:border-[#9898b0] hover:text-[#e8e8f0]"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-['Syne',sans-serif] font-bold text-xl text-[#e8e8f0]">Live Job Board</h2>
            <div className="flex-1 h-px bg-[#2a2a3a]" />
          </div>

          {/* Cards grid — gated for unauthenticated users */}
          {!isLoggedIn ? (
            <SignupGate feature="the Decision Engine job analysis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.slice(0, 2).map((job) => (
                  <DecisionJobCard key={job.id} job={job} dna={dna} />
                ))}
              </div>
            </SignupGate>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((job) => (
                <DecisionJobCard key={job.id} job={job} dna={dna} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
