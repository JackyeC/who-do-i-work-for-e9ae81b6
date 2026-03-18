import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ValuesPreferenceSidebar } from "@/components/ValuesPreferenceSidebar";
import { VALUES_LENSES } from "@/lib/valuesLenses";
import { JobSidebar } from "@/components/jobs/JobSidebar";
import { JobListRow } from "@/components/jobs/JobListRow";
import { JobDetailDrawer } from "@/components/jobs/JobDetailDrawer";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { TrackingDashboard } from "@/components/jobs/TrackingDashboard";
import { AutoApplySettings } from "@/components/jobs/AutoApplySettings";
import { ApplyQueueDashboard } from "@/components/jobs/ApplyQueueDashboard";
import { UserProfileForm } from "@/components/jobs/UserProfileForm";
import { PreferenceCenter } from "@/components/jobs/PreferenceCenter";
import { JobAlertPreferences } from "@/components/jobs/JobAlertPreferences";
import { AskJackyeWidget } from "@/components/jobs/AskJackyeWidget";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoApplySubscription, STRIPE_TIERS } from "@/hooks/use-premium";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search, Briefcase, Building2, Filter, SlidersHorizontal, X, Monitor,
  Zap, LayoutDashboard, User, Wand2, Copy, Check, Loader2, ExternalLink,
  FileText, Sparkles, Shield, Lock, Crown, DollarSign,
} from "lucide-react";

function AutoApplyGated() {
  const { hasAutoApply, isLoggedIn } = useAutoApplySubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS.auto_apply.price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (hasAutoApply) {
    return (
      <div className="space-y-6">
        <AutoApplySettings />
        <ApplyQueueDashboard />
      </div>
    );
  }

  return (
    <Card className="border-dashed border-2 border-primary/15 bg-muted/30">
      <CardContent className="p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2 text-xl">Unlock Auto-Apply</h3>
        <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto leading-relaxed">
          Let AI scan for jobs at values-aligned companies, generate tailored cover letters, and queue them for your review — all automatically.
        </p>
        <ul className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto text-left space-y-1.5">
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Daily job scanning at tracked companies</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> AI-tailored cover letters per match</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Values-based match scoring</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Nothing sent without your approval</li>
        </ul>
        <Button size="lg" onClick={handleSubscribe} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          Subscribe — $9/mo
        </Button>
        <p className="text-xs text-muted-foreground mt-4">Cancel anytime. Works alongside your existing plan.</p>
      </CardContent>
    </Card>
  );
}

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [salaryOnly, setSalaryOnly] = useState(false);
  const [valuesFilters, setValuesFilters] = useState<string[]>([]);
  const [showValues, setShowValues] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [tab, setTab] = useState(searchParams.get("tab") || "browse");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedPayload, setGeneratedPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [semanticTerms, setSemanticTerms] = useState<string[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  // Semantic search expansion
  const handleSemanticSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSemanticTerms([]);
      return;
    }
    setSemanticLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semantic-search", {
        body: { query },
      });
      if (!error && data) {
        const terms = [...(data.expandedTerms || []), ...(data.relatedTitles || [])];
        setSemanticTerms(terms.filter((t: string) => t.toLowerCase() !== query.toLowerCase()));
      }
    } catch (e) {
      console.error("Semantic search error:", e);
    } finally {
      setSemanticLoading(false);
    }
  }, []);

  // Debounced semantic search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3) handleSemanticSearch(search);
      else setSemanticTerms([]);
    }, 600);
    return () => clearTimeout(timer);
  }, [search, handleSemanticSearch]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-with-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select(`*, companies:company_id (id, name, slug, industry, civic_footprint_score, state)`)
        .eq("is_active", true)
        .order("scraped_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: signalFlags } = useQuery({
    queryKey: ["company-signal-flags"],
    queryFn: async () => {
      const flags: Record<string, string[]> = {};
      const [benefits, hiringTech, sentiment, influence] = await Promise.all([
        supabase.from("company_signal_scans").select("company_id").eq("signal_category", "worker_benefits").limit(500),
        supabase.from("ai_hiring_signals").select("company_id").limit(500),
        supabase.from("company_signal_scans").select("company_id").eq("signal_category", "worker_sentiment").limit(500),
        supabase.from("company_candidates").select("company_id").limit(500),
      ]);
      const addFlag = (rows: any[] | null, flag: string) => {
        (rows || []).forEach((r: any) => {
          if (!flags[r.company_id]) flags[r.company_id] = [];
          if (!flags[r.company_id].includes(flag)) flags[r.company_id].push(flag);
        });
      };
      addFlag(benefits.data, "benefits");
      addFlag(hiringTech.data, "hiring_tech");
      addFlag(sentiment.data, "sentiment");
      addFlag(influence.data, "influence");
      return flags;
    },
  });

  // Canonical signals for job cards (Logic Bible V8.0)
  const { data: canonicalSignalsMap } = useQuery({
    queryKey: ["canonical-signals-all"],
    queryFn: async () => {
      const canonicalCategories = [
        'compensation_transparency', 'hiring_activity', 'workforce_stability',
        'company_behavior', 'innovation_activity', 'public_sentiment',
      ];
      const { data } = await supabase
        .from('company_signal_scans')
        .select('company_id, signal_category, signal_type, signal_value, confidence_level, scan_timestamp, summary, direction, value_normalized')
        .in('signal_category', canonicalCategories)
        .limit(1000);
      const map: Record<string, any[]> = {};
      (data || []).forEach((s: any) => {
        if (!map[s.company_id]) map[s.company_id] = [];
        map[s.company_id].push(s);
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: valuesSignals } = useQuery({
    queryKey: ["company-values-signals", valuesFilters],
    queryFn: async () => {
      if (valuesFilters.length === 0) return {};
      const orFilter = valuesFilters.map(f => `value_category.eq.${f},values_lens.eq.${f}`).join(",");
      const { data, error } = await supabase
        .from("company_values_signals")
        .select("company_id, value_category, values_lens, signal_summary, confidence")
        .or(orFilter);
      if (error) throw error;
      const map: Record<string, any[]> = {};
      (data || []).forEach((s: any) => {
        if (!map[s.company_id]) map[s.company_id] = [];
        map[s.company_id].push(s);
      });
      return map;
    },
    enabled: valuesFilters.length > 0,
  });

  const industries = useMemo(() => {
    if (!jobs) return [];
    const set = new Set(jobs.map((j: any) => j.companies?.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  // Calculate a simple match score for each job based on signals
  const jobScores = useMemo(() => {
    if (!jobs) return {};
    const scores: Record<string, number> = {};
    jobs.forEach((job: any) => {
      const company = job.companies;
      if (!company) return;
      let score = Math.min(Math.round((company.civic_footprint_score || 0) * 0.4), 40);
      const flags = signalFlags?.[company.id] || [];
      score += flags.length * 8;
      // Bonus for values match
      if (valuesFilters.length > 0 && valuesSignals) {
        const companyVals = valuesSignals[company.id] || [];
        const matchedCategories = new Set(companyVals.map((s: any) => s.value_category || s.values_lens));
        const matchRate = valuesFilters.filter(f => matchedCategories.has(f)).length / valuesFilters.length;
        score += Math.round(matchRate * 30);
      }
      scores[job.id] = Math.min(score, 99);
    });
    return scores;
  }, [jobs, signalFlags, valuesFilters, valuesSignals]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    // Reset visible count when filters change
    return jobs.filter((job: any) => {
      const company = job.companies;
      if (!company) return false;
      const loc = (job.location || "").toLowerCase();
      const isNonUS = /\b(india|germany|china|japan|south korea|mexico|brazil|canada|uk|france|spain|italy|australia|singapore|ireland|netherlands|israel|sweden|switzerland)\b/i.test(loc) ||
        /,\s*(in|de|cn|jp|kr|mx|br|ca|gb|fr|es|it|au|sg|ie|nl|il|se|ch)\s*$/i.test(loc);
      if (isNonUS) return false;
      if (salaryOnly && !job.salary_range) return false;
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        job.title.toLowerCase().includes(searchLower) ||
        company.name.toLowerCase().includes(searchLower) ||
        loc.includes(searchLower) ||
        // Semantic expanded terms matching
        semanticTerms.some(term => {
          const t = term.toLowerCase();
          return job.title.toLowerCase().includes(t) || company.name.toLowerCase().includes(t) || loc.includes(t);
        });
      const matchesScore = company.civic_footprint_score >= parseInt(minScore);
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
      const matchesWorkMode = workModeFilter === "all" || job.work_mode === workModeFilter;
      let matchesValues = true;
      if (valuesFilters.length > 0 && valuesSignals) {
        const companySignals = valuesSignals[company.id] || [];
        const companyCategories = new Set(companySignals.map((s: any) => s.value_category || s.values_lens));
        matchesValues = valuesFilters.every((f) => companyCategories.has(f));
      }
      return matchesSearch && matchesScore && matchesIndustry && matchesValues && matchesWorkMode;
    }).sort((a: any, b: any) => {
      // Sponsored jobs always sort to top
      const aSponsored = a.is_sponsored && (!a.sponsor_expires_at || new Date(a.sponsor_expires_at) > new Date());
      const bSponsored = b.is_sponsored && (!b.sponsor_expires_at || new Date(b.sponsor_expires_at) > new Date());
      if (aSponsored && !bSponsored) return -1;
      if (!aSponsored && bSponsored) return 1;
      return (jobScores[b.id] || 0) - (jobScores[a.id] || 0);
    });
  }, [jobs, search, semanticTerms, minScore, industryFilter, workModeFilter, salaryOnly, valuesFilters, valuesSignals, jobScores]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, minScore, industryFilter, workModeFilter, salaryOnly, valuesFilters]);

  const visibleJobs = useMemo(() => filtered?.slice(0, visibleCount) || [], [filtered, visibleCount]);
  const hasMore = visibleCount < (filtered?.length || 0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    // Small delay to show skeleton feedback
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 300);
  }, []);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const companiesWithJobs = useMemo(() => {
    if (!filtered) return 0;
    return new Set(filtered.map((j: any) => j.company_id)).size;
  }, [filtered]);

  const handleClickToApply = async (job: any) => {
    if (!user) {
      if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await supabase.from("applications_tracker").insert({
        user_id: user.id,
        company_id: job.company_id,
        job_id: job.id,
        job_title: job.title,
        company_name: job.companies?.name || "Unknown",
        application_link: job.url,
        status: "Draft",
      });
      toast.success("Application tracked!");
    } catch (e) {
      console.error("Failed to track application:", e);
    }
    if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
  };

  const handleGenerateCoverLetter = async (job: any) => {
    if (!user) {
      toast.error("Please sign in to generate a cover letter");
      return;
    }
    setGeneratingFor(job.id);
    setGeneratedPayload(null);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-application-payload", {
        body: { company_id: job.company_id, user_id: user.id },
      });
      if (error) throw error;
      if (result?.payload) {
        setGeneratedPayload({ ...result.payload, jobTitle: job.title, jobId: job.id });
        try { await navigator.clipboard.writeText(result.payload.matchingStatement); } catch {}
        toast.success("Cover letter generated & copied!");
        // Track application
        await supabase.from("applications_tracker").upsert({
          user_id: user.id,
          company_id: job.company_id,
          job_id: job.id,
          job_title: job.title,
          company_name: job.companies?.name || "Unknown",
          application_link: job.url,
          alignment_score: result.payload.alignmentScore || 0,
          status: "Draft",
        }, { onConflict: "user_id,job_id" }).then(() => {});
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("429")) {
        toast.error("Rate limited — try again in a moment");
      } else if (e?.message?.includes("402")) {
        toast.error("AI credits exhausted — please add funds");
      } else {
        toast.error(e?.message || "Generation failed");
      }
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleCopyPayload = async () => {
    if (!generatedPayload?.matchingStatement) return;
    await navigator.clipboard.writeText(generatedPayload.matchingStatement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1">

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">
              Know Before You Go
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Find jobs at companies that align with your values. Like AIApply — but with transparency built in.
            </p>
            <p className="text-muted-foreground text-[11px] mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--civic-green))]" />
              <span><strong className="text-foreground/80">Civic Score</strong> measures employer transparency across governance, lobbying, workforce data, and public accountability. Hover or tap any score to learn more.</span>
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse" className="gap-1.5">
                <Search className="w-4 h-4" />
                Browse Jobs
              </TabsTrigger>
              {user && (
                <>
                  <TabsTrigger value="auto-apply" className="gap-1.5">
                    <Zap className="w-4 h-4" />
                    Auto-Apply
                  </TabsTrigger>
                  <TabsTrigger value="tracker" className="gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    My Applications
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-1.5">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* ──── BROWSE JOBS TAB ──── */}
            <TabsContent value="browse">
              {/* Generated cover letter banner */}
              {generatedPayload && (
                <Card className="border-primary/30 bg-primary/5 mb-4 animate-in slide-in-from-top-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Wand2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">
                            Cover letter ready for {generatedPayload.jobTitle}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-0.5" />
                            {generatedPayload.alignmentScore}% match
                          </Badge>
                        </div>
                        {generatedPayload.targetedIntro && (
                          <p className="text-sm font-medium text-foreground/90 mb-2 italic">"{generatedPayload.targetedIntro}"</p>
                        )}
                        <div className="bg-background border border-border rounded-md p-3 text-sm text-foreground/90 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                          {generatedPayload.matchingStatement}
                        </div>
                        {generatedPayload.valuesCheck && (
                          <p className="text-xs text-muted-foreground mt-2">{generatedPayload.valuesCheck}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" onClick={handleCopyPayload} className="gap-1.5">
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                        {generatedPayload.careerSiteUrl && (
                          <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                            <a href={generatedPayload.careerSiteUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> Apply
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setGeneratedPayload(null)} className="text-xs">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground text-sm">
                  {filtered?.length || 0} jobs from {companiesWithJobs} companies
                  {minScore !== "0" && ` · Score ${minScore}+`}
                </p>
                {user && (
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-0.5" />
                    Match scores based on your profile & values
                  </p>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or locations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  {/* Semantic search expansion indicator */}
                  {semanticLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </span>
                  )}
                  {semanticTerms.length > 0 && !semanticLoading && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">AI expanded:</span>
                      {semanticTerms.slice(0, 5).map((term) => (
                        <Badge key={term} variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/5">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={minScore} onValueChange={setMinScore}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Min score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Scores</SelectItem>
                      <SelectItem value="30">Score 30+</SelectItem>
                      <SelectItem value="50">Score 50+</SelectItem>
                      <SelectItem value="70">Score 70+</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <Building2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <Monitor className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="on-site">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={showValues ? "default" : "outline"}
                    onClick={() => setShowValues(!showValues)}
                    className="gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Values</span>
                  </Button>
                 </div>
               </div>

               {/* Salary filter toggle */}
               <div className="flex items-center gap-2 mb-3">
                 <Switch
                   id="salary-only"
                   checked={salaryOnly}
                   onCheckedChange={setSalaryOnly}
                 />
                 <Label htmlFor="salary-only" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                   <DollarSign className="w-3 h-3" /> Show only jobs with salary listed
                 </Label>
               </div>

              {/* Active values chips */}
              {valuesFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="text-xs text-muted-foreground">Values:</span>
                  {valuesFilters.map((f) => {
                    const cat = VALUES_LENSES.find((c) => c.key === f);
                    return cat ? (
                      <Badge key={f} variant="secondary" className="text-xs flex items-center gap-1">
                        {cat.label}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setValuesFilters((prev) => prev.filter((p) => p !== f))} />
                      </Badge>
                    ) : null;
                  })}
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setValuesFilters([])}>
                    Clear all
                  </Button>
                </div>
              )}

              {/* Content area */}
              <div className="flex gap-5">
                {showValues && (
                  <div className="hidden sm:block w-56 shrink-0">
                    <div className="sticky top-20">
                      <ValuesPreferenceSidebar activeFilters={valuesFilters} onFiltersChange={setValuesFilters} />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {isLoading && (
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <JobCardSkeleton key={i} />
                      ))}
                    </div>
                  )}
                  {!isLoading && filtered?.length === 0 && (
                    <EmptyState
                      icon={Briefcase}
                      title="No jobs found"
                      description={
                        valuesFilters.length > 0
                          ? "No jobs match your values filters. Try removing some filters."
                          : jobs?.length === 0
                          ? "Job listings are being scraped. Check back soon!"
                          : "Try adjusting your filters or search terms."
                      }
                    />
                  )}

                  <div className="space-y-2">
                    {visibleJobs.map((job: any) => {
                      const company = job.companies;
                      const companyValueSignals = valuesSignals?.[company?.id] || [];
                      const companySignals = signalFlags?.[company?.id] || [];
                      const score = jobScores[job.id] || 0;
                      const isGenerating = generatingFor === job.id;

                      return (
                        <div key={job.id} className="relative group">
                          <JobListRow
                            job={job}
                            companyValueSignals={companyValueSignals}
                            companySignalFlags={companySignals}
                            companySignals={canonicalSignalsMap?.[company?.id] || []}
                            matchScore={score}
                            isSelected={selectedJob?.id === job.id}
                            onClick={() => setSelectedJob(job)}
                          />
                          {/* Quick-action overlay: Generate Cover Letter */}
                          {user && (
                            <div className="absolute right-14 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1 text-xs h-7 shadow-md"
                                disabled={isGenerating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateCoverLetter(job);
                                }}
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileText className="w-3 h-3" />
                                )}
                                {isGenerating ? "Generating..." : "Cover Letter"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Infinite scroll sentinel + loading skeletons */}
                  {hasMore && (
                    <div ref={sentinelRef} className="space-y-2 mt-2">
                      {loadingMore && Array.from({ length: 3 }).map((_, i) => (
                        <JobCardSkeleton key={`load-${i}`} />
                      ))}
                    </div>
                  )}
                  {!isLoading && filtered.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} jobs
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ──── AUTO-APPLY TAB ──── */}
            <TabsContent value="auto-apply">
              {user ? (
                <AutoApplyGated />
              ) : (
                <EmptyState
                  icon={Zap}
                  title="Sign in to use Auto-Apply"
                  description="Auto-apply generates tailored cover letters and tracks applications for jobs that match your values."
                />
              )}
            </TabsContent>

            {/* ──── MY APPLICATIONS TAB ──── */}
            <TabsContent value="tracker">
              {user ? (
                <TrackingDashboard />
              ) : (
                <EmptyState
                  icon={LayoutDashboard}
                  title="Sign in to track applications"
                  description="Keep track of where you've applied and your progress."
                />
              )}
            </TabsContent>

            {/* ──── PROFILE TAB ──── */}
            <TabsContent value="profile">
              {user ? (
                <div className="space-y-6">
                  <UserProfileForm />
                  <JobAlertPreferences />
                  <PreferenceCenter />
                </div>
              ) : (
                <EmptyState
                  icon={User}
                  title="Sign in to set up your profile"
                  description="Your profile powers AI-generated cover letters and job matching."
                />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Job detail drawer */}
      <JobDetailDrawer
        job={selectedJob}
        companyValueSignals={selectedJob ? (valuesSignals?.[selectedJob.companies?.id] || []) : []}
        companySignals={selectedJob ? (canonicalSignalsMap?.[selectedJob.companies?.id] || []) : []}
        matchScore={selectedJob ? jobScores[selectedJob.id] : undefined}
        open={!!selectedJob}
        onOpenChange={(open) => { if (!open) setSelectedJob(null); }}
        onApply={handleClickToApply}
      />

      {/* Mobile values panel */}
      {showValues && (
        <div className="sm:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowValues(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-background border-l border-border p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Values Filter</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowValues(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ValuesPreferenceSidebar activeFilters={valuesFilters} onFiltersChange={setValuesFilters} />
          </div>
        </div>
      )}

      <AskJackyeWidget />
      <Footer />
    </div>
  );
}
