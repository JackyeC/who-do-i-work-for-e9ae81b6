import { cn } from "@/lib/utils";

const SPECTRUM_GROUPS = [
  {
    label: "Far right",
    description:
      "Sees America as under siege and wants a return to a more rigid social order, often centered on nationalism, restriction, and strongman politics.",
    barColor: "bg-destructive",
    labelColor: "text-destructive",
  },
  {
    label: "Moderate right",
    description:
      "Focuses on tax cuts, free markets, deregulation, and traditional institutions, while generally favoring established conservative governance over open political disruption.",
    barColor: "bg-[hsl(var(--civic-yellow))]",
    labelColor: "text-[hsl(var(--civic-yellow))]",
  },
  {
    label: "Center",
    description:
      "Tends to frame politics as a balance problem, emphasizing compromise, institutional stability, and skepticism toward both major sides.",
    barColor: "bg-muted-foreground/60",
    labelColor: "text-muted-foreground",
  },
  {
    label: "Moderate left",
    description:
      "Supports reform through existing institutions, including a stronger safety net, civil rights, and incremental policy change within a capitalist framework.",
    barColor: "bg-[hsl(var(--civic-blue))]",
    labelColor: "text-[hsl(var(--civic-blue))]",
  },
  {
    label: "Far left",
    description:
      "Argues that structural inequality is built into the system itself and supports deeper changes such as wealth taxes, expanded public programs, and stronger limits on corporate power.",
    barColor: "bg-primary",
    labelColor: "text-primary",
  },
];

export function PoliticalSpectrumExplainer() {
  return (
    <section className="py-16 px-5">
      <div className="max-w-[1100px] mx-auto">
        {/* Intro */}
        <div className="max-w-[760px] mb-8">
          <p className="font-mono text-xs tracking-[0.12em] uppercase text-muted-foreground font-bold mb-3">
            Independent media explainer
          </p>
          <h2
            className="font-sans text-foreground leading-[1.05] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            The 5 ideological groups shaping American politics.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[58ch]">
            Most people hear labels like far right, moderate, or far left
            without a clear definition. This breaks the landscape into five
            camps so visitors can understand what each group tends to believe,
            how they frame power, and why it matters.
          </p>
        </div>

        {/* Spectrum bar */}
        <div
          className="grid gap-[0.35rem] mb-8"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
          aria-hidden="true"
        >
          {SPECTRUM_GROUPS.map((g) => (
            <span
              key={g.label}
              className={cn("h-3 rounded-full block", g.barColor)}
            />
          ))}
        </div>

        {/* Cards — 1 col → 2 col → 5 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SPECTRUM_GROUPS.map((g) => (
            <div
              key={g.label}
              className="rounded-2xl p-5 bg-foreground/[0.04] border border-foreground/[0.08] backdrop-blur-sm flex flex-col"
            >
              <p
                className={cn(
                  "font-mono text-[0.78rem] font-bold uppercase tracking-[0.08em] mb-3",
                  g.labelColor
                )}
              >
                {g.label}
              </p>
              <p className="text-sm text-muted-foreground leading-[1.65]">
                {g.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
