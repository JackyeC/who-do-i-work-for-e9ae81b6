import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceiptsFeed, type ReceiptArticle } from "@/hooks/use-receipts-feed";
import { ReceiptsFilters } from "@/components/receipts/ReceiptsFilters";
import { FeaturedReceipt } from "@/components/receipts/FeaturedReceipt";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { SpecialEditionCard } from "@/components/receipts/SpecialEditionCard";
import { FloatingBubble } from "@/components/receipts/FloatingBubble";
import { EmailCaptureModal } from "@/components/receipts/EmailCaptureModal";
import { WorkNewsTicker } from "@/components/news/WorkNewsTicker";
import { HowToRead } from "@/components/receipts/HowToRead";
import { ReceiptsSidebar } from "@/components/receipts/ReceiptsSidebar";
import { PosterLightbox } from "@/components/receipts/PosterLightbox";
import { getSourceBiasKey } from "@/components/receipts/BiasBar";
import type { ReceiptSortMode } from "@/components/receipts/heat-config";

// ─── Static company receipts (existing investigations) ───
interface StaticReceipt {
  slug: string;
  name: string;
  sector: string;
  headline: string;
  date: string;
  spice: number;
}

const STATIC_INVESTIGATIONS: StaticReceipt[] = [
  { slug: "meta", name: "Meta", sector: "Big Tech", headline: "DEI team dissolved + massive WARN filings", date: "March 2026", spice: 5 },
  { slug: "google", name: "Google", sector: "Big Tech", headline: "11-year diversity report killed", date: "March 2026", spice: 4 },
  { slug: "amazon", name: "Amazon", sector: "Big Tech", headline: "14K HR staff cut + 4,085 WARN notices", date: "March 2026", spice: 5 },
  { slug: "boeing", name: "Boeing", sector: "Defense", headline: "Representation goals scrapped + safety lawsuits", date: "March 2026", spice: 4 },
  { slug: "att", name: "AT&T", sector: "Telecom", headline: "Publicly declared DEI doesn't exist", date: "March 2026", spice: 5 },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } },
};

function getTimeThreshold(filter: string): number {
  const now = Date.now();
  switch (filter) {
    case "24h": return now - 24 * 60 * 60 * 1000;
    case "7d": return now - 7 * 24 * 60 * 60 * 1000;
    case "30d": return now - 30 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

export default function Receipts() {
  usePageSEO({
    title: "The Receipts — JRC EDIT × Live Work Intelligence Feed",
    description: "Live editorial work-intelligence feed by Jackye Clayton. Every story analyzed, every receipt pulled, every action attached. No spin. No rankings. Just receipts.",
    path: "/newsletter",
    jsonLd: {
      "@type": ["CollectionPage", "Review"],
      name: "The Receipts — JRC EDIT",
      description: "Live editorial work-intelligence feed analyzing workplace news through public data.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
      author: {
        "@type": "Person",
        name: "Jackye Clayton",
        jobTitle: "Talent Acquisition Executive",
        sameAs: ["https://www.linkedin.com/in/jackyeclayton/"],
      },
      provider: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const { data: articles, isLoading } = useReceiptsFeed();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<ReceiptSortMode>("newest");
  const [heatFilter, setHeatFilter] = useState<number | null>(null);
  const [biasFilter, setBiasFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [lightboxArticle, setLightboxArticle] = useState<ReceiptArticle | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const filtered = useMemo(() => {
    if (!articles) return [];
    const timeThreshold = getTimeThreshold(timeFilter);

    let result = articles.filter((a) => {
      const matchCategory = category === "all" || a.category === category;
      const matchHeat = heatFilter === null || a.spice_level === heatFilter;
      const matchBias = biasFilter === "all" || getSourceBiasKey(a.source_name) === biasFilter;
      const matchTime = timeFilter === "all" || new Date(a.published_at ?? 0).getTime() >= timeThreshold;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.headline.toLowerCase().includes(q) ||
        (a.source_name?.toLowerCase().includes(q) ?? false) ||
        (a.category?.toLowerCase().includes(q) ?? false) ||
        a.jackye_take.toLowerCase().includes(q) ||
        a.receipt_connection.toLowerCase().includes(q);
      return matchCategory && matchHeat && matchBias && matchTime && matchSearch;
    });

    switch (sortMode) {
      case "newest":
        result = [...result].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
        break;
      case "hottest":
        result = [...result].sort((a, b) => b.spice_level - a.spice_level);
        break;
      case "consequential":
        result = [...result].sort((a, b) => {
          const aScore = b.spice_level * 10 + (b.is_controversy ? 20 : 0) + (b.receipt_connection ? 5 : 0);
          const bScore = a.spice_level * 10 + (a.is_controversy ? 20 : 0) + (a.receipt_connection ? 5 : 0);
          return aScore - bScore;
        });
        break;
      case "drama":
        result = [...result].sort((a, b) => {
          const aDrama = (b.spice_level * 20) + (b.is_controversy ? 10 : 0);
          const bDrama = (a.spice_level * 20) + (a.is_controversy ? 10 : 0);
          return aDrama - bDrama;
        });
        break;
      default:
        result = [...result].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
    }
    return result;
  }, [articles, search, category, sortMode, heatFilter, biasFilter, timeFilter]);

  const featuredArticle = filtered[0];
  const feedArticles = filtered.slice(1);
  const hot5 = useMemo(() => {
    if (!articles) return [];
    return [...articles].sort((a, b) => b.spice_level - a.spice_level).slice(0, 5);
  }, [articles]);

  return (
    <div className="min-h-screen bg-background">
      {/* Live Ticker */}
      <WorkNewsTicker />

      {/* Hero */}
      <header className="border-b border-border py-12 px-8 text-center">
        <div className="max-w-[780px] mx-auto">
          <p className="text-base uppercase tracking-[0.55em] text-primary mb-4 font-mono">
            JRC EDIT × WDIWF
          </p>
          <h1
            className="font-black text-foreground leading-none uppercase"
            style={{ fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            The Receipts
          </h1>
          <p
            className="font-light text-muted-foreground italic mt-4"
            style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}
          >
            The world of work. Documented.
          </p>
          <p
            className="font-medium text-foreground mt-3 opacity-80"
            style={{ fontSize: "clamp(16px, 1.6vw, 20px)" }}
          >
            I pull the receipts so you don't have to.{" "}
            <span className="text-primary">They always leave something out.</span>
          </p>
          <div className="w-[52px] h-0.5 bg-primary mx-auto my-6" />

          {/* Newsletter Subscribe */}
          <div className="mt-8 mb-6">
            {nlStatus === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2.5 text-primary font-semibold text-base py-4"
              >
                <Check className="w-5 h-5" /> You're in. First drop lands Monday.
              </motion.div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="relative group max-w-[480px] mx-auto">
                <div ref={turnstileRef} />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md rounded-xl" />
                <div className="relative flex items-center bg-card/80 backdrop-blur-sm border border-primary/20 focus-within:border-primary/50 transition-all duration-300 rounded-xl">
                  <Mail className="w-4.5 h-4.5 text-muted-foreground ml-4 shrink-0" />
                  <input
                    type="email"
                    value={nlEmail}
                    onChange={(e) => { setNlEmail(e.target.value); setNlStatus("idle"); }}
                    placeholder="you@company.com"
                    className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-sans"
                    disabled={nlStatus === "loading"}
                  />
                  <button
                    type="submit"
                    disabled={nlStatus === "loading"}
                    className="mr-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {nlStatus === "loading" ? "..." : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                {nlStatus === "error" && (
                  <p className="text-destructive text-xs mt-3 font-mono">{nlError}</p>
                )}
              </form>
            )}
            <p className="text-xs text-muted-foreground/60 mt-4">Free forever. One email per week. No spam.</p>
          </div>

          <p className="text-base text-muted-foreground tracking-[0.12em] font-mono">
            Jackye Clayton 👑 × WDIWF
            <span className="mx-2.5 text-border">·</span>
            <span className="italic">"Stop applying. Start aligning."</span>
          </p>
        </div>
      </header>

      {/* Sticky filter nav */}
      <nav className="border-b border-border px-8 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-[1160px] mx-auto py-3">
          <ReceiptsFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sortMode={sortMode}
            onSortChange={setSortMode}
            heatFilter={heatFilter}
            onHeatFilterChange={setHeatFilter}
            biasFilter={biasFilter}
            onBiasFilterChange={setBiasFilter}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          />
        </div>
      </nav>

      {/* How to Read */}
      <HowToRead />

      {/* Main content: single column + sidebar */}
      <div className="max-w-[1160px] mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
        <main>
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          )}

          {/* Featured story */}
          {!isLoading && featuredArticle && <FeaturedReceipt article={featuredArticle} onPosterClick={setLightboxArticle} />}

          {/* Divider */}
          {!isLoading && feedArticles.length > 0 && (
            <div className="flex items-center gap-4 my-10">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-mono">Latest</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Feed */}
          {!isLoading && (
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              key={`${category}-${search}-${sortMode}-${heatFilter}-${biasFilter}-${timeFilter}`}
            >
              {feedArticles.map((article, idx) => (
                <motion.div key={article?.id} variants={stagger.item}>
                  <ReceiptCard article={article} onPosterClick={setLightboxArticle} onRequestEmailCapture={() => setShowEmailCapture(true)} />
                  {(idx + 1) % 5 === 0 && <SpecialEditionCard />}
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-lg py-16">
              No stories match your filters.
            </p>
          )}
        </main>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <ReceiptsSidebar hotArticles={hot5} />
        </div>
      </div>

      {/* Company investigations */}
      <section className="max-w-[1160px] mx-auto px-4 md:px-8 py-16 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-mono uppercase tracking-[0.2em] text-primary">
            Deep Investigations
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STATIC_INVESTIGATIONS.map((inv) => (
            <Link
              key={inv.slug}
              to={`/receipts/${inv.slug}`}
              className="block p-5 bg-card border border-border/40 rounded-xl hover:border-primary/40 hover:shadow-lg active:scale-[0.98] transition-all group receipt-card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{inv.sector}</span>
                <span className="text-sm text-muted-foreground">{inv.date}</span>
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {inv.name}
              </h3>
              <p className="text-base text-muted-foreground mt-1">{inv.headline}</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-bold text-primary">
                Read full report <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-8 text-center">
        <p className="text-sm text-muted-foreground tracking-[0.1em] font-mono">
          The Receipts · <em>by Jackye Clayton 👑 × WDIWF</em>
        </p>
        <p className="text-sm text-muted-foreground mt-2 italic">
          "Every company runs a background check on you. WDIWF runs one on them."
        </p>
        <div className="flex justify-center gap-8 mt-4">
          <Link to="/" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors">
            wdiwf.jackyeclayton.com
          </Link>
          <Link to="/submit-tip" className="text-sm text-muted-foreground tracking-[0.1em] font-mono hover:text-primary transition-colors">
            Submit a tip
          </Link>
        </div>
      </footer>

      {/* Floating Bubble */}
      <FloatingBubble />

      {/* Email Capture Modal */}
      <EmailCaptureModal open={showEmailCapture} onClose={() => setShowEmailCapture(false)} />

      {/* Poster Lightbox */}
      <PosterLightbox article={lightboxArticle} onClose={() => setLightboxArticle(null)} />
    </div>
  );
}
