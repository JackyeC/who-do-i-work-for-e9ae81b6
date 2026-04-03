import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ConversionModule() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl border border-primary/25 bg-card/60 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-primary/15 bg-primary/5">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">
          Next Action
        </p>
      </div>
      <div className="p-5 md:p-6 space-y-4">
        <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
          Your story has receipts.
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The companies behind layoffs, reorgs, and broken promises leave a trail — in federal filings,
          lobbying records, and political contributions most job seekers never check.
          WDIWF shows you the signals behind the offer letter, before you sign.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
    </motion.div>
  );
}
