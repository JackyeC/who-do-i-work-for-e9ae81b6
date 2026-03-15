import { SectionReveal } from "@/components/landing/SectionReveal";

const platforms = [
  "LinkedIn Learning",
  "HR Tech Conference",
  "Recruiting Daily",
  "SHRM",
  "TAtech",
  "ERE Media",
];

const pillars = [
  { stat: "15+", label: "Years in Talent Acquisition" },
  { stat: "Board Member", label: "HR Technology Advisory" },
  { stat: "LinkedIn Learning", label: "Published Instructor" },
];

export function SocialProofStrip() {
  return (
    <SectionReveal>
      <div className="border-y border-border px-6 lg:px-16 py-14 lg:py-16">
        <div className="max-w-[960px] mx-auto flex flex-col gap-10">
          {/* Row 1 — Platform logos as text wordmarks */}
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted-foreground/50">
              Featured In
            </span>
            <div className="flex items-center justify-center gap-6 lg:gap-10 flex-wrap">
              {platforms.map((name) => (
                <span
                  key={name}
                  className="font-mono text-sm tracking-wider uppercase text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-default select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Row 2 — Three proof pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {pillars.map((p) => (
              <div key={p.label} className="text-center">
                <div className="font-data text-2xl font-bold text-foreground mb-1">
                  {p.stat}
                </div>
                <div className="font-mono text-sm tracking-wider uppercase text-muted-foreground">
                  {p.label}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 — Credibility quote */}
          <div className="max-w-[540px] mx-auto">
            <blockquote className="border-l-2 border-primary pl-4">
              <p className="font-serif italic text-base text-foreground/80 leading-relaxed mb-2">
                "Jackye doesn't just understand recruiting — she understands the systems behind it."
              </p>
              <cite className="font-mono text-sm tracking-wider uppercase text-muted-foreground not-italic">
                — Industry Peer, HR Technology Leader
              </cite>
            </blockquote>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
