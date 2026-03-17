import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";

export function AddYourStoryCTA() {
  return (
    <div className="p-4 border border-primary/15 bg-primary/[0.03] rounded-lg">
      <div className="flex items-start gap-3">
        <PenLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">
            Claim Your Story
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Standard public data is only half the story. Claim your Narrative Alignment Package to provide the full context for your future talent.
          </p>
          <Link
            to="/for-employers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Learn about the $599 Narrative Alignment Package →
          </Link>
        </div>
      </div>
    </div>
  );
}
