import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { User, Briefcase, MapPin, Code, DollarSign } from "lucide-react";

export function CareerProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["career-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_career_profile")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Loading profile...</div>;

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="No career profile yet"
        description="Upload your resume in the Upload tab to auto-generate your career profile."
      />
    );
  }

  return (
    <div className="space-y-4">
      {profile.auto_generated && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
          ✨ This profile was auto-generated from your uploaded resume. You can update it manually below.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" /> Career Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.seniority_level && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Seniority</p>
              <Badge variant="secondary" className="capitalize">{profile.seniority_level}</Badge>
            </div>
          )}

          {profile.job_titles?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Job Titles</p>
              <div className="flex flex-wrap gap-1">
                {profile.job_titles.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Code className="w-3 h-3" /> Skills</p>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {profile.industries?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Industries</p>
              <div className="flex flex-wrap gap-1">
                {profile.industries.map((ind: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{ind}</Badge>
                ))}
              </div>
            </div>
          )}

          {profile.preferred_locations?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Preferred Locations</p>
              <div className="flex flex-wrap gap-1">
                {profile.preferred_locations.map((loc: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
                ))}
              </div>
            </div>
          )}

          {(profile.salary_range_min || profile.salary_range_max) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salary Range</p>
              <p className="text-sm text-foreground">
                {profile.salary_range_min ? `$${profile.salary_range_min.toLocaleString()}` : "N/A"} — {profile.salary_range_max ? `$${profile.salary_range_max.toLocaleString()}` : "N/A"}
              </p>
            </div>
          )}

          {profile.management_scope && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Management Scope</p>
              <p className="text-sm text-foreground">{profile.management_scope}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
