import { DollarSign, TrendingUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LeverageLevel } from "./LeverageScore";

interface OfferIntelligenceProps {
  salaryRange: string | null | undefined;
  leverageLevel: LeverageLevel;
  civicScore: number;
}

export function OfferIntelligence({ salaryRange, leverageLevel, civicScore }: OfferIntelligenceProps) {
  const roomLabel = leverageLevel === "high" ? "Significant" : leverageLevel === "medium" ? "Moderate" : "Limited";
  const roomColor = leverageLevel === "high"
    ? "text-[hsl(var(--civic-green))]"
    : leverageLevel === "medium"
    ? "text-[hsl(var(--civic-yellow))]"
    : "text-muted-foreground";

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
        <DollarSign className="w-3 h-3 text-muted-foreground" /> Offer Intelligence
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Listed Range</p>
          {salaryRange ? (
            <p className="text-sm font-semibold text-[hsl(var(--civic-green))]">{salaryRange}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Not disclosed
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Negotiation Room</p>
          <p className={`text-sm font-semibold flex items-center gap-1 ${roomColor}`}>
            <TrendingUp className="w-3.5 h-3.5" /> {roomLabel}
          </p>
        </div>
      </div>

      {civicScore < 50 && (
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          Low transparency score suggests less structured pay bands — anchoring first may be advantageous.
        </p>
      )}
    </div>
  );
}
