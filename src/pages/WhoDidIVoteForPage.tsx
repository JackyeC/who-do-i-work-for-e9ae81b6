/**
 * Who Did I Vote For? — Public-facing congressional lookup page
 *
 * Editorial dark-mode page that lets users search by ZIP/address
 * to see their representatives' voting records, behavioral alerts,
 * campaign funding, and signal confidence methodology.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, ArrowRight } from "lucide-react";
import { RepProfileCard, type RepProfileData } from "@/components/civic/RepProfileCard";
import { VoteCard, type VoteData } from "@/components/civic/VoteCard";
import { AlertCard, type AlertData } from "@/components/civic/AlertCard";
import { FundingOverview, type FundingItem } from "@/components/civic/FundingOverview";
import { SignalConfidenceLegend } from "@/components/civic/SignalConfidenceLegend";

// ─── Sample data (rendered before search to demo the format) ─── //
const SAMPLE_REP: RepProfileData = {
  name: "Rep. Marcus J. Whitfield",
  party: "R",
  state: "Texas",
  district: "24",
  committees: ["Ways & Means", "Energy & Commerce", "Small Business"],
  lastUpdated: "March 24, 2026",
  sourceName: "Congress.gov",
};

const SAMPLE_VOTES: VoteData[] = [
  { billTitle: "Expanding Overtime Protections for Hourly Workers", vote: "no", outcome: "failed", date: "March 18, 2026", sourceName: "Congress.gov" },
  { billTitle: "Federal Data Privacy and Consumer Protection Act", vote: "yes", outcome: "passed", date: "March 10, 2026", sourceName: "Congress.gov" },
  { billTitle: "Lowering Prescription Drug Costs Act", vote: "no", outcome: "passed", date: "February 28, 2026", sourceName: "Congress.gov" },
  { billTitle: "Small Business Tax Relief Extension", vote: "yes", outcome: "passed", date: "February 14, 2026", sourceName: "Congress.gov" },
  { billTitle: "Infrastructure and Clean Energy Investment Act", vote: "no", outcome: "failed", date: "January 30, 2026", sourceName: "Congress.gov" },
];

const SAMPLE_ALERTS: AlertData[] = [
  {
    type: "pattern",
    title: "Pattern Detected",
    summary: "Voted against expanding worker protections in 4 of last 5 relevant votes",
    context: "These votes relate to hourly worker pay and overtime protections",
    receipts: [
      { billId: "H.R. 4521", vote: "no", date: "March 2026" },
      { billId: "H.R. 4102", vote: "no", date: "January 2026" },
      { billId: "H.R. 3887", vote: "no", date: "December 2025" },
      { billId: "H.R. 3654", vote: "no", date: "October 2025" },
      { billId: "H.R. 3201", vote: "yes", date: "August 2025" },
    ],
    source: "Congress.gov",
    confidence: "Multi-Source Signal",
  },
  {
    type: "funding_alignment",
    title: "Funding Alignment Signal",
    summary: "Top funding industry (Pharmaceuticals) aligns with recent voting behavior",
    context: "Multiple votes align with priorities of this industry",
    receipts: [
      { billId: "H.R. 4380", vote: "no", date: "Feb 2026", note: "Feb 2026 — Drug pricing cap" },
      { billId: "H.R. 4015", vote: "no", date: "Dec 2025", note: "Dec 2025 — Import reform" },
      { billId: "H.R. 3790", vote: "yes", date: "Nov 2025", note: "Nov 2025 — Patent extension" },
    ],
    source: "OpenFEC + Congress.gov",
    confidence: "Multi-Source Signal",
  },
];

const SAMPLE_FUNDING: FundingItem[] = [
  { industry: "Pharmaceuticals / Health Products", amount: 482500 },
  { industry: "Oil & Gas", amount: 347200 },
  { industry: "Real Estate", amount: 218900 },
];

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

// ─── Section header ─── //
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <Reveal>
      <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-primary mb-3">
        {label}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 tracking-tight">
        {title}
      </h2>
    </Reveal>
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
  const [hasSearched, setHasSearched] = useState(false);
  const [liveRep, setLiveRep] = useState<RepProfileData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("voter-lookup", {
        body: { address: query.trim() },
      });
      if (error) throw error;

      if (data?.success && data.data?.representatives?.length > 0) {
        const rep = data.data.representatives[0];
        setLiveRep({
          name: rep.name,
          party: rep.party,
          state: rep.state || data.data.state,
          district: rep.district || data.data.district,
          committees: rep.committees,
          photoUrl: rep.photoUrl,
          lastUpdated: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          sourceName: "Congress.gov",
        });
        setHasSearched(true);

        // Scroll to results
        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        toast({ title: "No results found", description: "Try a more specific US address or ZIP code.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message || "Could not complete the search.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  // Use live data or sample
  const displayRep = liveRep || SAMPLE_REP;

  return (
    <div className="bg-background min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="min-h-[85vh] flex items-center justify-center text-center px-6 py-24 sm:py-32">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold text-foreground leading-[1.08] tracking-tight mb-6">
              Stop applying.<br />Start aligning.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
              See what companies and decision-makers actually do — not just what they say.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <form
              onSubmit={handleSearch}
              className="flex items-center max-w-lg mx-auto bg-card border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your ZIP code or address"
                className="flex-1 bg-transparent border-none outline-none px-5 py-4 text-foreground placeholder:text-muted-foreground text-base"
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
          </Reveal>
        </div>
      </section>

      {/* ═══ REP RESULTS ═══ */}
      <section id="results" className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <SectionHeader label="Representative" title="Your Representative" />

          <Reveal delay={0.1}>
            {!hasSearched && (
              <div className="mb-3 flex justify-center">
                <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground">
                  Preview — Enter your address above to see real data
                </Badge>
              </div>
            )}
            <RepProfileCard rep={displayRep} />
          </Reveal>

          {hasSearched && liveRep && (
            <Reveal delay={0.2}>
              <div className="mt-4 text-center">
                <Link
                  to={`/representative/${encodeURIComponent(liveRep.name)}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  View full funding profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ═══ RECENT VOTES ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <SectionHeader label="Voting Record" title="Recent Votes" />
          <div className="space-y-3">
            {SAMPLE_VOTES.map((vote, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <VoteCard vote={vote} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BEHAVIORAL ALERTS ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <SectionHeader label="Behavioral Signals" title="Alerts" />
          <div className="space-y-5">
            {SAMPLE_ALERTS.map((alert, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <AlertCard alert={alert} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FUNDING OVERVIEW ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <SectionHeader label="Campaign Finance" title="Funding Overview" />
          <Reveal delay={0.1}>
            <FundingOverview
              items={SAMPLE_FUNDING}
              source="Source: OpenFEC · 2025–2026 Election Cycle"
            />
          </Reveal>
        </div>
      </section>

      {/* ═══ SIGNAL CONFIDENCE ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[840px] mx-auto px-6">
          <SectionHeader label="Methodology" title="Signal Confidence" />
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
              Check Another Representative
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base font-bold"
              asChild
            >
              <Link to="/offer-clarity">Analyze Your Offer</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
