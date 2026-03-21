import { useState, useEffect, useCallback } from "react";
import { Trophy, Zap, Lock, Users } from "lucide-react";
import { BRACKET_REGIONS } from "@/data/bracketData2026";
import { BracketMatchupCard } from "@/components/bracket/BracketMatchupCard";
import { ShareVoteCard } from "@/components/bracket/ShareVoteCard";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function BrandMadness() {
  const { user } = useAuth();
  const [activeRegion, setActiveRegion] = useState("tech");
  const [votes, setVotes] = useState<Record<string, Record<string, number>>>({});
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [lastVote, setLastVote] = useState<{ matchupId: string; brandSlug: string } | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);

  usePageSEO({
    title: "Brand Madness 2026 — 64 Brands, 4 Regions, 1 Champion",
    description:
      "Vote in the biggest corporate bracket of 2026. 64 brands battle across Tech, Food, Sports, and Style — judged by your votes AND their Corporate Character Score™.",
    path: "/brand-madness",
  });

  // Load aggregate votes
  useEffect(() => {
    const loadVotes = async () => {
      const { data } = await supabase
        .from("bracket_vote_totals")
        .select("matchup_id, voted_for, vote_count");

      if (data) {
        const agg: Record<string, Record<string, number>> = {};
        let total = 0;
        data.forEach((v: any) => {
          if (!agg[v.matchup_id]) agg[v.matchup_id] = {};
          agg[v.matchup_id][v.voted_for] = v.vote_count;
          total += v.vote_count;
        });
        setVotes(agg);
        setTotalVoters(total);
      }
    };
    loadVotes();
  }, []);

  // Load user votes
  useEffect(() => {
    if (!user) return;
    const loadUserVotes = async () => {
      const { data } = await supabase
        .from("bracket_votes")
        .select("matchup_id, voted_for")
        .eq("user_id", user.id);

      if (data) {
        const uv: Record<string, string> = {};
        data.forEach((v: any) => {
          uv[v.matchup_id] = v.voted_for;
        });
        setUserVotes(uv);
      }
    };
    loadUserVotes();
  }, [user]);

  const handleVote = useCallback((matchupId: string, brandSlug: string) => {
    setUserVotes((prev) => ({ ...prev, [matchupId]: brandSlug }));
    setVotes((prev) => {
      const matchup = { ...(prev[matchupId] || {}) };
      // Remove previous vote if exists
      const prevVote = userVotes[matchupId];
      if (prevVote && matchup[prevVote]) matchup[prevVote]--;
      matchup[brandSlug] = (matchup[brandSlug] || 0) + 1;
      return { ...prev, [matchupId]: matchup };
    });
    setLastVote({ matchupId, brandSlug });
    setTotalVoters((p) => p + 1);
  }, [userVotes]);

  const region = BRACKET_REGIONS.find((r) => r.id === activeRegion)!;

  // Find data for the share card
  const shareData = lastVote
    ? (() => {
        for (const r of BRACKET_REGIONS) {
          const m = r.matchups.find((m) => m.id === lastVote.matchupId);
          if (m) {
            const isA = m.brandA.slug === lastVote.brandSlug;
            const brand = isA ? m.brandA : m.brandB;
            const opponent = isA ? m.brandB : m.brandA;
            const mv = votes[lastVote.matchupId] || {};
            const total = Object.values(mv).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round(((mv[lastVote.brandSlug] || 0) / total) * 100) : 100;
            return { brandName: brand.name, brandEmoji: brand.emoji, opponentName: opponent.name, regionName: r.name, votePercent: pct, tensionLabel: m.tension?.label };
          }
        }
        return null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary font-semibold">
              March 2026
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Brand Madness 2026
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-[600px] mb-4">
            64 brands. 4 regions. Your vote decides who advances — but 50% of
            the score comes from their Corporate Character Score™. Welcome to
            the biggest bracket in career intelligence.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono font-semibold text-foreground">{totalVoters.toLocaleString()}</span> votes cast
            </div>
            {!user && (
              <Link to="/login">
                <Button size="sm" className="font-mono text-[10px]">
                  Sign Up to Vote
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Region tabs */}
      <div className="border-b border-border bg-muted/20 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          {BRACKET_REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRegion(r.id)}
              className={cn(
                "font-mono text-[10px] tracking-wider uppercase px-4 py-1.5 border transition-all whitespace-nowrap flex items-center gap-1.5",
                activeRegion === r.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              <span>{r.emoji}</span>
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Matchups grid */}
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{region.emoji}</span>
          <h2 className="font-bold text-foreground text-lg">{region.name} Region</h2>
          <span className="font-mono text-[9px] tracking-wider text-muted-foreground ml-2">
            Round of 64
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {region.matchups.map((matchup) => (
            <BracketMatchupCard
              key={matchup.id}
              matchup={matchup}
              regionColor={region.color}
              votes={votes[matchup.id] || {}}
              userVote={userVotes[matchup.id]}
              onVote={handleVote}
            />
          ))}
        </div>

        {/* Share card after voting */}
        {shareData && (
          <div className="max-w-md mx-auto mb-8">
            <ShareVoteCard {...shareData} />
          </div>
        )}

        {/* Gated rounds teaser */}
        <div className="border border-border bg-card p-6 text-center">
          <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
          <h3 className="font-bold text-foreground text-sm mb-1">
            Elite Eight & Final Four
          </h3>
          <p className="text-[12px] text-muted-foreground max-w-md mx-auto mb-3">
            Round of 32 results drop March 21. Elite Eight voting opens March
            28 — verified accounts only. Sign up now to lock in your bracket.
          </p>
          {!user && (
            <Link to="/login">
              <Button size="sm" className="font-mono text-[10px]">
                <Zap className="w-3 h-3 mr-1" />
                Create Free Account
              </Button>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            Brand Madness 2026 · 50% fan votes + 50% Corporate Character
            Score™ · Powered by verified intelligence · whodoiworkfor.com
          </p>
        </div>
      </div>
    </div>
  );
}
