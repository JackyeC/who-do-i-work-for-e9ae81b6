import { useState } from "react";
import { Share2, X, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SharePasticheProps {
  headline: string;
  articleId: string;
}

const PASTICHE_LINES = [
  "Every company runs a background check on you. This one runs one on them.",
  "The part they hoped you wouldn't read.",
  "Receipts. Not vibes.",
  "You deserve to know before you sign.",
  "Follow the money. Then follow your gut.",
];

export function SharePastiche({ headline, articleId }: SharePasticheProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const line = PASTICHE_LINES[Math.abs(headline.length) % PASTICHE_LINES.length];
  const shareUrl = `${window.location.origin}/newsletter#story-${articleId}`;
  const shareText = `${headline}\n\n"${line}"\n\n${shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: headline, text: `"${line}"`, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-elevated relative"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-primary mb-3">Share this receipt</p>

              <p className="text-base font-bold text-foreground leading-snug mb-4">{headline}</p>

              <blockquote className="border-l-2 border-primary pl-4 mb-5">
                <p className="text-sm text-foreground/70 italic leading-relaxed">"{line}"</p>
                <cite className="text-[10px] text-muted-foreground font-mono mt-1 block not-italic">— The Work Signal</cite>
              </blockquote>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 bg-muted border border-border rounded-lg py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
