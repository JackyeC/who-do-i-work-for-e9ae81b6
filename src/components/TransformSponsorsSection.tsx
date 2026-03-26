import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Target,
  Cpu,
  Building2,
  DollarSign,
  Gift,
  HeartPulse,
  BookOpen,
  Star,
  Rocket,
  Scale,
  BarChart3,
  Globe,
  Wallet,
  Home,
  Briefcase,
  Megaphone,
  Link,
  ShieldCheck,
  Landmark,
  Mic,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  TRANSFORM_SPONSORS,
  TRANSFORM_CATEGORIES,
  type TransformSponsor,
} from "@/data/transformSponsorsData";

/* ─── animation variants ─── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  },
};

/* ─── icon map ─── */
const iconMap: Record<string, typeof Target> = {
  Target,
  Cpu,
  Building2,
  DollarSign,
  Gift,
  HeartPulse,
  BookOpen,
  Star,
  Rocket,
  Scale,
  BarChart3,
  Globe,
  Wallet,
  Home,
  Briefcase,
  Megaphone,
  Link,
  ShieldCheck,
  Landmark,
  Mic,
};

/* ─── tier config ─── */
const tierConfig: Record<string, { bg: string; text: string }> = {
  Title: { bg: "bg-primary", text: "text-primary-foreground" },
  Gold: { bg: "bg-amber-600", text: "text-white" },
  Silver: { bg: "bg-zinc-400", text: "text-zinc-900" },
  Bronze: { bg: "bg-orange-700", text: "text-white" },
};

/* ─── CATEGORY CARD ─── */
function CategoryCard({
  name,
  companies,
}: {
  name: string;
  companies: TransformSponsor[];
}) {
  const [expanded, setExpanded] = useState(false);
  const catMeta = TRANSFORM_CATEGORIES[name];
  const Icon = iconMap[catMeta?.icon] || Target;
  const displayCompanies = expanded ? companies : companies.slice(0, 12);
  const hasMore = companies.length > 12;

  return (
    <motion.div variants={stagger.item}>
      <Card className="bg-card border border-border hover:border-primary/30 transition-colors h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground text-sm">{name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {catMeta?.desc}
          </p>
          <p className="text-xs font-mono text-primary/80 uppercase tracking-wider mb-3">
            {companies.length} companies
          </p>

          {/* Company Chips */}
          <div className="flex flex-wrap gap-1.5">
            {displayCompanies.map((company) => (
              <span
                key={company.name}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  company.tier
                    ? "bg-card border border-primary/20 text-foreground/80"
                    : "bg-background/50 border border-border text-muted-foreground"
                }`}
              >
                {/* Year dots */}
                {company.years.map((y) => (
                  <span
                    key={y}
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      y === "2025" ? "bg-[#e8ff47]" : "bg-[#40c0f0]"
                    }`}
                  />
                ))}
                {company.name}
                {company.tier && (
                  <Badge
                    className={`${tierConfig[company.tier]?.bg} ${
                      tierConfig[company.tier]?.text
                    } border-0 text-[9px] font-mono px-1 py-0 h-3.5 leading-none`}
                  >
                    {company.tier.toUpperCase()}
                  </Badge>
                )}
              </span>
            ))}
          </div>

          {/* Expand/Collapse */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-3"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Show all {companies.length}
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SECTION COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function TransformSponsorsSection() {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<"All" | "2025" | "2026">("All");
  const [activeCategory, setActiveCategory] = useState("All");

  const total = TRANSFORM_SPONSORS.length;
  const bothYears = TRANSFORM_SPONSORS.filter((c) => c.years.length === 2).length;
  const newIn2026 = TRANSFORM_SPONSORS.filter(
    (c) => c.years.length === 1 && c.years[0] === "2026"
  ).length;

  const filtered = useMemo(() => {
    return TRANSFORM_SPONSORS.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase());
      const matchesYear =
        yearFilter === "All" || c.years.includes(yearFilter);
      const matchesCat =
        activeCategory === "All" || c.category === activeCategory;
      return matchesSearch && matchesYear && matchesCat;
    });
  }, [search, yearFilter, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, TransformSponsor[]> = {};
    for (const company of filtered) {
      if (!groups[company.category]) groups[company.category] = [];
      groups[company.category].push(company);
    }
    return groups;
  }, [filtered]);

  const categoryNames = Object.keys(TRANSFORM_CATEGORIES);

  return (
    <section className="py-16 px-4 border-t border-border" id="transform-directory">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="tracking-[0.2em] text-primary font-mono uppercase text-sm mb-3">
            HR Tech Intelligence
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Transform 2025 & 2026{" "}
            <span className="text-primary">Sponsor Directory</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Every sponsor, exhibitor, and partner from Transform 2025 and 2026 —
            categorized by what they actually do. {total} companies shaping the
            HR tech landscape, tracked and organized by WDIWF.
          </p>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-10"
        >
          {[
            { label: "Total Companies", value: total },
            { label: "HR Categories", value: Object.keys(TRANSFORM_CATEGORIES).length },
            { label: "Both Years", value: bothYears },
            { label: "New in 2026", value: newIn2026 },
          ].map((stat) => (
            <motion.div key={stat.label} variants={stagger.item}>
              <Card className="bg-card border border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl md:text-3xl font-bold font-mono text-primary tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#e8ff47]" /> 2025
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#40c0f0]" /> 2026
          </span>
          <Badge className="bg-primary text-primary-foreground border-0 text-[9px] font-mono px-1.5">
            TITLE
          </Badge>
          <Badge className="bg-amber-600 text-white border-0 text-[9px] font-mono px-1.5">
            GOLD
          </Badge>
          <Badge className="bg-zinc-400 text-zinc-900 border-0 text-[9px] font-mono px-1.5">
            SILVER
          </Badge>
          <Badge className="bg-orange-700 text-white border-0 text-[9px] font-mono px-1.5">
            BRONZE
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${total} companies...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Year Filter */}
        <div className="flex gap-2 mb-4">
          {(["All", "2025", "2026"] as const).map((year) => (
            <Button
              key={year}
              variant={yearFilter === year ? "default" : "outline"}
              size="sm"
              onClick={() => setYearFilter(year)}
              className={
                yearFilter === year
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-card"
              }
            >
              {year === "All" ? `All Years (${total})` : `Transform ${year}`}
            </Button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeCategory === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("All")}
            className={
              activeCategory === "All"
                ? "bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-card"
            }
          >
            All ({filtered.length})
          </Button>
          {categoryNames.map((cat) => {
            const count = groupedByCategory[cat]?.length || 0;
            if (count === 0 && activeCategory !== cat) return null;
            const CatIcon = iconMap[TRANSFORM_CATEGORIES[cat]?.icon] || Target;
            const shortName = cat.split(" & ")[0].split(" / ")[0];
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-card"
                }
              >
                <CatIcon className="w-3 h-3 mr-1" />
                {shortName} ({count})
              </Button>
            );
          })}
        </div>

        {/* Category Cards Grid */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Object.entries(groupedByCategory)
            .sort(([a], [b]) => categoryNames.indexOf(a) - categoryNames.indexOf(b))
            .map(([cat, companies]) => (
              <CategoryCard key={cat} name={cat} companies={companies} />
            ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No companies match your search.</p>
          </div>
        )}

        {/* Source Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data compiled from{" "}
            <a
              href="https://register.transform.us/2025/sponsors-2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
            >
              Transform 2025
            </a>{" "}
            and{" "}
            <a
              href="https://transform.us/conference/sponsors-2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary underline-offset-2 hover:underline"
            >
              Transform 2026
            </a>{" "}
            · Updated March 2026
            <br />
            Categorized by WDIWF · This is not an endorsement — it's intelligence.
          </p>
        </div>
      </div>
    </section>
  );
}
