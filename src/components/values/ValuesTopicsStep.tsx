import { motion } from "framer-motion";
import type { TopicRating } from "./useValuesFlow";

const TOPICS = [
  { column: "worker_protections_importance", label: "Worker Protections" },
  { column: "dei_equity_importance", label: "Inclusion" },
  { column: "anti_corruption_importance", label: "Leadership Ethics" },
  { column: "pay_equity_importance", label: "Compensation Fairness" },
  { column: "reproductive_rights_importance", label: "Reproductive Healthcare" },
  { column: "education_access_importance", label: "Education Access" },
  { column: "environment_climate_importance", label: "Environment" },
  { column: "mission_alignment_importance", label: "Mission Alignment" },
  { column: "ai_ethics_importance", label: "AI Ethics" },
  { column: "pay_transparency_importance", label: "Pay Transparency" },
  { column: "political_transparency_importance", label: "Political Spending Transparency" },
  { column: "data_privacy_importance", label: "Data Privacy" },
];

const RATINGS = [
  { value: 90, label: "Must-have" },
  { value: 70, label: "Matters" },
  { value: 40, label: "Flexible" },
  { value: 10, label: "Don't care" },
];

interface Props {
  ratings: TopicRating[];
  onChange: (ratings: TopicRating[]) => void;
}

export function ValuesTopicsStep({ ratings, onChange }: Props) {
  const getRating = (col: string) => ratings.find((r) => r.column === col)?.value ?? null;

  const setRating = (col: string, value: number) => {
    const updated = ratings.filter((r) => r.column !== col);
    updated.push({ column: col, value });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          How much does each of these matter?
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          Rate each topic. This sharpens how we evaluate employers for you.
        </p>
      </div>

      <div className="space-y-2">
        {TOPICS.map((topic, idx) => {
          const current = getRating(topic.column);
          return (
            <motion.div
              key={topic.column}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-xl p-3 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              style={{ background: "#13121A", borderColor: "#242424" }}
            >
              <p className="text-sm font-medium" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
                {topic.label}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRating(topic.column, r.value)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all border"
                    style={{
                      background: current === r.value ? "rgba(240,192,64,0.12)" : "transparent",
                      borderColor: current === r.value ? "#F0C040" : "#242424",
                      color: current === r.value ? "#F0C040" : "#9898A0",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
