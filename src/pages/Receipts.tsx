import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceiptsFeed } from "@/hooks/use-receipts-feed";
import { ReceiptsFilters } from "@/components/receipts/ReceiptsFilters";
import { FeaturedReceipt } from "@/components/receipts/FeaturedReceipt";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { WorkNewsTicker } from "@/components/news/WorkNewsTicker";
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
    title: "The Receipts — Live Work Intelligence Feed",
    description: "Live editorial work-intelligence feed. Every story summarized, Jackye's take included, and a useful action attached. No spin. No rankings. Just receipts.",
    path: "/receipts",
    jsonLd: {
      "@type": "CollectionPage",
      name: "The Receipts",
      description: "Live editorial work-intelligence feed by Jackye Clayton.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
      provider: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const { data: articles, isLoading } = useReceiptsFeed();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<ReceiptSortMode>("newest");
  const [heatFilter, setHeatFilter] = useState<number | null>(null);

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
        result = [...result].sort((a, b) =>
          new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
        );
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
        // Default: newest
        result = [...result].sort((a, b) =>
          new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
        );
    }

    return result;
  }, [articles, search, category, sortMode, heatFilter]);

  const featuredArticle = filtered[0];
  const feedArticles = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Live Ticker */}
      <WorkNewsTicker />

      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-4 max-w-3xl mx-auto">
        <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
          The Receipts
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
          No spin. No rankings.
          <br />
          <span className="text-primary">Just receipts.</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-2 max-w-2xl mx-auto">
          Live work-intelligence feed. Every story summarized, Jackye's take included,
          and a useful action attached. Updated every 2 hours.
        </p>
        <p className="font-mono text-muted-foreground text-xs">
          {articles?.length ?? 0} stories tracked · Powered by GDELT, BLS, FEC & public records
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
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

      {/* Loading */}
      {isLoading && (
        <div className="max-w-5xl mx-auto px-4 space-y-4">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[500px] w-full rounded-xl" />)}
          </div>
        </div>
      )}

      {/* Featured + Feed */}
      {!isLoading && (
        <div className="max-w-5xl mx-auto px-4">
          {/* Featured story */}
          {featuredArticle && <FeaturedReceipt article={featuredArticle} />}

          {/* Feed grid */}
          <motion.div
            className="grid gap-4 md:grid-cols-2"
            variants={stagger.container}
            initial="hidden"
            animate="show"
            key={`${category}-${search}-${sortMode}-${heatFilter}`}
          >
            {feedArticles.map((article) => (
              <motion.div key={article.id} variants={stagger.item}>
                <ReceiptCard article={article} />
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No stories match your filters.
            </p>
          )}
        </div>
      )}

      {/* Company investigations section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
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
              className="block p-4 bg-card border border-border/40 rounded-xl hover:border-primary/40 transition-all group"
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
      <footer className="max-w-3xl mx-auto px-4 pb-12 text-center space-y-3">
        <Link
          to="/submit-tip"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Know something? Submit a tip anonymously →
        </Link>
        <p className="text-xs text-muted-foreground">
          Created by Jackye Clayton · WDIWF
        </p>
      </footer>
    </div>
  );
}
