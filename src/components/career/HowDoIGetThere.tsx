import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import {
  GraduationCap, Target, Users, Building2, ExternalLink,
  BookOpen, Video, Award, Newspaper, ChevronRight, Compass,
  Loader2
} from "lucide-react";

const RESOURCE_ICONS: Record<string, any> = {
  course: GraduationCap,
  certificate: Award,
  article: Newspaper,
  book: BookOpen,
  video: Video,
  community: Users,
};

export function HowDoIGetThere() {
  const { user } = useAuth();

  // Fetch growth tracks (target roles with gap analysis)
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

  // Collect all missing skills from tracks
  const allMissingSkills = [...new Set(
    (tracks || []).flatMap((t: any) => (t.missing_skills || []).map((s: string) => s.toLowerCase()))
  )];

  // Fetch learning resources matching missing skills
  const { data: resources } = useQuery({
    queryKey: ["learning-resources", allMissingSkills],
    queryFn: async () => {
      if (allMissingSkills.length === 0) return [];
      const { data } = await (supabase as any)
        .from("learning_resources")
        .select("*")
        .limit(50);
      // Filter client-side for flexible matching
      return (data || []).filter((r: any) =>
        allMissingSkills.some(skill =>
          r.skill_tag?.toLowerCase().includes(skill) || skill.includes(r.skill_tag?.toLowerCase())
        )
      );
    },
    enabled: allMissingSkills.length > 0,
  });

  // Fetch suggested companies for target roles
  const { data: suggestedCompanies } = useQuery({
    queryKey: ["suggested-companies-for-roles", tracks?.length],
    queryFn: async () => {
      if (!tracks || tracks.length === 0) return [];
      // Find companies with active jobs matching target roles
      const targetRoles = tracks.map((t: any) => t.target_role).filter(Boolean);
      const { data } = await supabase
        .from("company_jobs")
        .select("company_id, title, companies(id, name, slug, civic_footprint_score)")
        .eq("is_active", true)
        .limit(100);

      if (!data) return [];
      // Filter for target role matches
      const matches = data.filter((j: any) =>
        targetRoles.some((role: string) =>
          j.title?.toLowerCase().includes(role.toLowerCase().split(" ")[0])
        )
      );
      // Deduplicate by company
      const seen = new Set();
      return matches.filter((m: any) => {
        if (!m.companies || seen.has(m.companies.id)) return false;
        seen.add(m.companies.id);
        return true;
      }).slice(0, 6);
    },
    enabled: !!tracks && tracks.length > 0,
  });

  if (tracksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Set a target role first"
        description="Go to the Next Move tab and add a target role to get personalized path recommendations."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Path cards per target role */}
      {tracks.filter((t: any) => t.status !== "achieved").slice(0, 3).map((track: any) => (
        <Card key={track.id} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 font-display">
                <Target className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
                Path to: {track.target_role}
              </CardTitle>
              <Badge variant={track.skills_match_pct >= 75 ? "success" : "secondary"} className="text-xs">
                {track.skills_match_pct}% ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Why it matches */}
            {track.gap_analysis?.rationale && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Why this fits you: </span>
                {track.gap_analysis.rationale}
              </div>
            )}

            {/* Skill gaps */}
            {(track.missing_skills || []).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Skills to Build</h4>
                <div className="flex flex-wrap gap-1.5">
                  {track.missing_skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Learning resources for this track's skills */}
            {resources && resources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[hsl(var(--civic-green))]" />
                  Recommended Learning
                </h4>
                <div className="space-y-2">
                  {resources
                    .filter((r: any) =>
                      (track.missing_skills || []).some((ms: string) =>
                        r.skill_tag?.toLowerCase().includes(ms.toLowerCase()) ||
                        ms.toLowerCase().includes(r.skill_tag?.toLowerCase())
                      )
                    )
                    .slice(0, 4)
                    .map((r: any) => {
                      const Icon = RESOURCE_ICONS[r.resource_type] || BookOpen;
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Icon className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{r.resource_title}</p>
                            <p className="text-xs text-muted-foreground">{r.provider_name} · {r.level} · {r.estimated_time || "Self-paced"}</p>
                          </div>
                          {r.resource_url && (
                            <a href={r.resource_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Suggested next steps */}
            {track.gap_analysis?.suggested_next && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Next Steps</h4>
                <div className="space-y-1">
                  {(track.gap_analysis.suggested_next as string[]).slice(0, 4).map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Suggested companies */}
      {suggestedCompanies && suggestedCompanies.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display">
              <Building2 className="w-4 h-4 text-[hsl(var(--civic-green))]" />
              Companies Hiring for Your Target Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedCompanies.map((match: any) => (
                <a
                  key={match.companies.id}
                  href={`/company/${match.companies.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{match.companies.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.title}</p>
                  </div>
                  {match.companies.civic_footprint_score > 0 && (
                    <Badge variant="outline" className="text-xs ml-auto shrink-0">
                      CF {match.companies.civic_footprint_score}
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
