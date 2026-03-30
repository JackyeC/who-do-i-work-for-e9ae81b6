import { useRef, useState } from "react";
import { X, Download, Linkedin, Twitter, Link2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

interface ComponentScore {
  label: string;
  score: number;
  weight: number;
}

interface EmployerClarityShareCardProps {
  companyName: string;
  totalScore: number;
  components: ComponentScore[];
  onClose?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "hsl(var(--civic-green))";
  if (score >= 45) return "hsl(var(--civic-yellow))";
  return "hsl(var(--civic-red))";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-[hsl(var(--civic-green))]";
  if (score >= 45) return "bg-[hsl(var(--civic-yellow))]";
  return "bg-destructive";
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-[hsl(var(--civic-green))]";
  if (score >= 45) return "text-[hsl(var(--civic-yellow))]";
  return "text-destructive";
}

export function EmployerClarityShareCard({
  companyName,
  totalScore,
  components,
  onClose,
}: EmployerClarityShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-clarity-score.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Card downloaded!", description: "Ready to share 📸" });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const shareLinkedIn = () => {
    const text = `I pulled the receipts on ${companyName}. Employer Clarity Score: ${totalScore}/100. Know before you go → wdiwf.jackyeclayton.com`;
    const url = "https://wdiwf.jackyeclayton.com";
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=600,height=600"
    );
  };

  const shareTwitter = () => {
    const text = `🧾 ${companyName} Employer Clarity Score: ${totalScore}/100. I pulled the receipts. wdiwf.jackyeclayton.com`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const copyLink = () => {
    const text = `I pulled the receipts on ${companyName}. Employer Clarity Score: ${totalScore}/100. Know before you go → wdiwf.jackyeclayton.com`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard! 📋" });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-primary/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-500 font-bold text-sm">W?</span>
            </div>
            <h2 className="font-semibold text-foreground">Share Clarity Score</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Share Card Preview */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={cardRef}
            className="bg-[#1a1a2e] border border-primary/20 rounded-lg p-8 w-full max-w-md"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(30, 30, 46, 1) 100%)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 font-bold text-xs">W?</span>
                </div>
                <span className="font-mono text-xs tracking-widest uppercase text-primary">
                  Employer Clarity
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {companyName}
              </h3>
            </div>

            {/* Large Circular Score */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-current"
                style={{
                  borderColor: getScoreColor(totalScore),
                  background: `conic-gradient(${getScoreColor(totalScore)} 0deg ${(totalScore / 100) * 360}deg, transparent ${(totalScore / 100) * 360}deg)`,
                }}
              >
                <div className="absolute inset-2 bg-[#1a1a2e] rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-4xl font-black tabular-nums",
                        getScoreTextColor(totalScore)
                      )}
                    >
                      {totalScore}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      /100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Bars */}
            <div className="space-y-4 mb-8">
              {components.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground text-sm">
                      {c.label}
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums text-xs",
                        getScoreTextColor(c.score)
                      )}
                    >
                      {c.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getScoreBgColor(c.score)
                      )}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center border-t border-primary/20 pt-6">
              <div className="text-xs text-muted-foreground font-mono tracking-wide">
                I pulled the receipts
              </div>
              <div className="text-sm font-semibold text-amber-500 mt-1">
                wdiwf.jackyeclayton.com
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-6 w-full max-w-md">
            <button
              onClick={downloadCard}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-mono text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Downloading..." : "Download Card"}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="border-t border-primary/20 px-6 py-4 space-y-3">
          <div className="text-xs font-mono tracking-widest uppercase text-primary">
            Share This Score
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareLinkedIn}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[hsl(210,80%,40%)] hover:bg-[hsl(210,80%,30%)] text-white font-mono text-xs tracking-wider uppercase transition-colors rounded"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </button>

            <button
              onClick={shareTwitter}
              className="inline-flex items-center gap-2 px-3 py-2 bg-foreground hover:bg-foreground/80 text-background font-mono text-xs tracking-wider uppercase transition-colors rounded"
            >
              <Twitter className="w-4 h-4" />
              Twitter/X
            </button>

            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-3 py-2 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground font-mono text-xs tracking-wider uppercase transition-colors rounded"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-primary" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Share your company's Employer Clarity Score and help others make
            informed career decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
