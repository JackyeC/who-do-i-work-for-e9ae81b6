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
  Target, Compass, Plus, Loader2, CheckCircle2,
  ArrowUpRight, ArrowRightLeft, ArrowUp, Clock,
  MapPin, Flag, ChevronDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SmartGoalsSection } from "./SmartGoalsSection";
import { cn } from "@/lib/utils";

export function CareerJourneyTimeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [targetInput, setTargetInput] = useState("");

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

  const { data: tracks, isLoading } = useQuery({
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
      toast.success("Career path mapped! AI generated your gap analysis and SMART goals.");
      setTargetInput("");
      queryClient.invalidateQueries({ queryKey: ["growth-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["smart-goals"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to analyze target role"),
  });

  const cleanTitles = ((profile as any)?.preferred_titles || []).filter((t: string) => t && t.toLowerCase() !== "unknown");
  const cleanJobTitles = (profile?.job_titles || []).filter((t: string) => t && t.toLowerCase() !== "unknown");
  const currentRole = cleanTitles[0] || cleanJobTitles[0] || "Your Current Role";
  const currentSkills = profile?.skills || [];

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

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading career map...</div>;
  }

  const activeTrack = (tracks || []).find((t: any) => t.status !== "achieved");

  return (
    <div className="space-y-6">
      {/* Three Questions Framework */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question 1</p>
            <p className="text-sm font-semibold text-foreground">Where am I now?</p>
            <p className="text-xs text-muted-foreground mt-1">{currentRole}</p>
          </CardContent>
        </Card>
        <Card className={cn("border-border", activeTrack ? "border-primary/20 bg-primary/5" : "")}>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question 2</p>
            <p className="text-sm font-semibold text-foreground">Where do I want to go?</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTrack ? (activeTrack as any).target_role : "Set a target below"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Flag className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question 3</p>
            <p className="text-sm font-semibold text-foreground">What do I need to do?</p>
            <p className="text-xs text-muted-foreground mt-1">SMART goals & skills below</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Journey */}
      {(tracks || []).length > 0 ? (
        <div className="space-y-4">
          {(tracks || []).map((track: any) => {
            const MoveIcon = getMoveIcon(track);
            const moveLabel = getMoveLabel(track);
            const isAchieved = track.status === "achieved";

            return (
              <JourneyCard
                key={track.id}
                track={track}
                currentRole={currentRole}
                currentSkills={currentSkills}
                MoveIcon={MoveIcon}
                moveLabel={moveLabel}
                isAchieved={isAchieved}
                userId={user!.id}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="py-12 text-center">
            <Compass className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground mb-2 font-display">Start Your Career Map</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Enter a role you'd like to grow into. AI will analyze the gap between where you are now and where you want to be,
              then generate personalized SMART goals to get you there.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add target role */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add a Career Destination
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Where do you want to go? (e.g., Marketing Manager, Staff Engineer, VP of Sales)"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && targetInput.trim()) addTarget.mutate(targetInput); }}
              className="text-sm"
            />
            <Button
              onClick={() => addTarget.mutate(targetInput)}
              disabled={!targetInput.trim() || addTarget.isPending}
            >
              {addTarget.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Mapping...</>
              ) : (
                "Map Path"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achieved tracks */}
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

function JourneyCard({ track, currentRole, currentSkills, MoveIcon, moveLabel, isAchieved, userId }: {
  track: any; currentRole: string; currentSkills: string[];
  MoveIcon: any; moveLabel: string; isAchieved: boolean; userId: string;
}) {
  const [expanded, setExpanded] = useState(!isAchieved);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className={cn(
        "overflow-hidden transition-all",
        isAchieved ? "border-[hsl(var(--civic-green))]/30 opacity-75" : "border-primary/20"
      )}>
        {/* Journey visual: Start → Progress → Destination */}
        <div className="bg-muted/30 px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            {/* Start */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{currentRole}</span>
            </div>

            {/* Progress line */}
            <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isAchieved ? "bg-[hsl(var(--civic-green))]" : "bg-primary"
                )}
                style={{ width: `${track.skills_match_pct || 0}%` }}
              />
            </div>

            {/* Destination */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">{track.target_role}</span>
              <div className={cn(
                "w-3 h-3 rounded-full",
                isAchieved ? "bg-[hsl(var(--civic-green))]" : "bg-primary"
              )} />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Key metrics */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] gap-1">
                <MoveIcon className="w-3 h-3" /> {moveLabel}
              </Badge>
              <Badge
                variant={track.skills_match_pct >= 75 ? "success" : track.skills_match_pct >= 50 ? "warning" : "secondary"}
                className="text-xs"
              >
                {track.skills_match_pct}% skills match
              </Badge>
              {track.gap_analysis?.estimated_months && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{track.gap_analysis.estimated_months} months
                </span>
              )}
            </div>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
                {expanded ? "Collapse" : "Details"}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Skills comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Matching skills */}
              {(track.completed_skills || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your Matching Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {track.completed_skills.slice(0, 6).map((s: string, i: number) => (
                      <span key={i} className="text-[10px] bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] rounded px-1.5 py-0.5 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {(track.missing_skills || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Skills to Build</p>
                  <div className="flex flex-wrap gap-1">
                    {track.missing_skills.map((s: string, i: number) => (
                      <span key={i} className="text-[10px] bg-[hsl(var(--civic-red))]/10 text-[hsl(var(--civic-red))] rounded px-1.5 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggested next steps */}
            {track.gap_analysis?.suggested_next && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Recommended Steps</p>
                <ul className="space-y-1">
                  {(track.gap_analysis.suggested_next as string[]).map((step: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary font-semibold">{i + 1}.</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SMART Goals */}
            <SmartGoalsSection trackId={track.id} userId={userId} targetRole={track.target_role} />
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
