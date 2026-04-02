/**
 * WhoDoI Trail — Left sidebar: case intro, objectives, path choices, notebook.
 */
import { useTrail } from "./TrailContext";
import type { InvestigationPath, TheoryChoice, PriorityChoice } from "./types";
import { BookOpen, DollarSign, Users, Briefcase, Image, Brain, Shield, Heart, Star, Handshake } from "lucide-react";

const PATH_OPTIONS: { id: InvestigationPath; label: string; icon: typeof DollarSign; emoji: string; desc: string; color: string }[] = [
  { id: "money", label: "Follow the Money", icon: DollarSign, emoji: "💰", desc: "PACs, lobbying, contracts, tax behavior", color: "#F2C14E" },
  { id: "workers", label: "Follow the Workers", icon: Users, emoji: "🥾", desc: "Labor signals, layoffs, complaints, culture", color: "#39C0BA" },
  { id: "executives", label: "Follow the Executives", icon: Briefcase, emoji: "👔", desc: "Board networks, revolving doors, compensation", color: "#9B7BFF" },
  { id: "image", label: "Follow the Image", icon: Image, emoji: "✨", desc: "Claims vs. evidence, branding, DEI", color: "#FF6B6B" },
];

const THEORY_OPTIONS: { id: TheoryChoice; label: string; emoji: string; color: string }[] = [
  { id: "hypocrisy", label: "Hypocrisy", emoji: "🎭", color: "#FF6B6B" },
  { id: "elite_access", label: "Elite Access", emoji: "🔑", color: "#9B7BFF" },
  { id: "labor_extraction", label: "Labor Extraction", emoji: "⛏️", color: "#FF9F43" },
  { id: "image_management", label: "Image Management", emoji: "🪞", color: "#39C0BA" },
  { id: "quiet_influence", label: "Quiet Influence", emoji: "🌑", color: "#F2C14E" },
];

const PRIORITY_OPTIONS: { id: PriorityChoice; label: string; icon: typeof Shield; emoji: string; color: string }[] = [
  { id: "stability", label: "Stability", icon: Shield, emoji: "🛡️", color: "#63D471" },
  { id: "ethics", label: "Ethics", icon: Heart, emoji: "💚", color: "#39C0BA" },
  { id: "prestige", label: "Prestige", icon: Star, emoji: "⭐", color: "#F2C14E" },
  { id: "pay", label: "Pay", icon: DollarSign, emoji: "💵", color: "#FF9F43" },
  { id: "belonging", label: "Belonging", icon: Handshake, emoji: "🤝", color: "#9B7BFF" },
];

export function TrailSidebar() {
  const { state, choosePath, chooseTheory, choosePriority, solveCase } = useTrail();
  const { phase, caseFile, revealedCards, revealedConnections, collectedFragments } = state;

  return (
    <aside className="w-72 shrink-0 border-r overflow-y-auto flex flex-col"
      style={{ background: "#20232B", borderColor: "rgba(245,241,232,0.08)" }}>

      {/* Case intro */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(245,241,232,0.06)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4" style={{ color: "#F2C14E" }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#F2C14E" }}>Case File</span>
        </div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "#F5F1E8" }}>{caseFile.companyName}</h2>
        <p className="text-xs leading-relaxed" style={{ color: "#B9C0CC" }}>{caseFile.companyDescription}</p>
      </div>

      {/* Phase-specific content */}
      <div className="flex-1 p-4 space-y-4">
        {phase === "intro" && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
                ACT 1 — Choose Your Trail
              </h3>
              <p className="text-xs" style={{ color: "#B9C0CC" }}>Where do you want to start investigating?</p>
            </div>
            <div className="space-y-2">
              {PATH_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => choosePath(opt.id)}
                  className="w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  style={{
                    background: "#2A2E38",
                    borderColor: "rgba(245,241,232,0.06)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = opt.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${opt.color}20`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.06)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: opt.color }}>{opt.label}</span>
                  </div>
                  <p className="text-xs pl-7" style={{ color: "#B9C0CC" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "act1" && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
                ACT 2 — Form a Theory
              </h3>
              <p className="text-xs" style={{ color: "#B9C0CC" }}>Based on what you've seen so far, what pattern do you suspect?</p>
            </div>
            <div className="space-y-2">
              {THEORY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => chooseTheory(opt.id)}
                  className="w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "#2A2E38", borderColor: "rgba(245,241,232,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.06)"; }}
                >
                  <span className="text-lg mr-2">{opt.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: opt.color }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "act2" && (
          <>
            <div className="mb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#B9C0CC" }}>
                ACT 3 — What Matters Most?
              </h3>
              <p className="text-xs" style={{ color: "#B9C0CC" }}>As a worker, what's your top priority?</p>
            </div>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => choosePriority(opt.id)}
                  className="w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "#2A2E38", borderColor: "rgba(245,241,232,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.06)"; }}
                >
                  <span className="text-lg mr-2">{opt.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: opt.color }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {(phase === "board" || phase === "reveal") && (
          <>
            {/* Case Notebook */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#F2C14E" }}>
                📓 Case Notebook
              </h3>
              <div className="space-y-1.5 text-xs" style={{ color: "#B9C0CC" }}>
                <div className="flex justify-between">
                  <span>Clues found</span>
                  <span style={{ color: "#F5F1E8" }}>{revealedCards.size}/{caseFile.cards.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections</span>
                  <span style={{ color: "#F5F1E8" }}>{revealedConnections.size}/{caseFile.connections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fragments</span>
                  <span style={{ color: "#F5F1E8" }}>{collectedFragments.size}/{caseFile.fragments.length}</span>
                </div>
              </div>
            </div>

            {/* Theory log */}
            <div className="p-3 rounded-lg" style={{ background: "#2A2E38" }}>
              <p className="text-xs font-mono uppercase mb-1" style={{ color: "#B9C0CC" }}>Your Choices</p>
              <div className="space-y-1 text-xs" style={{ color: "#F5F1E8" }}>
                {state.path && <p>Trail: <span style={{ color: "#F2C14E" }}>{PATH_OPTIONS.find(p => p.id === state.path)?.label}</span></p>}
                {state.theory && <p>Theory: <span style={{ color: "#FF6B6B" }}>{THEORY_OPTIONS.find(t => t.id === state.theory)?.label}</span></p>}
                {state.priority && <p>Priority: <span style={{ color: "#9B7BFF" }}>{PRIORITY_OPTIONS.find(p => p.id === state.priority)?.label}</span></p>}
              </div>
            </div>

            {/* Solve button */}
            {phase === "board" && revealedCards.size >= 10 && (
              <button
                onClick={solveCase}
                className="w-full p-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "#F2C14E", color: "#17181D" }}
              >
                🔍 Close the Case
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-center" style={{ borderColor: "rgba(245,241,232,0.06)" }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#B9C0CC" }}>
          WDIWF × WhoDoI Trail
        </span>
      </div>
    </aside>
  );
}
