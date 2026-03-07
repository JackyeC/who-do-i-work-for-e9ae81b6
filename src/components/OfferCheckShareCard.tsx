import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Building2, BarChart3 } from "lucide-react";

interface OfferCheckShareCardProps {
  companyName: string;
  industry: string;
  state: string;
  totalSignals: number;
  sectionsWithSignals: number;
  totalSections: number;
  transparencyCount: number;
  generatedAt: string;
}

export function OfferCheckShareCard({
  companyName,
  industry,
  state,
  totalSignals,
  sectionsWithSignals,
  totalSections,
  transparencyCount,
  generatedAt,
}: OfferCheckShareCardProps) {
  return (
    <Card className="max-w-md border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Offer Check</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">CivicLens</Badge>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{companyName}</span>
          </div>
          <p className="text-xs text-muted-foreground">{industry} · {state}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{totalSignals}</div>
            <div className="text-[10px] text-muted-foreground">Signals</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{sectionsWithSignals}/{totalSections}</div>
            <div className="text-[10px] text-muted-foreground">Sections</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{transparencyCount}/7</div>
            <div className="text-[10px] text-muted-foreground">Disclosures</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Generated {new Date(generatedAt).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-muted-foreground">
            civicLens.app
          </span>
        </div>

        <p className="text-[9px] text-muted-foreground/60 mt-3 pt-2 border-t border-border">
          Signals detected from public sources. No conclusions drawn. Interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}
