import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CompanyLogo } from "@/components/CompanyLogo";
import { JobPostingSchema } from "@/components/jobs/JobPostingSchema";
import { JobQualityBadge } from "@/components/jobs/JobQualityBadge";
import { WhatThisMeansForYou } from "@/components/jobs/WhatThisMeansForYou";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  ExternalLink, MapPin, Wifi, Monitor, Home, DollarSign,
  Shield, ShieldCheck, Network, Building2, AlertTriangle, Eye, ChevronLeft, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { evaluateJobQuality, detectRepost, hasEvergreenSignals } from "@/lib/jobQuality";
import { differenceInDays } from "date-fns";

const WORK_MODE_META: Record<string, { icon: any; label: string }> = {
  remote: { icon: Wifi, label: "Remote" },
  hybrid: { icon: Monitor, label: "Hybrid" },
  "on-site": { icon: Home, label: "On-site" },
};

function getUserPreferenceCategories(): Set<string> {
  try {
    const raw = localStorage.getItem("userWorkProfile");
    if (!raw) return new Set();
    const profile = JSON.parse(raw);
    const cats = new Set<string>();
    if (profile.priorities?.includes("values")) {
      cats.add("progress_policy");
      cats.add("traditional_policy");
    }
    if (profile.priorities?.includes("stability")) cats.add("labor_policy");
    if (profile.priorities?.includes("sustainability")) cats.add("climate_policy");
    if (profile.priorities?.includes("equity")) cats.add("equity_policy");
    return cats;
  } catch {
    return new Set();
  }
}

function trackApplyClick(jobId: string, companyId: string, url: string) {
  supabase.from("job_click_events").insert({
    job_id: jobId,
    company_id: companyId,
    click_type: "apply",
    destination_url: url,
  }).then(() => {});
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select("*, companies(name, slug, logo_url, vetted_status, jackye_insight, description, civic_footprint_score, website_url)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch alignment signals
  const { data: alignmentSignals } = useQuery({
    queryKey: ["alignment-signals-detail", job?.company_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("institutional_alignment_signals")
        .select("institution_category")
        .eq("company_id", job!.company_id);
      return new Set((data || []).map((r: any) => r.institution_category));
    },
    enabled: !!job?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch research
  const { data: research } = useQuery({
    queryKey: ["job-research-snippet", job?.company_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_research")
        .select("connection_chain, research_summary")
        .eq("company_id", job!.company_id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!job?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const co = job?.companies as any;
  const civicScore = co?.civic_footprint_score || 0;
  const prefCategories = getUserPreferenceCategories();
  const companyCats = alignmentSignals || new Set<string>();
  const matchedCats = [...prefCategories].filter((c) => companyCats.has(c));

  const qualitySignal = job ? evaluateJobQuality(job) : null;
  const isEvergreen = job ? hasEvergreenSignals(job.description) : false;
  const jobAgeDays = job ? differenceInDays(new Date(), new Date(job.posted_at || job.created_at)) : 0;

  const pageTitle = job ? `${job.title} at ${co?.name || "Unknown"} | Job Board` : "Job Details";
  const pageDesc = job
    ? `${job.title} at ${co?.name}. ${job.salary_range ? `Salary: ${job.salary_range}. ` : ""}${job.location || "Remote"}. View company intelligence before you apply.`
    : "Job listing with employer transparency signals.";

  usePageSEO({ title: pageTitle, description: pageDesc });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">This listing may have been removed or is no longer active.</p>
          <Button asChild><Link to="/job-board">← Back to Job Board</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isCertified = co?.vetted_status === "certified";
  const isVerified = co?.vetted_status === "verified";
  const workMode = job.work_mode ? WORK_MODE_META[job.work_mode] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {job && <JobPostingSchema job={job} />}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Back link */}
        <Link to="/job-board" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Job Board
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <CompanyLogo companyName={co?.name || "Unknown"} logoUrl={co?.logo_url} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{job.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Link to={`/company/${co?.slug}`} className="text-sm text-primary hover:underline font-medium">
                {co?.name || "Unknown Company"}
              </Link>
              {isVerified && (
                <Badge variant="outline" className="text-[10px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </Badge>
              )}
              {isCertified && (
                <Badge variant="outline" className="text-[10px] gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" /> Certified
                </Badge>
              )}
            </div>
            {/* Meta strip */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
              )}
              {workMode && (
                <span className="flex items-center gap-1"><workMode.icon className="w-3 h-3" /> {workMode.label}</span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.employment_type}</span>
              )}
              {job.seniority_level && (
                <Badge variant="outline" className="text-[10px] py-0">{job.seniority_level}</Badge>
              )}
              {job.department && (
                <Badge variant="outline" className="text-[10px] py-0">{job.department}</Badge>
              )}
            </div>
            {/* Quality badge */}
            {qualitySignal && (
              <div className="mt-2">
                <JobQualityBadge signal={qualitySignal} isEvergreen={isEvergreen} />
              </div>
            )}
          </div>
        </div>

        {/* Salary + Clarity grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Compensation</p>
            {job.salary_range ? (
              <p className="text-base font-semibold text-[hsl(var(--civic-green))] flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> {job.salary_range}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not disclosed</p>
            )}
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Clarity Score</p>
            <p className={cn(
              "text-base font-semibold",
              civicScore >= 70 ? "text-[hsl(var(--civic-green))]" :
              civicScore >= 40 ? "text-[hsl(var(--civic-yellow))]" :
              "text-[hsl(var(--civic-red))]"
            )}>
              {civicScore}/100
            </p>
          </div>
        </div>

        {/* What This Means For You */}
        <div className="mb-6">
          <WhatThisMeansForYou
            matchCount={matchedCats.length}
            matchedCategories={matchedCats}
            civicScore={civicScore}
            salaryRange={job.salary_range}
            jobAgeDays={jobAgeDays}
          />
        </div>

        {/* Strategic Context */}
        {co?.jackye_insight && (
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 mb-4">
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-muted-foreground" /> Strategic Context
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{co.jackye_insight}</p>
          </div>
        )}

        {/* Connection Chain */}
        {research?.connection_chain && (
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 mb-4">
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Network className="w-3 h-3 text-muted-foreground" /> Connection Chain
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{research.connection_chain}</p>
          </div>
        )}

        {/* Job Description */}
        {job.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">About This Role</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line prose prose-sm max-w-none">
              {job.description}
            </div>
          </div>
        )}

        {/* Company snapshot */}
        {co?.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">About {co.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{co.description}</p>
          </div>
        )}

        <Separator className="my-6" />

        {/* Before You Apply */}
        <div className="p-4 rounded-lg border border-[hsl(var(--civic-yellow)/0.2)] bg-[hsl(var(--civic-yellow)/0.04)] mb-6">
          <p className="text-xs font-semibold text-[hsl(var(--civic-yellow))] uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Before You Apply
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {!job.salary_range && <li>• No salary disclosed — ask about compensation early</li>}
            {civicScore < 40 && <li>• Limited transparency signals — do independent research</li>}
            {jobAgeDays > 30 && <li>• Listing is {jobAgeDays} days old — confirm it's still active</li>}
            {isEvergreen && <li>• This listing contains language suggesting a general talent pipeline</li>}
            <li>• Review the <Link to={`/company/${co?.slug}`} className="text-primary hover:underline">full company profile</Link> before deciding</li>
          </ul>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {job.url ? (
            <Button className="flex-1 gap-2" size="lg" asChild
              onClick={() => trackApplyClick(job.id, job.company_id, job.url!)}>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply Now <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          ) : (
            <Button className="flex-1 gap-2" size="lg" variant="secondary" asChild>
              <Link to={`/company/${co?.slug}`}>View All Roles</Link>
            </Button>
          )}
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link to={`/company/${co?.slug}`}>
              <Building2 className="w-4 h-4" /> Full Company Intelligence
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
