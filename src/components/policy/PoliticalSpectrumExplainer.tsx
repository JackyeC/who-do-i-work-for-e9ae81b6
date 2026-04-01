import { cn } from "@/lib/utils";

const SPECTRUM_GROUPS = [
  {
    label: "Far Right",
    title: "MAGA / white Christian nationalism",
    description:
      "This camp frames America as a nation under siege and pushes strongman politics, mass deportation, abortion bans, and attacks on LGBTQ protections.",
    color: "bg-destructive/80",
  },
  {
    label: "Moderate Right",
    title: "Old GOP / Reagan conservatism",
    description:
      "This group centers tax cuts, deregulation, business power, and traditional values while still operating inside older Republican institutions.",
    color: "bg-destructive/40",
  },
  {
    label: "Center",
    title: "Both-sides pragmatists",
    description:
      "The center is less a fixed ideology and more a posture built around compromise, disengagement, or the belief that both parties are equally extreme.",
    color: "bg-muted-foreground/40",
  },
  {
    label: "Moderate Left",
    title: "Institutional Democrats",
    description:
      "This camp supports reform, civil rights, and a larger safety net, but usually stays within pro-business and incremental policy boundaries.",
    color: "bg-primary/40",
  },
  {
    label: "Far Left",
    title: "Progressive / structural change",
    description:
      "The far left argues the system is functioning as designed and calls for major structural changes like Medicare for All, wealth taxes, and stronger corporate regulation.",
    color: "bg-primary/80",
  },
];

export function PoliticalSpectrumExplainer() {
  return (
    <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
      <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
        Independent media explainer
      </p>
      <h2 className="font-sans text-lg font-bold text-foreground mb-3">
        The 5 political groups most Americans mix up.
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[58ch] mb-8">
        Most people hear labels like far right, moderate, or far left without
        ever getting a clear explanation of what those groups actually believe.
        This breaks the spectrum into five camps so the language shaping American
        politics makes more sense.
      </p>

      {/* Spectrum bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-8 gap-px" aria-hidden="true">
        {SPECTRUM_GROUPS.map((g) => (
          <div key={g.label} className={cn("flex-1", g.color)} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {SPECTRUM_GROUPS.map((g) => (
          <div
            key={g.label}
            className="border border-border bg-card p-4 space-y-2"
          >
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary">
              {g.label}
            </p>
            <h3 className="text-sm font-bold text-foreground leading-snug">
              {g.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {g.description}
            </p>
          </div>
        ))}
      </div>

      {/* Why it matters callout */}
      <div className="border border-border bg-card p-5 max-w-[640px]">
        <h3 className="text-sm font-bold text-foreground mb-2">
          Why this matters
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Political language gets used as a shortcut to shut conversations down.
          A clearer spectrum helps people understand who is driving policy, who
          is defending the status quo, and who is demanding structural change.
        </p>
      </div>
    </section>
  );
}
