import { useState } from "react";
import { cn } from "@/lib/utils";

const BIAS_LEGEND = [
  { color: "#3B82F6", label: "Left" },
  { color: "#60A5FA", label: "Lean Left" },
  { color: "#A78BFA", label: "Center" },
  { color: "#FB7185", label: "Lean Right" },
  { color: "#EF4444", label: "Right" },
];

const SPICE_LEGEND = [
  [1, "Footnote. You should know this exists."],
  [2, "Side-eye. Something's off here."],
  [3, "Screenshot this. Send it to your group chat."],
  [4, "We have a problem. This affects your job."],
  [5, "They thought we wouldn't find out. We found out."],
] as const;

export function HowToRead() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-[1160px] mx-auto px-8">
        <button
          onClick={() => setOpen(!open)}
          className="bg-transparent border-none cursor-pointer py-3 flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-[0.08em] font-mono"
        >
          <span className="text-primary">?</span> HOW TO READ THIS {open ? "▲" : "▼"}
        </button>
        {open && (
          <div className="pb-5 flex flex-wrap gap-7">
            {/* Spice Level */}
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2 font-mono">
                Spice Level
              </div>
              <div className="flex flex-col gap-1">
                {SPICE_LEGEND.map(([n, label]) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <span className="min-w-[80px]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} style={{ fontSize: 12, opacity: i <= n ? 1 : 0.18 }}>
                          🌶️
                        </span>
                      ))}
                    </span>
                    <span className="text-[15px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Bias */}
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2 font-mono">
                Source Bias
              </div>
              <div className="flex flex-col gap-1.5">
                {BIAS_LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2 font-mono">
                Badges
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded">HOT</span>
                  <span className="text-xs text-muted-foreground">Breaking or trending this week</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-bold">Jackye's take →</span>
                  <span className="text-xs text-muted-foreground">Her unfiltered analysis — always free</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2 font-mono">
                Categories
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  ["#38BDF8", "Structure — SEC, State Registries"],
                  ["#F0C040", "Money — FEC, USASpending, IRS 990"],
                  ["#FB7185", "Behavior — OSHA, EEOC, DOL WHD"],
                  ["#A78BFA", "Influence — LDA, OpenSecrets, FACA"],
                  ["#2DD4BF", "Momentum — WARN, Job Postings, Earnings"],
                  ["#34D399", "Context — BLS, H1B, USPTO"],
                  ["#F97316", "Off the Record — Reddit, Blind, Glassdoor"],
                ].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    <span className="text-xs text-muted-foreground">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
