import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  Zap, Target, Loader2, Lightbulb, ArrowRight, Copy,
  CheckCircle2, Clock, Rocket, RefreshCw, Sparkles
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; badgeVariant: "default" | "outline" | "secondary" }> = {
  pending: { label: "Pending", icon: Clock, color: "text-muted-foreground", badgeVariant: "outline" },
  in_progress: { label: "In Progress", icon: Rocket, color: "text-primary", badgeVariant: "default" },
  skill_unlocked: { label: "Skill Unlocked", icon: CheckCircle2, color: "text-green-600", badgeVariant: "secondary" },
};

export function SkillGapBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [coachingNote, setCoachingNote] = useState<string | null>(null);
  const [readinessCurrent, setReadinessCurrent] = useState<number | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["stretch-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stretch_projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const generateProjects = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("skill-gap-gigs", {});
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCoachingNote(data.coaching_note || null);
      setReadinessCurrent(data.career_readiness_current || 0);

      toast({
        title: "Stretch projects generated!",
        description: `Found ${data.projects?.length || 0} skill gaps with actionable projects.`,
      });

      queryClient.invalidateQueries({ queryKey: ["stretch-projects"] });
    } catch (err: any) {
      console.error("Generation failed:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (projectId: string, newStatus: string) => {
    const { error } = await supabase
      .from("stretch_projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    if (error) {
      toast({ title: "Update failed", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["stretch-projects"] });
    if (newStatus === "skill_unlocked") {
      toast({ title: "🎉 Skill Unlocked!", description: "Great work completing this stretch project." });
    }
  };

  const copyProposal = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied!", description: "Proposal script copied to clipboard." });
  };

  // Calculate readiness
  const totalPoints = (projects || []).reduce((sum, p) => sum + (p.readiness_points || 0), 0);
  const earnedPoints = (projects || [])
    .filter((p) => p.status === "skill_unlocked")
    .reduce((sum, p) => sum + (p.readiness_points || 0), 0);
  const inProgressPoints = (projects || [])
    .filter((p) => p.status === "in_progress")
    .reduce((sum, p) => sum + Math.round((p.readiness_points || 0) * 0.5), 0);
  const baseReadiness = readinessCurrent ?? 40;
  const readinessScore = Math.min(baseReadiness + earnedPoints + inProgressPoints, 100);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading stretch projects...</div>;
  }

  if (!projects?.length) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Target}
          title="Discover your skill gaps"
          description="We'll analyze your career profile against your target roles and generate actionable stretch projects you can propose right now."
        />
        <div className="flex justify-center">
          <Button onClick={generateProjects} disabled={generating} size="lg" className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Analyzing your profile..." : "Generate Stretch Projects"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Readiness Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Internal Gigs & Stretch Projects
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bridge the gap between where you are and where you want to be
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={generateProjects} disabled={generating} className="gap-1.5">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh Analysis
        </Button>
      </div>

      {/* Career Readiness Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Career Readiness Score</span>
            <span className="text-sm font-bold text-primary">{readinessScore}%</span>
          </div>
          <Progress value={readinessScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Complete stretch projects to increase your readiness for target roles
          </p>
        </CardContent>
      </Card>

      {/* Coaching Note */}
      {coachingNote && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Jackye Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{coachingNote}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default coaching note if none from AI */}
      {!coachingNote && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Jackye Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Don't wait for a promotion to get the experience. Use a Stretch Project to "audit" the skill before you bet your career on it.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Cards */}
      <div className="space-y-4">
        {projects.map((project, idx) => {
          const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">Project {idx + 1}</span>
                      <Badge variant={statusConfig.badgeVariant} className="text-xs gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                      {project.readiness_points > 0 && (
                        <span className="text-xs text-primary font-medium">+{project.readiness_points} pts</span>
                      )}
                    </div>
                    <CardTitle className="text-base">{project.project_title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Skill Gap */}
                <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                  <p className="text-xs font-medium text-destructive mb-0.5">The Gap</p>
                  <p className="text-sm text-foreground">{project.skill_gap}</p>
                </div>

                {/* Why It Matters */}
                {project.why_it_matters && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Why It Matters</p>
                    <p className="text-sm text-foreground">{project.why_it_matters}</p>
                  </div>
                )}

                {/* Target */}
                {(project.target_company || project.target_role) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="w-3 h-3" />
                    {project.target_company && <span>{project.target_company}</span>}
                    {project.target_company && project.target_role && <ArrowRight className="w-3 h-3" />}
                    {project.target_role && <span className="font-medium">{project.target_role}</span>}
                  </div>
                )}

                {/* Proposal Script */}
                {project.proposal_script && (
                  <div className="bg-accent/30 border border-accent/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground">The Proposal Script</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1 px-2"
                        onClick={() => copyProposal(project.proposal_script!)}
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{project.proposal_script}"
                    </p>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-2 pt-1">
                  {project.status === "pending" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => updateStatus(project.id, "in_progress")}
                    >
                      <Rocket className="w-3.5 h-3.5" /> Start Project
                    </Button>
                  )}
                  {project.status === "in_progress" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => updateStatus(project.id, "skill_unlocked")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Skill Unlocked
                    </Button>
                  )}
                  {project.status === "skill_unlocked" && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed — skill signal added to your profile
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
