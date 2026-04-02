/**
 * WhoDoI Trail — Reveal screen reframed for job seekers.
 * Empowering, not just dramatic.
 */
import { useTrail } from "./TrailContext";
import { getRank } from "./types";
import { RotateCcw, Share2, BookmarkPlus, Trophy, Sparkles, Star, ArrowRight } from "lucide-react";

export function TrailRevealScreen() {
  const { state, resetGame } = useTrail();
  const { finalArchetype, finalArtifact, score, profile } = state;

  if (!finalArchetype || !finalArtifact) return null;

  const rank = getRank(score);
  const rarityColors: Record<string, { bg: string; text: string; glow: string }> = {
    common: { bg: "#B9C0CC15", text: "#B9C0CC", glow: "none" },
    uncommon: { bg: "#63D47115", text: "#63D471", glow: "0 0 12px #63D47130" },
    rare: { bg: "#9B7BFF15", text: "#9B7BFF", glow: "0 0 16px #9B7BFF30" },
    legendary: { bg: "#F2C14E15", text: "#F2C14E", glow: "0 0 24px #F2C14E30" },
  };
  const rarity = rarityColors[finalArtifact.rarity] || rarityColors.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{ background: "rgba(10,11,15,0.95)" }}>
      
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${finalArchetype.colorAccent}12 0%, transparent 50%)` }} />

      <div className="w-full max-w-lg mx-4 my-8 rounded-3xl border overflow-hidden animate-scale-in relative"
        style={{ background: "#171B25", borderColor: `${finalArchetype.colorAccent}30` }}>

        <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${finalArchetype.colorAccent}, transparent)` }} />

        {/* Header */}
        <div className="relative p-8 pb-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center top, ${finalArchetype.colorAccent}15 0%, transparent 60%)` }} />
          <div className="relative">
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2" style={{ color: "#F2C14E" }}>
              <Sparkles className="w-3 h-3" />
              Investigation Complete
              <Sparkles className="w-3 h-3" />
            </p>
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-5xl mb-4 relative"
              style={{
                background: `${finalArchetype.colorAccent}12`,
                border: `2px solid ${finalArchetype.colorAccent}30`,
                boxShadow: `0 0 40px ${finalArchetype.colorAccent}20`,
              }}>
              {finalArchetype.emoji}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#B9C0CC" }}>
              This company's true identity:
            </p>
            <h2 className="text-2xl font-black mb-2 tracking-tight" style={{ color: finalArchetype.colorAccent }}>
              {finalArchetype.title}
            </h2>
            <p className="text-sm italic leading-relaxed max-w-sm mx-auto" style={{ color: "#D4CFC5" }}>
              "{finalArchetype.verdict}"
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* Decision Scorecard — the 4 questions */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "#1E222C" }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5" style={{ color: "#F2C14E" }}>
              <Star className="w-3 h-3" /> Your Decision Scorecard
            </p>
            {[
              { q: "Can I trust this company?", icon: "🔍", answer: finalArchetype.id === "arch-snack" ? "Their marketing is louder than their investment in workers. Trust the pattern, not the slogan." : finalArchetype.id === "arch-country" ? "Trust runs on access here — and you're not in the inner circle." : finalArchetype.id === "arch-mission" ? "They believe in the mission. They just don't fund the people doing it." : "Transparency is structurally absent. You can't trust what you can't see.", color: "#FF6B6B" },
              { q: "Does behavior match messaging?", icon: "🎭", answer: finalArchetype.id === "arch-snack" ? "The careers page and the lobbying record tell different stories." : finalArchetype.id === "arch-country" ? "The meritocracy pitch doesn't match the revolving-door reality." : finalArchetype.id === "arch-mission" ? "The DEI report looks great. The DEI team no longer exists." : "The ethics board was announced. It hasn't done anything.", color: "#FF9F43" },
              { q: "Would I feel safe and valued?", icon: "🛡️", answer: finalArchetype.id === "arch-snack" ? "Until restructuring hits — then headcount is a line item." : finalArchetype.id === "arch-country" ? "If you're in the right network, maybe. Otherwise, you're labor." : finalArchetype.id === "arch-mission" ? "The mission makes you feel needed. The burnout makes you feel used." : "Workers who raised concerns faced retaliation. That's the answer.", color: "#39C0BA" },
              { q: "Is pay fair and belonging real?", icon: "💰", answer: finalArchetype.id === "arch-snack" ? "Comp looks fine — until you see the 758:1 CEO ratio." : finalArchetype.id === "arch-country" ? "Pay is competitive if you have leverage. Most workers don't." : finalArchetype.id === "arch-mission" ? "You'll accept less because you believe. They're counting on that." : "Pay equity data is missing by design, not by accident.", color: "#9B7BFF" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#151820" }}>
                <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <p className="text-[11px] font-bold mb-0.5" style={{ color: item.color }}>{item.q}</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: "#D4CFC5" }}>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Traits */}
          <div className="p-3.5 rounded-xl" style={{ background: "#1E222C" }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5" style={{ color: "#B9C0CC" }}>
              <Star className="w-3 h-3" /> What This Employer Is Really About
            </p>
            <div className="flex flex-wrap gap-1.5">
              {finalArchetype.traits.map(t => (
                <span key={t} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold"
                  style={{ background: `${finalArchetype.colorAccent}10`, color: finalArchetype.colorAccent, border: `1px solid ${finalArchetype.colorAccent}20` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Worker impact */}
          <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: "#1E222C" }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "#F2C14E" }} />
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#F2C14E" }}>
              💡 What This Means for Your Career Decision
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "#D4CFC5" }}>
              {finalArchetype.workerImpact}
            </p>
          </div>

          {/* Artifact */}
          <div className="flex items-center gap-4 p-4 rounded-xl border relative overflow-hidden"
            style={{ background: "#0F1118", borderColor: `${rarity.text}25`, boxShadow: rarity.glow }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at left, ${rarity.text}05 0%, transparent 60%)` }} />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 relative"
              style={{ background: rarity.bg, border: `1px solid ${rarity.text}30` }}>
              {finalArtifact.emoji}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold" style={{ color: "#F5F1E8" }}>{finalArtifact.name}</p>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold"
                  style={{ background: rarity.bg, color: rarity.text, border: `1px solid ${rarity.text}30` }}>
                  {finalArtifact.rarity}
                </span>
              </div>
              <p className="text-[11px] italic" style={{ color: "#B9C0CC" }}>
                {finalArtifact.description}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-stretch gap-2">
            {[
              { value: score.toString(), label: "SCORE", color: "#F2C14E", icon: "⚡" },
              { value: rank.badge, label: rank.title.toUpperCase(), color: "#F5F1E8", icon: "" },
              { value: state.revealedCards.size.toString(), label: "EVIDENCE", color: "#63D471", icon: "" },
              { value: state.revealedConnections.size.toString(), label: "LINKS", color: "#9B7BFF", icon: "" },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center p-2.5 rounded-xl" style={{ background: "#1E222C" }}>
                <p className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.icon}{s.value}</p>
                <p className="text-[8px] font-mono tracking-wider" style={{ color: "#B9C0CC" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Empowerment message */}
          <div className="p-4 rounded-xl text-center space-y-2" style={{ background: "rgba(99,212,113,0.05)", border: "1px solid rgba(99,212,113,0.1)" }}>
            <p className="text-[12px] font-semibold leading-relaxed" style={{ color: "#63D471" }}>
              You just saw what most applicants never look for.
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#B9C0CC" }}>
              You're not crazy for noticing red flags. You're not asking too much. You now have a smarter way to evaluate employers — and whatever you decide next, you're deciding with clarity, not hope.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex gap-2 pt-1">
            <button onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl text-sm font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              style={{ background: "#1E222C", color: "#F5F1E8", border: "1px solid rgba(245,241,232,0.06)" }}>
              <RotateCcw className="w-4 h-4" /> Investigate Again
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl text-sm font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              style={{
                background: "linear-gradient(135deg, #F2C14E, #E5A820)",
                color: "#17181D",
                boxShadow: "0 4px 16px rgba(242,193,78,0.3)",
              }}>
              <Share2 className="w-4 h-4" /> Share This
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-[11px] font-semibold transition-all hover:translate-y-[-1px]"
              style={{ background: "#1E222C", color: "#B9C0CC", border: "1px solid rgba(245,241,232,0.04)" }}>
              <BookmarkPlus className="w-3.5 h-3.5" /> Save to My File
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-[11px] font-semibold transition-all hover:translate-y-[-1px]"
              style={{ background: "#1E222C", color: "#B9C0CC", border: "1px solid rgba(245,241,232,0.04)" }}>
              <Trophy className="w-3.5 h-3.5" /> Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
