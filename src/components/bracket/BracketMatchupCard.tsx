import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { BracketMatchup } from "@/data/bracketData2026";

interface BracketMatchupCardProps {
  matchup: BracketMatchup;
  regionColor: string;
  votes: { [brandSlug: string]: number };
  userVote?: string;
  onVote: (matchupId: string, brandSlug: string) => void;
}

export function BracketMatchupCard({
  matchup,
  regionColor,
  votes,
  userVote,
  onVote,
}: BracketMatchupCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [voting, setVoting] = useState(false);

  const totalVotes = (votes[matchup.brandA.slug] || 0) + (votes[matchup.brandB.slug] || 0);
  const pctA = totalVotes > 0 ? Math.round(((votes[matchup.brandA.slug] || 0) / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  const votedBrand = userVote === matchup.brandA.slug ? matchup.brandA : userVote === matchup.brandB.slug ? matchup.brandB : null;

  const handleVote = async (brandSlug: string) => {
    if (voting) return;

    if (!user) {
      toast({ title: "Sign up to vote", description: "Create a free account to cast your vote in Brand Madness.", variant: "destructive" });
      return;
    }

    setVoting(true);
    try {
      const { error } = await supabase.from("bracket_votes").upsert(
        { user_id: user.id, matchup_id: matchup.id, round: 1, voted_for: brandSlug },
        { onConflict: "user_id,matchup_id,round" }
      );
      if (error) throw error;
      onVote(matchup.id, brandSlug);
    } catch {
      toast({ title: "Vote failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  const BrandSide = ({
    brand,
    seed,
    pct,
    isVoted,
    side,
  }: {
    brand: BracketMatchup["brandA"];
    seed: number;
    pct: number;
    isVoted: boolean;
    side: "left" | "right";
  }) => (
    <button
      onClick={() => handleVote(brand.slug)}
      disabled={voting}
      className={cn(
        "flex-1 p-3 transition-all relative overflow-hidden group",
        side === "left" ? "border-r border-border" : "",
        isVoted
          ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
          : "hover:bg-primary/[0.04]"
      )}
    >
      {/* Vote bar background */}
      {userVote && (
        <div
          className={cn(
            "absolute inset-0 bg-primary/5 transition-all",
            side === "left" ? "origin-left" : "origin-right"
          )}
          style={{ width: `${pct}%` }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-muted-foreground">#{seed}</span>
          {isVoted && <Check className="w-3 h-3 text-primary" />}
        </div>
        <div className="text-lg mb-0.5">{brand.emoji}</div>
        <div className="font-bold text-[11px] text-foreground leading-tight mb-0.5">{brand.name}</div>
        <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">{brand.tagline}</div>
        {userVote && (
          <div className="mt-1.5 font-mono text-[10px] font-bold text-primary">{pct}%</div>
        )}
      </div>
    </button>
  );

  return (
    <div className="border border-border bg-card hover:border-primary/20 transition-all">
      {/* Seed matchup header */}
      <div className="px-3 py-1.5 bg-muted/20 border-b border-border flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
          #{matchup.seed1} vs #{matchup.seed2}
        </span>
        {totalVotes > 0 && (
          <span className="font-mono text-[8px] text-muted-foreground">
            {totalVotes.toLocaleString()} votes
          </span>
        )}
      </div>

      {/* Tension chip */}
      {matchup.tension && (
        <div className="px-3 py-1.5 border-b border-border bg-muted/10 flex items-center justify-center">
          <span className="font-mono text-[8px] tracking-[0.15em] uppercase text-accent-foreground/70">
            ⚡ {matchup.tension.label}
          </span>
        </div>
      )}

      {/* VS battle */}
      <div className="flex">
        <BrandSide brand={matchup.brandA} seed={matchup.seed1} pct={pctA} isVoted={userVote === matchup.brandA.slug} side="left" />
        <BrandSide brand={matchup.brandB} seed={matchup.seed2} pct={pctB} isVoted={userVote === matchup.brandB.slug} side="right" />
      </div>

      {/* Post-vote insight */}
      {userVote && votedBrand && matchup.postVoteInsight && (
        <div className="border-t border-border bg-muted/10 px-3 py-3 space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              {matchup.postVoteInsight}
            </p>
          </div>

          {matchup.operatingContext && (
            <div className="bg-card border border-border/50 rounded px-3 py-2 space-y-1">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground">How they tend to operate</p>
              <p className="text-[10px] text-foreground leading-snug">
                <span className="font-semibold">Leaning:</span> {matchup.operatingContext.leaning}
              </p>
              <p className="text-[10px] text-foreground leading-snug">
                <span className="font-semibold">Tradeoff:</span> {matchup.operatingContext.tradeoff}
              </p>
              <p className="text-[10px] text-primary leading-snug">
                <span className="font-semibold">Ask:</span> "{matchup.operatingContext.questionToAsk}"
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(`/company/${votedBrand.slug}`)}
            className="w-full flex items-center justify-center gap-1 text-[9px] font-mono tracking-wider uppercase text-primary hover:text-primary/80 transition-colors pt-1"
          >
            See full company intelligence <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
