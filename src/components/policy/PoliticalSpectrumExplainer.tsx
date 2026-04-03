import { cn } from "@/lib/utils";

const SPECTRUM_GROUPS = [
  {
    label: "Far Right",
    title: "MAGA / white Christian nationalism",
    description:
      "This camp frames America as a nation under siege and pushes strongman politics, mass deportation, abortion bans, and attacks on LGBTQ protections.",
  },
  {
    label: "Moderate Right",
    title: "Old GOP / Reagan conservatism",
    description:
      "This group centers tax cuts, deregulation, business power, and traditional values while still operating inside older Republican institutions.",
  },
  {
    label: "Center",
    title: "Both-sides pragmatists",
    description:
      "The center is less a fixed ideology and more a posture built around compromise, disengagement, or the belief that both parties are equally extreme.",
  },
  {
    label: "Moderate Left",
    title: "Institutional Democrats",
    description:
      "This camp supports reform, civil rights, and a larger safety net, but usually stays within pro-business and incremental policy boundaries.",
  },
  {
    label: "Far Left",
    title: "Progressive / structural change",
    description:
      "The far left argues the system is functioning as designed and calls for major structural changes like Medicare for All, wealth taxes, and stronger corporate regulation.",
  },
];

const BAR_COLORS = [
  "bg-[hsl(0_72%_51%)]",       // red — far right
  "bg-[hsl(25_95%_53%)]",      // orange — moderate right
  "bg-muted-foreground/50",    // gray — center
  "bg-[hsl(var(--civic-blue))]", // blue — moderate left
  "bg-primary",                // gold/purple — far left
];

export function PoliticalSpectrumExplainer() {
  return (
    <section className="py-16 px-5">
      <div className="max-w-[1100px] mx-auto">
        {/* Intro */}
        <div className="max-w-[760px] mb-8">
          <p className="font-mono text-[0.8rem] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">
            Independent media explainer
          </p>
          <h2
            className="font-sans text-foreground leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800 }}
          >
            The 5 political groups most Americans mix up
          </h2>
          <p className="text-[1.05rem] leading-[1.7] text-muted-foreground">
            Most people hear labels like far right, moderate, or far left
            without ever getting a clear explanation of what those groups
            actually believe. This breaks the spectrum into five camps so people
            can understand the language shaping American politics.
          </p>
        </div>

        {/* Spectrum bar */}
        <div
          className="grid gap-[0.35rem] my-8"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
          aria-hidden="true"
        >
          {BAR_COLORS.map((color, i) => (
            <span key={i} className={cn("h-3 rounded-full block", color)} />
          ))}
        </div>

        {/* Cards — 12-col grid: 1→2→3+2 layout */}
        <div className="grid grid-cols-12 gap-4">
          {SPECTRUM_GROUPS.map((g, i) => (
            <div
              key={g.label}
              className={cn(
                "col-span-12 sm:col-span-6",
                i < 3 ? "lg:col-span-4" : "lg:col-span-6",
                "rounded-2xl p-5",
                "bg-foreground/[0.04] border border-foreground/[0.08]",
                "backdrop-blur-sm"
              )}
            >
              <p className="font-mono text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[hsl(var(--civic-blue))] mb-2">
                {g.label}
              </p>
              <h3 className="text-[1.2rem] font-bold text-foreground leading-[1.2] mb-2.5">
                {g.title}
              </h3>
              <p className="text-muted-foreground leading-[1.65] text-sm">
                {g.description}
              </p>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div className="mt-6 p-6 rounded-2xl border border-foreground/[0.08] bg-gradient-to-br from-[hsl(var(--civic-blue))]/[0.14] to-primary/[0.14]">
          <h3 className="text-[1.15rem] font-bold text-foreground mb-3">
            Why this matters
          </h3>
          <p className="text-muted-foreground leading-[1.7] text-sm">
            Political language gets used as a shortcut to shut conversations
            down. A clearer spectrum helps people understand who is driving
            policy, who is defending the status quo, and who is demanding
            structural change.
          </p>
        </div>
      </div>
    </section>
  );
}
