import { Copy, Link2, Linkedin, Twitter, Download, FileText, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GivingShareRowProps {
  permalink: string;
  plainText: string;
  tweetText: string;
  /** Tier required for image/pdf export: "scout" | "strategist" */
  cardRef?: React.RefObject<HTMLDivElement>;
  companySlug: string;
}

export function GivingShareRow({ permalink, plainText, tweetText, companySlug }: GivingShareRowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  // For now, all users are free-tier unless subscription logic is wired
  const isScout = !!user;
  const isStrategist = false; // TODO: wire to subscription tier

  const copyLink = () => {
    navigator.clipboard.writeText(permalink);
    toast({ title: "Link copied — share with anyone" });
  };

  const copyText = () => {
    navigator.clipboard.writeText(plainText);
    toast({ title: "Copied to clipboard" });
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`, "_blank");
  };

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(permalink)}`, "_blank");
  };

  const btnClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer";
  const lockedClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-border/30 bg-muted/20 text-muted-foreground/50 cursor-not-allowed";

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-border/30">
      {isScout && (
        <button onClick={copyLink} className={btnClass}>
          <Link2 className="w-3 h-3" /> Copy link
        </button>
      )}
      <button onClick={copyText} className={btnClass}>
        <Copy className="w-3 h-3" /> Copy as text
      </button>
      <button onClick={shareLinkedIn} className={btnClass}>
        <Linkedin className="w-3 h-3" /> LinkedIn
      </button>
      <button onClick={shareX} className={btnClass}>
        <Twitter className="w-3 h-3" /> X
      </button>
      {isStrategist ? (
        <>
          <button className={btnClass}>
            <Download className="w-3 h-3" /> Download image
          </button>
          <button className={btnClass}>
            <FileText className="w-3 h-3" /> Export PDF
          </button>
        </>
      ) : (
        <>
          <button className={lockedClass} title="Upgrade to Strategist to unlock">
            <Lock className="w-2.5 h-2.5" /> Image <span className="text-[9px]">Pro</span>
          </button>
          <button className={lockedClass} title="Upgrade to Strategist to unlock">
            <Lock className="w-2.5 h-2.5" /> PDF <span className="text-[9px]">Pro</span>
          </button>
        </>
      )}
    </div>
  );
}
