import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search, Shield, ShieldCheck, AlertTriangle, Briefcase, ChevronDown, ArrowRight, Building2, PenLine,
} from "lucide-react";

// ── Types ──
interface SampleOrg {
  id: string;
  name: string;
  initial: string;
  color: string;
  mission: string;
  categories: string[];
  realityCheckScore: number;
  verified: ("b-corp" | "501c3" | "mission-verified")[];
  orgType: string;
  location: string;
  size: string;
  openRoles: number;
  narrativeGap: boolean;
}

// ── Constants ──
const MISSION_CATEGORIES = [
  "Climate", "Health Equity", "Education", "Civic/Policy", "Veterans",
  "Faith-Based", "Community/Social", "Economic Justice", "LGBTQ Rights",
  "Disability Rights", "Rural Development", "Other",
] as const;

const ORG_TYPES = ["All", "Nonprofit", "B Corp", "Social Enterprise", "For-Purpose"] as const;
const LOCATIONS = ["All", "Remote-friendly", "Northeast", "Southeast", "Midwest", "West"] as const;
const SIZES = ["All", "Under 50", "50-200", "200-1000", "1000+"] as const;

// ── Sample data ──
const SAMPLE_ORGS: SampleOrg[] = [
  {
    id: "1", name: "GreenGrid Energy", initial: "G", color: "hsl(var(--civic-green))",
    mission: "Accelerating equitable access to clean energy in underserved communities.",
    categories: ["Climate", "Economic Justice"], realityCheckScore: 88,
    verified: ["b-corp", "mission-verified"], orgType: "B Corp", location: "Remote-friendly",
    size: "50-200", openRoles: 4, narrativeGap: false,
  },
  {
    id: "2", name: "Pathways Health Alliance", initial: "P", color: "hsl(var(--civic-blue))",
    mission: "Closing the health equity gap through community-based primary care.",
    categories: ["Health Equity", "Community/Social"], realityCheckScore: 76,
    verified: ["501c3", "mission-verified"], orgType: "Nonprofit", location: "Southeast",
    size: "200-1000", openRoles: 12, narrativeGap: false,
  },
  {
    id: "3", name: "VetBridge", initial: "V", color: "hsl(var(--primary))",
    mission: "Connecting transitioning service members with mission-aligned employers.",
    categories: ["Veterans", "Education"], realityCheckScore: 82,
    verified: ["501c3"], orgType: "Nonprofit", location: "Midwest",
    size: "Under 50", openRoles: 2, narrativeGap: false,
  },
  {
    id: "4", name: "EqualFuture Labs", initial: "E", color: "hsl(var(--civic-red))",
    mission: "Building accessible technology for people with disabilities — by people with disabilities.",
    categories: ["Disability Rights", "Education"], realityCheckScore: 91,
    verified: ["b-corp", "mission-verified"], orgType: "Social Enterprise", location: "West",
    size: "Under 50", openRoles: 3, narrativeGap: false,
  },
  {
    id: "5", name: "Civic Compass", initial: "C", color: "hsl(var(--civic-gold))",
    mission: "Making local policy data actionable for everyday voters.",
    categories: ["Civic/Policy"], realityCheckScore: 72,
    verified: ["mission-verified"], orgType: "For-Purpose", location: "Remote-friendly",
    size: "Under 50", openRoles: 1, narrativeGap: false,
  },
  {
    id: "6", name: "Rooted Harvest", initial: "R", color: "hsl(var(--civic-green))",
    mission: "Revitalizing rural food systems through cooperative agriculture.",
    categories: ["Rural Development", "Economic Justice", "Climate"], realityCheckScore: 65,
    verified: ["501c3"], orgType: "Nonprofit", location: "Midwest",
    size: "50-200", openRoles: 6, narrativeGap: true,
  },
  {
    id: "7", name: "PrideWorks Collective", initial: "P", color: "hsl(var(--civic-blue))",
    mission: "Creating safe, affirming workplaces through employer certification and training.",
    categories: ["LGBTQ Rights", "Community/Social"], realityCheckScore: 85,
    verified: ["mission-verified"], orgType: "Social Enterprise", location: "Northeast",
    size: "Under 50", openRoles: 0, narrativeGap: false,
  },
  {
    id: "8", name: "LightHouse Learning", initial: "L", color: "hsl(var(--primary))",
    mission: "Delivering free K-12 tutoring in faith communities across 14 states.",
    categories: ["Faith-Based", "Education"], realityCheckScore: 47,
    verified: ["501c3"], orgType: "Nonprofit", location: "Southeast",
    size: "1000+", openRoles: 22, narrativeGap: true,
  },
];

// ── Helpers ──
function scoreColor(score: number) {
  if (score >= 70) return "text-civic-green";
  if (score >= 50) return "text-civic-yellow";
  return "text-civic-red";
}
function scoreBg(score: number) {
  if (score >= 70) return "bg-civic-green/10";
  if (score >= 50) return "bg-civic-yellow/10";
  return "bg-civic-red/10";
}

function verificationLabel(v: string) {
  if (v === "b-corp") return "B Corp";
  if (v === "501c3") return "501(c)(3)";
  return "Mission Verified";
}

// ── Component ──
export default function Companies() {
  usePageSEO({
    title: "Mission-Driven Organizations",
    description: "Browse verified mission-driven organizations. No bias. Just receipts.",
    path: "/companies",
  });

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [orgType, setOrgType] = useState("All");
  const [location, setLocation] = useState("All");
  const [size, setSize] = useState("All");

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filtered = useMemo(() => {
    return SAMPLE_ORGS.filter((org) => {
      if (search && !org.name.toLowerCase().includes(search.toLowerCase()) && !org.mission.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategories.length > 0 && !selectedCategories.some((c) => org.categories.includes(c))) return false;
      if (verifiedOnly && org.verified.length === 0) return false;
      if (orgType !== "All" && org.orgType !== orgType) return false;
      if (location !== "All" && org.location !== location) return false;
      if (size !== "All" && org.size !== size) return false;
      return true;
    });
  }, [search, selectedCategories, verifiedOnly, orgType, location, size]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-24 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Organizations walking the talk.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg"
          >
            Every org here has been verified against public data. No bias. Just receipts.
          </motion.p>
        </div>
      </section>

      {/* Claim CTA */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <Link to="/for-employers">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.04] flex items-center gap-3 hover:border-primary/40 transition-colors">
              <PenLine className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Is your organization here? Claim your profile.</p>
                <p className="text-xs text-muted-foreground">Verify your mission data and reach aligned talent.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary shrink-0" />
            </div>
          </Link>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations or mission keywords…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {/* Mission Category multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Mission Category
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{selectedCategories.length}</Badge>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="grid grid-cols-1 gap-2">
                  {MISSION_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Verified toggle */}
            <Button
              variant={verifiedOnly ? "default" : "outline"} size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
            >
              <ShieldCheck className="w-3 h-3" />
              Verified Only
            </Button>

            {/* Org Type */}
            <Select value={orgType} onValueChange={setOrgType}>
              <SelectTrigger className="w-auto h-9 text-xs gap-1 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t === "All" ? "All Types" : t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-auto h-9 text-xs gap-1 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l === "All" ? "All Locations" : l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Size */}
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-auto h-9 text-xs gap-1 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "All" ? "All Sizes" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground mb-4">{filtered.length} organization{filtered.length !== 1 ? "s" : ""} found</p>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No organizations match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((org, i) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                >
                  <Card className="h-full hover:border-primary/30 transition-all group">
                    <CardContent className="p-5 flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                          style={{ backgroundColor: org.color, color: "hsl(var(--background))" }}
                        >
                          {org.initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">
                            {org.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{org.mission}</p>
                        </div>
                      </div>

                      {/* Category tags */}
                      <div className="flex flex-wrap gap-1">
                        {org.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">{cat}</Badge>
                        ))}
                      </div>

                      {/* Scores & badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Reality Check Score */}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${scoreBg(org.realityCheckScore)} ${scoreColor(org.realityCheckScore)}`}>
                          {org.realityCheckScore}/100
                        </span>

                        {/* Verification badges */}
                        {org.verified.map((v) => (
                          <span key={v} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Shield className="w-3 h-3 text-civic-green" />
                            {verificationLabel(v)}
                          </span>
                        ))}

                        {/* Narrative gap */}
                        {org.narrativeGap && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-civic-yellow">
                            <AlertTriangle className="w-3 h-3" />
                            Narrative Gap
                          </span>
                        )}
                      </div>

                      {/* Open roles */}
                      {org.openRoles > 0 ? (
                        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs mt-auto">
                          <Briefcase className="w-3 h-3" />
                          Open Roles: {org.openRoles}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="w-full text-xs mt-auto opacity-50" disabled>
                          No open roles
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Neutrality note */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Listings are based on publicly available data. WDIWF does not endorse any organization.
            Verification reflects data consistency, not a value judgment. <Link to="/methodology" className="text-primary hover:underline">See methodology →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
