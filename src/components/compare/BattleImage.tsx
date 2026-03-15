import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BattleImageProps {
  companyA: string;
  companyB: string;
  industryA?: string;
  industryB?: string;
}

export function BattleImage({ companyA, companyB, industryA, industryB }: BattleImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
    if (companyA && companyB) generate();
  }, [companyA, companyB]);

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

      <div className="px-5 py-2 border-t border-border bg-muted/10 text-center">
        <span className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
          Powered by AI · For entertainment purposes · Not a reflection of actual corporate performance
        </span>
      </div>
    </div>
  );
}
