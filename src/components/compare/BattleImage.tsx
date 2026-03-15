import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Sparkles, RefreshCw, Share2, Linkedin, Link2, Check, Twitter, Facebook } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { openShareWindow, getShareText, type ShareContext } from "@/lib/social-share";

interface BattleImageProps {
  companyA: string;
  companyB: string;
  industryA?: string;
  industryB?: string;
  scoreA?: number;
  scoreB?: number;
  slugA?: string;
  slugB?: string;
}

export function BattleImage({ companyA, companyB, industryA, industryB, scoreA, scoreB, slugA, slugB }: BattleImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-battle-image", {
        body: { companyA, companyB, industryA, industryB },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        if (data.error.includes("Rate limited")) {
          toast({ title: "Slow down!", description: "Too many requests — try again in a moment.", variant: "destructive" });
        }
        throw new Error(data.error);
      }
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (e) {
      console.error("Battle image error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyA && companyB) {
      generate();
      // Pre-generate OG card for social sharing
      supabase.functions.invoke("generate-og-card", {
        body: { type: "battle", companyA, companyB, scoreA, scoreB, industryA, industryB },
      }).catch(() => {}); // silent — OG card is best-effort
    }
  }, [companyA, companyB]);

  const shareCtx = useMemo<ShareContext>(() => ({
    type: "battle",
    companyA,
    companyB,
    scoreA,
    scoreB,
    slugA,
    slugB,
  }), [companyA, companyB, scoreA, scoreB, slugA, slugB]);

  const shareText = getShareText("copy", shareCtx);

  const shareLinkedIn = () => openShareWindow("linkedin", shareCtx);
  const shareTwitter = () => openShareWindow("twitter", shareCtx);
  const shareFacebook = () => openShareWindow("facebook", shareCtx);

  const copyLink = () => {
    navigator.clipboard.writeText(getShareText("copy", shareCtx));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Battle link copied! 🔥" });
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${companyA}-vs-${companyB}-battle.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Image downloaded! 📸", description: "Share it on social media!" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  return (
    <div className="border border-border bg-card overflow-hidden mb-8">
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-semibold">
            AI Battle Arena
          </span>
        </div>
        {imageUrl && !loading && (
          <button
            onClick={generate}
            className="flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      <div className="relative min-h-[280px] flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="text-center">
              <div className="font-mono text-[10px] tracking-wider uppercase text-primary mb-1">
                Generating Battle Art
              </div>
              <div className="text-[12px] text-muted-foreground">
                AI is illustrating {companyA} vs {companyB}...
              </div>
            </div>
          </div>
        )}

        {imageUrl && !loading && (
          <img
            src={imageUrl}
            alt={`${companyA} vs ${companyB} battle illustration`}
            className="w-full max-h-[400px] object-contain"
          />
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Zap className="w-8 h-8 text-muted-foreground" />
            <div className="text-[12px] text-muted-foreground">
              Couldn't generate battle art this time.
            </div>
            <button
              onClick={generate}
              className="font-mono text-[10px] tracking-wider uppercase text-primary hover:underline"
            >
              Try again →
            </button>
          </div>
        )}
      </div>

      {/* Share bar — only when image is ready */}
      {imageUrl && !loading && (
        <div className="px-5 py-4 border-t border-border bg-muted/10">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-semibold">
              Share This Battle
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">
            {shareText}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareLinkedIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(210,80%,40%)] hover:bg-[hsl(210,80%,30%)] text-white font-mono text-[9px] tracking-wider uppercase transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </button>
            <button
              onClick={shareFacebook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(220,46%,48%)] hover:bg-[hsl(220,46%,38%)] text-white font-mono text-[9px] tracking-wider uppercase transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </button>
            <button
              onClick={shareTwitter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground hover:bg-foreground/80 text-background font-mono text-[9px] tracking-wider uppercase transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" /> Twitter / X
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-muted/30 text-foreground font-mono text-[9px] tracking-wider uppercase transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={downloadImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-mono text-[9px] tracking-wider uppercase transition-colors"
            >
              📸 Download Image
            </button>
          </div>
        </div>
      )}

      <div className="px-5 py-2 border-t border-border bg-muted/10 text-center">
        <span className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
          Powered by AI · For entertainment purposes · Celebrating underrepresented voices in corporate America
        </span>
      </div>
    </div>
  );
}
