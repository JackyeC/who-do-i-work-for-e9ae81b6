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
    signals: ["Donates 1% of revenue to environmental causes", "Employee-led activism encouraged", "Below-market salaries offset by strong benefits and purpose premium"],
    jackyeTake: "Patagonia walks it. The pay gap versus tech is real, but the people who stay do so because the mission isn't marketing — it's operations. If you need top-dollar comp, look elsewhere. If you need meaning baked into every sprint, this is it.",
  },
  {
    id: "seed-2", name: "REI Co-op", initial: "R", color: "hsl(var(--civic-green))",
    mission: "Inspiring, educating, and outfitting for a lifetime of outdoor adventure and stewardship.",
    categories: ["Retail/Outdoor", "Sustainability"],
    scores: [{ label: "Culture", value: 4.7 }, { label: "Work-life", value: 4.5 }, { label: "Innovation", value: 3.8 }],
    confidence: "High", legalStatus: "Co-op",
    verified: ["mission-verified"], location: "National", size: "1000+", openRoles: 23, narrativeGap: false,
    signals: ["Employee-owned cooperative structure", "Closes on Black Friday as values statement", "Growth slower than investor-backed competitors"],
    jackyeTake: "The co-op model is real and it shows in how employees are treated. Closing on Black Friday isn't a stunt — they've done it for years. Innovation pace is slower because they're not chasing quarterly earnings. That's a feature, not a bug.",
  },
  {
    id: "seed-3", name: "Costco", initial: "C", color: "hsl(var(--civic-blue))",
    mission: "Providing quality goods at the lowest possible prices while taking care of employees and members.",
    categories: ["Retail"],
    scores: [{ label: "Stability", value: 5.0 }, { label: "Compensation", value: 4.6 }, { label: "Mission", value: 3.5 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "National", size: "1000+", openRoles: 89, narrativeGap: false,
    signals: ["Highest retail wages in sector consistently", "Low executive-to-worker pay ratio", "Mission not explicitly stated but behavior is consistent"],
    jackyeTake: "Costco proves you don't need a mission statement to have a mission. The pay, the benefits, the retention rates — the data speaks louder than any careers page. The work itself is retail, so calibrate expectations, but the employer behind it is exceptional.",
  },
  {
    id: "seed-4", name: "Ben & Jerry's", initial: "B", color: "hsl(var(--civic-gold))",
    mission: "Making the best ice cream in the nicest possible way while advancing social justice.",
    categories: ["Food/Agriculture", "Community/Social"],
    scores: [{ label: "Mission", value: 4.8 }, { label: "Culture", value: 4.3 }, { label: "Stability", value: 3.6 }],
    confidence: "Medium", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Northeast", size: "200-1000", openRoles: 5, narrativeGap: true,
    signals: ["Linked Prosperity model ties executive pay to entry-level", "Active social justice advocacy on brand channels", "Unilever parent company tension — autonomy questions linger"],
    jackyeTake: "The mission is loud and genuine at the brand level. But Unilever ownership creates a narrative gap worth watching — how much autonomy does the subsidiary actually have? The social justice work is real; the corporate parent is complicated.",
  },
  {
    id: "seed-5", name: "Eileen Fisher", initial: "E", color: "hsl(var(--civic-gold))",
    mission: "Creating simple, sustainable clothing while championing women's empowerment and responsible business.",
    categories: ["Fashion", "Sustainability"],
    scores: [{ label: "Mission", value: 4.7 }, { label: "Work-life", value: 4.4 }, { label: "Compensation", value: 3.7 }],
    confidence: "Medium", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Northeast", size: "200-1000", openRoles: 3, narrativeGap: false,
    signals: ["Employee ownership program", "Take-back and recycling program with published diversion rates", "Smaller company — limited growth trajectory"],
    jackyeTake: "A quiet giant in ethical fashion. The employee ownership is genuine and the take-back program's diversion rates are public. Growth opportunities are limited by the company's deliberate scale. Perfect for someone who wants depth over trajectory.",
  },
  {
    id: "seed-6", name: "Seventh Generation", initial: "S", color: "hsl(var(--civic-green))",
    mission: "Transforming commerce to nurture the health of the next seven generations.",
    categories: ["Sustainability", "Climate"],
    scores: [{ label: "Mission", value: 4.6 }, { label: "Culture", value: 4.1 }, { label: "Innovation", value: 3.9 }],
    confidence: "Medium", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Northeast", size: "200-1000", openRoles: 4, narrativeGap: true,
    signals: ["Full ingredient transparency on all products", "B Corp certified with published reports", "Unilever parent company — same autonomy questions as Ben & Jerry's"],
    jackyeTake: "The ingredient transparency is industry-leading and verifiable. Like Ben & Jerry's, the Unilever ownership creates a tension between indie mission and corporate parent. The team is mission-driven; the boardroom is more complicated.",
  },
  {
    id: "seed-7", name: "Starbucks", initial: "S", color: "hsl(var(--civic-blue))",
    mission: "Inspiring and nurturing the human spirit — one person, one cup, and one neighborhood at a time.",
    categories: ["Retail/Food", "Community/Social"],
    scores: [{ label: "Compensation", value: 4.2 }, { label: "Culture", value: 3.6 }, { label: "Mission", value: 3.4 }],
    confidence: "High", legalStatus: "For-Profit",
    verified: [], location: "National", size: "1000+", openRoles: 156, narrativeGap: false,
    signals: ["Barista benefits include tuition coverage and stock grants", "Healthcare for part-time workers — rare in food service", "Union organizing tensions creating culture uncertainty"],
    jackyeTake: "The benefits package for hourly workers is genuinely best-in-class for the sector. But the union response has introduced real cultural uncertainty. If you're on the corporate side, it's a strong employer. Store-level experience varies significantly by location.",
  },
  {
    id: "seed-8", name: "The Body Shop", initial: "T", color: "hsl(var(--civic-green))",
    mission: "Enriching people and planet through ethical beauty and Community Fair Trade.",
    categories: ["Sustainability", "Community/Social"],
    scores: [{ label: "Mission", value: 4.4 }, { label: "Culture", value: 3.9 }, { label: "Stability", value: 3.3 }],
    confidence: "Medium", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "National", size: "1000+", openRoles: 11, narrativeGap: false,
    signals: ["Community Fair Trade program sourcing from 20+ countries", "Against animal testing since founding", "Ownership changes have created some strategic instability"],
    jackyeTake: "The Community Fair Trade model is one of the most tangible ethical supply chains in retail. The mission DNA is deep. But multiple ownership transitions have created some turbulence — ask about long-term strategic direction in interviews.",
  },
  {
    id: "seed-9", name: "Warby Parker", initial: "W", color: "hsl(var(--civic-blue))",
    mission: "Offering designer eyewear at revolutionary prices while leading the way for socially conscious businesses.",
    categories: ["Retail", "Community/Social"],
    scores: [{ label: "Mission", value: 4.3 }, { label: "Growth", value: 4.5 }, { label: "Work-life", value: 3.8 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Remote-friendly", size: "1000+", openRoles: 18, narrativeGap: false,
    signals: ["Buy-one-give-one model distributed 13M+ pairs", "B Corp certified public company — rare combination", "Post-IPO growth pressures are real"],
    jackyeTake: "One of the few B Corps that went public and kept the certification. The give-one model is measurable and published. Post-IPO, there's natural tension between mission and shareholder expectations. The culture is strong but growth pace is demanding.",
  },
  {
    id: "seed-10", name: "Bombas", initial: "B", color: "hsl(var(--primary))",
    mission: "Donating essential clothing items to those experiencing homelessness with every purchase.",
    categories: ["Retail", "Community/Social"],
    scores: [{ label: "Mission", value: 4.8 }, { label: "Culture", value: 4.5 }, { label: "Growth", value: 4.0 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "Northeast", size: "200-1000", openRoles: 6, narrativeGap: false,
    signals: ["100M+ items donated to homeless shelters", "Product designed specifically for shelter needs", "Strong Glassdoor ratings and employee sentiment"],
    jackyeTake: "The one-for-one model here is unusually sophisticated — they actually design the donated product differently for shelter use. That's not marketing, that's engineering empathy. Mid-size company energy with genuine mission integration at every level.",
  },
  {
    id: "seed-11", name: "TOMS", initial: "T", color: "hsl(var(--civic-gold))",
    mission: "Using business to improve lives by giving ⅓ of profits to grassroots good.",
    categories: ["Retail", "Community/Social"],
    scores: [{ label: "Mission", value: 4.0 }, { label: "Stability", value: 3.4 }, { label: "Culture", value: 3.7 }],
    confidence: "Medium", legalStatus: "For-Purpose",
    verified: ["mission-verified"], location: "West", size: "200-1000", openRoles: 4, narrativeGap: false,
    signals: ["Evolved from one-for-one to ⅓ of profits giving model", "Ownership change in 2019 shifted dynamics", "Mission still central but business model has been tested"],
    jackyeTake: "TOMS pioneered the giving model and deserves credit for evolving it when the one-for-one approach was criticized. The 2019 ownership change is worth understanding — ask about it directly. The mission is genuine; the business stability is the question.",
  },
  {
    id: "seed-12", name: "New Belgium Brewing", initial: "N", color: "hsl(var(--civic-green))",
    mission: "Brewing beer with purpose through environmental stewardship and community engagement.",
    categories: ["Sustainability", "Community/Social"],
    scores: [{ label: "Mission", value: 4.5 }, { label: "Culture", value: 4.6 }, { label: "Stability", value: 4.0 }],
    confidence: "High", legalStatus: "B Corp",
    verified: ["b-corp", "mission-verified"], location: "West", size: "200-1000", openRoles: 7, narrativeGap: false,
    signals: ["First wind-powered brewery in the US", "Employee ownership culture deeply embedded", "Kirin acquisition preserved B Corp status — unusual"],
    jackyeTake: "New Belgium kept its B Corp certification through a major acquisition — that's nearly unheard of and says something real about the acquirer's respect for the culture. The environmental commitments are verified and the employee culture is legendary in the industry.",
  },
];

const SAMPLE_ORGS: SampleOrg[] = [...SEED_ORGS];

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
                        <Link to={`/browse?search=${encodeURIComponent(org.name)}`}>
                          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs mt-auto">
                            <Briefcase className="w-3 h-3" />
                            Open Roles: {org.openRoles}
                          </Button>
                        </Link>
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
