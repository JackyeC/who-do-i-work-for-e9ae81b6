import { useState, useCallback, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EpisodeShell } from "@/components/no-regrets-game/EpisodeShell";
import { StatsBar } from "@/components/no-regrets-game/StatsBar";
import { PatternBreakToast } from "@/components/no-regrets-game/PatternBreakToast";
import { ChoiceButtons } from "@/components/no-regrets-game/ChoiceButtons";
import { SignupGate } from "@/components/SignupGate";
import { EPISODE_3 } from "@/data/no-regrets-episodes";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";
import type { Choice, PlayerStats, CompanyArchetype, EpisodeBranch } from "@/types/no-regrets-game";

const HEALTHY_CHOICES: Record<string, string> = {
  "moral-injury-exit": "You broke the pattern. Future you just exhaled.",
  "mission-collapse-leave": "You chose clarity over loyalty. That takes nerve.",
  "burnout-spiral-reclaim": "You chose yourself over the brand. That's not quitting — it's strategy.",
};

function applyChanges(base: PlayerStats, changes: Partial<PlayerStats>): PlayerStats {
  return {
    money: Math.max(0, Math.min(100, base.money + (changes.money ?? 0))),
    safety: Math.max(0, Math.min(100, base.safety + (changes.safety ?? 0))),
    sanity: Math.max(0, Math.min(100, base.sanity + (changes.sanity ?? 0))),
    power: Math.max(0, Math.min(100, base.power + (changes.power ?? 0))),
  };
}

function EvidenceCard({ emoji, title, detail, variant }: { emoji: string; title: string; detail: string; variant: "warning" | "justification" }) {
  const isWarning = variant === "warning";
  return (
    <div className={`rounded-xl border overflow-hidden ${isWarning ? "border-[hsl(var(--destructive))]/20" : "border-primary/15"}`}>
      <div className={`px-4 py-2 border-b flex items-center gap-2 ${isWarning ? "border-[hsl(var(--destructive))]/10 bg-[hsl(var(--destructive))]/5" : "border-primary/10 bg-primary/5"}`}>
        <span className="text-sm">{emoji}</span>
        <p className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isWarning ? "text-[hsl(var(--destructive))]/70" : "text-primary/70"}`}>
          {title}
        </p>
      </div>
      <div className="p-4 bg-card/30">
        <p className="text-[13px] text-muted-foreground leading-relaxed italic">{detail}</p>
      </div>
    </div>
  );
}

export default function NoRegretsEpisode3() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [choosing, setChoosing] = useState(false);
  const [baseStats, setBaseStats] = useState(EPISODE_3.initialStats);
  const [branch, setBranch] = useState<EpisodeBranch | null>(null);

  useEffect(() => {
    trackNoRegrets("episode_3_started");
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (raw) {
      try {
        const ep2 = JSON.parse(raw);
        if (ep2.stats) setBaseStats(ep2.stats);
        const archetype = ep2.companyArchetype as CompanyArchetype;
        const found = EPISODE_3.branches?.find(b => b.forArchetype === archetype);
        if (found) setBranch(found);
      } catch { /* fallback */ }
    }
  }, []);

  const [patternBreakMsg, setPatternBreakMsg] = useState<string | null>(null);

  const handleChoose = useCallback((choice: Choice) => {
    setChoosing(true);
    trackNoRegrets("episode_3_completed", { consequence_label: choice.archetype });

    const isHealthy = choice.id in HEALTHY_CHOICES;
    const bonusChanges = isHealthy ? { sanity: 10, power: 5 } : {};
    const merged = { ...choice.statChanges, ...Object.fromEntries(
      Object.entries(bonusChanges).map(([k, v]) => [k, (choice.statChanges[k as keyof PlayerStats] ?? 0) + v])
    )};
    const newStats = applyChanges(baseStats, merged);

    if (isHealthy) {
      setPatternBreakMsg(HEALTHY_CHOICES[choice.id]);
    }

    sessionStorage.setItem(
      "noRegrets_ep3",
      JSON.stringify({
        choiceId: choice.id,
        stats: newStats,
        previousStats: baseStats,
        recapText: choice.recapText,
        consequenceLabel: choice.archetype,
      })
    );
    setTimeout(() => navigate("/no-regrets-game/episode-3-recap"), isHealthy ? 1800 : 400);
  }, [baseStats, navigate]);

  if (!branch) {
    const raw = sessionStorage.getItem("noRegrets_ep2");
    if (!raw) return <Navigate to="/no-regrets-game/episode-2" replace />;
    return null;
  }

  return (
    <EpisodeShell>
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/60">Season 1</p>
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{EPISODE_3.title}</h2>
        <p className="text-xs text-muted-foreground italic">What did that choice cost you?</p>
        <div className="h-px w-12 bg-primary/30 mt-1" />
      </div>

      <div className="rounded-xl border border-border/20 bg-card/30 p-5 md:p-6 space-y-4">
        {EPISODE_3.narrative.map((p, i) => (
          <p key={`intro-${i}`} className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{p}</p>
        ))}
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-primary/15">
        {branch.narrative.map((p, i) => (
          <p key={i} className="text-sm md:text-[15px] text-muted-foreground leading-[1.8]">{p}</p>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EvidenceCard {...branch.warningSign} variant="warning" />
        <EvidenceCard {...branch.selfJustification} variant="justification" />
      </div>

      <StatsBar stats={baseStats} />

      {patternBreakMsg && <PatternBreakToast message={patternBreakMsg} />}

      {user ? (
        <ChoiceButtons
          choices={branch.choices}
          onChoose={handleChoose}
          disabled={choosing}
        />
      ) : (
        <SignupGate feature="story choices">
          <div className="space-y-3">
            {branch.choices.map((choice) => (
              <div key={choice.id} className="p-4 rounded-xl border border-border/30 bg-card/40 opacity-50">
                <span className="text-sm text-foreground">{choice.label}</span>
              </div>
            ))}
          </div>
        </SignupGate>
      )}
    </EpisodeShell>
  );
}
