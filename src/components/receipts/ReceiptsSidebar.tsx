import { Link } from "react-router-dom";
import { BiasBar } from "./BiasBar";
import type { ReceiptArticle } from "@/hooks/use-receipts-feed";

const CAT_COLORS: Record<string, string> = {
  ai_workplace: "#38BDF8",
  future_of_work: "#F0C040",
  labor_organizing: "#2DD4BF",
  worker_rights: "#A78BFA",
  regulation: "#FB7185",
  layoffs: "#FB7185",
  pay_equity: "#34D399",
  legislation: "#60A5FA",
  general: "#EDE8DC",
};

const BIAS_LEGEND = [
  { key: "left", color: "#3B82F6", label: "Left" },
  { key: "lean-left", color: "#60A5FA", label: "Lean Left" },
  { key: "center", color: "#A78BFA", label: "Center" },
  { key: "lean-right", color: "#FB7185", label: "Lean Right" },
  { key: "right", color: "#EF4444", label: "Right" },
];

interface ReceiptsSidebarProps {
  hotArticles: ReceiptArticle[];
}

export function ReceiptsSidebar({ hotArticles }: ReceiptsSidebarProps) {
  return (
    <aside className="sticky top-[74px] space-y-5">
      {/* Newsletter */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-[9px] uppercase tracking-[0.55em] text-primary mb-3 font-mono">
          Every Morning
        </p>
        <h3 className="text-2xl font-black text-foreground mb-2 leading-tight">
          My Uncertainty Era
        </h3>
        <p className="text-base text-muted-foreground italic leading-relaxed mb-4">
          The part where I say what everyone's thinking but nobody's saying.
        </p>
        <blockquote className="border-l-2 border-primary pl-3.5 mb-5">
          <p className="text-base text-foreground leading-relaxed italic">
            "Every company has a 'people are our greatest asset' poster. Most hang next to a layoff plan. Those who see this clearly?{" "}
            <span className="text-primary">My people.</span>"
          </p>
        </blockquote>
        <Link
          to="/newsletter"
          className="block bg-primary text-primary-foreground font-extrabold py-3.5 rounded-lg text-center text-base tracking-[0.08em] no-underline hover:opacity-90 transition-opacity"
        >
          Subscribe → Daily Briefing
        </Link>
      </div>

      {/* Hottest Takes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[9px] uppercase tracking-[0.55em] text-primary mb-3.5 font-mono">
          ⭐ Highest Stargaze
        </p>
        {hotArticles.slice(0, 4).map((article) => (
          <button
            key={article?.id}
            onClick={() => document.getElementById(`p-${article?.id}-s`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="block w-full text-left pb-3 mb-3 border-b border-border last:border-none last:mb-0 last:pb-0 group/hot cursor-pointer hover:bg-muted/20 rounded-md px-1 -mx-1 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: CAT_COLORS[article.category ?? ""] || "#EDE8DC" }}
              >
                {article.category?.replace("_", " ") || "NEWS"}
              </span>
              <BiasBar bias="center" />
            </div>
            <p className="text-base font-bold text-foreground leading-snug group-hover/hot:text-primary transition-colors">
              {article.headline}
            </p>
            <span className="text-xs text-primary opacity-0 group-hover/hot:opacity-100 transition-opacity flex items-center gap-1 mt-1">
              Jump to story →
            </span>
          </button>
        ))}
      </div>

      {/* Source Bias Legend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[9px] uppercase tracking-[0.55em] text-primary mb-3.5 font-mono">
          Source Bias
        </p>
        {BIAS_LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground mt-2.5 leading-relaxed font-mono">
          Multiple perspectives, labeled honestly.
        </p>
      </div>

      {/* The Receipts blurb */}
      <div className="rounded-xl p-5 border" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.15)" }}>
        <p className="text-[9px] uppercase tracking-[0.55em] text-primary mb-2.5 font-mono">
          🧾 The Receipts
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Connecting dots corporate PR hoped you wouldn't. Every story. Every time.
        </p>
      </div>
    </aside>
  );
}
