import { useState } from "react";
import { Zap } from "lucide-react";
import { rivalries2026, RIVALRY_CATEGORIES } from "@/data/rivalries2026";
import { RivalryBattleCard } from "@/components/RivalryBattleCard";
import { usePageSEO } from "@/hooks/use-page-seo";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/landing/SectionReveal";

export default function Rivalries() {
  const [activeCategory, setActiveCategory] = useState("all");

  usePageSEO({
    title: "2026 Rivalry Super Tracker — Corporate Intelligence Matchups",
    description: "Track the biggest corporate rivalries of 2026. AI wars, streaming battles, fast food dethronings, and ethical fashion showdowns — powered by career intelligence signals.",
    path: "/rivalries",
  });

  const filtered = activeCategory === "all"
    ? rivalries2026
    : rivalries2026.filter(r => r.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary font-semibold">
              2026 Intelligence
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Rivalry Super Tracker
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-[600px]">
            The highest-stakes corporate matchups of 2026, analyzed through career intelligence signals.
            Every rivalry includes transparency scores, lobbying data, and workforce signals.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="border-b border-border bg-muted/20 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          {RIVALRY_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "font-mono text-[10px] tracking-wider uppercase px-4 py-1.5 border transition-all whitespace-nowrap",
                activeCategory === cat.key
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rivalry cards */}
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rivalry, i) => (
            <SectionReveal key={rivalry.id} delay={i * 0.05}>
              <RivalryBattleCard rivalry={rivalry} />
            </SectionReveal>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            Rivalry data curated from public signals · Corporate Character Scores powered by verified intelligence ·
            Updated March 2026
          </p>
        </div>
      </div>
    </div>
  );
}
