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
  "Direct Source": "text-civic-green border-civic-green/30 bg-civic-green/[0.06]",
  "Multi-Source": "text-primary border-primary/30 bg-primary/[0.06]",
  High: "text-civic-green border-civic-green/30 bg-civic-green/[0.06]",
  Medium: "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/[0.06]",
  Low: "text-muted-foreground border-border bg-muted/50",
};

interface OfferCheckReportProps {
  sections: OfferCheckSection[];
  lockedSections?: string[];
  onUnlock?: () => void;
}

function SignalRow({ signal }: { signal: OfferCheckSignal }) {
  return (
    <div className="py-3.5 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <span className="text-sm text-foreground font-medium leading-snug">{signal.description}</span>
        <Badge variant="outline" className={cn("text-[10px] shrink-0 rounded-lg px-2.5", CONFIDENCE_STYLES[signal.confidence] || CONFIDENCE_STYLES["Low"])}>
          {signal.confidence}
        </Badge>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground/60 font-semibold">
          Evidence
        </span>
        {signal.detectionMethod && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Search className="w-2.5 h-2.5" />
            {signal.detectionMethod.replace(/_/g, " ")}
          </span>
        )}
        {signal.detectedAt && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(signal.detectedAt).toLocaleDateString()}
          </span>
        )}
        {signal.lastVerified && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified: {new Date(signal.lastVerified).toLocaleDateString()}
          </span>
        )}
        {signal.sourceUrl && (
          <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 font-medium">
            View evidence <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      {signal.evidenceText && (
        <p className="text-[11px] text-muted-foreground italic mt-2 pl-3 border-l-2 border-civic-gold-muted/30">"{signal.evidenceText}"</p>
      )}
    </div>
  );
}

export function OfferCheckReport({ sections, lockedSections = [], onUnlock }: OfferCheckReportProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.id] || BarChart3;
        const isLocked = lockedSections.includes(section.id);

        return (
          <Card key={section.id} className="card-official rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/[0.04] flex items-center justify-center border border-primary/[0.06]">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {section.title}
                {section.stale && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground ml-auto rounded-lg">
                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                    Signals not recently verified
                  </Badge>
                )}
                {!section.stale && section.hasData && (
                  <Badge variant="secondary" className="text-[10px] ml-auto font-semibold rounded-lg">
                    {section.signals.length} signal{section.signals.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="text-center py-8">
                  <Lock className="w-6 h-6 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign up to unlock the full Offer Check report.
                  </p>
                  {onUnlock && (
                    <Button onClick={onUnlock} size="sm">
                      Unlock Full Report
                    </Button>
                  )}
                </div>
              ) : !section.hasData ? (
                <div className="py-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground italic">
                    Audit Pending — no public evidence detected in scanned sources for this category.
                  </p>
                </div>
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
