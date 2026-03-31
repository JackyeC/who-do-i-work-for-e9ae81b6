import { cn } from "@/lib/utils";
import { HeatChip } from "./HeatChip";

interface PosterData {
  bg: string;
  accent: string;
  dark: string;
  emoji: string;
  bigTxt: string;
  sub: string;
  tag: string;
  copy: string;
  fine: string;
}

interface ReceiptPosterProps {
  poster: PosterData;
  category: string | null;
  spiceLevel: number;
  className?: string;
}

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_workplace: "AI & WORK",
  future_of_work: "FUTURE OF WORK",
  labor_organizing: "LABOR",
  worker_rights: "DEI",
  regulation: "POLICY",
  layoffs: "LAYOFFS",
  pay_equity: "MONEY",
  legislation: "HIRING",
  general: "NEWS",
};

export function ReceiptPoster({ poster, category, spiceLevel, className }: ReceiptPosterProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg aspect-[4/5] md:aspect-[3/4] flex flex-col justify-between p-5 md:p-6",
        className
      )}
      style={{ backgroundColor: poster.bg }}
    >
      {/* Aged print texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top: Category badge + heat */}
      <div className="relative z-10 flex items-start justify-between">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded"
          style={{ backgroundColor: poster.accent + "33", color: poster.dark }}
        >
          {CATEGORY_DISPLAY[category ?? ""] || "NEWS"}
        </span>
        <HeatChip level={spiceLevel} />
      </div>

      {/* Center: Big headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
        <span className="text-4xl md:text-5xl">{poster.emoji}</span>
        <h2
          className="text-2xl md:text-3xl font-black uppercase leading-[0.95] tracking-tight"
          style={{ color: poster.dark }}
        >
          {poster.bigTxt}
        </h2>
        <p
          className="text-sm md:text-base font-medium italic"
          style={{ color: poster.dark + "cc" }}
        >
          {poster.sub}
        </p>
      </div>

      {/* Bottom: Ironic tag + copy + footer */}
      <div className="relative z-10 space-y-1.5 text-center">
        <p
          className="text-[10px] font-mono uppercase tracking-[0.15em]"
          style={{ color: poster.dark + "88" }}
        >
          {poster.tag}
        </p>
        <p
          className="text-xs font-semibold"
          style={{ color: poster.dark + "bb" }}
        >
          {poster.copy}
        </p>
        <p
          className="text-[9px] italic opacity-50"
          style={{ color: poster.dark }}
        >
          {poster.fine}
        </p>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.3em] pt-2 border-t opacity-40"
          style={{ color: poster.dark, borderColor: poster.dark + "33" }}
        >
          The Receipts by Jackye · WDIWF
        </div>
      </div>
    </div>
  );
}
