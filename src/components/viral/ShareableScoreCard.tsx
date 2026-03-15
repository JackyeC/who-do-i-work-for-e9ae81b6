import { useState, useEffect } from "react";
import { Linkedin, Link2, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { preGenerateOGCard } from "@/lib/social-share";

interface ShareableScoreCardProps {
  companyName: string;
  clarityScore: number;
  signals: { label: string; score: number; status: string }[];
  slug: string;
}

function clarityBand(score: number) {
  if (score >= 80) return { label: "High Clarity", color: "text-civic-green", bg: "bg-civic-green/10", accent: "border-civic-green" };
  if (score >= 60) return { label: "Moderate Clarity", color: "text-civic-yellow", bg: "bg-civic-yellow/10", accent: "border-civic-yellow" };
  if (score >= 40) return { label: "Low Clarity", color: "text-civic-red", bg: "bg-civic-red/10", accent: "border-civic-red" };
  return { label: "Opaque", color: "text-civic-red", bg: "bg-civic-red/10", accent: "border-civic-red" };
}

export function ShareableScoreCard({ companyName, clarityScore, signals, slug }: ShareableScoreCardProps) {
  const [copied, setCopied] = useState(false);
  const band = clarityBand(clarityScore);

  const shareUrl = `https://wdiwf.jackyeclayton.com/company/${slug}`;
  const shareText = `${companyName} scored ${clarityScore}/100 on employer transparency. Would you work here? Check the intelligence:`;

  useEffect(() => {
    preGenerateOGCard({ type: "company", companyA: companyName, scoreA: clarityScore, slugA: slug });
  }, [companyName, clarityScore]);

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=600");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied — paste it on LinkedIn!" });
  };

  return (
    <div className="space-y-3">
      {/* The visual card optimized for screenshots */}
      <div
        id={`score-card-${slug}`}
        className="bg-card border border-border p-6 relative overflow-hidden"
      >
        {/* Decorative accent */}
        <div className={`absolute top-0 left-0 w-1 h-full ${band.accent}`} />

        <div className="pl-4">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-2">
            Employer Intelligence Report
          </div>
          <div className="font-serif text-xl mb-1 text-foreground">{companyName}</div>

          {/* Big score */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-data text-4xl font-bold text-foreground">{clarityScore}</span>
            <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">/100</span>
            <span className={`font-mono text-[10px] tracking-wider uppercase ${band.color} px-2 py-0.5 ${band.bg}`}>
              {band.label}
            </span>
          </div>

          {/* Signal bars */}
          <div className="grid gap-2">
            {signals.slice(0, 5).map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-[120px] font-mono text-[9px] tracking-wider uppercase text-muted-foreground truncate">
                  {s.label}
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.score >= 70 ? "bg-civic-green" : s.score >= 45 ? "bg-civic-yellow" : "bg-civic-red"}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <div className="font-data text-xs font-semibold text-foreground w-8 text-right">{s.score}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="font-mono text-[8px] tracking-widest uppercase text-muted-foreground">
              whodoimworkfor.com
            </span>
            <span className="font-mono text-[8px] tracking-widest uppercase text-muted-foreground">
              Employer Intelligence by Jackye Clayton
            </span>
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="flex gap-2">
        <Button
          onClick={shareLinkedIn}
          size="sm"
          className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white"
        >
          <Linkedin className="w-3.5 h-3.5" />
          Share on LinkedIn
        </Button>
        <Button onClick={copyLink} variant="outline" size="sm" className="gap-1.5">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
}
