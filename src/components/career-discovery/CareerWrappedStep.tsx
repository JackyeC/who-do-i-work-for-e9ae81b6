import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download, Share2, Sparkles, TrendingUp, Target, GitBranch,
  Building2, GraduationCap, Users, Lock, Linkedin, Link2, Copy,
  CheckCircle2, ArrowRight, Zap, BarChart3, Calendar, Mail, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/hooks/use-premium";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import type { CareerDiscoveryData, CompanyDiscoveryData, SkillGapData, MultipleFuturesData, ActionPlanData, CareerProfile } from "@/hooks/use-career-discovery";

interface CareerWrappedStepProps {
  profile: CareerProfile | null;
  careerPaths: CareerDiscoveryData | null;
  companies: CompanyDiscoveryData | null;
  skillGap: SkillGapData | null;
  futures: MultipleFuturesData | null;
  actionPlan: ActionPlanData | null;
}

const REVEAL_SLIDES = [
  { key: "intro", label: "Your Career Map Results" },
  { key: "paths", label: "Paths Discovered" },
  { key: "companies", label: "Companies Found" },
  { key: "skills", label: "Skill Snapshot" },
  { key: "futures", label: "Your Futures" },
  { key: "summary", label: "Your Report" },
];

export function CareerWrappedStep({ profile, careerPaths, companies, skillGap, futures, actionPlan }: CareerWrappedStepProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isPremium } = usePremium();

  // Auto-advance slides
  useEffect(() => {
    if (!profile) return;
    if (!autoPlaying || currentSlide >= REVEAL_SLIDES.length - 1) {
      if (currentSlide >= REVEAL_SLIDES.length - 1) setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setCurrentSlide(s => s + 1), 3000);
    return () => clearTimeout(timer);
  }, [currentSlide, autoPlaying, profile]);

  if (!profile) {
    return (
      <Card className="border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Complete your profile first to see your Career Map Results.</p>
      </Card>
    );
  }

  const pathCount = (careerPaths?.likely?.length || 0) + (careerPaths?.adjacent?.length || 0) + (careerPaths?.unexpected?.length || 0);
  const companyCount = companies?.companies?.length || 0;
  const strongSkills = skillGap?.skills?.filter(s => s.category === "strong").length || 0;
  const totalSkills = skillGap?.skills?.length || 0;
  const skillMatch = totalSkills > 0 ? Math.round((strongSkills / totalSkills) * 100) : 0;
  const futureCount = futures?.futures?.length || 0;
  const topFuture = futures?.futures?.[0];

  const handleShareLinkedIn = () => {
    const text = `🗺️ Just mapped my career with Who Do I Work For?\n\n📊 ${pathCount} career paths discovered\n🏢 ${companyCount} aligned companies found\n💪 ${skillMatch}% skills match\n🔮 ${futureCount} possible futures explored\n\nDiscover your career path 👇`;
    const url = `${window.location.origin}/career-map`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/career-map`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied! Share it with friends.");
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 3, useCORS: true });
      const link = document.createElement("a");
      link.download = "my-career-map.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Career card downloaded!");
    } catch {
      toast.error("Failed to download card");
    }
  };

  const handleDownloadPDF = () => {
    if (!isPremium) {
      toast("Upgrade to Pro to download your full Career Roadmap PDF", {
        action: { label: "View Plans", onClick: () => window.open("/pricing", "_blank") },
      });
      return;
    }
    toast.success("Generating your full PDF roadmap...");
  };

  const handleEmailResults = async () => {
    setEmailing(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-career-results", {
        body: { profile, careerPaths, companies, skillGap, futures, actionPlan },
      });
      if (error) throw error;
      if (data?.method === 'saved') {
        toast.success("Results saved! They'll be emailed once email sending is fully configured.");
      } else {
        toast.success("Career Map Results sent to your email!");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send email. Please try again.");
    } finally {
      setEmailing(false);
    }
  };

  const slideKey = REVEAL_SLIDES[currentSlide]?.key;

  return (
    <div className="space-y-6">
      {/* Wrapped Reveal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent min-h-[420px] flex items-center justify-center p-8">
        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {REVEAL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentSlide(i); setAutoPlaying(false); }}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === currentSlide ? "w-8 bg-primary-foreground" : i < currentSlide ? "w-4 bg-primary-foreground/60" : "w-4 bg-primary-foreground/25"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slideKey}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center text-primary-foreground max-w-md mx-auto"
          >
            {slideKey === "intro" && (
              <div className="space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-90" />
                </motion.div>
                <h2 className="text-3xl font-bold font-display">Your Career Map Results</h2>
                <p className="text-primary-foreground/80 text-sm">
                  Here's what we discovered for <span className="font-semibold">{profile.jobTitle}</span>
                </p>
              </div>
            )}

            {slideKey === "paths" && (
              <div className="space-y-4">
                <GitBranch className="w-12 h-12 mx-auto opacity-80" />
                <motion.p
                  className="text-6xl font-black font-mono"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {pathCount}
                </motion.p>
                <p className="text-lg font-medium">Career Paths Discovered</p>
                <p className="text-primary-foreground/70 text-xs">Including roles you may never have considered</p>
              </div>
            )}

            {slideKey === "companies" && (
              <div className="space-y-4">
                <Building2 className="w-12 h-12 mx-auto opacity-80" />
                <motion.p
                  className="text-6xl font-black font-mono"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {companyCount}
                </motion.p>
                <p className="text-lg font-medium">Values-Aligned Companies</p>
                <p className="text-primary-foreground/70 text-xs">Companies whose culture matches your priorities</p>
              </div>
            )}

            {slideKey === "skills" && (
              <div className="space-y-4">
                <BarChart3 className="w-12 h-12 mx-auto opacity-80" />
                <motion.p
                  className="text-6xl font-black font-mono"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {skillMatch}%
                </motion.p>
                <p className="text-lg font-medium">Skills Match</p>
                <p className="text-primary-foreground/70 text-xs">{strongSkills} of {totalSkills} skills already in your toolkit</p>
              </div>
            )}

            {slideKey === "futures" && (
              <div className="space-y-4">
                <Zap className="w-12 h-12 mx-auto opacity-80" />
                <motion.p
                  className="text-6xl font-black font-mono"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {futureCount}
                </motion.p>
                <p className="text-lg font-medium">Possible Futures</p>
                {topFuture && (
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
                    Top: {topFuture.label}
                  </Badge>
                )}
              </div>
            )}

            {slideKey === "summary" && (
              <div className="space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto opacity-80" />
                <h2 className="text-2xl font-bold font-display">You're Ready.</h2>
                <p className="text-primary-foreground/80 text-sm">
                  Share your results, download your roadmap, or start checking off your action plan.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip button */}
        {!revealed && (
          <button
            onClick={() => { setCurrentSlide(REVEAL_SLIDES.length - 1); setAutoPlaying(false); setRevealed(true); }}
            className="absolute bottom-4 right-4 text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition"
          >
            Skip →
          </button>
        )}
      </div>

      {/* Shareable Card */}
      <div ref={cardRef} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Career Intelligence Report</p>
        </div>
        <h3 className="text-lg font-bold text-foreground font-display">{profile.jobTitle}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={GitBranch} label="Paths Found" value={String(pathCount)} />
          <StatCard icon={Building2} label="Companies" value={String(companyCount)} />
          <StatCard icon={BarChart3} label="Skills Match" value={`${skillMatch}%`} />
          <StatCard icon={Zap} label="Futures" value={String(futureCount)} />
        </div>
        {topFuture && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Top Career Path</p>
            <p className="text-sm font-semibold text-foreground">{topFuture.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{topFuture.description}</p>
          </div>
        )}
        <p className="text-[9px] text-muted-foreground text-center italic pt-2 border-t border-border">
          Career Mapped by CivicLens · {new Date().toLocaleDateString()} · civiclens.com/career-map
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={handleEmailResults} disabled={emailing} className="gap-2">
          {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {emailing ? "Sending…" : "Email My Results"}
        </Button>
        <Button onClick={handleShareLinkedIn} className="gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white">
          <Linkedin className="w-4 h-4" /> Share on LinkedIn
        </Button>
        <Button variant="outline" onClick={handleCopyLink} className="gap-2">
          <Link2 className="w-4 h-4" /> Copy Link to Share
        </Button>
        <Button variant="outline" onClick={handleDownloadCard} className="gap-2">
          <Download className="w-4 h-4" /> Download Career Card
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className={cn("gap-2 sm:col-span-2", !isPremium && "opacity-80")}
          variant={isPremium ? "default" : "outline"}
        >
          {isPremium ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isPremium ? "Download Full PDF" : "Full PDF (Pro)"}
        </Button>
      </div>

      {/* Compare CTA */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Challenge a friend</p>
            <p className="text-xs text-muted-foreground">
              Send them the link so they can map their career too — then compare paths.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5 shrink-0">
            <Copy className="w-3.5 h-3.5" /> Share
          </Button>
        </CardContent>
      </Card>

      {/* Checklist CTA */}
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-[hsl(var(--civic-green))] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Start Your Career Checklist</p>
            <p className="text-xs text-muted-foreground">
              Track your progress — skills to build, courses to take, people to meet.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" asChild>
            <a href="/career-intelligence?tab=checklist">
              Start <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
