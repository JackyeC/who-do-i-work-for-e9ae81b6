import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Building2, Shield, Bot, Heart, BarChart3, Users, Flag, MessageSquareWarning } from "lucide-react";
import { type OfferCheckSection } from "@/hooks/use-offer-check";

interface OfferCheckShareCardProps {
  companyName: string;
  industry: string;
  state: string;
  totalSignals: number;
  sectionsWithSignals: number;
  totalSections: number;
  transparencyCount: number;
  generatedAt: string;
  sections?: OfferCheckSection[];
  confidenceRating?: string;
}

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  civic: Shield,
  "hiring-tech": Bot,
  "worker-benefits": Heart,
  compensation: BarChart3,
  "worker-sentiment": Users,
  affiliations: Flag,
  "say-do": MessageSquareWarning,
};

const CATEGORY_LABELS: Record<string, string> = {
  civic: "Influence",
  "hiring-tech": "Hiring Tech",
  "worker-benefits": "Benefits",
  compensation: "Pay Transparency",
  "worker-sentiment": "Sentiment",
  affiliations: "Affiliations",
  "say-do": "Say vs Do",
};

export function OfferCheckShareCard({
  companyName,
  industry,
  state,
  totalSignals,
  sectionsWithSignals,
  totalSections,
  transparencyCount,
  generatedAt,
  sections,
  confidenceRating,
}: OfferCheckShareCardProps) {
  // Filter to signal sections (skip overview and confidence review)
  const signalSections = sections?.filter(s => !["overview", "review"].includes(s.id)) || [];

  return (
    <Card className="max-w-md border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-foreground text-sm">Offer Check</span>
            <span className="text-xs text-muted-foreground">by Jackye Clayton</span>
          </div>
          {confidenceRating && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {confidenceRating} confidence
            </Badge>
          )}
        </div>

        {/* Company */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{companyName}</span>
          </div>
          <p className="text-xs text-muted-foreground">{industry} · {state}</p>
        </div>

        {/* Signal Categories */}
        {signalSections.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {signalSections.map(section => {
              const Icon = CATEGORY_ICONS[section.id] || Shield;
              const label = CATEGORY_LABELS[section.id] || section.title;
              return (
                <div key={section.id} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-foreground font-medium flex-1">{label}</span>
                  {section.hasData ? (
                    <Badge variant="secondary" className="text-xs h-4">
                      {section.signals.length} signal{section.signals.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No public evidence</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{totalSignals}</div>
            <div className="text-xs text-muted-foreground">Signals</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{sectionsWithSignals}/{totalSections}</div>
            <div className="text-xs text-muted-foreground">Sections</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{transparencyCount}/7</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
           <span className="text-xs text-muted-foreground">
            Scanned {new Date(generatedAt).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-muted-foreground">
            offercheck.app
          </span>
        </div>

        <p className="text-[9px] text-muted-foreground/60 mt-3 pt-2 border-t border-border">
          Signals detected from public sources. No conclusions drawn. Interpretation is left to the user.
        </p>
      </CardContent>
    </Card>
  );
}