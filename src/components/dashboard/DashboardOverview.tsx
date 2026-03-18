import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight, FileText, Building2, Upload, Bell,
  DollarSign, Briefcase, Search
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard-hub", user?.id],
    queryFn: async () => {
      const [tracked, apps, alerts, profile, docs] = await Promise.all([
        (supabase as any)
          .from("tracked_companies")
          .select("id, created_at, company:companies(name, slug, industry, civic_footprint_score)")
          .eq("user_id", user!.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("applications_tracker")
          .select("id, status, company_name, job_title, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        (supabase as any)
          .from("user_alerts")
          .select("id, change_description, company_name, signal_category, date_detected, created_at")
          .eq("user_id", user!.id)
          .order("date_detected", { ascending: false })
          .limit(3),
        (supabase as any)
          .from("user_career_profile")
          .select("target_salary_min, target_salary_max, skills, seniority_level, job_titles")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("user_documents")
          .select("id, document_type, status, parsed_signals, original_filename, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      return {
        tracked: tracked.data || [],
        apps: apps.data || [],
        alerts: alerts.data || [],
        profile: profile.data,
        docs: docs.data || [],
      };
    },
    enabled: !!user,
  });

  const tracked = data?.tracked || [];
  const apps = data?.apps || [];
  const alerts = data?.alerts || [];
  const profile = data?.profile;
  const docs = data?.docs || [];

  // Determine "continue where you left off" item
  const lastTracked = tracked[0];
  const lastApp = apps[0];

  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  return (
    <div className="space-y-5">
      {/* Section 1: Continue where you left off */}
      <motion.div {...anim(0)}>
        <Card className="border-border/40 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary to-primary/40" />
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Continue where you left off
            </h3>
            {lastTracked?.company ? (
              <Link
                to={`/company/${lastTracked.company.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 hover:shadow-sm transition-all group"
              >
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {lastTracked.company.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lastTracked.company.industry}
                    {lastTracked.company.civic_footprint_score != null && ` · Score: ${lastTracked.company.civic_footprint_score}/100`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0" />
              </Link>
            ) : lastApp ? (
              <div
                onClick={() => onNavigate("tracker")}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
              >
                <Briefcase className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {lastApp.job_title}
                  </p>
                  <p className="text-sm text-muted-foreground">{lastApp.company_name} · {lastApp.status}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0" />
              </div>
            ) : (
              <Link
                to="/check"
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 hover:shadow-sm transition-all group"
              >
                <Search className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Check your first company
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Search any employer for civic footprint & hiring signals
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0" />
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Companies you're evaluating */}
      {tracked.length > 0 && (
        <motion.div {...anim(0.08)}>
          <Card className="border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Companies you're evaluating
                </h3>
                <Button variant="ghost" size="sm" className="text-sm h-7" onClick={() => onNavigate("tracked")}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {tracked.map((t: any) => (
                  <Link
                    key={t.id}
                    to={`/company/${t.company?.slug}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {t.company?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.company?.industry && (
                        <span className="text-xs text-muted-foreground hidden sm:block">{t.company.industry}</span>
                      )}
                      {t.company?.civic_footprint_score != null && (
                        <Badge variant="outline" className="text-xs">
                          {t.company.civic_footprint_score}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section 3: Your compensation baseline */}
      <motion.div {...anim(0.14)}>
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Your compensation baseline
            </h3>
            {profile ? (
              <div className="flex flex-wrap gap-3">
                {(profile.target_salary_min || profile.target_salary_max) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
                    <DollarSign className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile.target_salary_min && profile.target_salary_max
                          ? `$${(profile.target_salary_min / 1000).toFixed(0)}k – $${(profile.target_salary_max / 1000).toFixed(0)}k`
                          : profile.target_salary_min
                          ? `From $${(profile.target_salary_min / 1000).toFixed(0)}k`
                          : `Up to $${(profile.target_salary_max / 1000).toFixed(0)}k`}
                      </p>
                      <p className="text-sm text-muted-foreground">Target range</p>
                    </div>
                  </div>
                )}
                {profile.skills?.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile.skills.length} skills</p>
                      <p className="text-sm text-muted-foreground">Detected from profile</p>
                    </div>
                  </div>
                )}
                {profile.seniority_level && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{profile.seniority_level}</p>
                      <p className="text-sm text-muted-foreground">Seniority level</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/career-map"
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 hover:shadow-sm transition-all group"
              >
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Upload your resume
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We'll extract skills & compensation context to power your evaluations
                  </p>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 4: Recent signals */}
      {alerts.length > 0 && (
        <motion.div {...anim(0.2)}>
          <Card className="border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                   Recent signals
                </h3>
                <Button variant="ghost" size="sm" className="text-sm h-7" onClick={() => onNavigate("alerts")}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border/20"
                  >
                    <Bell className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{alert.company_name}</span>
                        <Badge variant="outline" className="text-xs">{alert.signal_category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-1">
                        {alert.change_description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Documents & Applications */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Recent documents */}
        <motion.div {...anim(0.26)}>
          <Card className="border-border/40 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Recent Documents</h3>
                <Link to="/career-map" className="text-sm text-primary font-medium hover:underline">View all</Link>
              </div>
              {docs.length > 0 ? (
                <div className="space-y-2">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type.replace("_", " ")} · {doc.status === "parsed" ? "✓ Parsed" : doc.status}
                        </p>
                      </div>
                      {doc.status === "parsed" && doc.parsed_signals?.skills?.length > 0 && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {doc.parsed_signals.skills.length} skills
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                   <Button variant="link" size="sm" className="text-sm mt-1" asChild>
                     <Link to="/career-map">Upload Resume →</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent applications */}
        <motion.div {...anim(0.3)}>
          <Card className="border-border/40 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Recent Applications</h3>
                <Button variant="ghost" size="sm" className="text-sm h-7" onClick={() => onNavigate("tracker")}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {apps.length > 0 ? (
                <div className="space-y-2">
                  {apps.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{app.job_title}</p>
                        <p className="text-sm text-muted-foreground">{app.company_name}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          app.status === "applied" ? "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" :
                          app.status === "interviewing" ? "border-primary/30 text-primary" :
                          ""
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No applications tracked yet</p>
                   <Button variant="link" size="sm" className="text-sm mt-1" onClick={() => onNavigate("tracker")}>
                     Track an application →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
