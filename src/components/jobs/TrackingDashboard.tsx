import { useState } from "react";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LayoutDashboard, Trash2, ExternalLink, Shield, Calendar,
  Search, StickyNote, ChevronDown, ChevronUp, FileText, BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { ApplicationStepper } from "./ApplicationStepper";
import { ApplicationAnalytics } from "./ApplicationAnalytics";

const STATUSES = ["Draft", "Submitted", "Interviewing", "Offered", "Rejected", "Withdrawn"] as const;

function ApplicationCard({ app, updateStatus, deleteApp }: {
  app: any;
  updateStatus: any;
  deleteApp: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(app.notes || "");
  const [saving, setSaving] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await supabase
        .from("applications_tracker")
        .update({ notes })
        .eq("id", app.id)
        .eq("user_id", user!.id);
      queryClient.invalidateQueries({ queryKey: ["applications-tracker"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link to={`/applications/${app.id}`} className="font-medium text-foreground truncate hover:text-primary transition-colors">
                  {app.job_title}
                </Link>
              </div>
              <Link
                to={`/dossier/${app.company_name?.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-primary hover:underline"
              >
                {app.company_name}
              </Link>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                {app.alignment_score > 0 && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {app.alignment_score}% aligned
                  </span>
                )}
                {app.applied_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(app.applied_at), "MMM d, yyyy")}
                  </span>
                )}
                {(app.matched_signals as string[] || []).slice(0, 3).map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
                {app.notes && !expanded && (
                  <span className="flex items-center gap-1 text-primary">
                    <StickyNote className="w-3 h-3" />
                    Notes
                  </span>
                )}
                {app.cover_letter_text && !expanded && (
                  <span className="flex items-center gap-1 text-primary">
                    <FileText className="w-3 h-3" />
                    Cover letter
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
              {app.application_link && (
                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                  <a href={app.application_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteApp.mutate(app.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <ApplicationStepper
            currentStatus={app.status}
            onStatusChange={(status) => updateStatus.mutate({ id: app.id, status })}
            compact
          />
        </div>

        {/* Expandable section */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            {/* Cover letter */}
            {app.cover_letter_text && (
              <div>
                <button
                  onClick={() => setShowCoverLetter(!showCoverLetter)}
                  className="text-xs font-medium text-primary flex items-center gap-1 mb-1"
                >
                  <FileText className="w-3 h-3" />
                  {showCoverLetter ? "Hide cover letter" : "View saved cover letter"}
                </button>
                {showCoverLetter && (
                  <div className="bg-muted/50 rounded-md p-3 text-xs text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto border border-border/50">
                    {app.cover_letter_text}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <Textarea
              placeholder="Add notes about this application (interview prep, contacts, follow-ups...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              disabled={saving || notes === (app.notes || "")}
              className="text-xs h-7"
            >
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type StatusTab = "all" | typeof STATUSES[number];

export function TrackingDashboard() {
  const { applications, isLoading, updateStatus, deleteApp } = useApplicationsTracker();
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"pipeline" | "analytics">("pipeline");

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  // Group counts
  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a: any) => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Filter
  const filtered = applications.filter((app: any) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery ||
      app.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No applications tracked</h3>
          <p className="text-muted-foreground text-sm">
            Apply to jobs from the "Matched Jobs" tab to start tracking your pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === "pipeline" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setView("pipeline")}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Pipeline
        </Button>
        <Button
          variant={view === "analytics" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setView("analytics")}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analytics
        </Button>
      </div>

      {view === "analytics" ? (
        <ApplicationAnalytics />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {STATUSES.map(status => (
              <Card
                key={status}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm",
                  statusFilter === status && "ring-2 ring-primary/50"
                )}
                onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              >
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{grouped[status] || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Status filter tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3 h-7">All ({applications.length})</TabsTrigger>
              {STATUSES.filter(s => grouped[s] > 0).map(s => (
                <TabsTrigger key={s} value={s} className="text-xs px-3 h-7">
                  {s} ({grouped[s]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Application list */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No applications match your search." : "No applications with this status."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((app: any) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  updateStatus={updateStatus}
                  deleteApp={deleteApp}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
