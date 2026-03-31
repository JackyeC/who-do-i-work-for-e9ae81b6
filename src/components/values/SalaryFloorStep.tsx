import { motion } from "framer-motion";
import type { SalaryData } from "./useValuesFlow";

interface Props {
  data: SalaryData;
  onChange: (data: SalaryData) => void;
}

export function SalaryFloorStep({ data, onChange }: Props) {
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange({ ...data, salaryFloor: raw ? parseInt(raw) : null });
  };

  const formatted = data.salaryFloor
    ? `$${data.salaryFloor.toLocaleString()}`
    : "";

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          What's your floor?
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          The number below which it's not worth the conversation. We won't share this — it just sharpens our recommendations.
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div
          className="rounded-xl p-4 border"
          style={{ background: "#13121A", borderColor: "#242424" }}
        >
          <label
            className="text-xs font-mono uppercase tracking-wider block mb-2"
            style={{ color: "#F0C040", fontFamily: "DM Mono, monospace" }}
          >
            Minimum Annual Salary
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatted}
            onChange={handleSalaryChange}
            placeholder="$0"
            className="w-full bg-transparent text-3xl font-bold outline-none border-b pb-2"
            style={{
              color: "#F0EBE0",
              borderColor: "#242424",
              fontFamily: "DM Sans, sans-serif",
            }}
          />
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{ background: "#13121A", borderColor: "#242424" }}
        >
          <label
            className="text-xs font-mono uppercase tracking-wider block mb-2"
            style={{ color: "#F0C040", fontFamily: "DM Mono, monospace" }}
          >
            Walk-Away Triggers
          </label>
          <p className="text-xs mb-3" style={{ color: "#9898A0" }}>
            Beyond salary — what would make you walk away from an offer or role?
          </p>
          <textarea
            value={data.walkAway}
            onChange={(e) => onChange({ ...data, walkAway: e.target.value })}
            placeholder="e.g. Bait-and-switch on remote work, unclear scope, no growth path..."
            rows={3}
            className="w-full bg-transparent text-sm outline-none resize-none"
            style={{
              color: "#F0EBE0",
              fontFamily: "DM Sans, sans-serif",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
