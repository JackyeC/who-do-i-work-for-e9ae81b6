import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bookmark, BookmarkCheck, MapPin, Users, Clock, Shield, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobListing {
  id: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  type: "Remote" | "Hybrid" | "Onsite";
  salary: string;
  posted: string;
  applicants: number;
  integrityScore: number;
  integrityLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  alignmentPct: number;
  skills: string[];
  description: string;
  whyAligns: string;
  integritySummary: string;
  narrativeGap: string | null;
}

const SAMPLE_JOBS: JobListing[] = [
  {
    id: "1", company: "Meridian Health Systems", logo: "MH", title: "People Operations Manager",
    location: "Austin, TX", type: "Hybrid", salary: "$95K–$120K", posted: "2 days ago",
    applicants: 34, integrityScore: 82, integrityLevel: "LOW", alignmentPct: 91,
    skills: ["HR Strategy", "DEI Programs", "Employee Engagement", "Benefits Admin"],
    description: "Lead people operations for a healthcare company committed to transparent compensation and equitable hiring practices. You'll design programs that put employee wellbeing first.",
    whyAligns: "Strong public commitment to worker wellbeing. Transparent pay bands. This is the real thing.",
    integritySummary: "Strong transparency practices. Published EEO-1 data. No recent EEOC complaints. Board diversity above industry average.",
    narrativeGap: null,
  },
  {
    id: "2", company: "Canopy Financial Group", logo: "CF", title: "Senior Data Analyst",
    location: "Remote", type: "Remote", salary: "$110K–$140K", posted: "1 day ago",
    applicants: 67, integrityScore: 74, integrityLevel: "LOW", alignmentPct: 84,
    skills: ["SQL", "Python", "Tableau", "Financial Modeling"],
    description: "Analyze lending patterns and develop models that ensure equitable access to financial products across demographics.",
    whyAligns: "Fair-lending audits on file. Leadership reflects the communities they serve. Worth your attention.",
    integritySummary: "Active CDFI partnerships. Published diversity report. Moderate lobbying spend in consumer finance regulation.",
    narrativeGap: null,
  },
  {
    id: "3", company: "TerraForge Manufacturing", logo: "TF", title: "Sustainability Director",
    location: "Detroit, MI", type: "Onsite", salary: "$130K–$165K", posted: "5 days ago",
    applicants: 18, integrityScore: 68, integrityLevel: "MODERATE", alignmentPct: 77,
    skills: ["ESG Reporting", "Supply Chain", "Carbon Accounting", "Stakeholder Relations"],
    description: "Drive sustainability transformation across manufacturing operations with direct CEO reporting line.",
    whyAligns: "Real carbon reduction targets — but Scope 3 reporting has gaps. Ask about it.",
    integritySummary: "Published first ESG report in 2024. Some gaps in Scope 3 emissions reporting. Strong union relations.",
    narrativeGap: "Claims 'industry-leading sustainability' but Scope 3 reporting is incomplete.",
  },
  {
    id: "4", company: "Lighthouse Education Partners", logo: "LE", title: "Curriculum Design Lead",
    location: "Denver, CO", type: "Hybrid", salary: "$85K–$105K", posted: "3 days ago",
    applicants: 22, integrityScore: 88, integrityLevel: "LOW", alignmentPct: 93,
    skills: ["Instructional Design", "Equity Frameworks", "EdTech", "Assessment"],
    description: "Design culturally responsive curriculum reaching 200+ schools. Deep commitment to educational equity required.",
    whyAligns: "Highest integrity score in ed-tech. Community board. Published pay equity audit. This one's real.",
    integritySummary: "Top-tier transparency. Community advisory board. Published pay equity audit. B-Corp certified.",
    narrativeGap: null,
  },
  {
    id: "5", company: "Vantage Media Corp", logo: "VM", title: "Content Strategy Manager",
    location: "New York, NY", type: "Hybrid", salary: "$100K–$130K", posted: "1 week ago",
    applicants: 89, integrityScore: 45, integrityLevel: "HIGH", alignmentPct: 52,
    skills: ["Content Strategy", "SEO", "Team Leadership", "Analytics"],
    description: "Lead content strategy across digital platforms for a fast-growing media company.",
    whyAligns: "They market 'employee-first culture' while Glassdoor tells a different story. Proceed with your eyes open.",
    integritySummary: "Recent leadership turnover. Employee sentiment trending negative. PAC contributions to anti-worker legislation flagged.",
    narrativeGap: "Markets 'employee-first culture' while Glassdoor reviews cite burnout and management issues.",
  },
  {
    id: "6", company: "Evergreen Community Health", logo: "EC", title: "Community Health Director",
    location: "Portland, OR", type: "Onsite", salary: "$105K–$135K", posted: "4 days ago",
    applicants: 12, integrityScore: 91, integrityLevel: "LOW", alignmentPct: 96,
    skills: ["Public Health", "Community Engagement", "Grant Writing", "Program Evaluation"],
    description: "Lead community health initiatives with a focus on underserved populations. Direct impact on health equity outcomes.",
    whyAligns: "91 integrity. Community governance. Published health equity data. Living wage employer. This is where values live.",
    integritySummary: "FQHC with exemplary transparency. Community board governance. Published health equity data. Living wage employer.",
    narrativeGap: null,
  },
  {
    id: "7", company: "Axiom Defense Systems", logo: "AD", title: "Project Manager",
    location: "Arlington, VA", type: "Onsite", salary: "$120K–$155K", posted: "6 days ago",
    applicants: 41, integrityScore: 32, integrityLevel: "CRITICAL", alignmentPct: 28,
    skills: ["PMP", "DoD Clearance", "Agile", "Stakeholder Management"],
    description: "Manage classified defense projects with cross-functional teams.",
    whyAligns: "Critical misalignment detected. Axiom's government contract history, lobbying spend, and PAC donations conflict with your stated values around transparency and social impact.",
    integritySummary: "Significant lobbying spend. Multiple government contract controversies. No published diversity data. Board lacks independence.",
    narrativeGap: "Claims 'making the world safer' while lobbying against civilian oversight provisions.",
  },
  {
    id: "8", company: "Bloom Urban Agriculture", logo: "BU", title: "Operations Manager",
    location: "Chicago, IL", type: "Hybrid", salary: "$75K–$95K", posted: "Today",
    applicants: 8, integrityScore: 85, integrityLevel: "LOW", alignmentPct: 89,
    skills: ["Operations", "Supply Chain", "Community Development", "Budget Management"],
    description: "Oversee urban farming operations across 12 sites, managing teams and ensuring food access for underserved neighborhoods.",
    whyAligns: "Bloom's mission and operations are tightly aligned. They pay living wages, source locally, and their board includes community members from the neighborhoods they serve.",
    integritySummary: "Mission-driven social enterprise. Living wage certified. Community governance model. Transparent financials.",
    narrativeGap: null,
  },
];

function getScoreColor(level: string) {
  switch (level) {
    case "LOW": return "bg-civic-green/10 text-civic-green border-civic-green/20";
    case "MODERATE": return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20";
    case "HIGH": return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20";
    case "CRITICAL": return "bg-civic-red/10 text-civic-red border-civic-red/20";
    default: return "bg-muted text-muted-foreground";
  }
}

function getAlignmentColor(pct: number) {
  if (pct >= 80) return "text-civic-green";
  if (pct >= 60) return "text-civic-yellow";
  return "text-civic-red";
}

export function JobsFeedSection() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minIntegrity, setMinIntegrity] = useState([60]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const filtered = SAMPLE_JOBS.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && job.type !== typeFilter) return false;
    if (job.integrityScore < minIntegrity[0]) return false;
    return true;
  });

  const toggleSave = (id: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-civic-green/20 bg-civic-green/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-civic-green shrink-0" />
          <p className="text-sm text-foreground/90">
            <span className="font-semibold">Who Do I Work For only shows you roles at companies that passed our integrity check.</span>
            {" "}Every listing here has been screened for transparency, governance, and worker treatment signals.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search roles or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] bg-card border-border/50">
            <SelectValue placeholder="Work type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
            <SelectItem value="Onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 min-w-[220px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Min Integrity: {minIntegrity[0]}+</span>
          <Slider value={minIntegrity} onValueChange={setMinIntegrity} min={0} max={100} step={5} className="w-[120px]" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} roles found</p>

      {/* Job Cards */}
      <div className="grid gap-4">
        {filtered.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className="group rounded-xl border border-border/40 bg-card p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {job.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-[15px]">{job.title}</h3>
                    <Badge variant="outline" className={cn("text-xs font-mono", getScoreColor(job.integrityLevel))}>
                      {job.integrityScore} Integrity
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span>{job.type}</span>
                    <span>{job.salary}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicants} applicants</span>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {job.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs bg-muted/50 font-normal">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={cn("text-lg font-bold font-mono", getAlignmentColor(job.alignmentPct))}>
                  {job.alignmentPct}% <span className="text-xs font-normal">aligned</span>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }}
                    className="h-8 w-8 p-0"
                  >
                    {savedJobs.has(job.id) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }} className="text-xs h-8">
                    View Dossier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side Panel */}
      <Sheet open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedJob && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {selectedJob.logo}
                  </div>
                  <div>
                    <SheetTitle className="text-lg">{selectedJob.title}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("text-xs font-mono", getScoreColor(selectedJob.integrityLevel))}>
                  {selectedJob.integrityScore} Integrity
                </Badge>
                <span className={cn("text-sm font-bold font-mono", getAlignmentColor(selectedJob.alignmentPct))}>
                  {selectedJob.alignmentPct}% aligned
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Job Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="rounded-lg border border-civic-green/20 bg-civic-green/5 p-4">
                <h4 className="text-sm font-semibold text-civic-green mb-1.5">Why This Aligns</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedJob.whyAligns}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1.5">Integrity Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.integritySummary}</p>
              </div>

              {selectedJob.narrativeGap && (
                <div className="rounded-lg border border-civic-yellow/20 bg-civic-yellow/5 p-4">
                  <h4 className="text-sm font-semibold text-civic-yellow mb-1.5">⚠ Narrative Gap Detected</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selectedJob.narrativeGap}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => toggleSave(selectedJob.id)}
                  variant="outline"
                  className="flex-1"
                >
                  {savedJobs.has(selectedJob.id) ? <><BookmarkCheck className="w-4 h-4 mr-2" /> Saved</> : <><Bookmark className="w-4 h-4 mr-2" /> Save</>}
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ExternalLink className="w-4 h-4 mr-2" /> View Full Dossier
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
