import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Network, Landmark, ArrowRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

interface FlowNode {
  id: string;
  label: string;
  amount?: string;
  detail: string;
}

const pipelineSteps = [
  {
    icon: DollarSign,
    label: "Money Goes In",
    color: "text-[hsl(var(--civic-gold))]",
    bgColor: "bg-[hsl(var(--civic-gold))]/10 border-[hsl(var(--civic-gold))]/20",
    nodes: [
      { id: "pac", label: "Corporate PAC", amount: "$2.4M", detail: "Company political fund donations to candidates and committees" },
      { id: "exec", label: "Executive Giving", amount: "$890K", detail: "Personal political donations from C-suite executives" },
      { id: "lobby", label: "Lobbying Spend", amount: "$5.1M", detail: "Direct payments to lobbying firms for legislative access" },
      { id: "trade", label: "Trade Association Dues", amount: "$1.2M", detail: "Industry group memberships that lobby on the company's behalf" },
    ],
  },
  {
    icon: Network,
    label: "Connections Are Made",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    nodes: [
      { id: "committee", label: "Committee Chairs", detail: "Politicians on powerful appropriations and oversight committees" },
      { id: "revolving", label: "Revolving Door Hires", detail: "Former government officials now employed at the company" },
      { id: "advisory", label: "Advisory Panels", detail: "Company people sitting on government advisory boards" },
      { id: "boards", label: "Shared Board Members", detail: "Interlocking directorships with other influential companies" },
    ],
  },
  {
    icon: Landmark,
    label: "Benefits Come Back",
    color: "text-[hsl(var(--civic-green))]",
    bgColor: "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20",
    nodes: [
      { id: "contracts", label: "Federal Contracts", amount: "$47M", detail: "Government contracts awarded through competitive and sole-source bids" },
      { id: "subsidies", label: "Tax Subsidies", amount: "$12M", detail: "Taxpayer-funded tax breaks, grants, and incentive packages" },
      { id: "regs", label: "Favorable Regulation", detail: "Rules and exemptions written to benefit the company's operations" },
      { id: "bills", label: "Legislative Wins", detail: "Laws passed that directly improve the company's competitive position" },
    ],
  },
];

function FlowNodeCard({ node, color }: { node: FlowNode; color: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card/80 border border-border/40 hover:border-primary/30 transition-all cursor-pointer group">
            <div className={cn("w-1 h-8 rounded-full opacity-60", color.replace("text-", "bg-"))} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-foreground truncate">{node.label}</span>
                {node.amount && (
                  <span className="font-mono text-xs font-bold text-foreground tabular-nums shrink-0">
                    {node.amount}
                  </span>
                )}
              </div>
            </div>
            <Receipt className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <div className="space-y-1">
            <p className="font-semibold text-xs">{node.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{node.detail}</p>
            {node.amount && (
              <p className="font-mono text-xs text-foreground">{node.amount}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function InfluencePipelineVisual() {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-4 font-display">
              Follow the Money
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">
              Companies spend money to influence government. Here's how that works, step by step.
              <span className="block text-xs mt-1 text-muted-foreground/60 font-mono">Hover any node to see the receipt.</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Flow arrows (desktop) */}
            {[33.33, 66.66].map((left) => (
              <div key={left} className="hidden md:block absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${left}%` }}>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-8 h-8 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-elevated"
                >
                  <ArrowRight className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
            ))}

            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.label}
                variants={fadeUp}
                custom={i + 1}
                className={`rounded-2xl border p-5 ${step.bgColor} relative`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-card/80 border border-border/40 flex items-center justify-center shadow-sm">
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-display">{step.label}</h3>
                    <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground">
                      Stage {i + 1} of 3
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {step.nodes.map((node) => (
                    <FlowNodeCard key={node.id} node={node} color={step.color} />
                  ))}
                </div>

                {/* Mobile arrow */}
                {i < pipelineSteps.length - 1 && (
                  <div className="md:hidden flex justify-center my-3">
                    <motion.div
                      animate={{ y: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-6 h-6 rounded-full bg-card border border-border/60 flex items-center justify-center rotate-90"
                    >
                      <ArrowRight className="w-3 h-3 text-primary" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
