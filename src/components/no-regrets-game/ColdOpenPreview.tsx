import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { trackNoRegrets } from "@/lib/noRegretsAnalytics";

interface PreviewStats {
  money: number;
  safety: number;
  sanity: number;
  power: number;
}

interface PreviewChoice {
  id: string;
  label: string;
  statChanges: Partial<PreviewStats>;
  nextBeat: number;
}

interface StoryBeat {
  narrative: string;
  prompt: string;
  choices: PreviewChoice[];
}

const INITIAL_STATS: PreviewStats = { money: 55, safety: 60, sanity: 65, power: 40 };

const BEATS: StoryBeat[] = [
  {
    narrative:
      "It's 4:47 on a Friday. Your calendar clears itself. A meeting appears: \"Quick Sync — HR + Your Manager.\" Your Slack goes quiet. Your manager's status changes to 🔇.",
    prompt: "You have ninety seconds before that call. What do you do?",
    choices: [
      { id: "c0a", label: "Screenshot everything. Emails, Slack DMs, your last performance review. If this is what you think it is, you want receipts.", statChanges: { power: 10, sanity: -5 }, nextBeat: 1 },
      { id: "c0b", label: "Text your partner: \"Something's happening. Don't panic yet.\" Then close the laptop lid and breathe.", statChanges: { sanity: 10, power: -5 }, nextBeat: 1 },
      { id: "c0c", label: "Open LinkedIn. Start drafting a post. If they're cutting you, the narrative starts now.", statChanges: { power: 15, safety: -10, sanity: -5 }, nextBeat: 1 },
    ],
  },
  {
    narrative:
      "The call lasts eight minutes. They thank you for your contributions. Your access will be revoked at 6 PM. You get 4 weeks severance — if you sign by Monday. The HR person reads from a script. Your manager says nothing.",
    prompt: "Monday is 72 hours away. What's your move?",
    choices: [
      { id: "c1a", label: "Sign nothing. Call an employment attorney Monday morning. Four weeks feels low for what you know about this company.", statChanges: { money: -5, power: 15, safety: 5 }, nextBeat: 2 },
      { id: "c1b", label: "Sign it Sunday night. You need the money, and fighting will cost more than four weeks of pay.", statChanges: { money: 10, power: -10, sanity: 5 }, nextBeat: 2 },
      { id: "c1c", label: "Don't respond at all. Spend the weekend mapping every contact who might hire you. The leverage is in options, not lawyers.", statChanges: { power: 5, sanity: -5, money: -5 }, nextBeat: 2 },
    ],
  },
  {
    narrative:
      "It's Wednesday. Your severance decision is behind you. Three recruiters have already reached out — the market moves fast when you've been at a name-brand. One message stands out: \"We're hiring fast. Can you start in two weeks?\"",
    prompt: "How do you feel right now?",
    choices: [
      { id: "c2a", label: "Relieved. You just want to stop bleeding cash and get back to something stable. Speed sounds good.", statChanges: { money: 10, safety: 5, sanity: -10, power: -5 }, nextBeat: -1 },
      { id: "c2b", label: "Suspicious. \"Hiring fast\" is a red flag. You've seen what happens when companies backfill without thinking. You want to slow down.", statChanges: { sanity: 10, power: 5, money: -5 }, nextBeat: -1 },
      { id: "c2c", label: "Strategic. You'll take the call, but you're running your own due diligence first. You want to know who funds them, who left recently, and why.", statChanges: { power: 10, sanity: 5, safety: 5, money: -5 }, nextBeat: -1 },
    ],
  },
];

const STAT_CONFIG: { key: keyof PreviewStats; label: string; emoji: string }[] = [
  { key: "money", label: "Money", emoji: "💰" },
  { key: "safety", label: "Safety", emoji: "🛡️" },
  { key: "sanity", label: "Sanity", emoji: "🧠" },
  { key: "power", label: "Power", emoji: "⚡" },
];

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function MiniStats({ stats, prev }: { stats: PreviewStats; prev?: PreviewStats }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STAT_CONFIG.map(({ key, label, emoji }) => {
        const val = Math.max(0, Math.min(100, stats[key]));
        const diff = prev ? stats[key] - prev[key] : 0;
        const barColor = val >= 60 ? "bg-[hsl(var(--civic-green))]" : val >= 30 ? "bg-primary" : "bg-[hsl(var(--destructive))]";
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <span className="text-sm">{emoji}</span>
            <div className="w-full h-1 rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ duration: 0.8, ease, delay: 0.2 }}
              />
            </div>
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-foreground">{val}</span>
              {diff !== 0 && (
                <motion.span
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.25 }}
                  className={cn(
                    "ml-0.5 text-[9px] font-mono font-semibold",
                    diff > 0 ? "text-[hsl(var(--civic-green))]" : "text-[hsl(var(--destructive))]"
                  )}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </motion.span>
              )}
            </div>
            <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest font-mono">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function applyChanges(base: PreviewStats, changes: Partial<PreviewStats>): PreviewStats {
  return {
    money: Math.max(0, Math.min(100, base.money + (changes.money ?? 0))),
    safety: Math.max(0, Math.min(100, base.safety + (changes.safety ?? 0))),
    sanity: Math.max(0, Math.min(100, base.sanity + (changes.sanity ?? 0))),
    power: Math.max(0, Math.min(100, base.power + (changes.power ?? 0))),
  };
}

export function ColdOpenPreview() {
  const [beatIndex, setBeatIndex] = useState(0);
  const [stats, setStats] = useState<PreviewStats>(INITIAL_STATS);
  const [prevStats, setPrevStats] = useState<PreviewStats | undefined>(undefined);
  const [choosing, setChoosing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const handleChoice = useCallback((choice: PreviewChoice) => {
    setChoosing(true);
    setPrevStats(stats);
    const next = applyChanges(stats, choice.statChanges);
    setStats(next);

    setTimeout(() => {
      if (choice.nextBeat === -1) {
        setFinished(true);
      } else {
        setBeatIndex(choice.nextBeat);
      }
      setChoosing(false);
    }, 500);
  }, [stats]);

  const handleRestart = () => {
    setStarted(false);
    setBeatIndex(0);
    setStats(INITIAL_STATS);
    setPrevStats(undefined);
    setFinished(false);
    setChoosing(false);
  };

  if (!started) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
            Cold Open · No Login Required
          </p>
        </div>
        <div className="p-5 md:p-7 text-center space-y-4">
          <h3 className="text-lg font-display font-bold text-foreground">
            See what's at stake in 60 seconds.
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Three quick decisions. Watch your Money, Safety, Sanity, and Power shift in real time.
            No account needed — just instinct.
          </p>
          <Button
            variant="premium"
            size="lg"
            onClick={() => setStarted(true)}
            className="gap-2"
          >
            <Play className="w-4 h-4" /> Try the Cold Open
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="rounded-xl border border-primary/20 bg-card/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
            Preview Complete
          </p>
        </div>
        <div className="p-5 md:p-7 space-y-5">
          <MiniStats stats={stats} prev={prevStats} />

          <div className="border-t border-border/20 pt-5 text-center space-y-3">
            <h3 className="text-lg font-display font-bold text-foreground">
              Want to see how this story ends for you?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Save your path and start Season 1 — three full episodes where every choice reshapes
              your money, safety, sanity, and power. The receipts are waiting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                variant="premium"
                size="lg"
                onClick={() => trackNoRegrets("landing_primary_cta_click", { cta_destination: "/no-regrets-game" })}
              >
                <Link to="/no-regrets-game" className="gap-2">
                  Start Season 1 <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" /> Replay Cold Open
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const beat = BEATS[beatIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-xl border border-border/30 bg-card/40 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
            Cold Open · Beat {beatIndex + 1} of {BEATS.length}
          </p>
        </div>
      </div>

      <div className="p-5 md:p-7 space-y-5">
        <MiniStats stats={stats} prev={prevStats} />

        <AnimatePresence mode="wait">
          <motion.div
            key={beatIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground leading-[1.8]">{beat.narrative}</p>

            <div className="space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60">
                {beat.prompt}
              </p>
              {beat.choices.map((choice, idx) => (
                <motion.button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  disabled={choosing}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.3, ease }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group w-full text-left rounded-lg border border-border/40 bg-card/60 hover:bg-card hover:border-primary/30 transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <div className="flex items-start gap-3 p-3 md:p-4">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-muted/40 border border-border/30 flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs md:text-sm text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                      {choice.label}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
