import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Loader2, ArrowRight, Mail } from "lucide-react";
import { dossierCompactBadgeText } from "@/domain/career/dossier-ui-labels";
import { useApplicationDossiers, dossierForApplication } from "@/hooks/use-application-dossiers";
import { format } from "date-fns";

const STATUSES = ["Considering", "Draft", "Submitted", "Interview", "Offer", "Rejected", "Ghosted"];

function statusColor(status: string) {
  switch (status) {
    case "Offer": return "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))]";
    case "Interview": return "bg-primary/10 text-primary";
    case "Submitted": case "Draft": return "bg-muted text-muted-foreground";
    case "Rejected": case "Ghosted": return "bg-destructive/10 text-destructive";
    default: return "bg-accent text-accent-foreground";
  }
}

export default function Applications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { applications, isLoading, updateStatus } = useApplicationsTracker();
  const { data: dossiers } = useApplicationDossiers();

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Your Applications</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/10">
          <CardContent className="py-12 text-center max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              Nothing in your pipeline yet. Track roles from matched jobs or add applications manually — submitted roles get an in-dashboard dossier receipt.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Button size="sm" variant="default" onClick={() => navigate("/dashboard?tab=matches")}>
                Matched jobs
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/jobs-feed")}>
                Jobs feed
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {applications.map((app: any) => {
            const dossier = dossierForApplication(dossiers, app.id);
            return (
            <Card
              key={app.id}
              className="hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {app.job_title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {app.company_name}
                  </p>
                  {app.updated_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Updated {format(new Date(app.updated_at), "MMM d, yyyy")}
                    </p>
                  )}
                  {dossier && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />
                      {dossierCompactBadgeText(dossier.email_status)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={app.status}
                    onValueChange={(val) => updateStatus.mutate({ id: app.id, status: val })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
