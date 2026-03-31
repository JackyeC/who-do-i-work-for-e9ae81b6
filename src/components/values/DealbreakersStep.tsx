import { motion } from "framer-motion";
import {
  Ban, ShieldOff, Leaf, Bot, Eye, HardHat,
  Lock, Scale, AlertTriangle, UserX
} from "lucide-react";
import type { DealbreakersData } from "./useValuesFlow";

const DEALBREAKER_OPTIONS = [
  { column: "labor_rights_importance", label: "Wage Theft", icon: Ban, desc: "Unpaid wages, misclassification, or stolen tips" },
  { column: "union_rights_importance", label: "Anti-Union Activity", icon: ShieldOff, desc: "Union busting, retaliation against organizing" },
  { column: "environment_climate_importance", label: "Environmental Violations", icon: Leaf, desc: "Pollution, emissions fraud, or greenwashing" },
  { column: "ai_ethics_importance", label: "AI Hiring Without Disclosure", icon: Bot, desc: "Automated screening with no transparency" },
  { column: "political_donations_importance", label: "Political Spending Opacity", icon: Eye, desc: "Dark money, hidden PAC contributions" },
  { column: "workplace_safety_importance", label: "Safety Violations", icon: HardHat, desc: "OSHA violations, unsafe conditions" },
  { column: "data_privacy_importance", label: "Data Privacy Breaches", icon: Lock, desc: "Employee or candidate data mishandled" },
  { column: "anti_discrimination_importance", label: "Discrimination Records", icon: Scale, desc: "EEOC complaints, pay gap lawsuits" },
  { column: "worker_protections_importance", label: "Retaliation Patterns", icon: AlertTriangle, desc: "Whistleblower punishment, review suppression" },
  { column: "anti_corruption_importance", label: "Executive Ethics Concerns", icon: UserX, desc: "Fraud, self-dealing, or golden parachutes" },
];

interface Props {
  data: DealbreakersData;
  onChange: (data: DealbreakersData) => void;
}

export function DealbreakersStep({ data, onChange }: Props) {
  const toggleSelected = (col: string) => {
    const isSelected = data.selected.includes(col);
    if (isSelected) {
      onChange({
        selected: data.selected.filter((c) => c !== col),
        walkAway: data.walkAway.filter((c) => c !== col),
      });
    } else if (data.selected.length < 5) {
      onChange({ ...data, selected: [...data.selected, col] });
    }
  };

  const toggleWalkAway = (col: string) => {
    if (!data.selected.includes(col)) return;
    const isWA = data.walkAway.includes(col);
    if (isWA) {
      onChange({ ...data, walkAway: data.walkAway.filter((c) => c !== col) });
    } else if (data.walkAway.length < 2) {
      onChange({ ...data, walkAway: [...data.walkAway, col] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          What won't you tolerate?
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          Pick up to 5 dealbreakers. Then mark your top 2 true walk-away issues.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DEALBREAKER_OPTIONS.map((opt, idx) => {
          const selected = data.selected.includes(opt.column);
          const isWA = data.walkAway.includes(opt.column);
          const Icon = opt.icon;

          return (
            <motion.div
              key={opt.column}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <button
                onClick={() => toggleSelected(opt.column)}
                className="w-full text-left rounded-xl p-3 border transition-all"
                style={{
                  background: selected ? "rgba(240,192,64,0.10)" : "#13121A",
                  borderColor: isWA ? "#F0C040" : selected ? "rgba(240,192,64,0.4)" : "#242424",
                  borderWidth: isWA ? 2 : 1,
                }}
              >
                <Icon className="w-4 h-4 mb-2" style={{ color: selected ? "#F0C040" : "#9898A0" }} />
                <p className="text-sm font-semibold" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-1 leading-snug" style={{ color: "#9898A0" }}>
                  {opt.desc}
                </p>
              </button>
              {selected && (
                <button
                  onClick={() => toggleWalkAway(opt.column)}
                  className="mt-1 text-xs w-full text-center py-1 rounded-lg transition-all"
                  style={{
                    background: isWA ? "rgba(240,192,64,0.15)" : "transparent",
                    color: isWA ? "#F0C040" : "#9898A0",
                    fontFamily: "DM Mono, monospace",
                  }}
                >
                  {isWA ? "★ Walk-away issue" : "Mark as walk-away"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-center mt-2" style={{ color: "#9898A0", fontFamily: "DM Mono, monospace" }}>
        {data.selected.length}/5 selected · {data.walkAway.length}/2 walk-away
      </p>
    </div>
  );
}
