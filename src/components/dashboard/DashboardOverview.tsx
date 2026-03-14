import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  User, Briefcase, Target, Bell, CheckCircle2, ArrowRight,
  FileText, Building2, Heart, Sparkles, TrendingUp, MapPin,
  GraduationCap, Zap, Search, Upload, Shield
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard-overview", user?.id],
    queryFn: async () => {
      const [profile, docs, apps, alerts, values, tracked, watchlist] = await Promise.all([
        (supabase as any).from("user_career_profile").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_documents").select("id, document_type, status, parsed_signals, original_filename, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("applications_tracker").select("id, status, company_name, job_title", { count: "exact" }).eq("user_id", user!.id).order("created_at", { ascending: false }).limit(3),
        (supabase as any).from("user_alerts").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        (supabase as any).from("user_values_profile").select("id").eq("user_id", user!.id).maybeSingle(),
        (supabase as any).from("tracked_companies").select("id, company:companies(name, industry)", { count: "exact" }).eq("user_id", user!.id).eq("is_active", true).limit(3),
        supabase.from("user_company_watchlist").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        profile: profile.data,
        docs: docs.data || [],
        apps: apps.data || [],
        appCount: apps.count || 0,
        alertCount: alerts.count || 0,
        values: values.data,
        tracked: tracked.data || [],
        trackedCount: tracked.count || 0,
        watchCount: watchlist.count || 0,
      };
    },
    enabled: !!user,
  });

  const profile = data?.profile;
  const parsedResume = data?.docs?.find((d: any) => d.document_type === "resume" && d.status === "parsed");
  const resumeSignals = parsedResume?.parsed_signals as Record<string, any> | undefined;
  const hasProfile = !!(profile?.job_titles?.length || profile?.skills?.length);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = resumeSignals?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-display">
              {greeting()}, {displayName.split(" ")[0]}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {hasProfile
                ? "Your intelligence dashboard is active. Here's what's happening."
                : "Let's get your career intelligence set up."}
            </p>
          </div>
          {resumeSignals?.seniority_level && (
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary shrink-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              {resumeSignals.seniority_level.charAt(0).toUpperCase() + resumeSignals.seniority_level.slice(1)} Level
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Applications", value: data?.appCount ?? 0, icon: Briefcase, color: "civic-blue", action: () => onNavigate("tracker") },
          { label: "Tracked Companies", value: data?.trackedCount ?? 0, icon: Building2, color: "civic-green", action: () => onNavigate("tracked") },
          { label: "Unread Alerts", value: data?.alertCount ?? 0, icon: Bell, color: "civic-gold", action: () => onNavigate("alerts") },
          { label: "Skills Detected", value: profile?.skills?.length ?? 0, icon: Zap, color: "primary", action: () => onNavigate("how") },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            onClick={stat.action}
            className="bg-card rounded-xl border border-border/40 p-4 cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all group h-full"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 text-[hsl(var(--${stat.color}))]`} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all" />
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Profile Intelligence Card — only if resume parsed */}
      {hasProfile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-border/40 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-primary via-[hsl(var(--civic-gold))] to-[hsl(var(--civic-green))]" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Your Career Profile</h3>
                  <p className="text-xs text-muted-foreground">
                    {resumeSignals?.years_experience ? `${resumeSignals.years_experience}+ years` : ""}
                    {resumeSignals?.years_experience && profile?.industries?.length ? " · " : ""}
                    {profile?.industries?.slice(0, 3).join(", ")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("how")}>
                  View Full Profile <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {/* Professional bio */}
              {resumeSignals?.professional_bio && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 bg-muted/30 rounded-lg p-3 border border-border/30">
                  "{resumeSignals.professional_bio}"
                </p>
              )}

              {/* Job titles */}
              {profile?.job_titles?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Experience
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.job_titles.slice(0, 5).map((title: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[11px] font-medium">
                        {title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Top skills */}
              {profile?.skills?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Top Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 12).map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 border border-primary/10 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 12 && (
                      <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5">
                        +{profile.skills.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick actions — when profile is incomplete */}
      {!hasProfile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card className="border-border/40 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-primary to-[hsl(var(--civic-gold))]" />
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-1">Get Started</h3>
              <p className="text-xs text-muted-foreground mb-4">Complete these steps to unlock personalized career intelligence.</p>
              <div className="space-y-2">
                {[
                  {
                    done: !!data?.values,
                    label: "Set your workplace values",
                    desc: "What matters — pay transparency, worker protections, AI ethics.",
                    icon: Heart,
                    action: () => onNavigate("values"),
                  },
                  {
                    done: hasProfile,
                    label: "Upload your resume",
                    desc: "We'll extract skills & experience to power career matching.",
                    icon: Upload,
                    action: () => window.location.href = "/career-map",
                  },
                  {
                    done: (data?.appCount || 0) > 0,
                    label: "Check your first company",
                    desc: "Search any employer for civic footprint & hiring signals.",
                    icon: Search,
                    action: () => window.location.href = "/check",
                  },
                ].map((step) => (
                  <div
                    key={step.label}
                    onClick={!step.done ? step.action : undefined}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      step.done
                        ? "bg-muted/20 opacity-60"
                        : "bg-card border border-border/30 hover:border-primary/20 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--civic-green))] shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <step.icon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {step.label}
                      </p>
                      {!step.done && <p className="text-xs text-muted-foreground">{step.desc}</p>}
                    </div>
                    {!step.done && <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two-column: Recent Activity + Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Recent documents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <Card className="border-border/40 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Recent Documents</h3>
                <Link to="/career-map" className="text-[11px] text-primary font-medium hover:underline">View all</Link>
              </div>
              {data?.docs && data.docs.length > 0 ? (
                <div className="space-y-2">
                  {data.docs.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{doc.original_filename}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.document_type.replace("_", " ")} · {doc.status === "parsed" ? "✓ Parsed" : doc.status}
                        </p>
                      </div>
                      {doc.status === "parsed" && doc.parsed_signals?.skills?.length > 0 && (
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {doc.parsed_signals.skills.length} skills
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
                  <Button variant="link" size="sm" className="text-xs mt-1" asChild>
                    <Link to="/career-map">Upload Resume →</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-border/40 h-full">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  { label: "Check a company", icon: Search, href: "/check", desc: "Civic footprint & signals" },
                  { label: "Career Discovery", icon: Sparkles, href: "/career-map", desc: "AI-powered path mapping" },
                  { label: "Offer Check", icon: Shield, href: "/check?tab=offer", desc: "Analyze any job offer" },
                  { label: "Browse companies", icon: Building2, href: "/browse", desc: "Explore the database" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent applications */}
      {data?.apps && data.apps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Card className="border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Recent Applications</h3>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("tracker")}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {data.apps.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{app.job_title}</p>
                      <p className="text-[10px] text-muted-foreground">{app.company_name}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
