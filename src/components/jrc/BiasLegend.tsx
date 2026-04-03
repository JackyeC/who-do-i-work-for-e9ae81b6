import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { BIAS_SOURCE_DISPLAY, BIAS_JRC_DISPLAY, BIAS_CONFIDENCE_COLOR } from "@/lib/jrc-story-schema";

interface BiasLegendProps {
  trigger?: React.ReactNode;
}

export function BiasLegend({ trigger }: BiasLegendProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs font-mono uppercase tracking-wider">
            <HelpCircle className="w-3 h-3" />
            How we score bias
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            Bias Scoring — JRC EDIT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm text-foreground/90">
          {/* Source Bias */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
              Source Bias
            </h3>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              How the original source frames the story.
            </p>
            <div className="space-y-1.5">
              {Object.entries(BIAS_SOURCE_DISPLAY).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* JRC Lens */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
              JRC Editorial Lens
            </h3>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              The editorial angle of this take.
            </p>
            <div className="space-y-1.5">
              {Object.entries(BIAS_JRC_DISPLAY).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                  <span className="text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Confidence */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-2">
              Receipts Confidence
            </h3>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              How strong the evidence is for this interpretation.
            </p>
            <div className="space-y-1.5">
              {Object.entries(BIAS_CONFIDENCE_COLOR).map(([key, { dot, label }]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="text-foreground/80 capitalize">{key}</span>
                  <span className="text-muted-foreground">— {label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}