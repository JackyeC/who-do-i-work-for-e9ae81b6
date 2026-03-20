import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MapPin, Clock, Users, Shield, X, Zap, ChevronRight,
  Building2, AlertTriangle, Bookmark, BookmarkCheck, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MockJob {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  type: "Remote" | "Hybrid" | "Onsite";
  postedDate: string;
  applicants: number;
  integrityScore: number;
  alignmentPct: number;
  skills: string[];
  description: string;
  whyAligns: string;
  companySummary: string;
  narrativeGap?: string;
  isAligned: boolean;
}

const MOCK_JOBS: MockJob[] = [
  {
    id: "1", title: "Senior Product Manager", company: "Patagonia", location: "Ventura, CA", type: "Hybrid",
    postedDate: "2 days ago", applicants: 47, integrityScore: 92, alignmentPct: 94, isAligned: true,
    skills: ["Product Strategy", "Sustainability", "Agile", "Stakeholder Mgmt"],
    description: "Lead product strategy for our digital commerce platform, ensuring alignment with our environmental mission.",
    whyAligns: "Your values around environmental impact and purpose-driven work match Patagonia's B Corp mission.",
    companySummary: "B Corp certified. Donates 1% of revenue to environmental causes. Strong employee-first culture.",
    narrativeGap: undefined,
  },
  {
    id: "2", title: "Retail Operations Lead", company: "REI", location: "Kent, WA", type: "Hybrid",
    postedDate: "3 days ago", applicants: 63, integrityScore: 89, alignmentPct: 87, isAligned: true,
    skills: ["Retail Ops", "Team Leadership", "Inventory Mgmt", "Sustainability"],
    description: "Oversee retail operations for flagship locations, championing REI's cooperative mission and outdoor stewardship values.",
    whyAligns: "REI's co-op model and outdoor access mission align with your preference for organizations that balance profit and purpose.",
    companySummary: "Consumer co-op with 23M+ members. Closes on Black Friday for #OptOutside. Strong worker protections and profit-sharing.",
    narrativeGap: "Recent unionization efforts at some stores suggest tension between stated values and frontline worker experience.",
  },
  {
    id: "3", title: "Supply Chain Analyst", company: "Costco", location: "Issaquah, WA", type: "Onsite",
    postedDate: "1 week ago", applicants: 56, integrityScore: 82, alignmentPct: 76, isAligned: true,
    skills: ["Supply Chain", "SQL", "Data Analysis", "Inventory Mgmt"],
    description: "Analyze and optimize supply chain operations for one of the largest retailers in the world.",
    whyAligns: "Costco's compensation leadership and low executive-to-worker pay ratio reflect values around fair compensation.",
    companySummary: "Highest retail wages in sector. Low executive pay ratio. Mission not explicitly stated but behavior is consistent.",
    narrativeGap: undefined,
  },
  {
    id: "4", title: "Social Impact Coordinator", company: "Ben & Jerry's", location: "Burlington, VT", type: "Hybrid",
    postedDate: "1 day ago", applicants: 91, integrityScore: 86, alignmentPct: 90, isAligned: true,
    skills: ["Campaign Strategy", "Community Organizing", "Communications", "Social Justice"],
    description: "Drive social mission campaigns and community partnerships that align ice cream with activism.",
    whyAligns: "Their activist brand DNA and board-level social mission mandate match your desire for purpose-first culture.",
    companySummary: "Independent board for social mission. Publicly advocates on climate, racial justice, and democracy. Owned by Unilever.",
    narrativeGap: "Unilever ownership creates structural tension — parent company lobbying record doesn't always match Ben & Jerry's advocacy.",
  },
  {
    id: "5", title: "Head of Sustainable Design", company: "Eileen Fisher", location: "Irvington, NY", type: "Hybrid",
    postedDate: "4 days ago", applicants: 28, integrityScore: 91, alignmentPct: 85, isAligned: true,
    skills: ["Sustainable Fashion", "Circular Design", "Product Development", "Supply Chain Ethics"],
    description: "Lead the design team in creating timeless, sustainable garments while advancing circularity and take-back programs.",
    whyAligns: "B Corp certified with genuine circular fashion programs — one of the few fashion companies where the sustainability claims hold up.",
    companySummary: "B Corp certified. Renew take-back program. Employee-owned through ESOP. Industry leader in garment worker welfare.",
    narrativeGap: undefined,
  },
  {
    id: "6", title: "Store Manager — Flagship", company: "Starbucks", location: "Seattle, WA", type: "Onsite",
    postedDate: "5 days ago", applicants: 154, integrityScore: 64, alignmentPct: 68, isAligned: false,
    skills: ["Retail Mgmt", "Team Leadership", "P&L", "Customer Experience"],
    description: "Lead a high-volume flagship store team, delivering the Starbucks experience while managing operations and partner development.",
    whyAligns: "Strong benefits package (healthcare, tuition) signals worker investment, though recent labor disputes warrant scrutiny.",
    companySummary: "Industry-leading benefits for part-time workers. College tuition program. Aggressive anti-union response documented.",
    narrativeGap: "Public commitment to 'partner experience' contrasts with documented union-busting complaints across 300+ stores.",
  },
  {
    id: "7", title: "Impact Partnerships Manager", company: "Bombas", location: "New York, NY", type: "Remote",
    postedDate: "2 days ago", applicants: 72, integrityScore: 88, alignmentPct: 89, isAligned: true,
    skills: ["Nonprofit Partnerships", "Impact Measurement", "Business Development", "Storytelling"],
    description: "Build and manage partnerships with homeless shelters and community organizations for Bombas' one-purchased-one-donated model.",
    whyAligns: "Certified B Corp with a one-for-one giving model that's measurable and transparent — 100M+ items donated.",
    companySummary: "B Corp certified. One-for-one donation model. 100M+ items donated. Fast-growth DTC with strong mission culture.",
    narrativeGap: undefined,
  },
  {
    id: "8", title: "Brand Strategist", company: "Warby Parker", location: "New York, NY", type: "Hybrid",
    postedDate: "6 days ago", applicants: 89, integrityScore: 83, alignmentPct: 79, isAligned: true,
    skills: ["Brand Strategy", "Consumer Insights", "Creative Direction", "Social Impact"],
    description: "Shape brand strategy and storytelling for Warby Parker's mission to provide affordable, stylish eyewear with social impact.",
    whyAligns: "Buy-a-Pair, Give-a-Pair program and B Corp certification show commitment beyond marketing.",
    companySummary: "B Corp certified. Buy-a-Pair, Give-a-Pair model. Publicly traded — watch for shareholder pressure vs mission tension.",
    narrativeGap: "Post-IPO cost pressures have led to retail expansion speed that some employees flag as straining culture.",
  },
];

function IntegrityBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 65 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border", color)}>
      <Shield className="w-3 h-3" /> {score}
    </span>
  );
}

export default function JobsFeed() {
  usePageSEO({ title: "Jobs Feed — Who Do I Work For?" });
  const { user } = useAuth();
  const [tab, setTab] = useState<"aligned" | "all">("aligned");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [passedJobs, setPassedJobs] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const passJob = (id: string) => {
    setPassedJobs(prev => new Set(prev).add(id));
    if (selectedJob?.id === id) setSelectedJob(null);
  };

  const filteredJobs = useMemo(() => {
    let jobs = MOCK_JOBS.filter(j => !passedJobs.has(j.id));
    if (tab === "aligned") jobs = jobs.filter(j => j.isAligned);
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return jobs;
  }, [tab, search, passedJobs]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Jobs Feed — Who Do I Work For?</title>
      </Helmet>

      {/* Tagline bar */}
      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">
          You deserve to know exactly who you work for.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Jobs Feed</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Roles aligned with your values. Not just your skills.</p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="aligned">Aligned Roles</TabsTrigger>
              <TabsTrigger value="all">All Jobs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Job list */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No roles match your current filters.</p>
            </div>
          ) : (
            filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border",
                    selectedJob?.id === job.id ? "border-primary/40 bg-primary/[0.03]" : "border-border/50 hover:border-border"
                  )}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start gap-4">
                    {/* Company avatar */}
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-tight">{job.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-semibold text-primary">{job.alignmentPct}% aligned</span>
                          <IntegrityBadge score={job.integrityScore} />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {job.postedDate}</span>
                        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicants} applicants</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{job.type}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.skills.slice(0, 4).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }}>
                        {savedJobs.has(job.id) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail side panel */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => { if (!open) setSelectedJob(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          {selectedJob && (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-5">
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <SheetTitle className="text-lg font-bold leading-tight">{selectedJob.title}</SheetTitle>
                      <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-primary">{selectedJob.alignmentPct}% aligned</span>
                  <IntegrityBadge score={selectedJob.integrityScore} />
                  <Badge variant="outline" className="text-xs">{selectedJob.type}</Badge>
                </div>

                {/* Why This Aligns */}
                <div className="bg-primary/[0.05] border border-primary/10 rounded-lg p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">Why This Aligns</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selectedJob.whyAligns}</p>
                </div>

                {/* Company Integrity Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Integrity Summary</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">{selectedJob.companySummary}</p>
                </div>

                {/* Narrative Gap Warning */}
                {selectedJob.narrativeGap && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Narrative Gap Detected</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">{selectedJob.narrativeGap}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Description</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">{selectedJob.description}</p>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => passJob(selectedJob.id)} variant="outline" className="flex-1">
                    <X className="w-4 h-4 mr-1.5" /> Pass
                  </Button>
                  <Button className="flex-1 gap-1.5">
                    <Zap className="w-4 h-4" /> Apply When It Counts™
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
