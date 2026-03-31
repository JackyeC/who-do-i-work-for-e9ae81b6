import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageSEO } from "@/hooks/use-page-seo";
import { PaletteGrid } from "@/components/palette/PaletteGrid";
import { PalettePosterPreview } from "@/components/palette/PalettePosterPreview";
import { PaletteHeader } from "@/components/palette/PaletteHeader";
import { PALETTES, type PaletteEntry } from "@/components/palette/palette-data";

export default function PaletteStudio() {
  const [selected, setSelected] = useState<PaletteEntry>(PALETTES[0]);
  const [mood, setMood] = useState<string>("all");

  usePageSEO({
    title: "Palette Studio — JRC EDIT × WDIWF Creative Direction",
    description: "Explore curated editorial palettes for The Receipts poster series. A creative direction tool by Jackye Clayton.",
    path: "/palette",
  });

  const filtered = mood === "all" ? PALETTES : PALETTES.filter(p => p.mood === mood);

  const handleSelect = useCallback((p: PaletteEntry) => setSelected(p), []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient background glow that shifts with selected palette */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 70% 20%, ${selected.accent}06 0%, transparent 50%)`,
        }}
      />

      <div className="relative">
        <PaletteHeader mood={mood} onMoodChange={setMood} />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-28">
          <div className="grid lg:grid-cols-[1fr_480px] gap-8 lg:gap-16 items-start">
            {/* Left: palette browser */}
            <div className="order-2 lg:order-1">
              <div className="flex items-baseline justify-between mb-5">
                <p className="text-xs font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
                  {filtered.length} palette{filtered.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.2em]">
                  TAP TO PREVIEW
                </p>
              </div>
              <PaletteGrid
                palettes={filtered}
                selected={selected}
                onSelect={handleSelect}
              />
            </div>

            {/* Right: live poster — sticky artboard */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  <PalettePosterPreview palette={selected} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom signature */}
        <div className="text-center pb-12">
          <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-muted-foreground/25">
            CREATED BY JACKYE CLAYTON · WDIWF
          </p>
        </div>
      </div>
    </div>
  );
}
