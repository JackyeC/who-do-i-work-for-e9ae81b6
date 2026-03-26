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
  ExternalLink,
  Users,
  CircleDollarSign,
  AlertTriangle,
  Building,
} from "lucide-react";
import {
  HR_TECH_COMPANIES,
  HR_TECH_CATEGORIES,
  type HRTechCompany,
} from "@/data/transformSponsorsData";

/* ─── animation variants ─── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  },
};

/* ─── icon map ─── */
const iconMap: Record<string, typeof Target> = {
  Target, Cpu, Building2, DollarSign, Gift, HeartPulse, BookOpen, Star,
  Rocket, Scale, BarChart3, Globe, Wallet, Home, Briefcase, Megaphone,
  Link, ShieldCheck, Landmark, Mic,
};

/* ─── COMPANY CARD (with intel expand) ─── */
function CompanyCard({ company }: { company: HRTechCompany }) {
  const [expanded, setExpanded] = useState(false);
  const hasIntel = !!company.intel;

  /* funding type badge color */
  const fundingColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("pe")) return "text-red-400 bg-red-500/10";
    if (t.includes("public")) return "text-amber-400 bg-amber-500/10";
    if (t.includes("vc")) return "text-emerald-400 bg-emerald-500/10";
    if (t.includes("mutual") || t.includes("bootstrap") || t.includes("private"))
      return "text-blue-400 bg-blue-500/10";
    return "text-muted-foreground bg-muted/30";
  };

  return (
    <motion.div variants={stagger.item}>
      <Card
        className={`bg-card border ${
          hasIntel
            ? "border-primary/20 hover:border-primary/40"
            : "border-border hover:border-border/60"
        } transition-colors ${hasIntel ? "cursor-pointer" : ""}`}
        onClick={() => hasIntel && setExpanded(!expanded)}
      >
        <CardContent className="p-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base truncate">
                {company.name}
              </h3>
              <p className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
                {company.category}
              </p>
            </div>
            {company.intel?.fundingType && (
              <Badge
                className={`${fundingColor(company.intel.fundingType)} border-0 text-xs font-mono shrink-0`}
              >
                {company.intel.fundingType.length > 20
                  ? company.intel.fundingType.slice(0, 20) + "…"
                  : company.intel.fundingType}
              </Badge>
            )}
          </div>

          {/* One-liner */}
          {company.intel?.oneLiner && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {company.intel.oneLiner}
            </p>
          )}

          {/* Quick stats row */}
          {company.intel && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {company.intel.ceo && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  <Users className="w-3 h-3 mr-1" />
                  {company.intel.ceo.split(",")[0].split("(")[0].trim().length > 25
                    ? company.intel.ceo.split(",")[0].split("(")[0].trim().slice(0, 25) + "…"
                    : company.intel.ceo.split(",")[0].split("(")[0].trim()}
                </Badge>
              )}
              {company.intel.totalFunding && company.intel.totalFunding !== "N/A" && company.intel.totalFunding !== "$0" && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  <CircleDollarSign className="w-3 h-3 mr-1" />
                  {company.intel.totalFunding}
                </Badge>
              )}
              {company.intel.peOwner && company.intel.peOwner !== "N/A" && company.intel.peOwner !== "None" && (
                <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                  <Building className="w-3 h-3 mr-1" />
                  PE: {company.intel.peOwner.length > 30
                    ? company.intel.peOwner.slice(0, 30) + "…"
                    : company.intel.peOwner}
                </Badge>
              )}
            </div>
          )}

          {/* Expand toggle */}
          {hasIntel && (
            <button
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Full intel
                </>
              )}
            </button>
          )}

          {/* Expanded Intel */}
          {expanded && company.intel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border space-y-3"
            >
              {company.intel.founders && (
                <IntelRow label="Founders" value={company.intel.founders} />
              )}
              {company.intel.keyExecs && (
                <IntelRow label="Key Executives" value={company.intel.keyExecs} />
              )}
              {company.intel.fundingType && (
                <IntelRow
                  label="Funding"
                  value={`${company.intel.fundingType}${
                    company.intel.totalFunding && company.intel.totalFunding !== "N/A"
                      ? ` · ${company.intel.totalFunding}`
                      : ""
                  }${
                    company.intel.latestRound && company.intel.latestRound !== "N/A"
                      ? ` · Latest: ${company.intel.latestRound}`
                      : ""
                  }`}
                />
              )}
              {company.intel.keyInvestors &&
                company.intel.keyInvestors !== "N/A" && (
                  <IntelRow label="Key Investors" value={company.intel.keyInvestors} />
                )}
              {company.intel.peOwner &&
                company.intel.peOwner !== "N/A" &&
                company.intel.peOwner !== "None" && (
                  <IntelRow label="PE Owner" value={company.intel.peOwner} warn />
                )}
              {company.intel.politicalSpending && (
                <IntelRow
                  label="Political Spending"
                  value={company.intel.politicalSpending}
                  warn={
                    !company.intel.politicalSpending
                      .toLowerCase()
                      .includes("no public pac") &&
                    !company.intel.politicalSpending
                      .toLowerCase()
                      .includes("no pac") &&
                    !company.intel.politicalSpending
                      .toLowerCase()
                      .includes("none found")
                  }
                />
              )}
              {company.intel.lobbying &&
                !company.intel.lobbying.toLowerCase().includes("no lobbying") &&
                !company.intel.lobbying.toLowerCase().includes("none found") && (
                  <IntelRow label="Lobbying" value={company.intel.lobbying} warn />
                )}
              {company.intel.whoTheySupport &&
                !company.intel.whoTheySupport.toLowerCase().includes("no affiliations") &&
                !company.intel.whoTheySupport.toLowerCase().includes("no specific") &&
                !company.intel.whoTheySupport.toLowerCase().includes("none found") && (
                  <IntelRow label="Who They Support" value={company.intel.whoTheySupport} />
                )}
              {company.intel.redFlags &&
                !company.intel.redFlags.toLowerCase().includes("none found") &&
                !company.intel.redFlags.toLowerCase().includes("no red flags") &&
                !company.intel.redFlags.toLowerCase().includes("no major") && (
                  <IntelRow label="Red Flags" value={company.intel.redFlags} warn />
                )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Intel Row ─── */
function IntelRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-mono uppercase tracking-wider mb-1 ${
          warn ? "text-red-400/70" : "text-primary/70"
        }`}
      >
        {warn && <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />}
        {label}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
    </div>
  );
}

/* ─── Simple chip for non-intel companies ─── */
function CompanyChip({ company }: { company: HRTechCompany }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-background/50 border border-border text-muted-foreground">
      {company.name}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   HR TECH VENDOR DIRECTORY
   ═══════════════════════════════════════════════════════ */
export default function HRTechVendorDirectory() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAllInCategory, setShowAllInCategory] = useState<Set<string>>(
    new Set()
  );

  const total = HR_TECH_COMPANIES.length;
  const withIntel = HR_TECH_COMPANIES.filter((c) => c.intel).length;

  const filtered = useMemo(() => {
    return HR_TECH_COMPANIES.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase()) ||
        (c.intel?.oneLiner || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.intel?.ceo || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.intel?.keyInvestors || "").toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        activeCategory === "All" || c.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCategory]);

  /* Split into intel cards and basic chips per category */
  const groupedByCategory = useMemo(() => {
    const groups: Record<
      string,
      { withIntel: HRTechCompany[]; basic: HRTechCompany[] }
    > = {};
    for (const company of filtered) {
      if (!groups[company.category])
        groups[company.category] = { withIntel: [], basic: [] };
      if (company.intel) {
        groups[company.category].withIntel.push(company);
      } else {
        groups[company.category].basic.push(company);
      }
    }
    return groups;
  }, [filtered]);

  const categoryNames = Object.keys(HR_TECH_CATEGORIES);

  const toggleShowAll = (cat: string) => {
    setShowAllInCategory((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <>
      {/* Stats */}
      <div className="flex flex-wrap gap-6 mb-8 text-sm text-muted-foreground">
        <span>
          <span className="text-lg font-bold font-mono text-primary">{total}</span>{" "}
          companies tracked
        </span>
        <span>
          <span className="text-lg font-bold font-mono text-primary">{withIntel}</span>{" "}
          with full intel
        </span>
        <span>
          <span className="text-lg font-bold font-mono text-primary">
            {Object.keys(HR_TECH_CATEGORIES).length}
          </span>{" "}
          categories
        </span>
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
          const group = groupedByCategory[cat];
          const count = group
            ? group.withIntel.length + group.basic.length
            : 0;
          if (count === 0 && activeCategory !== cat) return null;
          const CatIcon = iconMap[HR_TECH_CATEGORIES[cat]?.icon] || Target;
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

      {/* Directory by Category */}
      {Object.entries(groupedByCategory)
        .sort(
          ([a], [b]) => categoryNames.indexOf(a) - categoryNames.indexOf(b)
        )
        .map(([cat, group]) => {
          const catMeta = HR_TECH_CATEGORIES[cat];
          const CatIcon = iconMap[catMeta?.icon] || Target;
          const totalInCat = group.withIntel.length + group.basic.length;
          const isExpanded = showAllInCategory.has(cat);

          return (
            <div key={cat} className="mb-12">
              {/* Category Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <CatIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{cat}</h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {totalInCat}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                {catMeta?.desc}
              </p>

              {/* Intel Cards (full profiles) */}
              {group.withIntel.length > 0 && (
                <motion.div
                  variants={stagger.container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-50px" }}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4"
                >
                  {group.withIntel.map((company) => (
                    <CompanyCard key={company.name} company={company} />
                  ))}
                </motion.div>
              )}

              {/* Basic chips (no intel yet) */}
              {group.basic.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
                    Also in this category
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(isExpanded ? group.basic : group.basic.slice(0, 20)).map(
                      (company) => (
                        <CompanyChip key={company.name} company={company} />
                      )
                    )}
                  </div>
                  {group.basic.length > 20 && (
                    <button
                      onClick={() => toggleShowAll(cat)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Show all{" "}
                          {group.basic.length}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No companies match your search.
          </p>
        </div>
      )}
    </>
  );
}
