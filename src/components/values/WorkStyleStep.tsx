import { motion } from "framer-motion";
import type { WorkStyleData } from "./useValuesFlow";

interface SegmentOption {
  value: string;
  label: string;
}

function SegmentGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: "#13121A", borderColor: "#242424" }}>
      <p className="text-sm font-semibold mb-3" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
        {label}
      </p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 rounded-lg py-2 px-3 text-sm font-medium transition-all border"
            style={{
              background: value === opt.value ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: value === opt.value ? "#F0C040" : "#242424",
              color: value === opt.value ? "#F0C040" : "#F0EBE0",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  data: WorkStyleData;
  onChange: (data: WorkStyleData) => void;
}

export function WorkStyleStep({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          How do you work best?
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          Quick picks. No wrong answers. Just what fits you right now.
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <SegmentGroup
          label="Growth vs Stability"
          options={[
            { value: "startup", label: "Growth" },
            { value: "enterprise", label: "Stability" },
          ]}
          value={data.growthVsStability}
          onChange={(v) => onChange({ ...data, growthVsStability: v as any })}
        />
        <SegmentGroup
          label="Company Size"
          options={[
            { value: "small", label: "Small / Startup" },
            { value: "large", label: "Large / Enterprise" },
          ]}
          value={data.companySize}
          onChange={(v) => onChange({ ...data, companySize: v as any })}
        />
        <SegmentGroup
          label="Work Location"
          options={[
            { value: "remote", label: "Remote" },
            { value: "hybrid", label: "Hybrid" },
            { value: "in-person", label: "In-Person" },
          ]}
          value={data.remote}
          onChange={(v) => onChange({ ...data, remote: v as any })}
        />
        <SegmentGroup
          label="What drives your next move?"
          options={[
            { value: "mission", label: "Mission" },
            { value: "compensation", label: "Compensation" },
          ]}
          value={data.missionVsComp}
          onChange={(v) => onChange({ ...data, missionVsComp: v as any })}
        />
      </motion.div>
    </div>
  );
}
