import { useState, useEffect } from "react";
import { Linkedin, Link2, Check, Download, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { preGenerateOGCard } from "@/lib/social-share";

interface SignalRow {
  label: string;
  score: number;
  status: "positive" | "negative" | "neutral";
}

interface IntelligenceSnapshotProps {
  companyName: string;
  overallScore: number;
  scoreLabel: string;
  signals: SignalRow[];
  slug: string;
  metrics?: { label: string; value: string }[];
}

function scoreBand(score: number) {
  if (score >= 80) return { label: "Exemplary", color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10", accent: "border-[hsl(var(--civic-green))]" };
  if (score >= 65) return { label: "Responsible", color: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/10", accent: "border-[hsl(var(--civic-blue))]" };
  if (score >= 45) return { label: "Mixed Signals", color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]/10", accent: "border-[hsl(var(--civic-yellow))]" };
  if (score >= 25) return { label: "Concerning", color: "text-destructive", bg: "bg-destructive/10", accent: "border-destructive" };
  return { label: "Opaque", color: "text-destructive", bg: "bg-destructive/10", accent: "border-destructive" };
}

export function IntelligenceSnapshotCard({ companyName, overallScore, scoreLabel, signals, slug, metrics }: IntelligenceSnapshotProps) {
  const [copied, setCopied] = useState(false);
  const band = scoreBand(overallScore);

  const shareUrl = `https://wdiwf.jackyeclayton.com/company/${slug}`;
  const shareText = `${companyName} scored ${overallScore}/100 on the Corporate Behavior Index™. Here's what the data says about working there:`;

  useEffect(() => {
    preGenerateOGCard({ type: "company", companyA: companyName, scoreA: overallScore, slugA: slug });
  }, [companyName, overallScore]);

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
      {/* Visual card designed for screenshots */}
      <div id={`intelligence-snapshot-${slug}`} className="bg-card border border-border p-6 rounded-xl relative overflow-hidden">
        <div className={cn("absolute top-0 left-0 w-1.5 h-full rounded-l-xl", band.accent)} />

        <div className="pl-4">
          {/* Brand header */}
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-2">
            Corporate Behavior Index™
          </div>
          <div className="font-serif text-xl mb-1 text-foreground font-bold">{companyName}</div>

          {/* Score display */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-mono text-5xl font-black text-foreground">{overallScore}</span>
            <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">/100</span>
            <Badge className={cn("text-[10px]", band.color, band.bg, "border", band.accent)}>
              {scoreLabel || band.label}
            </Badge>
          </div>

          {/* Key metrics row */}
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {metrics.slice(0, 3).map((m) => (
                <div key={m.label} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-sm font-bold text-foreground">{m.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Signal bars */}
          <div className="grid gap-2">
            {signals.slice(0, 5).map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-[130px] font-mono text-[9px] tracking-wider uppercase text-muted-foreground truncate">
                  {s.label}
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full",
                      s.status === "positive" ? "bg-[hsl(var(--civic-green))]" :
                      s.status === "negative" ? "bg-destructive" : "bg-[hsl(var(--civic-yellow))]"
                    )}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <div className="font-mono text-xs font-semibold text-foreground w-8 text-right">{s.score}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
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
        <Button onClick={shareLinkedIn} size="sm" className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white">
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
