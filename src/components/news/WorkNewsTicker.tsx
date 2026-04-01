import { useWorkNewsTicker } from "@/hooks/use-work-news";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Newspaper, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WorkNewsTickerProps {
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  regulation: "REG",
  future_of_work: "WORK",
  worker_rights: "RIGHTS",
  ai_workplace: "AI",
  legislation: "LAW",
  layoffs: "LAYOFFS",
  pay_equity: "PAY",
  labor_organizing: "LABOR",
  general: "NEWS",
};

export function WorkNewsTicker({ className }: WorkNewsTickerProps) {
  const navigate = useNavigate();
  const { data: articles } = useWorkNewsTicker();

  if (!articles?.length) return null;

  // Double the items for seamless loop
  const doubled = [...articles, ...articles];

  return (
    <div className={cn("relative overflow-hidden bg-card/80 border-b border-border", className)}>
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 bg-destructive text-destructive-foreground px-3 py-1.5 flex items-center gap-1.5 z-10">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">Live</span>
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-8 whitespace-nowrap py-1.5 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: { repeat: Infinity, duration: articles.length * 4, ease: "linear" },
            }}
          >
            {doubled.map((article, i) => (
              <a
                key={`${article.id}-${i}`}
                href={article.source_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs hover:text-primary transition-colors cursor-pointer"
              >
                {article.is_controversy ? (
                  <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                ) : (
                  <Newspaper className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-xs text-primary/70 uppercase">
                  {CATEGORY_LABELS[article.category] || "NEWS"}
                </span>
                <span className={cn(
                  "text-foreground/90 hover:text-primary transition-colors",
                  article.is_controversy && "text-destructive font-medium"
                )}>
                  {article.headline.length > 80
                    ? article.headline.slice(0, 80) + "…"
                    : article.headline}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground text-xs">{article.source_name}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
