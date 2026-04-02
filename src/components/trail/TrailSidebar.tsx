/**
 * WhoDoI Trail — Left sidebar with polished navy styling.
 */
import { useTrail } from "./TrailContext";
import type { InvestigationPath, TheoryChoice, PriorityChoice } from "./types";
import { BookOpen, DollarSign, Users, Briefcase, Image, Shield, Heart, Star, Handshake } from "lucide-react";

const PATH_OPTIONS: { id: InvestigationPath; label: string; emoji: string; desc: string; color: string; stat: string }[] = [
  { id: "money", label: "Follow the Money", emoji: "💰", desc: "PACs, lobbying, contracts, tax behavior", color: "#F2C14E", stat: "4 receipts" },
  { id: "workers", label: "Follow the Workers", emoji: "🥾", desc: "Labor signals, layoffs, complaints, culture", color: "#39C0BA", stat: "3 signals" },
  { id: "executives", label: "Follow the Executives", emoji: "👔", desc: "Board networks, revolving doors, compensation", color: "#9B7BFF", stat: "3 profiles" },
  { id: "image", label: "Follow the Image", emoji: "✨", desc: "Claims vs. evidence, branding, DEI", color: "#FF6B6B", stat: "3 claims" },
];

const THEORY_OPTIONS: { id: TheoryChoice; label: string; emoji: string; color: string }[] = [
  { id: "hypocrisy", label: "Hypocrisy", emoji: "🎭", color: "#FF6B6B" },
  { id: "elite_access", label: "Elite Access", emoji: "🔑", color: "#9B7BFF" },
  { id: "labor_extraction", label: "Labor Extraction", emoji: "⛏️", color: "#FF9F43" },
  { id: "image_management", label: "Image Management", emoji: "🪞", color: "#39C0BA" },
  { id: "quiet_influence", label: "Quiet Influence", emoji: "🌑", color: "#F2C14E" },
];

const PRIORITY_OPTIONS: { id: PriorityChoice; label: string; emoji: string; color: string }[] = [
  { id: "stability", label: "Stability", emoji: "🛡️", color: "#63D471" },
  { id: "ethics", label: "Ethics", emoji: "💚", color: "#39C0BA" },
  { id: "prestige", label: "Prestige", emoji: "⭐", color: "#F2C14E" },
  { id: "pay", label: "Pay", emoji: "💵", color: "#FF9F43" },
  { id: "belonging", label: "Belonging", emoji: "🤝", color: "#9B7BFF" },
];

export function TrailSidebar() {
  const { state, choosePath, chooseTheory, choosePriority, solveCase } = useTrail();
  const { phase, caseFile, revealedCards, revealedConnections, collectedFragments } = state;

  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto flex flex-col"
      style={{
        background: "linear-gradient(180deg, #1A1D28 0%, #161922 100%)",
        borderRight: "1px solid rgba(242,193,78,0.08)",
      }}>

      {/* Case header */}
      <div className="p-4" style={{ borderBottom: "1px solid rgba(242,193,78,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(242,193,78,0.1)" }}>
            <BookOpen className="w-4 h-4" style={{ color: "#F2C14E" }} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "#F2C14E" }}>
              Active Case
            </span>
          </div>
        </div>
        <h2 className="text-sm font-bold mb-1" style={{ color: "#F5F1E8" }}>{caseFile.companyName}</h2>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "#2A2E38", color: "#B9C0CC" }}>
            {caseFile.companyIndustry}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "#B9C0CC" }}>
          {caseFile.companyDescription}
        </p>
      </div>

      {/* Phase content */}
      <div className="flex-1 p-4 space-y-3">

        {/* ─── INTRO: Path choices ─── */}
        {phase === "intro" && (
          <>
            <div className="mb-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#F5F1E8" }}>
                Act 1 — Choose Your Trail
              </h3>
              <p className="text-[10px]" style={{ color: "#B9C0CC" }}>Where will you start investigating?</p>
            </div>
            {PATH_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => choosePath(opt.id)}
                className="w-full text-left rounded-xl overflow-hidden transition-all hover:translate-y-[-1px] active:translate-y-[0px] group"
                style={{
                  background: "#1E222C",
                  border: "1px solid rgba(245,241,232,0.04)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}40`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${opt.color}15`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Color accent bar */}
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${opt.color}, ${opt.color}60)` }} />
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: opt.color }}>{opt.label}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: `${opt.color}15`, color: opt.color }}>
                      {opt.stat}
                    </span>
                  </div>
                  <p className="text-[10px] pl-7" style={{ color: "#B9C0CC" }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ─── ACT 1: Theory choices ─── */}
        {phase === "act1" && (
          <>
            <div className="mb-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#F5F1E8" }}>
                Act 2 — Form a Theory
              </h3>
              <p className="text-[10px]" style={{ color: "#B9C0CC" }}>What pattern do you suspect?</p>
            </div>
            {THEORY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => chooseTheory(opt.id)}
                className="w-full text-left p-3 rounded-xl transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                style={{ background: "#1E222C", border: "1px solid rgba(245,241,232,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)"; }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: opt.color }}>{opt.label}</span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ─── ACT 2: Priority choices ─── */}
        {phase === "act2" && (
          <>
            <div className="mb-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#F5F1E8" }}>
                Act 3 — What Matters Most?
              </h3>
              <p className="text-[10px]" style={{ color: "#B9C0CC" }}>As a worker, what's your priority?</p>
            </div>
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => choosePriority(opt.id)}
                className="w-full text-left p-3 rounded-xl transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                style={{ background: "#1E222C", border: "1px solid rgba(245,241,232,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)"; }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: opt.color }}>{opt.label}</span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ─── BOARD: Case notebook ─── */}
        {(phase === "board" || phase === "reveal") && (
          <>
            <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#F2C14E" }}>
                📓 Case Notebook
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Clues found", val: `${revealedCards.size}/${caseFile.cards.length}`, pct: (revealedCards.size / caseFile.cards.length) * 100, color: "#F2C14E" },
                  { label: "Connections", val: `${revealedConnections.size}/${caseFile.connections.length}`, pct: (revealedConnections.size / caseFile.connections.length) * 100, color: "#9B7BFF" },
                  { label: "Fragments", val: `${collectedFragments.size}/${caseFile.fragments.length}`, pct: (collectedFragments.size / caseFile.fragments.length) * 100, color: "#39C0BA" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                      <span className="font-mono font-bold" style={{ color: item.color }}>{item.val}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#17181D" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Choices recap */}
            <div className="p-3 rounded-xl" style={{ background: "#1E222C" }}>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#B9C0CC" }}>
                Your Choices
              </p>
              <div className="space-y-1.5 text-[11px]">
                {state.path && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F2C14E" }} />
                    <span style={{ color: "#B9C0CC" }}>Trail:</span>
                    <span className="font-medium" style={{ color: "#F2C14E" }}>
                      {PATH_OPTIONS.find(p => p.id === state.path)?.label}
                    </span>
                  </div>
                )}
                {state.theory && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B6B" }} />
                    <span style={{ color: "#B9C0CC" }}>Theory:</span>
                    <span className="font-medium" style={{ color: "#FF6B6B" }}>
                      {THEORY_OPTIONS.find(t => t.id === state.theory)?.label}
                    </span>
                  </div>
                )}
                {state.priority && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B7BFF" }} />
                    <span style={{ color: "#B9C0CC" }}>Priority:</span>
                    <span className="font-medium" style={{ color: "#9B7BFF" }}>
                      {PRIORITY_OPTIONS.find(p => p.id === state.priority)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Solve button */}
            {phase === "board" && revealedCards.size >= 10 && (
              <button
                onClick={solveCase}
                className="w-full p-3 rounded-xl font-bold text-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                style={{
                  background: "linear-gradient(135deg, #F2C14E, #E5A820)",
                  color: "#17181D",
                  boxShadow: "0 4px 20px rgba(242,193,78,0.3)",
                }}
              >
                🔍 Close the Case
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center" style={{ borderTop: "1px solid rgba(242,193,78,0.06)" }}>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(185,192,204,0.5)" }}>
          WDIWF × WhoDoI Trail
        </span>
      </div>
    </aside>
  );
}
