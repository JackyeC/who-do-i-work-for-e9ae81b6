import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Target, Compass, Plus, Loader2, CheckCircle2,
  ArrowUpRight, ArrowRightLeft, ArrowUp, Clock,
  MapPin, Flag, ChevronDown, Sparkles
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SmartGoalsSection } from "./SmartGoalsSection";
import { CareerPathPreviewCard } from "./CareerPathPreviewCard";
import { CareerReportView } from "./CareerReportView";
import { cn } from "@/lib/utils";

export function CareerJourneyTimeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [targetInput, setTargetInput] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

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
    onSuccess: (data) => {
      toast.success("Career path mapped! Full report ready.");
      setTargetInput("");
      queryClient.invalidateQueries({ queryKey: ["growth-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["smart-goals"] });
      if (data?.track?.id) setSelectedTrackId(data.track.id);
    },
    onError: (e: any) => toast.error(e.message || "Failed to analyze target role"),
  });

  const cleanTitles = ((profile as any)?.preferred_titles || []).filter((t: string) => t && t.toLowerCase() !== "unknown");
  const cleanJobTitles = (profile?.job_titles || []).filter((t: string) => t && t.toLowerCase() !== "unknown");
  const currentRole = cleanTitles[0] || cleanJobTitles[0] || "Your Current Role";
  const currentSkills = profile?.skills || [];

  const activeTracks = (tracks || []).filter((t: any) => t.status !== "achieved");
  const achievedTracks = (tracks || []).filter((t: any) => t.status === "achieved");
  const selectedTrack = selectedTrackId
    ? (tracks || []).find((t: any) => t.id === selectedTrackId)
    : activeTracks[0];

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading career map...</div>;
  }

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
        <Card className={cn("border-border", selectedTrack ? "border-primary/20 bg-primary/5" : "")}>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question 2</p>
            <p className="text-sm font-semibold text-foreground">Where do I want to go?</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedTrack ? (selectedTrack as any).target_role : "Set a target below"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Flag className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Question 3</p>
            <p className="text-sm font-semibold text-foreground">What do I need to do?</p>
            <p className="text-xs text-muted-foreground mt-1">Full report & SMART goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Preview Cards — like Share2Inspire */}
      {activeTracks.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Your Career Paths
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTracks.map((track: any) => (
              <CareerPathPreviewCard
                key={track.id}
                label={track.gap_analysis?.career_path_label || track.target_role}
                matchPct={track.skills_match_pct || 0}
                currentRole={currentRole}
                targetRole={track.target_role}
                summary={track.gap_analysis?.career_path_summary || `${(track.missing_skills || []).slice(0, 3).join(", ")}`}
                isActive={selectedTrack?.id === track.id}
                onClick={() => setSelectedTrackId(track.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Track Full Report */}
      {selectedTrack && (
        <div className="space-y-4">
          <CareerReportView
            track={selectedTrack}
            currentRole={currentRole}
            currentSkills={currentSkills}
          />

          {/* SMART Goals for selected track */}
          <Card className="border-border">
            <CardContent className="p-4">
              <SmartGoalsSection
                trackId={selectedTrack.id}
                userId={user!.id}
                targetRole={selectedTrack.target_role}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {activeTracks.length === 0 && (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="py-12 text-center">
            <Compass className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground mb-2 font-display">Start Your Career Map</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-1">
              Enter a role you'd like to grow into. AI will generate a full career report with:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {["Career Roadmap", "Gap Analysis", "Salary Estimate", "Training", "Networking", "30-60-90 Plan"].map(f => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
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
          {addTarget.isPending && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI is analyzing your profile, estimating salary ranges, and building your 30-60-90 day plan...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Achieved tracks */}
      {achievedTracks.length > 0 && (
        <Card className="border-[hsl(var(--civic-green))]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))]" /> Achieved Moves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievedTracks.map((track: any) => (
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
