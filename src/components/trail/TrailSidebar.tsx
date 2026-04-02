/**
 * WhoDoI Trail — Left sidebar: branching choices + case notebook.
 * Game-like with personality in microcopy.
 */
import { useTrail } from "./TrailContext";
import type { InvestigationPath, TheoryChoice, PriorityChoice } from "./types";
import { BookOpen, Fingerprint, ArrowRight, Sparkles } from "lucide-react";

const PATH_OPTIONS: { id: InvestigationPath; label: string; emoji: string; desc: string; color: string; stat: string; hook: string }[] = [
  { id: "money", label: "Follow the Money", emoji: "💰", desc: "PACs, lobbying, contracts, tax behavior", color: "#F2C14E", stat: "4 receipts", hook: "The dollars never lie." },
  { id: "workers", label: "Follow the Workers", emoji: "🥾", desc: "Labor signals, layoffs, complaints, culture", color: "#39C0BA", stat: "3 signals", hook: "Listen to what they're not saying." },
  { id: "executives", label: "Follow the Executives", emoji: "👔", desc: "Board networks, revolving doors, compensation", color: "#9B7BFF", stat: "3 profiles", hook: "Check the corner offices." },
  { id: "image", label: "Follow the Image", emoji: "✨", desc: "Claims vs. evidence, branding, DEI", color: "#FF6B6B", stat: "3 claims", hook: "Pretty words. But are they true?" },
];

const THEORY_OPTIONS: { id: TheoryChoice; label: string; emoji: string; color: string; hook: string }[] = [
  { id: "hypocrisy", label: "Hypocrisy", emoji: "🎭", color: "#FF6B6B", hook: "They say one thing, fund the opposite" },
  { id: "elite_access", label: "Elite Access", emoji: "🔑", color: "#9B7BFF", hook: "The real product is proximity to power" },
  { id: "labor_extraction", label: "Labor Extraction", emoji: "⛏️", color: "#FF9F43", hook: "Workers generate value they'll never see" },
  { id: "image_management", label: "Image Management", emoji: "🪞", color: "#39C0BA", hook: "The brand is the mask" },
  { id: "quiet_influence", label: "Quiet Influence", emoji: "🌑", color: "#F2C14E", hook: "Power moves in the dark" },
];

const PRIORITY_OPTIONS: { id: PriorityChoice; label: string; emoji: string; color: string; hook: string }[] = [
  { id: "stability", label: "Stability", emoji: "🛡️", color: "#63D471", hook: "Will this job still exist in 2 years?" },
  { id: "ethics", label: "Ethics", emoji: "💚", color: "#39C0BA", hook: "Can I sleep at night working here?" },
  { id: "prestige", label: "Prestige", emoji: "⭐", color: "#F2C14E", hook: "Does this name open doors?" },
  { id: "pay", label: "Pay", emoji: "💵", color: "#FF9F43", hook: "Show me the money — and the ratio." },
  { id: "belonging", label: "Belonging", emoji: "🤝", color: "#9B7BFF", hook: "Will I be seen here, or just counted?" },
];

export function TrailSidebar() {
  const { state, choosePath, chooseTheory, choosePriority, solveCase } = useTrail();
  const { phase, caseFile, revealedCards, revealedConnections, collectedFragments } = state;

  return (
    <aside className="w-[290px] shrink-0 overflow-y-auto flex flex-col"
      style={{
        background: "linear-gradient(180deg, #151820 0%, #111419 100%)",
        borderRight: "1px solid rgba(242,193,78,0.06)",
      }}>

      {/* Case header */}
      <div className="p-4" style={{ borderBottom: "1px solid rgba(242,193,78,0.06)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "rgba(242,193,78,0.08)", border: "1px solid rgba(242,193,78,0.12)" }}>
            <BookOpen className="w-4 h-4" style={{ color: "#F2C14E" }} />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold" style={{ color: "#F2C14E" }}>
              Case File Open
            </span>
          </div>
        </div>
        <h2 className="text-sm font-bold mb-1" style={{ color: "#F5F1E8" }}>{caseFile.companyName}</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full inline-block mb-2"
          style={{ background: "rgba(242,193,78,0.06)", color: "#B9C0CC", border: "1px solid rgba(242,193,78,0.08)" }}>
          {caseFile.companyIndustry}
        </span>
        <p className="text-[11px] leading-relaxed" style={{ color: "#9A93A0" }}>
          {caseFile.companyDescription}
        </p>
      </div>

      <div className="flex-1 p-4 space-y-3">

        {/* ─── INTRO: Path choices ─── */}
        {phase === "intro" && (
          <>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "#F2C14E", color: "#17181D", fontWeight: 800 }}>1</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#F5F1E8" }}>
                  Choose Your Trail
                </h3>
              </div>
              <p className="text-[10px] italic pl-7" style={{ color: "#B9C0CC" }}>Every investigation starts with a hunch.</p>
            </div>
            {PATH_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => choosePath(opt.id)}
                className="w-full text-left rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px] active:translate-y-[0px] group"
                style={{
                  background: "#171B25",
                  border: "1px solid rgba(245,241,232,0.04)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}50`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px ${opt.color}18, inset 0 1px 0 ${opt.color}10`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${opt.color}, ${opt.color}40)` }} />
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="text-[12px] font-bold" style={{ color: opt.color }}>{opt.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                      style={{ color: opt.color }} />
                  </div>
                  <p className="text-[10px] pl-8 italic" style={{ color: "#B9C0CC" }}>{opt.hook}</p>
                  <div className="flex items-center gap-2 mt-2 pl-8">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: `${opt.color}12`, color: opt.color, border: `1px solid ${opt.color}18` }}>
                      {opt.stat}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ─── ACT 1: Theory choices ─── */}
        {phase === "act1" && (
          <>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "#FF6B6B", color: "#17181D", fontWeight: 800 }}>2</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#F5F1E8" }}>
                  Form a Theory
                </h3>
              </div>
              <p className="text-[10px] italic pl-7" style={{ color: "#B9C0CC" }}>What pattern are you seeing?</p>
            </div>
            {THEORY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => chooseTheory(opt.id)}
                className="w-full text-left p-3.5 rounded-2xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] group"
                style={{ background: "#171B25", border: "1px solid rgba(245,241,232,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${opt.color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[12px] font-bold" style={{ color: opt.color }}>{opt.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: opt.color }} />
                </div>
                <p className="text-[10px] italic pl-8" style={{ color: "#B9C0CC" }}>{opt.hook}</p>
              </button>
            ))}
          </>
        )}

        {/* ─── ACT 2: Priority choices ─── */}
        {phase === "act2" && (
          <>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "#9B7BFF", color: "#17181D", fontWeight: 800 }}>3</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#F5F1E8" }}>
                  What Matters Most?
                </h3>
              </div>
              <p className="text-[10px] italic pl-7" style={{ color: "#B9C0CC" }}>As a worker — what's non-negotiable?</p>
            </div>
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => choosePriority(opt.id)}
                className="w-full text-left p-3.5 rounded-2xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] group"
                style={{ background: "#171B25", border: "1px solid rgba(245,241,232,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${opt.color}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${opt.color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,241,232,0.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[12px] font-bold" style={{ color: opt.color }}>{opt.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: opt.color }} />
                </div>
                <p className="text-[10px] italic pl-8" style={{ color: "#B9C0CC" }}>{opt.hook}</p>
              </button>
            ))}
          </>
        )}

        {/* ─── BOARD: Case notebook ─── */}
        {(phase === "board" || phase === "reveal") && (
          <>
            {/* Theory tracker */}
            <div className="p-3.5 rounded-2xl space-y-3"
              style={{ background: "#171B25", border: "1px solid rgba(242,193,78,0.06)" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "#F2C14E" }}>
                <Fingerprint className="w-3 h-3" /> Your Investigation
              </h3>
              <div className="space-y-2.5">
                {state.path && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg mt-0.5">{PATH_OPTIONS.find(p => p.id === state.path)?.emoji}</span>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>Trail</p>
                      <p className="text-[12px] font-bold" style={{ color: "#F2C14E" }}>
                        {PATH_OPTIONS.find(p => p.id === state.path)?.label}
                      </p>
                    </div>
                  </div>
                )}
                {state.theory && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg mt-0.5">{THEORY_OPTIONS.find(t => t.id === state.theory)?.emoji}</span>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>Theory</p>
                      <p className="text-[12px] font-bold" style={{ color: "#FF6B6B" }}>
                        {THEORY_OPTIONS.find(t => t.id === state.theory)?.label}
                      </p>
                    </div>
                  </div>
                )}
                {state.priority && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg mt-0.5">{PRIORITY_OPTIONS.find(p => p.id === state.priority)?.emoji}</span>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#B9C0CC" }}>Priority</p>
                      <p className="text-[12px] font-bold" style={{ color: "#9B7BFF" }}>
                        {PRIORITY_OPTIONS.find(p => p.id === state.priority)?.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress meters */}
            <div className="p-3.5 rounded-2xl space-y-3"
              style={{ background: "#171B25", border: "1px solid rgba(245,241,232,0.03)" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "#B9C0CC" }}>
                📓 Case Progress
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Clues uncovered", val: `${revealedCards.size}/${caseFile.cards.length}`, pct: (revealedCards.size / caseFile.cards.length) * 100, color: "#F2C14E" },
                  { label: "Evidence linked", val: `${revealedConnections.size}/${caseFile.connections.length}`, pct: (revealedConnections.size / caseFile.connections.length) * 100, color: "#9B7BFF" },
                  { label: "Fragments found", val: `${collectedFragments.size}/${caseFile.fragments.length}`, pct: (collectedFragments.size / caseFile.fragments.length) * 100, color: "#39C0BA" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span style={{ color: "#B9C0CC" }}>{item.label}</span>
                      <span className="font-mono font-bold tabular-nums" style={{ color: item.color }}>{item.val}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(23,24,29,0.8)" }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          background: `linear-gradient(90deg, ${item.color}, ${item.color}90)`,
                          transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                          boxShadow: item.pct > 0 ? `0 0 8px ${item.color}40` : "none",
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solve button */}
            {phase === "board" && revealedCards.size >= 10 && (
              <button
                onClick={solveCase}
                className="w-full p-4 rounded-2xl font-bold text-sm transition-all hover:translate-y-[-2px] active:translate-y-[0px] relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #F2C14E 0%, #E5A820 100%)",
                  color: "#17181D",
                  boxShadow: "0 8px 32px rgba(242,193,78,0.3), 0 0 0 1px rgba(242,193,78,0.5)",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #FFD666 0%, #F2C14E 100%)" }} />
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Close the Case
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center" style={{ borderTop: "1px solid rgba(242,193,78,0.04)" }}>
        <span className="text-[8px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(185,192,204,0.4)" }}>
          WDIWF × WhoDoI Trail
        </span>
      </div>
    </aside>
  );
}
