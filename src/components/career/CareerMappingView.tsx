import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  ArrowRight, Target, Zap, TrendingUp, ChevronRight,
  Plus, Loader2, CheckCircle2, Circle, Briefcase, Compass,
  ArrowUpRight, ArrowRightLeft, ArrowUp, Clock, Star
} from "lucide-react";
import { RoleLatticeNode } from "./RoleLatticeNode";
import { InternalGigCard } from "./InternalGigCard";

export function CareerMappingView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [targetInput, setTargetInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch user career profile
  const { data: profile } = useQuery({
    queryKey: ["career-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_career_profile")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch growth tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["growth-tracks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_growth_tracker")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch available gigs
  const { data: gigs } = useQuery({
    queryKey: ["project-gigs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_gigs")
        .select("*")
        .eq("is_active", true)
        .limit(6);
      return data || [];
    },
  });

  // Fetch role pathways
  const { data: pathways } = useQuery({
    queryKey: ["role-pathways"],
    queryFn: async () => {
      const { data } = await supabase
        .from("role_pathway")
        .select("*")
        .limit(20);
      return data || [];
    },
  });

  // Add a new target role with AI-powered gap analysis
  const addTarget = useMutation({
    mutationFn: async (targetRole: string) => {
      if (!user || !targetRole.trim()) return;
      const { data, error } = await supabase.functions.invoke("career-gap-analysis", {
        body: { target_role: targetRole.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("AI gap analysis complete! Your path has been mapped.");
      setTargetInput("");
      queryClient.invalidateQueries({ queryKey: ["growth-tracks"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to analyze target role"),
  });

  // Derive current role from profile
  const currentRole = (profile as any)?.preferred_titles?.[0] || profile?.job_titles?.[0] || "Your Current Role";
  const currentSkills = profile?.skills || [];

  // Build lattice nodes from tracks
  const latticeNodes = (tracks || []).filter(t => (t as any).status !== "achieved").slice(0, 3);

  const getMoveIcon = (track: any) => {
    const moveType = track.gap_analysis?.move_type;
    if (moveType === "upward") return ArrowUp;
    if (moveType === "diagonal") return ArrowUpRight;
    if (moveType === "lateral") return ArrowRightLeft;
    return ArrowUpRight;
  };
  const getMoveLabel = (track: any) => {
    const moveType = track.gap_analysis?.move_type;
    if (moveType === "upward") return "Upward";
    if (moveType === "diagonal") return "Diagonal";
    if (moveType === "lateral") return "Lateral";
    return "Exploring";
  };

  if (tracksLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading career map...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
            <Compass className="w-5 h-5 text-[hsl(var(--civic-blue))]" />
            Next Move Navigator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize lateral, upward, and diagonal moves. AI maps the skills and values alignment for each path.
          </p>
        </div>
      </div>

      {/* Role Lattice Visualization */}
      <Card className="border-[hsl(var(--civic-blue))]/20 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-[hsl(var(--civic-blue))]" /> Role Lattice
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current Role Node */}
          <div className="flex flex-col items-center">
            <div className="relative bg-[hsl(var(--civic-navy))] text-[hsl(var(--primary-foreground))] rounded-xl px-6 py-4 text-center shadow-md max-w-xs">
              <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Current Position</p>
              <p className="font-semibold text-sm">{currentRole}</p>
              {currentSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {currentSkills.slice(0, 4).map((s: string, i: number) => (
                    <span key={i} className="text-[10px] bg-white/15 rounded px-1.5 py-0.5">{s}</span>
                  ))}
                  {currentSkills.length > 4 && (
                    <span className="text-[10px] opacity-60">+{currentSkills.length - 4}</span>
                  )}
                </div>
              )}
            </div>

            {/* Connection lines */}
            {latticeNodes.length > 0 && (
              <div className="flex items-center justify-center my-3">
                <div className="w-px h-8 bg-border" />
              </div>
            )}

            {/* Target Role Nodes */}
            {latticeNodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {latticeNodes.map((track: any, idx: number) => (
                  <RoleLatticeNode
                    key={track.id}
                    targetRole={track.target_role}
                    skillsMatchPct={track.skills_match_pct || 0}
                    valuesScore={track.values_alignment_score || 0}
                    missingSkills={track.missing_skills || []}
                    completedSkills={track.completed_skills || []}
                    status={track.status}
                    moveType={getMoveLabel(track)}
                    MoveIcon={getMoveIcon(track)}
                    gapAnalysis={track.gap_analysis}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Compass className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No target roles yet. Add one below to start mapping your path.
              </div>
            )}
          </div>

          {/* Add target role */}
          <div className="mt-6 flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Enter a target role (e.g., TA Manager, Staff Engineer)..."
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTarget.mutate(targetInput); }}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => addTarget.mutate(targetInput)}
              disabled={!targetInput.trim() || addTarget.isPending}
            >
              {addTarget.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Gap Summary */}
      {latticeNodes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-[hsl(var(--civic-yellow))]" /> Skills Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latticeNodes.map((track: any) => (
              <div key={track.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{track.target_role}</p>
                  <Badge
                    variant={track.skills_match_pct >= 75 ? "success" : track.skills_match_pct >= 50 ? "warning" : "secondary"}
                    className="text-xs"
                  >
                    {track.skills_match_pct}% match
                  </Badge>
                </div>
                <Progress value={track.skills_match_pct} className="h-2" />
                {track.gap_analysis?.suggested_next && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(track.gap_analysis.suggested_next as string[]).slice(0, 3).map((suggestion: string, i: number) => (
                      <span key={i} className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> {suggestion}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Internal Gigs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[hsl(var(--civic-green))]" /> Internal Gigs & Stretch Projects
          </CardTitle>
          <p className="text-xs text-muted-foreground">Short-term projects to build missing skills for your target roles.</p>
        </CardHeader>
        <CardContent>
          {gigs && gigs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gigs.map((gig: any) => (
                <InternalGigCard
                  key={gig.id}
                  title={gig.title}
                  description={gig.description}
                  skillsOffered={gig.skills_offered || []}
                  durationWeeks={gig.duration_weeks}
                  department={gig.department}
                  missingSkills={latticeNodes.flatMap((t: any) => t.missing_skills || [])}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No internal gigs available"
              description="Internal gig opportunities will appear here as companies publish stretch projects and rotational assignments."
            />
          )}
        </CardContent>
      </Card>

      {/* Completed / Achieved tracks */}
      {(tracks || []).some((t: any) => t.status === "achieved") && (
        <Card className="border-[hsl(var(--civic-green))]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" /> Achieved Moves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(tracks || []).filter((t: any) => t.status === "achieved").map((track: any) => (
                <div key={track.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />
                  <span className="font-medium text-foreground">{track.target_role}</span>
                  <Badge variant="success" className="text-xs">Achieved</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
