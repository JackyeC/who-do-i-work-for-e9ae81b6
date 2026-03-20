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
import { Slider } from "@/components/ui/slider";
import {
  Search, Shield, ShieldCheck, AlertTriangle, Briefcase, ChevronDown, ArrowRight, Building2, PenLine, MessageSquareQuote,
} from "lucide-react";

// ── Types ──
interface ScoreEntry {
  label: string;
  value: number;
}

interface SampleOrg {
  id: string;
  name: string;
  initial: string;
  color: string;
  mission: string;
  categories: string[];
  scores: ScoreEntry[];
  confidence: "High" | "Medium" | "Low";
  legalStatus: "B Corp" | "Public Benefit Corp" | "501(c)(3)" | "For-Purpose" | "For-Profit" | "Co-op";
  verified: ("b-corp" | "501c3" | "mission-verified")[];
  location: string;
  size: string;
  openRoles: number;
  narrativeGap: boolean;
  signals: string[];
  jackyeTake: string;
}

// ── Constants ──
const MISSION_CATEGORIES = [
  "Climate", "Health Equity", "Education", "Civic/Policy", "Veterans",
  "Faith-Based", "Community/Social", "Economic Justice", "LGBTQ Rights",
  "Disability Rights", "Rural Development", "Sustainability", "Food/Agriculture",
  "Tech/AI", "Retail/Food", "Animal Welfare", "Retail/Outdoor", "Retail",
  "Fashion", "EdTech", "International Development", "Other",
] as const;

const LEGAL_STATUSES = ["All", "B Corp", "Public Benefit Corp", "501(c)(3)", "For-Purpose", "For-Profit", "Co-op"] as const;
const LOCATIONS = ["All", "Remote-friendly", "National", "Texas", "Northeast", "Southeast", "Midwest", "West"] as const;
const SIZES = ["All", "Under 50", "50-200", "200-1000", "1000+"] as const;

// ── Seed Data — 12 Integrity Companies ──
const SEED_ORGS: SampleOrg[] = [
  {
    id: "seed-1", name: "Patagonia", initial: "P", color: "hsl(var(--civic-green))",
    mission: "Build the best product, cause no unnecessary harm, use business to inspire and implement solutions to the environmental crisis.",
    categories: ["Sustainability", "Climate"],
    scores: [{ label: "Mission", value: 5.0 }, { label: "Work-life", value: 4.2 }, { label: "Compensation", value: 3.8 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "West", size: "1000+", openRoles: 8, narrativeGap: false,
    signals: ["Donates 1% of revenue to environmental causes", "Employee-led activism encouraged", "Below-market salaries with strong benefits and purpose premium"],
    jackyeTake: "Patagonia walks it. The pay gap versus tech is real, but the people who stay do so because the mission isn't marketing — it's operations. If you need top-dollar comp, look elsewhere. If you need meaning baked into every sprint, this is it.",
  },
  {
    id: "seed-2", name: "Vital Farms", initial: "V", color: "hsl(var(--civic-green))",
    mission: "Bringing ethical food to the table through pasture-raised standards and stakeholder capitalism.",
    categories: ["Food/Agriculture"],
    scores: [{ label: "Mission", value: 4.8 }, { label: "Culture", value: 4.5 }, { label: "Growth", value: 3.9 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Remote-friendly", size: "200-1000", openRoles: 5, narrativeGap: false,
    signals: ["Pasture-raised standards independently audited", "Employee ownership program", "Strong Glassdoor trajectory"],
    jackyeTake: "A genuine B Corp success story. Growth is steady but not explosive — that's by design. The ownership program is a real differentiator for retention. Watch for scaling pressures as they expand retail partnerships.",
  },
  {
    id: "seed-3", name: "NVIDIA", initial: "N", color: "hsl(var(--primary))",
    mission: "Pioneering accelerated computing to solve the world's most complex computational challenges.",
    categories: ["Tech/AI"],
    scores: [{ label: "Innovation", value: 5.0 }, { label: "Growth", value: 4.9 }, { label: "Work-life", value: 3.2 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "West", size: "1000+", openRoles: 142, narrativeGap: false,
    signals: ["Top AI research investment globally", "Fast-paced, high-performance culture", "Work-life balance consistently flagged in reviews"],
    jackyeTake: "The innovation is undeniable, and the stock has made millionaires. But the intensity is real. If you thrive under pressure and want to be at the center of AI, this is the place. If you need boundaries, know what you're signing up for.",
  },
  {
    id: "seed-4", name: "H-E-B", initial: "H", color: "hsl(var(--civic-blue))",
    mission: "Serving Texas communities with quality products and genuine care for people.",
    categories: ["Retail/Food", "Community/Social"],
    scores: [{ label: "Culture", value: 4.8 }, { label: "Stability", value: 5.0 }, { label: "Mission", value: 4.0 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "Texas", size: "1000+", openRoles: 67, narrativeGap: false,
    signals: ["Legendary community response during disasters", "Employee-first culture documented over decades", "Limited geographic reach — Texas-based"],
    jackyeTake: "H-E-B doesn't market its culture — Texans just know. The disaster response isn't PR, it's DNA. The limitation is geography: if you're not in Texas, this isn't for you. But if you are, few retailers come close.",
  },
  {
    id: "seed-5", name: "Best Friends Animal Society", initial: "B", color: "hsl(var(--civic-gold))",
    mission: "Leading the no-kill movement to save the lives of homeless pets across America.",
    categories: ["Animal Welfare", "Community/Social"],
    scores: [{ label: "Mission", value: 5.0 }, { label: "Compensation", value: 3.2 }, { label: "Culture", value: 4.6 }],
    confidence: "High", legalStatus: "501(c)(3)",
    verified: ["501c3", "mission-verified"], location: "National", size: "1000+", openRoles: 14, narrativeGap: false,
    signals: ["No-kill animal shelter mission with measurable outcomes", "High mission-passion culture", "Nonprofit compensation trade-off"],
    jackyeTake: "The passion here is palpable — people don't just work here, they believe. Compensation reflects the nonprofit reality, and that's an honest trade-off. If animal welfare is your calling, the culture will carry you. If you need market-rate pay, it won't.",
  },
  {
    id: "seed-6", name: "REI Co-op", initial: "R", color: "hsl(var(--civic-green))",
    mission: "Inspiring, educating, and outfitting for a lifetime of outdoor adventure and stewardship.",
    categories: ["Retail/Outdoor", "Sustainability"],
    scores: [{ label: "Culture", value: 4.7 }, { label: "Work-life", value: 4.5 }, { label: "Innovation", value: 3.8 }],
    confidence: "High", legalStatus: "Co-op",
    verified: ["mission-verified"], location: "National", size: "1000+", openRoles: 23, narrativeGap: false,
    signals: ["Employee-owned cooperative structure", "Closes on Black Friday as values statement", "Growth slower than investor-backed competitors"],
    jackyeTake: "The co-op model is real and it shows in how employees are treated. Closing on Black Friday isn't a stunt — they've done it for years. Innovation pace is slower because they're not chasing quarterly earnings. That's a feature, not a bug.",
  },
  {
    id: "seed-7", name: "Costco", initial: "C", color: "hsl(var(--civic-blue))",
    mission: "Providing quality goods at the lowest possible prices while taking care of employees and members.",
    categories: ["Retail"],
    scores: [{ label: "Stability", value: 5.0 }, { label: "Compensation", value: 4.6 }, { label: "Mission", value: 3.5 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "National", size: "1000+", openRoles: 89, narrativeGap: false,
    signals: ["Highest retail wages in sector consistently", "Low executive pay ratio vs frontline workers", "Mission not explicitly stated but behavior consistent"],
    jackyeTake: "Costco proves you don't need a mission statement to have a mission. The pay, the benefits, the retention rates — the data speaks louder than any careers page. The work itself is retail, so calibrate expectations, but the employer behind it is exceptional.",
  },
  {
    id: "seed-8", name: "Teach For America", initial: "T", color: "hsl(var(--primary))",
    mission: "Enlisting, developing, and mobilizing leaders to strengthen the movement for educational equity.",
    categories: ["Education"],
    scores: [{ label: "Mission", value: 4.5 }, { label: "Work-life", value: 3.0 }, { label: "Growth", value: 4.2 }],
    confidence: "Medium", legalStatus: "501(c)(3)",
    verified: ["501c3", "mission-verified"], location: "National", size: "1000+", openRoles: 31, narrativeGap: true,
    signals: ["Clear educational equity mission", "High-intensity culture with burnout risk", "Strong alumni network and career development"],
    jackyeTake: "TFA is a launchpad, not a landing pad. The alumni network is genuinely powerful and the mission is real. But the burnout rate is documented and the 2-year commitment is intense. Go in with eyes open and an exit plan, and it can be transformative.",
  },
  {
    id: "seed-9", name: "Salesforce", initial: "S", color: "hsl(var(--civic-blue))",
    mission: "Improving the state of the world through business as a platform for change.",
    categories: ["Tech/AI", "Community/Social"],
    scores: [{ label: "Inclusion", value: 4.8 }, { label: "Growth", value: 4.5 }, { label: "Work-life", value: 3.6 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "Remote-friendly", size: "1000+", openRoles: 203, narrativeGap: false,
    signals: ["1-1-1 model (1% product, equity, time to community)", "Chief Equality Officer role sustained over time", "Fast pace and high performance expectations"],
    jackyeTake: "The 1-1-1 model is institutionalized, not performative — that matters. The Chief Equality Officer role has survived multiple reorgs. But this is still big tech with big-tech intensity. The values infrastructure is real; the pace is relentless.",
  },
  {
    id: "seed-10", name: "Eileen Fisher", initial: "E", color: "hsl(var(--civic-gold))",
    mission: "Creating simple, sustainable clothing while championing women's empowerment and responsible business.",
    categories: ["Fashion", "Sustainability"],
    scores: [{ label: "Mission", value: 4.7 }, { label: "Work-life", value: 4.4 }, { label: "Compensation", value: 3.7 }],
    confidence: "Medium", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Northeast", size: "200-1000", openRoles: 3, narrativeGap: false,
    signals: ["Employee ownership program", "Sustainability commitments with audit trail", "Smaller company — limited growth trajectory"],
    jackyeTake: "A quiet giant in ethical fashion. The employee ownership is genuine and the sustainability audit trail is public. Growth opportunities are limited by the company's deliberate scale. Perfect for someone who wants depth over trajectory.",
  },
  {
    id: "seed-11", name: "Khan Academy", initial: "K", color: "hsl(var(--primary))",
    mission: "Providing a free, world-class education for anyone, anywhere.",
    categories: ["EdTech", "Education"],
    scores: [{ label: "Mission", value: 5.0 }, { label: "Compensation", value: 3.5 }, { label: "Innovation", value: 4.6 }],
    confidence: "High", legalStatus: "501(c)(3)",
    verified: ["501c3", "mission-verified"], location: "Remote-friendly", size: "200-1000", openRoles: 7, narrativeGap: false,
    signals: ["Free education for anyone, anywhere — lived consistently", "Remote-first culture", "Nonprofit compensation with equity upside absent"],
    jackyeTake: "Khan Academy is one of the rare organizations where the mission statement and the product are identical. The remote culture is mature and intentional. Compensation is nonprofit-level, and there's no equity event coming. You work here for the impact, period.",
  },
  {
    id: "seed-12", name: "Mercy Corps", initial: "M", color: "hsl(var(--civic-green))",
    mission: "Alleviating suffering, poverty, and oppression by helping people build secure, productive communities.",
    categories: ["International Development", "Community/Social"],
    scores: [{ label: "Mission", value: 4.9 }, { label: "Stability", value: 4.0 }, { label: "Work-life", value: 3.8 }],
    confidence: "Medium", legalStatus: "501(c)(3)",
    verified: ["501c3", "mission-verified"], location: "Remote-friendly", size: "1000+", openRoles: 19, narrativeGap: false,
    signals: ["Measurable humanitarian impact published annually", "Field work can be high-stress and high-stakes", "Strong internal culture of purpose and resilience"],
    jackyeTake: "Mercy Corps publishes their impact data — that's rare and it's verifiable. Field roles are genuinely demanding, and the organization is transparent about that. HQ roles offer more balance. The culture of resilience is real but not for everyone.",
  },
];

// Legacy orgs kept for variety
const LEGACY_ORGS: SampleOrg[] = [
  {
    id: "1", name: "GreenGrid Energy", initial: "G", color: "hsl(var(--civic-green))",
    mission: "Accelerating equitable access to clean energy in underserved communities.",
    categories: ["Climate", "Economic Justice"],
    scores: [{ label: "Mission", value: 4.4 }, { label: "Culture", value: 4.0 }, { label: "Stability", value: 3.6 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Remote-friendly", size: "50-200", openRoles: 4, narrativeGap: false,
    signals: ["Clean energy equity focus verified", "B Corp certified with public audit", "Still in growth phase — some operational gaps"],
    jackyeTake: "A promising clean energy player with genuine equity focus. Still scaling, so expect startup-adjacent energy with mission-driven guardrails.",
  },
  {
    id: "2", name: "Pathways Health Alliance", initial: "P", color: "hsl(var(--civic-blue))",
    mission: "Closing the health equity gap through community-based primary care.",
    categories: ["Health Equity", "Community/Social"],
    scores: [{ label: "Mission", value: 4.2 }, { label: "Stability", value: 4.5 }, { label: "Compensation", value: 3.8 }],
    confidence: "High", legalStatus: "501(c)(3)",
    verified: ["501c3", "mission-verified"], location: "Southeast", size: "200-1000", openRoles: 12, narrativeGap: false,
    signals: ["Community health outcomes tracked and published", "Strong leadership tenure", "Nonprofit compensation reality"],
    jackyeTake: "Solid health equity org with years of community trust. Leadership is stable and the outcomes are measurable. Compensation is what you'd expect for a nonprofit of this size.",
  },
  {
    id: "3", name: "VetBridge", initial: "V", color: "hsl(var(--primary))",
    mission: "Connecting transitioning service members with mission-aligned employers.",
    categories: ["Veterans", "Education"],
    scores: [{ label: "Mission", value: 4.6 }, { label: "Culture", value: 4.3 }, { label: "Growth", value: 3.5 }],
    confidence: "High", legalStatus: "501(c)(3)",
    verified: ["501c3"], location: "Midwest", size: "Under 50", openRoles: 2, narrativeGap: false,
    signals: ["Veteran-led and veteran-focused", "Small team with tight culture", "Limited growth trajectory due to niche focus"],
    jackyeTake: "Small but mighty. The team is veteran-led, which gives them credibility that larger orgs can't replicate. Growth is limited by design — they're deep, not wide.",
  },
];

const SAMPLE_ORGS: SampleOrg[] = [...SEED_ORGS, ...LEGACY_ORGS];

// ── Helpers ──
function avgScore(scores: ScoreEntry[]) {
  return scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
}

function scoreColor(score: number) {
  if (score >= 4.0) return "text-civic-green";
  if (score >= 3.0) return "text-civic-yellow";
  return "text-civic-red";
}
function scoreBg(score: number) {
  if (score >= 4.0) return "bg-civic-green/10";
  if (score >= 3.0) return "bg-civic-yellow/10";
  return "bg-civic-red/10";
}

function verificationLabel(v: string) {
  if (v === "b-corp") return "B Corp";
  if (v === "501c3") return "501(c)(3)";
  return "Mission Verified";
}

function isMissionVerifiedStatus(status: string) {
  return status === "B Corp" || status === "501(c)(3)";
}

// ── Component ──
export default function Companies() {
  usePageSEO({
    title: "Aligned Companies Directory",
    description: "Browse verified mission-driven organizations. No bias. Just receipts.",
    path: "/companies",
  });

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [legalStatus, setLegalStatus] = useState("All");
  const [location, setLocation] = useState("All");
  const [size, setSize] = useState("All");
  const [scoreRange, setScoreRange] = useState([0, 5]);
  const [expandedJackye, setExpandedJackye] = useState<string | null>(null);

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
      if (legalStatus !== "All" && org.legalStatus !== legalStatus) return false;
      if (location !== "All" && org.location !== location) return false;
      if (size !== "All" && org.size !== size) return false;
      const avg = avgScore(org.scores);
      if (avg < scoreRange[0] || avg > scoreRange[1]) return false;
      return true;
    });
  }, [search, selectedCategories, verifiedOnly, legalStatus, location, size, scoreRange]);

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
              <PopoverContent className="w-64 p-3 max-h-64 overflow-y-auto" align="start">
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

            {/* Legal Status */}
            <Select value={legalStatus} onValueChange={setLegalStatus}>
              <SelectTrigger className="w-auto h-9 text-xs gap-1 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_STATUSES.map((t) => (
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

            {/* Score Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Score: {scoreRange[0].toFixed(1)}–{scoreRange[1].toFixed(1)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4" align="start">
                <p className="text-xs text-muted-foreground mb-3">Average score range (0–5)</p>
                <Slider
                  min={0} max={5} step={0.5}
                  value={scoreRange}
                  onValueChange={setScoreRange}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{scoreRange[0].toFixed(1)}</span>
                  <span>{scoreRange[1].toFixed(1)}</span>
                </div>
              </PopoverContent>
            </Popover>
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
                  transition={{ delay: i * 0.04, duration: 0.35 }}
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
                          <p className="text-xs text-muted-foreground line-clamp-2">{org.mission}</p>
                        </div>
                      </div>

                      {/* Legal status + Mission Verified badge */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                          {org.legalStatus}
                        </Badge>
                        {isMissionVerifiedStatus(org.legalStatus) && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-civic-green/15 text-civic-green border-civic-green/30 hover:bg-civic-green/20">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                            Mission-Verified
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {org.confidence} confidence
                        </Badge>
                      </div>

                      {/* Category tags */}
                      <div className="flex flex-wrap gap-1">
                        {org.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">{cat}</Badge>
                        ))}
                      </div>

                      {/* Scores */}
                      <div className="flex flex-wrap gap-2">
                        {org.scores.map((s) => (
                          <div key={s.label} className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{s.label}</span>
                            <span className={`text-xs font-semibold px-1.5 py-0 rounded ${scoreBg(s.value)} ${scoreColor(s.value)}`}>
                              {s.value.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Signals */}
                      <ul className="space-y-1">
                        {org.signals.map((signal) => (
                          <li key={signal} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <span className="w-1 h-1 bg-primary/50 rounded-full mt-1.5 shrink-0" />
                            {signal}
                          </li>
                        ))}
                      </ul>

                      {/* Narrative gap */}
                      {org.narrativeGap && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-civic-yellow">
                          <AlertTriangle className="w-3 h-3" />
                          Narrative Gap Detected
                        </span>
                      )}

                      {/* Jackye's Take */}
                      <button
                        onClick={() => setExpandedJackye(expandedJackye === org.id ? null : org.id)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors text-left"
                      >
                        <MessageSquareQuote className="w-3.5 h-3.5 shrink-0" />
                        Jackye's Take
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedJackye === org.id ? "rotate-180" : ""}`} />
                      </button>
                      {expandedJackye === org.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-lg bg-primary/[0.04] border border-primary/10 p-3"
                        >
                          <p className="text-[11px] text-foreground/80 leading-relaxed italic">
                            "{org.jackyeTake}"
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
                            — Jackye Clayton, Professional Insight
                          </p>
                        </motion.div>
                      )}

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
