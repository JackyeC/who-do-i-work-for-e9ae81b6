import {
  type ChainStep,
  type ChainLayer,
  confidenceColor,
} from "@/lib/intelligenceChain";
import {
  Landmark, DollarSign, Building2, Briefcase, GraduationCap,
  ChevronRight
} from "lucide-react";

const LAYER_META: Record<ChainLayer, { icon: typeof Landmark; color: string }> = {
  policy: { icon: Landmark, color: "text-civic-blue" },
  influence: { icon: DollarSign, color: "text-civic-red" },
  company: { icon: Building2, color: "text-primary" },
  work: { icon: Briefcase, color: "text-civic-yellow" },
  career: { icon: GraduationCap, color: "text-civic-green" },
};

export function ChainTrace({ steps }: { steps: ChainStep[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap py-2">
      {steps.map((step, i) => {
        const meta = LAYER_META[step.layer];
        const Icon = meta.icon;
        return (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/40 border border-border">
              <Icon className={`w-3 h-3 ${meta.color} shrink-0`} strokeWidth={1.5} />
              <span className="text-[0.6rem] font-mono uppercase tracking-wider text-foreground whitespace-nowrap">
                {step.entity}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChainLayerBadge({ layer }: { layer: ChainLayer }) {
  const meta = LAYER_META[layer];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.55rem] font-mono uppercase tracking-widest ${meta.color} bg-muted/30 border border-border`}>
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {layer}
    </span>
  );
}
