import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2, Briefcase, Shield, Bot, BarChart3, ClipboardCheck,
  ExternalLink, Clock, CheckCircle2, AlertTriangle, Lock, Search,
  Heart, Users, Flag, MessageSquareWarning
} from "lucide-react";
import { type OfferCheckSection, type OfferCheckSignal } from "@/hooks/use-offer-check";

const SECTION_ICONS: Record<string, typeof Building2> = {
  overview: Building2,
  "corporate-structure": Building2,
  civic: Briefcase,
  "government-contracts": Briefcase,
  "hiring-tech": Bot,
  "worker-benefits": Heart,
  "compensation": BarChart3,
  "worker-sentiment": Users,
  "workplace-enforcement": Shield,
  "affiliations": Flag,
  "warn-layoffs": AlertTriangle,
  "say-do": MessageSquareWarning,
  safety: Shield,
  transparency: BarChart3,
  review: ClipboardCheck,
};

const CONFIDENCE_STYLES: Record<string, string> = {
  "Direct Source": "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  "Multi-Source": "text-primary border-primary/30",
  High: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
  Medium: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
  Low: "text-muted-foreground border-border",
};

interface OfferCheckReportProps {
  sections: OfferCheckSection[];
  lockedSections?: string[];
  onUnlock?: () => void;
}

function SignalRow({ signal }: { signal: OfferCheckSignal }) {
  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm text-foreground font-medium">{signal.description}</span>
        <Badge variant="outline" className={cn("text-[10px] shrink-0", CONFIDENCE_STYLES[signal.confidence] || CONFIDENCE_STYLES["Low"])}>
          {signal.confidence}
        </Badge>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {signal.detectionMethod && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Search className="w-2.5 h-2.5" />
            Detected via: {signal.detectionMethod.replace(/_/g, " ")}
          </span>
        )}
        {signal.detectedAt && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {new Date(signal.detectedAt).toLocaleDateString()}
          </span>
        )}
        {signal.lastVerified && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified: {new Date(signal.lastVerified).toLocaleDateString()}
          </span>
        )}
        {signal.sourceUrl && (
          <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
            View source <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      {signal.evidenceText && (
        <p className="text-[11px] text-muted-foreground italic mt-1">"{signal.evidenceText}"</p>
      )}
    </div>
  );
}

export function OfferCheckReport({ sections, lockedSections = [], onUnlock }: OfferCheckReportProps) {
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.id] || BarChart3;
        const isLocked = lockedSections.includes(section.id);

        return (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="w-4.5 h-4.5 text-primary" />
                {section.title}
                {section.stale && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground ml-auto">
                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                    Signals not recently verified
                  </Badge>
                )}
                {!section.stale && section.hasData && (
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {section.signals.length} signal{section.signals.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="text-center py-6">
                  <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign up to unlock the full Offer Check report.
                  </p>
                  {onUnlock && (
                    <Button onClick={onUnlock} size="sm">
                      Unlock Full Report
                    </Button>
                  )}
                </div>
              ) : !section.hasData ? (
                <p className="text-sm text-muted-foreground py-3">
                  No public evidence detected in scanned sources for this category.
                </p>
              ) : (
                <div>
                  {section.signals.map((signal, i) => (
                    <SignalRow key={i} signal={signal} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}