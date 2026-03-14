import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [voting, setVoting] = useState(false);

  const totalVotes = (votes[matchup.brandA.slug] || 0) + (votes[matchup.brandB.slug] || 0);
  const pctA = totalVotes > 0 ? Math.round(((votes[matchup.brandA.slug] || 0) / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

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

      {/* VS battle */}
      <div className="flex">
        <BrandSide brand={matchup.brandA} seed={matchup.seed1} pct={pctA} isVoted={userVote === matchup.brandA.slug} side="left" />
        <BrandSide brand={matchup.brandB} seed={matchup.seed2} pct={pctB} isVoted={userVote === matchup.brandB.slug} side="right" />
      </div>
    </div>
  );
}
