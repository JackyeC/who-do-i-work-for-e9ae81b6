/**
 * Who Did I Vote For? — Live congressional lookup page
 *
 * Searches by address using Census geocoder → legislators JSON → Congress.gov + FEC.
 * No mock data. Real receipts only.
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, ArrowRight, Users, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { RepProfileCard, type RepProfileData } from "@/components/civic/RepProfileCard";
import { FundingOverview, type FundingItem } from "@/components/civic/FundingOverview";
import { SignalConfidenceLegend } from "@/components/civic/SignalConfidenceLegend";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

// ─── Types ─── //
interface RepResult {
  name: string;
  bioguideId: string;
  party: string;
  title: string;
  level: string;
  state: string;
  district?: string;
  chamber: string;
  url?: string;
  photoUrl?: string | null;
  committees: string[];
  termsServed?: number;
  corporateFunders: { companyName: string; amount: number; donationType: string }[];
  totalCorporateFunding: number;
  dataSources: string[];
  confidence: string;
  lastUpdated: string;
}

interface VotingSummary {
  summary: string;
  data_source: string;
  policy_areas: string[];
  loading: boolean;
  error?: string;
}

// ─── Reveal wrapper ─── //
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Rep Result Card ─── //
function RepResultCard({ rep, votingSummary, onLoadSummary }: {
  rep: RepResult;
  votingSummary?: VotingSummary;
  onLoadSummary: () => void;
}) {
  const repProfile: RepProfileData = {
    name: rep.name,
    party: rep.party,
    state: rep.state,
    district: rep.district,
    committees: rep.committees,
    photoUrl: rep.photoUrl,
    lastUpdated: new Date(rep.lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    sourceName: rep.dataSources.join(" + "),
  };

  const funders: FundingItem[] = rep.corporateFunders.slice(0, 5).map(f => ({
    industry: f.companyName,
    amount: f.amount,
  }));

  return (
    <div className="space-y-4">
      <RepProfileCard rep={repProfile} />

      {/* Confidence badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn(
          "text-xs font-mono",
          rep.confidence === "high" ? "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" :
          rep.confidence === "medium" ? "border-[hsl(var(--civic-blue))]/30 text-[hsl(var(--civic-blue))]" :
          "border-border text-muted-foreground"
        )}>
          {rep.confidence === "high" ? "●" : rep.confidence === "medium" ? "●" : "○"} {rep.confidence} confidence
        </Badge>
        {rep.dataSources.map(src => (
          <Badge key={src} variant="secondary" className="text-[0.625rem] font-mono">
            {src}
          </Badge>
        ))}
      </div>

      {/* Top Funders */}
      {funders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm text-foreground">Top Campaign Funders</h4>
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              ${rep.totalCorporateFunding.toLocaleString()} total
            </span>
          </div>
          <FundingOverview
            items={funders}
            source="Source: OpenFEC · 2024 Election Cycle"
          />
        </div>
      )}

      {/* Voting Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <h4 className="font-bold text-sm text-foreground">Voting Record Summary</h4>
        </div>

        {!votingSummary ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadSummary}
            className="font-mono text-xs"
          >
            Load Voting Record
          </Button>
        ) : votingSummary.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing voting records from Congress.gov...
          </div>
        ) : votingSummary.error ? (
          <p className="text-sm text-destructive">{votingSummary.error}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed">
            <ReactMarkdown>{votingSummary.summary}</ReactMarkdown>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border not-prose">
              <Badge variant="secondary" className="text-[0.625rem] font-mono">
                {votingSummary.data_source === "congress.gov" ? "Congress.gov verified" : "AI inference"}
              </Badge>
              {votingSummary.policy_areas.slice(0, 3).map(area => (
                <Badge key={area} variant="outline" className="text-[0.625rem]">{area}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Link to full profile */}
      <div className="text-center">
        <Link
          to={`/representative/${encodeURIComponent(rep.name)}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          View full profile & funding details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ─── //
export default function WhoDidIVoteFor() {
  usePageSEO({
    title: "Who Did I Vote For? — Congressional Alert System",
    description: "See what your representatives actually do — not just what they say. Track votes, funding, and behavioral patterns.",
    path: "/who-did-i-vote-for",
  });

  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RepResult[] | null>(null);
  const [searchMeta, setSearchMeta] = useState<{ state: string; district: string; address: string } | null>(null);
  const [votingSummaries, setVotingSummaries] = useState<Record<string, VotingSummary>>({});

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResults(null);
    setSearchMeta(null);
    setVotingSummaries({});

    try {
      const { data, error } = await supabase.functions.invoke("voter-lookup", {
        body: { address: query.trim() },
      });
      if (error) throw error;

      if (!data?.success) {
        toast({
          title: "Lookup failed",
          description: data?.error || "Could not find representatives. Try adding city and state (e.g., '5000 Lake Highlands Dr, Dallas, TX 75214').",
          variant: "destructive",
        });
        return;
      }

      const reps = data.data?.representatives || [];
      if (reps.length === 0) {
        toast({
          title: "No representatives found",
          description: "Try a more specific US address with city, state, and ZIP code.",
          variant: "destructive",
        });
        return;
      }

      setResults(reps);
      setSearchMeta({
        state: data.data.state,
        district: data.data.district,
        address: data.data.searchedAddress,
      });

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      toast({
        title: "Lookup failed",
        description: err.message || "Could not complete the search.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, toast]);

  const loadVotingSummary = useCallback(async (rep: RepResult) => {
    const key = rep.bioguideId || rep.name;
    setVotingSummaries(prev => ({
      ...prev,
      [key]: { summary: "", data_source: "", policy_areas: [], loading: true },
    }));

    try {
      const { data, error } = await supabase.functions.invoke("candidate-voting-summary", {
        body: {
          candidate_name: rep.name,
          party: rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent",
          state: rep.state,
          district: rep.district,
        },
      });

      if (error) throw error;

      setVotingSummaries(prev => ({
        ...prev,
        [key]: {
          summary: data.summary || "No voting data available.",
          data_source: data.data_source || "ai_inference",
          policy_areas: data.policy_areas || [],
          loading: false,
        },
      }));
    } catch (err: any) {
      setVotingSummaries(prev => ({
        ...prev,
        [key]: {
          summary: "",
          data_source: "",
          policy_areas: [],
          loading: false,
          error: err.message || "Failed to load voting record.",
        },
      }));
    }
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="min-h-[70vh] flex items-center justify-center text-center px-6 py-24 sm:py-32">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase text-primary mb-4">
              Congressional Intelligence
            </p>
            <h1 className="text-[clamp(2.25rem,5.5vw,4rem)] font-extrabold text-foreground leading-[1.08] tracking-tight mb-6">
              You know who you voted for.<br />
              <span className="text-primary">Do you know what they've done?</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Enter your address. We'll show you your representatives, their voting records,
              campaign funders, and behavioral patterns — sourced from Congress.gov and OpenFEC.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <form
              onSubmit={handleSearch}
              className="flex items-center max-w-lg mx-auto bg-card border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <div className="flex items-center pl-4">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 5000 Lake Highlands Dr, Dallas, TX 75214"
                className="flex-1 bg-transparent border-none outline-none px-3 py-4 text-foreground placeholder:text-muted-foreground text-base"
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="bg-primary text-primary-foreground font-bold text-sm px-7 py-4 uppercase tracking-wider hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </form>
            <p className="text-xs text-muted-foreground/60 mt-3 font-mono">
              Include city, state, and ZIP for best results · Powered by US Census Bureau geocoder
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ RESULTS ═══ */}
      {results && results.length > 0 && (
        <section id="results" className="py-16 sm:py-20">
          <div className="max-w-[840px] mx-auto px-6">
            {/* Results header */}
            <Reveal>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-primary">
                  Your Representatives
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
                {searchMeta?.state}{searchMeta?.district ? ` — District ${searchMeta.district}` : ""}
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Showing {results.length} representative{results.length !== 1 ? "s" : ""} for{" "}
                <span className="text-foreground font-medium">{searchMeta?.address}</span>
              </p>
            </Reveal>

            {/* Rep cards */}
            <div className="space-y-10">
              {results.map((rep, i) => (
                <Reveal key={rep.bioguideId || rep.name} delay={i * 0.1}>
                  <RepResultCard
                    rep={rep}
                    votingSummary={votingSummaries[rep.bioguideId || rep.name]}
                    onLoadSummary={() => loadVotingSummary(rep)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ EMPTY STATE (before search) ═══ */}
      {!results && !isSearching && (
        <section className="py-16 sm:py-20">
          <div className="max-w-[840px] mx-auto px-6">
            <Reveal>
              <div className="text-center py-12 px-6 border border-dashed border-border rounded-xl">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Enter your address above</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We'll use the US Census Bureau to identify your congressional district,
                  then pull your representatives' voting records, committee assignments,
                  and campaign funding data from Congress.gov and OpenFEC.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═══ SIGNAL CONFIDENCE ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <Reveal>
            <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-primary mb-3">
              Methodology
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 tracking-tight">
              Signal Confidence
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <SignalConfidenceLegend />
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="text-center py-20 sm:py-28 px-6">
        <Reveal>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-foreground leading-[1.1] tracking-tight mb-4">
            Stop applying. Start aligning.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-12 leading-relaxed">
            You don't need more applications. You need better decisions.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-bold"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Check Your Representatives
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base font-bold"
              asChild
            >
              <Link to="/browse">Check Your Employer</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
