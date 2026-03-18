import { Slider } from "@/components/ui/slider";

export interface DNAValues {
  stability: number;
  autonomy: number;
  pace: number;
  innovation: number;
  comp: number;
}

const DNA_FADERS = [
  { id: "stability" as const, label: "Work Style", left: "Flexible", right: "Structured", defaultValue: 60 },
  { id: "autonomy" as const, label: "Ownership", left: "Guided", right: "Autonomous", defaultValue: 70 },
  { id: "pace" as const, label: "Pace", left: "Steady", right: "Fast-Paced", defaultValue: 55 },
  { id: "innovation" as const, label: "Culture", left: "Traditional", right: "Innovative", defaultValue: 65 },
  { id: "comp" as const, label: "Priority", left: "Mission", right: "Compensation", defaultValue: 45 },
];

interface DNAPanelProps {
  values: DNAValues;
  onChange: (values: DNAValues) => void;
}

export function DNAPanel({ values, onChange }: DNAPanelProps) {
  return (
    <div className="relative rounded-2xl border border-[#2a2a3a] bg-[#16161f] p-7 mb-10 overflow-hidden">
      {/* Watermark */}
      <span className="absolute top-5 right-6 font-mono text-[10px] text-[#2a2a3a] tracking-[3px] select-none">
        VALUES DNA
      </span>

      <h2 className="font-['Syne',sans-serif] font-bold text-sm text-[#e8ff47] tracking-wider uppercase mb-5">
        ⬡ Calibrate Your Values DNA
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DNA_FADERS.map((f) => (
          <div key={f.id} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[#e8e8f0] tracking-wide">{f.label}</span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#9898b0]">{f.left}</span>
              <span className="text-[#e8ff47]">{f.right}</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[values[f.id]]}
              onValueChange={([v]) => onChange({ ...values, [f.id]: v })}
              className="[&_[data-radix-slider-track]]:h-[3px] [&_[data-radix-slider-track]]:bg-[#2a2a3a] [&_[data-radix-slider-range]]:bg-[#e8ff47] [&_[data-radix-slider-thumb]]:h-3.5 [&_[data-radix-slider-thumb]]:w-3.5 [&_[data-radix-slider-thumb]]:bg-[#e8ff47] [&_[data-radix-slider-thumb]]:border-0 [&_[data-radix-slider-thumb]]:shadow-[0_0_10px_#e8ff47]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const DEFAULT_DNA: DNAValues = {
  stability: 60,
  autonomy: 70,
  pace: 55,
  innovation: 65,
  comp: 45,
};
