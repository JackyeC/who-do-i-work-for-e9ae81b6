/**
 * Pepper emoji heat display matching the reference design.
 */

interface SpicePeppersProps {
  level: number;
  big?: boolean;
}

const HEAT_TEXT: Record<number, string> = {
  5: "STRUCTURED SO YOU WOULDN'T FIND IT.",
  4: "DIRECT EMPLOYMENT IMPACT.",
  3: "WORTH DOCUMENTING.",
  2: "WORTH WATCHING.",
  1: "WORTH NOTING.",
};

export function SpicePeppers({ level, big = false }: SpicePeppersProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: big ? 26 : 20,
            opacity: i <= level ? 1 : 0.15,
            filter: i <= level ? "none" : "grayscale(1)",
          }}
        >
          🌶️
        </span>
      ))}
      <span
        className="font-mono font-bold ml-2"
        style={{
          fontSize: big ? 14 : 12,
          color: "#FF6B35",
        }}
      >
        {HEAT_TEXT[level] || HEAT_TEXT[1]}
      </span>
    </span>
  );
}
