import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, Users, Shield, BarChart3,
  Brain, Award, Briefcase, Eye,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransparencyGap {
  label: string;
  category: string;
  icon: React.ElementType;
  riskNote: string;
}

interface TransparencyGhostingProps {
  hasPayEquity?: boolean;
  hasPromotionData?: boolean;
  hasSentimentData?: boolean;
  hasBenefitsData?: boolean;
  hasAiHrSignals?: boolean;
  hasDeiReports?: boolean;
  hasCompensationData?: boolean;
  hasWorkforceDemographics?: boolean;
}

const ALL_SIGNALS: (TransparencyGap & { key: keyof TransparencyGhostingProps })[] = [
  { key: "hasPayEquity", label: "Pay Equity Audit", category: "Compensation", icon: DollarSign, riskNote: "No public pay equity data available. This is a transparency gap, not a negative finding." },
  { key: "hasPromotionData", label: "Promotion Velocity", category: "Mobility", icon: TrendingUp, riskNote: "Internal promotion rates are not publicly disclosed. Ask about advancement timelines." },
  { key: "hasSentimentData", label: "Worker Sentiment", category: "Culture", icon: Users, riskNote: "No aggregated employee sentiment signals found. Review sites may provide partial coverage." },
  { key: "hasBenefitsData", label: "Benefits Transparency", category: "Benefits", icon: Shield, riskNote: "Benefits details not publicly documented. Request a total compensation breakdown." },
  { key: "hasAiHrSignals", label: "AI Hiring Audit", category: "Hiring Tech", icon: Brain, riskNote: "No AI hiring tool disclosures detected. Ask if automated screening is used." },
  { key: "hasDeiReports", label: "DEI Reporting", category: "Diversity", icon: Award, riskNote: "No public DEI reports found. Inquire about workforce composition and inclusion initiatives." },
  { key: "hasCompensationData", label: "Executive Compensation", category: "Leadership", icon: Briefcase, riskNote: "Executive pay data not publicly filed. Common for private companies." },
  { key: "hasWorkforceDemographics", label: "Workforce Demographics", category: "Composition", icon: BarChart3, riskNote: "No public workforce demographic breakdown available." },
];

export function TransparencyGhosting(props: TransparencyGhostingProps) {
  const gaps = ALL_SIGNALS.filter((s) => !props[s.key]);

  if (gaps.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
          Transparency Gaps
        </span>
        <span className="font-mono text-[10px] text-destructive/80 ml-auto">
          {gaps.length} signal{gaps.length !== 1 ? "s" : ""} missing
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Omission is a signal. These data points are not publicly disclosed — which makes them open questions, not negative findings.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <TooltipProvider delayDuration={200}>
          {gaps.map((gap) => {
            const Icon = gap.icon;
            return (
              <Tooltip key={gap.label}>
                <TooltipTrigger asChild>
                   <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20 cursor-help group hover:border-destructive/30 transition-colors relative overflow-hidden">
                     {/* Shimmer overlay */}
                     <div className="absolute inset-0 shimmer-skeleton opacity-[0.04] pointer-events-none" />
                     {/* Ghosted icon */}
                     <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 relative">
                       <Icon className="w-4 h-4 text-muted-foreground/30" />
                     </div>
                     <div className="flex-1 min-w-0 relative">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-muted-foreground/50 font-mono">{gap.label}</span>
                       </div>
                       {/* Animated skeleton bars */}
                       <div className="flex items-center gap-1.5 mt-1.5">
                         <div className="h-1.5 w-16 rounded-full shimmer-skeleton" />
                         <div className="h-1.5 w-10 rounded-full shimmer-skeleton" style={{ animationDelay: "0.3s" }} />
                         <div className="h-1.5 w-8 rounded-full shimmer-skeleton" style={{ animationDelay: "0.6s" }} />
                       </div>
                     </div>
                     <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/30 shrink-0 relative">
                       {gap.category}
                     </span>
                   </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px]">
                  <p className="text-xs leading-relaxed">{gap.riskNote}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
