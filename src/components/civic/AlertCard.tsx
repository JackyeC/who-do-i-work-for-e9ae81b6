/**
 * AlertCard — behavioral signal alert with expandable receipts
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, DollarSign, ChevronDown } from "lucide-react";

export interface AlertReceipt {
  billId: string;
  vote: "yes" | "no";
  date: string;
  note?: string;
}

export interface AlertData {
  type: "pattern" | "funding_alignment";
  title: string;
  summary: string;
  context: string;
  receipts: AlertReceipt[];
  source: string;
  confidence: string;
}

interface AlertCardProps {
  alert: AlertData;
  className?: string;
}

export function AlertCard({ alert, className }: AlertCardProps) {
  const [open, setOpen] = useState(false);
  const isRed = alert.type === "pattern";

  const borderColor = isRed
    ? "before:bg-destructive before:shadow-[0_0_12px_hsl(var(--civic-red)/0.3)]"
    : "before:bg-primary before:shadow-[0_0_12px_hsl(var(--civic-gold)/0.3)]";

  const Icon = isRed ? AlertTriangle : DollarSign;
  const titleColor = isRed ? "text-destructive" : "text-primary";

  return (
    <div
      className={cn(
        "relative bg-card border border-border rounded-xl p-6 pl-8 overflow-hidden",
        "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl",
        borderColor,
        "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <Icon className={cn("w-5 h-5 shrink-0", titleColor)} />
        <span className={cn("text-base font-bold tracking-tight", titleColor)}>
          {alert.title}
        </span>
      </div>

      <p className="text-[0.9375rem] font-medium text-foreground leading-relaxed mb-1.5">
        {alert.summary}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {alert.context}
      </p>

      {/* Toggle receipts */}
      {alert.receipts.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium",
              "border border-border rounded-lg text-muted-foreground",
              "hover:text-foreground hover:border-muted-foreground hover:bg-muted/30 transition-all"
            )}
          >
            View Receipts
            <ChevronDown
              className={cn("w-3 h-3 transition-transform duration-300", open && "rotate-180")}
            />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-500",
              open ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
            )}
          >
            <div className="pt-4 border-t border-border space-y-2">
              {alert.receipts.map((r, i) => (
                <div key={i} className="flex items-center gap-3 font-mono text-sm text-muted-foreground py-1.5">
                  <span className="shrink-0">{r.billId}</span>
                  <span
                    className={cn(
                      "text-[0.6875rem] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                      r.vote === "yes"
                        ? "bg-[hsl(var(--civic-green))]/12 text-[hsl(var(--civic-green))]"
                        : "bg-destructive/12 text-destructive"
                    )}
                  >
                    {r.vote.toUpperCase()}
                  </span>
                  <span className="text-xs">{r.note || r.date}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Source: {alert.source}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium px-3 py-1 rounded-full bg-[hsl(var(--civic-blue))]/12 text-[hsl(var(--civic-blue))] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--civic-blue))]" />
          {alert.confidence}
        </span>
      </div>
    </div>
  );
}
