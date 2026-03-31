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
  const [lightboxArticle, setLightboxArticle] = useState<ReceiptArticle | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const filtered = useMemo(() => {
    if (!articles) return [];
    let result = articles.filter((a) => {
      const matchCategory = category === "all" || a.category === category;
      const matchHeat = heatFilter === null || a.spice_level === heatFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.headline.toLowerCase().includes(q) ||
        (a.source_name?.toLowerCase().includes(q) ?? false) ||
        (a.category?.toLowerCase().includes(q) ?? false) ||
        a.jackye_take.toLowerCase().includes(q) ||
        a.receipt_connection.toLowerCase().includes(q);
      return matchCategory && matchHeat && matchSearch;
    });

    switch (sortMode) {
      case "newest":
        result = [...result].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
        break;
      case "hottest":
        result = [...result].sort((a, b) => b.spice_level - a.spice_level);
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
  }, [articles, search, category, sortMode, heatFilter]);

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
      <header className="border-b border-border py-11 px-8 text-center">
        <div className="max-w-[780px] mx-auto">
          <p className="text-sm uppercase tracking-[0.55em] text-primary mb-3.5 font-mono">
            JRC EDIT × WDIWF
          </p>
          <h1
            className="font-black text-foreground leading-none uppercase"
            style={{ fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            The Receipts
          </h1>
          <p
            className="font-light text-muted-foreground italic mt-3"
            style={{ fontSize: "clamp(18px, 2.2vw, 26px)" }}
          >
            The world of work. Documented.
          </p>
          <p
            className="font-medium text-foreground mt-2.5 opacity-80"
            style={{ fontSize: "clamp(15px, 1.6vw, 19px)" }}
          >
            I pull the receipts so you don't have to.{" "}
            <span className="text-primary">They always leave something out.</span>
          </p>
          <div className="w-[52px] h-0.5 bg-primary mx-auto my-5" />
          <p className="text-sm text-muted-foreground tracking-[0.12em] font-mono">
            Jackye Clayton 👑 × WDIWF
            <span className="mx-2.5 text-border">·</span>
            <span className="italic">"Stop applying. Start aligning."</span>
          </p>
        </div>
      </header>

      {/* Sticky filter nav */}
      <nav className="border-b border-border px-8 sticky top-0 bg-background z-20">
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
          />
        </div>
      </nav>

      {/* How to Read */}
      <HowToRead />

      {/* Main content: single column + sidebar */}
      <div className="max-w-[1160px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
        <main>
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          )}

          {/* Featured story */}
          {!isLoading && featuredArticle && <FeaturedReceipt article={featuredArticle} onPosterClick={setLightboxArticle} onRequestEmailCapture={() => setShowEmailCapture(true)} />}

          {/* Divider */}
          {!isLoading && feedArticles.length > 0 && (
            <div className="flex items-center gap-4 my-9">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-mono">Latest</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Feed — single column with Special Edition interstitials */}
          {!isLoading && (
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              key={`${category}-${search}-${sortMode}-${heatFilter}`}
            >
              {feedArticles.map((article, idx) => (
                <motion.div key={article?.id} variants={stagger.item}>
                  <ReceiptCard article={article} onPosterClick={setLightboxArticle} onRequestEmailCapture={() => setShowEmailCapture(true)} />
                  {/* Special Edition interstitial every 5th card */}
                  {(idx + 1) % 5 === 0 && <SpecialEditionCard />}
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No stories match your filters.
            </p>
          )}
        </main>

        {/* Sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          <ReceiptsSidebar hotArticles={hot5} />
        </div>
      </div>

      {/* Company investigations section */}
      <section className="max-w-[1160px] mx-auto px-8 py-16 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
            Deep Investigations
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STATIC_INVESTIGATIONS.map((inv) => (
            <Link
              key={inv.slug}
              to={`/receipts/${inv.slug}`}
              className="block p-4 bg-card border border-border/40 rounded-xl hover:border-primary/40 transition-all group receipt-card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{inv.sector}</span>
                <span className="text-xs text-muted-foreground">{inv.date}</span>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {inv.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{inv.headline}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                Read full report <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-8 text-center">
        <p className="text-xs text-muted-foreground tracking-[0.1em] font-mono">
          The Receipts · <em>by Jackye Clayton 👑 × WDIWF</em>
        </p>
        <p className="text-[10px] text-muted-foreground mt-1.5 italic">
          "Every company runs a background check on you. WDIWF runs one on them."
        </p>
        <div className="flex justify-center gap-8 mt-4">
          <Link to="/" className="text-[10px] text-muted-foreground tracking-[0.1em] font-mono hover:text-primary">
            wdiwf.jackyeclayton.com
          </Link>
          <Link to="/submit-tip" className="text-[10px] text-muted-foreground tracking-[0.1em] font-mono hover:text-primary">
            Submit a tip
          </Link>
        </div>
        <div className="mt-4">
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "hsl(var(--muted-foreground))", fontWeight: 300, opacity: 0.5 }}>
            JRC EDIT
          </span>
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
