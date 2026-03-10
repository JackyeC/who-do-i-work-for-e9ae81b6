import { Progress } from "@/components/ui/progress";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function SlotTracker() {
  const { slotsUsed, slotLimit, tier, isPremium } = useTrackedCompanies();
  const navigate = useNavigate();
  const percentage = slotLimit > 0 ? (slotsUsed / slotLimit) * 100 : 0;
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  if (!isPremium) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-body font-semibold text-foreground">Tracked Companies</h3>
            <p className="text-caption text-muted-foreground">
              {slotsUsed} of {slotLimit} {tierLabel} slots used
            </p>
          </div>
        </div>
        <Badge
          variant={percentage >= 90 ? "destructive" : "secondary"}
          className="text-xs font-mono"
        >
          {slotLimit - slotsUsed} remaining
        </Badge>
      </div>

      <Progress value={percentage} className="h-3 mb-4" />

      <div className="flex items-center justify-between">
        <p className="text-micro text-muted-foreground">
          Need more slots? Add-on slots available at $12/company/month.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/browse")}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Track Company
        </Button>
      </div>
    </div>
  );
}
