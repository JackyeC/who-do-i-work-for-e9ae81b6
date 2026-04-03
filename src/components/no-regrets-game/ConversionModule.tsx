import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ConversionModule() {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
      <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
        Your story has receipts.
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The companies behind layoffs, reorgs, and broken promises leave a trail — in federal filings,
        lobbying records, and political contributions most job seekers never check.
        WDIWF shows you the signals behind the offer letter, before you sign.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="premium" size="lg" className="flex-1">
          <Link to="/follow-the-money" className="gap-2">
            See the real receipts <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to="/offer-check">
            Calculate my walk-away number
          </Link>
        </Button>
      </div>
    </div>
  );
}
