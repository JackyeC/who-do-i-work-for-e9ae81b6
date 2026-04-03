import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStepper } from "@/components/jobs/ApplicationStepper";
import { ApplicationDocumentVault } from "@/components/applications/DocumentVault";
import { WhatToExpect } from "@/components/applications/WhatToExpect";
import { ApplicationIntelligencePanel } from "@/components/applications/IntelligencePanel";
import { ApplicationTimeline } from "@/components/applications/Timeline";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, Shield, Calendar, ExternalLink, Building2, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { cn } from "@/lib/utils";

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const { applications, isLoading, updateStatus } = useApplicationsTracker();
  const app = applications.find((a: any) => a.id === id);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!app) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Application not found</h2>
            <p className="text-sm text-muted-foreground mb-4">This application may have been deleted.</p>
            <Button asChild variant="outline">
              <Link to="/dashboard?tab=tracker">Back to Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>{app.job_title} at {app.company_name} — Application | WDIWF</title>
      </Helmet>

      {/* Back nav */}
      <Link
        to="/dashboard?tab=tracker"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground font-display mb-1">
                {app.job_title}
              </h1>
              <Link
                to={`/dossier/${app.company_name?.toLowerCase().replace(/\s+/g, "-")}`}
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
              >
                <Building2 className="w-4 h-4" />
                {app.company_name}
              </Link>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {app.alignment_score > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" />
                    {app.alignment_score}% values aligned
                  </Badge>
                )}
                {app.applied_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Applied {format(new Date(app.applied_at), "MMMM d, yyyy")}
                  </span>
                )}
                {app.application_link && (
                  <a
                    href={app.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View posting
                  </a>
                )}
              </div>

              {/* Signal badges */}
              {(app.matched_signals as string[] || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(app.matched_signals as string[]).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1.5 font-medium",
                  app.status === "Offered" && "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30",
                  app.status === "Rejected" && "bg-destructive/10 text-destructive border-destructive/30",
                  app.status === "Submitted" && "bg-primary/10 text-primary border-primary/30",
                  app.status === "Interviewing" && "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30",
                )}
              >
                {app.status}
              </Badge>
            </div>
          </div>

          {/* Status stepper */}
          <div className="mt-5 pt-5 border-t border-border/30">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Progress</p>
            <ApplicationStepper
              currentStatus={app.status}
              onStatusChange={(status) => updateStatus.mutate({ id: app.id, status })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status timeline */}
          <ApplicationTimeline application={app} />

          {/* Document vault */}
          <ApplicationDocumentVault applicationId={app.id} />

          {/* Notes */}
          {app.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {app.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — intelligence + expectations */}
        <div className="space-y-6">
          <WhatToExpect status={app.status} appliedAt={app.applied_at} />
          <ApplicationIntelligencePanel
            companyId={app.company_id}
            companyName={app.company_name}
          />
        </div>
      </div>
    </div>
  );
}
