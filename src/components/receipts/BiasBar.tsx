/**
 * 5-segment bias bar visualization matching the reference design.
 * Labels: Left, Lean Left, Center, Lean Right, Right
 */

interface BiasBarProps {
  bias: string;
  big?: boolean;
}

const BIAS_CONFIG: Record<string, { label: string; color: string; position: number }> = {
  left: { label: "Left", color: "#3B82F6", position: 0 },
  "lean-left": { label: "Lean Left", color: "#60A5FA", position: 1 },
  "lean_left": { label: "Lean Left", color: "#60A5FA", position: 1 },
  center: { label: "Center", color: "#A78BFA", position: 2 },
  "lean-right": { label: "Lean Right", color: "#FB7185", position: 3 },
  "lean_right": { label: "Lean Right", color: "#FB7185", position: 3 },
  right: { label: "Right", color: "#EF4444", position: 4 },
};

export function BiasBar({ bias, big = false }: BiasBarProps) {
  const config = BIAS_CONFIG[bias];
  if (!config) return null;

  const h = big ? 10 : 7;
  const w = big ? 100 : 70;
  const segW = w / 5;

  return (
    <div className="inline-flex items-center gap-1.5">
      <svg width={w} height={h}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={i * segW + 1}
            y={0}
            width={segW - 2}
            height={h}
            rx={h / 2}
            fill={i === config.position ? config.color : "rgba(139,92,246,0.15)"}
          />
        ))}
      </svg>
      <span
        className="font-bold uppercase"
        style={{
          fontSize: big ? 11 : 9,
          color: config.color,
          letterSpacing: "0.05em",
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

/** Map source names to bias keys */
export function getSourceBiasKey(sourceName: string | null): string {
  if (!sourceName) return "center";
  const map: Record<string, string> = {
    "Fox News": "lean-right",
    "New York Post": "lean-right",
    "Reason": "lean-right",
    "Washington Examiner": "lean-right",
    "Daily Caller": "lean-right",
    "Freerepublic.com": "right",
    "Breitbart": "right",
    "Truthout": "left",
    "Democracy Now": "left",
    "Jacobin": "left",
    "Mother Jones": "left",
    "Al Jazeera English": "lean-left",
    "The Guardian": "lean-left",
    "CNN": "lean-left",
    "NPR": "lean-left",
    "Vox": "lean-left",
    "MSNBC": "left",
    "CBS News": "center",
    "NBER": "center",
    "CompTIA": "center",
    "Gallup": "center",
    "ADP Research": "center",
    "BLS": "center",
    "Reuters": "center",
    "AP News": "center",
    "BBC": "center",
    "Business Insider": "lean-left",
    "TechCrunch": "lean-left",
    "The Atlantic": "lean-left",
    "The Verge": "lean-left",
    "Harvard Business Review": "lean-right",
    "SHRM": "lean-right",
    "HR Dive": "center",
    "AIHR": "center",
    "CNET": "center",
    "Hollywood Reporter": "lean-left",
    "Futurism": "lean-left",
    "PCMag.com": "center",
    "TechRadar": "center",
    "Boston Herald": "lean-right",
    "Adweek": "center",
    "Www.gov.uk": "center",
    "RNZ": "center",
    "Hacker News": "center",
  };
  return map[sourceName] || "center";
}
