import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateRecruiterBrief, type RecruiterBriefData } from "@/lib/generateRecruiterBrief";
import {
  Search, Building2, Loader2, Activity, TrendingUp,
  Users, MessageSquare, Scale, HelpCircle, Save, FileText, PlusCircle,
  CheckCircle2, AlertTriangle, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateCandidatePdf } from "@/lib/generateCandidatePdf";
import { useToast } from "@/hooks/use-toast";

const COMPANY_FIELDS = "id, name, industry, civic_footprint_score, career_intelligence_score, confidence_rating, lobbying_spend, employee_count, jackye_insight, is_publicly_traded, description" as const;

const signalIcon = (level: "positive" | "neutral" | "caution") => {
  if (level === "positive") return <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />;
  if (level === "caution") return <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--civic-yellow))]" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

function SectionCard({ icon: Icon, title, children, delay = 0 }: {
  icon: React.ElementType; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="border-border/40">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
              {title}
            </h2>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function RecruiterBrief() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [brief, setBrief] = useState<RecruiterBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const searchCompanies = useCallback((name: string) => {
    setQuery(name);
    setBrief(null);
    if (name.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("companies")
        .select("id, name, industry, state")
        .ilike("name", `%${name}%`)
        .limit(6);
      setResults(data || []);
      setSearching(false);
    }, 300);
  }, []);

  const buildDemoBrief = (companyName: string): RecruiterBriefData => ({
    companyName,
    industry: "Technology",
    score: 62,
    confidence: "Medium",
    signals: [
      { label: "Workforce Stability", detail: "No WARN Act filings in last 12 months. Headcount appears stable based on public job postings.", level: "positive" },
      { label: "Compensation Transparency", detail: "Salary ranges posted on ~40% of open roles. No public pay equity audit found.", level: "neutral" },
      { label: "Political Spending", detail: "Corporate PAC active. Lobbying spend increased year-over-year. Check Connected Dots for detail.", level: "caution" },
    ],
    patterns: [
      "Public-facing values messaging is consistent but lacks third-party verification.",
      "Hiring velocity suggests growth, but role descriptions lack clarity on team structure.",
      "No recent EEOC complaints or OSHA violations in public record.",
    ],
    candidateQuestions: [
      "How has the team structure changed in the last 12 months?",
      "What does the company's approach to pay equity look like internally?",
    ],
    candidateConcerns: [
      "Lobbying spend may conflict with stated values on certain policy issues.",
      "Limited public data on internal promotion rates and retention.",
    ],
    sayThis: [
      '"The company has a stable workforce signal — no layoff notices in the last year."',
      '"Their civic score is moderate — worth discussing the specifics with candidates who care about transparency."',
    ],
    avoidThis: [
      '"They\'re a great company with nothing to worry about."',
      '"Their values are perfectly aligned with everyone."',
    ],
    strengths: [
      "No recent labor disruptions or safety violations",
      "Active hiring across multiple departments",
      "Public commitment to workforce development",
    ],
    honestAbout: [
      "Limited pay transparency on majority of listings",
      "PAC activity that may not align with all candidate values",
      "No published diversity or inclusion metrics since 2023",
    ],
    beReadyToAnswer: [
      "What's the company's stance on remote work long-term?",
      "Are there any pending lawsuits or regulatory actions?",
      "How does the company approach AI in hiring decisions?",
    ],
  });

  const selectCompany = async (company: any) => {
    setQuery(company.name);
    setResults([]);
    setLoading(true);

    // Fetch full company + supporting counts in parallel
    const [companyRes, jobsRes, warnsRes, execRes, sentPosRes, sentNegRes, litigRes] = await Promise.all([
      supabase.from("companies").select(COMPANY_FIELDS).eq("id", company.id).single(),
      supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("is_active", true),
      supabase.from("company_warn_notices").select("id", { count: "exact", head: true }).eq("company_id", company.id),
      supabase.from("company_executives").select("id", { count: "exact", head: true }).eq("company_id", company.id).not("departed_at", "is", null),
      supabase.from("company_worker_sentiment").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("sentiment", "positive"),
      supabase.from("company_worker_sentiment").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("sentiment", "negative"),
      supabase.from("company_court_cases").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    ]);

    if (companyRes.data) {
      const b = generateRecruiterBrief(
        companyRes.data as any,
        jobsRes.count ?? 0,
        warnsRes.count ?? 0,
        execRes.count ?? 0,
        sentPosRes.count ?? 0,
        sentNegRes.count ?? 0,
        litigRes.count ?? 0,
      );
      setBrief(b);
    } else {
      // Fallback to demo brief if company data not found
      setBrief(buildDemoBrief(company.name));
    }
    setLoading(false);
  };

  // Handle search submission for companies not in DB
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setResults([]);
      setLoading(true);
      setTimeout(() => {
        setBrief(buildDemoBrief(query.trim()));
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-2 font-semibold">
            Recruiter Intelligence Brief
          </p>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => searchCompanies(e.target.value)}
              placeholder="Search company name…"
              className="pl-9 bg-background/60 border-border/60 font-sans"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </form>

          {/* Dropdown */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 mx-4 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-30"
              >
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCompany(c)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-center gap-3 border-b border-border/30 last:border-0"
                  >
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.industry}{c.state ? ` · ${c.state}` : ""}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Building brief…</span>
        </div>
      )}

      {/* Empty state */}
      {!brief && !loading && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Search for a company to generate a recruiter intelligence brief.
          </p>
        </div>
      )}

      {/* Brief */}
      {brief && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* 1 — COMPANY REALITY SNAPSHOT */}
          <SectionCard icon={Activity} title="Company Reality Snapshot" delay={0}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">{brief.companyName}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{brief.industry}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-3xl font-bold font-display tabular-nums",
                  brief.score >= 60 ? "text-[hsl(var(--civic-green))]" :
                  brief.score >= 35 ? "text-[hsl(var(--civic-yellow))]" : "text-destructive"
                )}>
                  {brief.score}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">{brief.confidence} Confidence</Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 2 — WHAT'S SHOWING UP */}
          <SectionCard icon={TrendingUp} title="What's Showing Up" delay={0.05}>
            <div className="space-y-2">
              {brief.signals.map((s, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2.5 p-3 rounded-lg border",
                  s.level === "caution" ? "border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/[0.04]" :
                  s.level === "positive" ? "border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/[0.04]" :
                  "border-border/40 bg-muted/20"
                )}>
                  <span className="mt-0.5 shrink-0">{signalIcon(s.level)}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 3 — WHAT THIS SUGGESTS */}
          <SectionCard icon={MessageSquare} title="What This Suggests" delay={0.1}>
            <ul className="space-y-1.5">
              {brief.patterns.map((p, i) => (
                <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                  <span className="text-primary mt-1.5 shrink-0">›</span>
                  {p}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* 4 — CANDIDATE PERSPECTIVE */}
          <SectionCard icon={Users} title="Candidate Perspective" delay={0.15}>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Candidates are likely to ask about
                </p>
                <ul className="space-y-1">
                  {brief.candidateQuestions.map((q, i) => (
                    <li key={i} className="text-sm text-foreground/90 pl-3 border-l-2 border-[hsl(var(--civic-blue))]/30">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Candidates may be concerned about
                </p>
                <ul className="space-y-1">
                  {brief.candidateConcerns.map((c, i) => (
                    <li key={i} className="text-sm text-foreground/90 pl-3 border-l-2 border-[hsl(var(--civic-yellow))]/30">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* 5 — COMMUNICATION GUIDANCE */}
          <SectionCard icon={MessageSquare} title="Communication Guidance" delay={0.2}>
            <div className="space-y-3">
              <div>
                <Badge className="mb-2 bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20 text-xs">
                  Say this
                </Badge>
                <ul className="space-y-1.5">
                  {brief.sayThis.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/90 italic">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge className="mb-2 bg-destructive/10 text-destructive border-destructive/20 text-xs">
                  Avoid this
                </Badge>
                <ul className="space-y-1.5">
                  {brief.avoidThis.map((a, i) => (
                    <li key={i} className="text-sm text-foreground/70 line-through decoration-destructive/40">{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* 6 — TRADEOFFS */}
          <SectionCard icon={Scale} title="Tradeoffs" delay={0.25}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[hsl(var(--civic-green))]/20 bg-[hsl(var(--civic-green))]/[0.03]">
                <p className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--civic-green))] mb-2">What's strong</p>
                <ul className="space-y-1">
                  {brief.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/90">+ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/[0.03]">
                <p className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--civic-yellow))] mb-2">What to be honest about</p>
                <ul className="space-y-1">
                  {brief.honestAbout.map((h, i) => (
                    <li key={i} className="text-sm text-foreground/90">– {h}</li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* 7 — BE READY TO ANSWER */}
          <SectionCard icon={HelpCircle} title="Be Ready to Answer" delay={0.3}>
            <div className="space-y-2">
              {brief.beReadyToAnswer.map((q, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-sm text-foreground font-medium">{q}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ACTION BUTTONS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 pt-2 pb-8"
          >
            <Button variant="outline" className="gap-2 text-sm">
              <Save className="w-4 h-4" /> Save Brief
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-sm"
              onClick={() => {
                if (brief) {
                  generateCandidatePdf(brief);
                  toast({ title: "Candidate brief downloaded 📄" });
                }
              }}
            >
              <FileText className="w-4 h-4" /> Generate Candidate Version
            </Button>
            <Button variant="outline" className="gap-2 text-sm">
              <PlusCircle className="w-4 h-4" /> Add to Pipeline
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
