/**
 * FundingOverview — animated horizontal funding bars
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";

export interface FundingItem {
  industry: string;
  amount: number;
}

interface FundingOverviewProps {
  items: FundingItem[];
  source?: string;
  className?: string;
}

export function FundingOverview({ items, source, className }: FundingOverviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const maxAmount = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div ref={ref} className={cn("space-y-5", className)}>
      {items.map((item) => {
        const pct = Math.round((item.amount / maxAmount) * 100);
        return (
          <div key={item.industry} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.9375rem] font-semibold text-foreground">{item.industry}</span>
              <span className="font-mono text-sm font-medium text-primary">
                {formatCurrency(item.amount)}
              </span>
            </div>
            <div className="h-2 bg-muted/40 rounded overflow-hidden">
              <div
                className="h-full rounded bg-gradient-to-r from-primary to-[hsl(var(--civic-gold-light))] transition-[width] duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: visible ? `${pct}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
      {source && (
        <p className="text-xs text-muted-foreground mt-1">{source}</p>
      )}
    </div>
  );
}
