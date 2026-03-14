import { Share2, Twitter, Linkedin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareVoteCardProps {
  brandName: string;
  brandEmoji: string;
  opponentName: string;
  regionName: string;
  votePercent: number;
}

export function ShareVoteCard({ brandName, brandEmoji, opponentName, regionName, votePercent }: ShareVoteCardProps) {
  const { toast } = useToast();

  const shareText = `I just backed ${brandEmoji} ${brandName} over ${opponentName} in the ${regionName} Region of Brand Madness 2026! ${votePercent}% agree with me. See the receipts 👇`;
  const shareUrl = "https://who-do-i-work-for.lovable.app/brand-madness";

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({ title: "Copied!", description: "Share text copied to clipboard." });
  };

  return (
    <div className="border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-semibold">
          Share Your Vote
        </span>
      </div>

      <div className="bg-card border border-border p-4 mb-3">
        <div className="text-center">
          <div className="text-2xl mb-1">{brandEmoji}</div>
          <div className="font-bold text-foreground text-sm">{brandName}</div>
          <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
            vs {opponentName} · {regionName} Region
          </div>
          <div className="mt-2 font-mono text-lg font-black text-primary">{votePercent}%</div>
          <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">of voters agree</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-[10px] font-mono" onClick={shareToTwitter}>
          <Twitter className="w-3 h-3 mr-1" /> Post
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-[10px] font-mono" onClick={shareToLinkedIn}>
          <Linkedin className="w-3 h-3 mr-1" /> Share
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-[10px] font-mono" onClick={copyLink}>
          <Copy className="w-3 h-3 mr-1" /> Copy
        </Button>
      </div>
    </div>
  );
}
