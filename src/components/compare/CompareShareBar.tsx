import { useState, useEffect } from "react";
import { Linkedin, Link2, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { preGenerateOGCard } from "@/lib/social-share";

interface CompareShareBarProps {
  nameA: string;
  nameB: string;
  slugA: string;
  slugB: string;
  scoreA: number;
  scoreB: number;
}

export function CompareShareBar({ nameA, nameB, slugA, slugB, scoreA, scoreB }: CompareShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://wdiwf.jackyeclayton.com/compare?a=${slugA}&b=${slugB}`;
  const shareText = `${nameA} (${scoreA}/100) vs ${nameB} (${scoreB}/100): Who's more transparent? Compare employer intelligence scores.`;

  useEffect(() => {
    preGenerateOGCard({ type: "battle", companyA: nameA, companyB: nameB, scoreA, scoreB });
  }, [nameA, nameB, scoreA, scoreB]);

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=600");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Comparison link copied!" });
  };

  return (
    <div className="border border-border bg-card overflow-hidden mb-8">
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <Share2 className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-semibold">
          Share This Matchup
        </span>
      </div>
      <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          Think someone's choosing between these two? Send them the data.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button onClick={shareLinkedIn} size="sm" className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-mono text-[10px] tracking-wider uppercase">
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </Button>
          <Button onClick={copyLink} variant="outline" size="sm" className="gap-1.5 font-mono text-[10px] tracking-wider uppercase">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
