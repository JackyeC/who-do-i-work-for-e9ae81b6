import { useState } from "react";
import { motion } from "framer-motion";
import type { ForcedChoice } from "./useValuesFlow";

const SCENARIOS = [
  {
    a: "A company pays above market but has zero pay transparency.",
    b: "A company posts every salary band publicly but pays at market.",
  },
  {
    a: "A company has a strong DEI team but lobbies against worker protections.",
    b: "A company has no DEI program but a clean labor record.",
  },
  {
    a: "A company offers rapid promotion but burns through people.",
    b: "A company grows slower but has stable leadership and low churn.",
  },
  {
    a: "A company is fully remote but the team culture is weak.",
    b: "A company requires in-office but the team bonds are strong.",
  },
  {
    a: "A company is politically transparent — even when it's uncomfortable.",
    b: "A company stays out of politics entirely and focuses on mission.",
  },
  {
    a: "A company is AI-forward and moves fast on automation.",
    b: "A company is cautious on AI and prioritizes data privacy.",
  },
];

interface Props {
  choices: ForcedChoice[];
  onChange: (choices: ForcedChoice[]) => void;
}

export function ForcedChoiceStep({ choices, onChange }: Props) {
  const [skipsUsed, setSkipsUsed] = useState(
    choices.filter((c) => c.pick === "skip").length
  );

  const getChoice = (idx: number) => choices.find((c) => c.scenario === idx);

  const pick = (scenario: number, side: "a" | "b" | "skip") => {
    const existing = choices.filter((c) => c.scenario !== scenario);
    if (side === "skip") {
      const currentSkips = existing.filter((c) => c.pick === "skip").length;
      if (currentSkips >= 1) return; // max 1 skip
      setSkipsUsed(currentSkips + 1);
    }
    onChange([...existing, { scenario, pick: side }]);
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          Which matters more to you?
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          No right answers. Just tradeoffs. Pick the one that hits closer to home.
        </p>
      </div>

      {SCENARIOS.map((s, idx) => {
        const current = getChoice(idx);
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl p-4 border"
            style={{
              background: "#13121A",
              borderColor: current ? "#F0C040" : "#242424",
            }}
          >
            <p className="text-xs font-mono mb-3 uppercase tracking-wider" style={{ color: "#F0C040" }}>
              Scenario {idx + 1}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => pick(idx, "a")}
                className="text-left rounded-lg p-3 border transition-all text-sm"
                style={{
                  background: current?.pick === "a" ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
                  borderColor: current?.pick === "a" ? "#F0C040" : "#242424",
                  color: "#F0EBE0",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {s.a}
              </button>
              <button
                onClick={() => pick(idx, "b")}
                className="text-left rounded-lg p-3 border transition-all text-sm"
                style={{
                  background: current?.pick === "b" ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
                  borderColor: current?.pick === "b" ? "#F0C040" : "#242424",
                  color: "#F0EBE0",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {s.b}
              </button>
            </div>
            {!current && skipsUsed < 1 && (
              <button
                onClick={() => pick(idx, "skip")}
                className="mt-2 text-xs underline"
                style={{ color: "#9898A0" }}
              >
                Depends — skip this one
              </button>
            )}
            {current?.pick === "skip" && (
              <p className="mt-2 text-xs italic" style={{ color: "#9898A0" }}>Skipped</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
