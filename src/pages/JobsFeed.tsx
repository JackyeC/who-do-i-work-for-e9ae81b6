import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { friendlyErrorMessage } from "@/lib/user-friendly-error";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DreamJobProfileSummaryCard } from "@/components/career/DreamJobProfileSummaryCard";
import { MatchExplainer } from "@/components/jobs/MatchExplainer";

interface MatchReason {
  dimension: string;
  label: string;
  detail: string;
  impact: number;
}

interface ScoreBreakdown {
  skill: number;
  role: number;
  values: number;
  signals: number;
  location: number;
}

interface MatchedJob {
  id: string;
  job_id?: string;
  title: string;
  department?: string | null;
  company: {
    name: string;
    slug: string;
    employer_clarity_score: number;
    industry: string;
  };
  location: string;
  work_mode: string;
  salary_range?: string;
  alignment_score: number;
  matched_signals: string[];
  match_reasons?: MatchReason[];
  score_breakdown?: ScoreBreakdown;
  url: string;
}

function IntegrityBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-civic-green bg-civic-green/10 border-civic-green/20"
    : score >= 65 ? "text-civic-yellow bg-civic-yellow/10 border-civic-yellow/20"
    : "text-civic-red bg-civic-red/10 border-civic-red/20";
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
  const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [passedJobs, setPassedJobs] = useState<Set<string>>(new Set());

  const { data: matchedJobs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["values-job-matches", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("values-job-matcher", {
        body: { limit: 50 },
      });
      if (error) throw error;
      const raw = (data?.matches || []) as Record<string, unknown>[];
      return raw.map((m) => ({
        ...m,
        id: String(m.job_id ?? m.id ?? ""),
      })) as MatchedJob[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

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
    let jobs = (matchedJobs || []).filter(j => !passedJobs.has(j.id));
    if (tab === "aligned") jobs = jobs.filter(j => j.alignment_score >= 70);
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.name.toLowerCase().includes(q) ||
        (j.matched_signals || []).some(s => s.toLowerCase().includes(q))
      );
    }
    return jobs;
  }, [matchedJobs, tab, search, passedJobs]);

  const workModeLabel = (mode: string) => {
    if (!mode) return null;
    const labels: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "Onsite", "on-site": "Onsite" };
    return labels[mode.toLowerCase()] || mode;
  };

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
        {user && (
          <DreamJobProfileSummaryCard compact showSync className="mb-2" />
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Places That Deserve You</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Roles scored against your Dream Job Profile and required employer signals — not keyword stuffing.
            </p>
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
          {!user ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Sign in to see values-matched jobs</p>
              <p className="text-sm text-muted-foreground mt-1">We match roles to your values profile.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Finding roles that match your values...</p>
            </div>
          ) : isError ? (
            <Card className="border-dashed border-border/80 bg-muted/10">
              <div className="p-8 text-center space-y-4 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground leading-relaxed">{friendlyErrorMessage(error)}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button type="button" variant="default" size="sm" onClick={() => refetch()}>
                    Try again
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/dashboard?tab=profile">Review profile</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : filteredJobs.length === 0 ? (
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
                          <p className="text-xs text-muted-foreground mt-0.5">{job.company.name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-semibold text-primary">{job.alignment_score}% aligned</span>
                          <IntegrityBadge score={job.company.employer_clarity_score} />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        )}
                        {job.salary_range && (
                          <span className="inline-flex items-center gap-1">{job.salary_range}</span>
                        )}
                        {job.work_mode && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{workModeLabel(job.work_mode)}</Badge>
                        )}
                      </div>

                      {job.matched_signals && job.matched_signals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.matched_signals.slice(0, 4).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0 font-normal">{s}</Badge>
                          ))}
                        </div>
                      )}
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
                      <p className="text-sm text-muted-foreground">{selectedJob.company.name}</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-primary">{selectedJob.alignment_score}% aligned</span>
                  <IntegrityBadge score={selectedJob.company.employer_clarity_score} />
                  {selectedJob.work_mode && (
                    <Badge variant="outline" className="text-xs">{workModeLabel(selectedJob.work_mode)}</Badge>
                  )}
                </div>

                {/* Location & Salary */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {selectedJob.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedJob.location}</span>
                  )}
                  {selectedJob.salary_range && (
                    <span>{selectedJob.salary_range}</span>
                  )}
                  {selectedJob.company.industry && (
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {selectedJob.company.industry}</span>
                  )}
                </div>

                {/* Matched Signals */}
                {selectedJob.matched_signals && selectedJob.matched_signals.length > 0 && (
                  <div className="bg-primary/[0.05] border border-primary/10 rounded-lg p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">Matched Signals</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.matched_signals.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <MatchExplainer
                  alignmentScore={selectedJob.alignment_score}
                  matchedSignals={selectedJob.matched_signals || []}
                  matchReasons={selectedJob.match_reasons}
                  scoreBreakdown={selectedJob.score_breakdown}
                  jobTitle={selectedJob.title}
                  department={selectedJob.department}
                  industry={selectedJob.company.industry}
                  employerClarityScore={selectedJob.company.employer_clarity_score}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => passJob(selectedJob.id)} variant="outline" className="flex-1">
                    <X className="w-4 h-4 mr-1.5" /> Pass
                  </Button>
                  {selectedJob.url ? (
                    <Button className="flex-1 gap-1.5" asChild>
                      <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Apply
                      </a>
                    </Button>
                  ) : (
                    <Button className="flex-1 gap-1.5" disabled>
                      <Zap className="w-4 h-4" /> Apply When It Counts™
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
