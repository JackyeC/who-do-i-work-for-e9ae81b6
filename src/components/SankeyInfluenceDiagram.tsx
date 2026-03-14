import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Network, Landmark, TrendingUp } from "lucide-react";

interface SankeyNode {
  id: string;
  label: string;
  amount?: number;
  stage: 0 | 1 | 2;
}

interface SankeyFlow {
  from: string;
  to: string;
  value: number;
}

interface SankeyInfluenceDiagramProps {
  pacSpending?: number;
  lobbyingSpend?: number;
  executiveGiving?: number;
  tradeAssociationDues?: number;
  federalContracts?: number;
  subsidies?: number;
  companyName?: string;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function SankeyInfluenceDiagram({
  pacSpending = 0,
  lobbyingSpend = 0,
  executiveGiving = 0,
  tradeAssociationDues = 0,
  federalContracts = 0,
  subsidies = 0,
  companyName,
}: SankeyInfluenceDiagramProps) {
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

  const moneyIn = pacSpending + lobbyingSpend + executiveGiving + tradeAssociationDues;
  const benefitsOut = federalContracts + subsidies;
  const roi = moneyIn > 0 ? benefitsOut / moneyIn : 0;

  const stages = [
    {
      title: "Money In",
      icon: DollarSign,
      color: "text-destructive",
      items: [
        { id: "pac", label: "Corporate PAC", value: pacSpending },
        { id: "lobby", label: "Lobbying", value: lobbyingSpend },
        { id: "exec", label: "Executive Giving", value: executiveGiving },
        { id: "trade", label: "Trade Assoc.", value: tradeAssociationDues },
      ].filter(i => i.value > 0),
    },
    {
      title: "Connections",
      icon: Network,
      color: "text-primary",
      items: [
        { id: "committees", label: "Committee Chairs", value: 0 },
        { id: "revolving", label: "Revolving Door", value: 0 },
        { id: "advisory", label: "Advisory Panels", value: 0 },
      ],
    },
    {
      title: "Benefits Out",
      icon: Landmark,
      color: "text-[hsl(var(--civic-green))]",
      items: [
        { id: "contracts", label: "Federal Contracts", value: federalContracts },
        { id: "subsidies", label: "Tax Subsidies", value: subsidies },
      ].filter(i => i.value > 0),
    },
  ];

  // If no data, don't render
  if (moneyIn === 0 && benefitsOut === 0) return null;

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-display">
            <TrendingUp className="w-5 h-5 text-primary" />
            Influence Pipeline
          </div>
          {roi > 1 && (
            <Badge variant="outline" className="font-mono text-sm font-black tabular-nums border-primary/30 text-primary">
              {roi.toFixed(1)}× ROI
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono">
          How {companyName || "this company"} converts political spending into government benefits.
        </p>
      </CardHeader>

      <CardContent className="pb-6">
        {/* Sankey-style flow */}
        <div className="grid grid-cols-3 gap-2 relative">
          {stages.map((stage, si) => (
            <div key={stage.title} className="space-y-2">
              {/* Stage header */}
              <div className="flex items-center gap-1.5 mb-3">
                <stage.icon className={cn("w-3.5 h-3.5", stage.color)} />
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                  {stage.title}
                </span>
              </div>

              {/* Nodes */}
              {stage.items.map((item, ni) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: si === 0 ? -12 : si === 2 ? 12 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: si * 0.15 + ni * 0.05 }}
                  onMouseEnter={() => setHoveredFlow(item.id)}
                  onMouseLeave={() => setHoveredFlow(null)}
                  className={cn(
                    "p-2.5 rounded border transition-all cursor-default",
                    "bg-card border-border/40",
                    hoveredFlow === item.id && "border-primary/50 bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-medium text-foreground truncate">{item.label}</span>
                    {item.value > 0 && (
                      <span className="font-mono text-[11px] font-bold tabular-nums text-foreground shrink-0">
                        {formatCurrency(item.value)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Stage total */}
              {si !== 1 && (
                <div className="pt-1 border-t border-border/30 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className={cn("font-mono text-xs font-black tabular-nums", stage.color)}>
                      {formatCurrency(si === 0 ? moneyIn : benefitsOut)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Flow arrows between columns */}
          {[0, 1].map((i) => (
            <div
              key={`arrow-${i}`}
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `${33.33 * (i + 1)}%`, transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: i * 0.3 }}
                className="w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary">
                  <path d="M2 6h8M7 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </div>
          ))}
        </div>

        {/* ROI callout */}
        {roi > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 rounded border border-primary/20 bg-primary/5 text-center"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
              Influence Return on Investment
            </span>
            <span className="font-mono text-3xl font-black tabular-nums text-primary">
              {roi.toFixed(1)}×
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              For every $1 spent on political influence, {companyName || "this company"} received{" "}
              <span className="text-foreground font-semibold">{formatCurrency(benefitsOut / (moneyIn || 1))}</span> in government benefits.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
