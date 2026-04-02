import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyWithWDIWFProps {
  companyId: string;
  companyName: string;
  companySlug?: string;
  alignmentScore?: number;
  matchedSignals?: string[];
  className?: string;
}

export function ApplyWithWDIWF({
  companyId,
  companyName,
  alignmentScore,
  matchedSignals,
  className,
}: ApplyWithWDIWFProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackApplication } = useApplicationsTracker();
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [applicationLink, setApplicationLink] = useState("");

  if (!user) return null;

  const handleCreate = () => {
    if (!jobTitle.trim()) return;
    trackApplication.mutate(
      {
        company_id: companyId,
        job_title: jobTitle.trim(),
        company_name: companyName,
        application_link: applicationLink || undefined,
        alignment_score: alignmentScore,
        matched_signals: matchedSignals,
        status: "Draft",
      },
      {
        onSuccess: () => {
          setOpen(false);
          navigate("/dashboard?tab=tracker");
        },
      }
    );
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className={cn("gap-1.5 text-xs font-semibold", className)}
      >
        <Shield className="w-3.5 h-3.5" />
        Apply with WDIWF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Apply to {companyName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every application gets a paper trail: your documents, their record, and a timeline you control.
            </p>

            <div>
              <Label>Job Title / Role</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Product Manager"
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label>Application Link (optional)</Label>
              <Input
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            {alignmentScore != null && alignmentScore > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-[hsl(var(--civic-green))]/5 border border-[hsl(var(--civic-green))]/20">
                <Shield className="w-4 h-4 text-[hsl(var(--civic-green))]" />
                <span className="text-xs font-medium text-foreground">
                  {alignmentScore}% values aligned with this employer
                </span>
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={!jobTitle.trim() || trackApplication.isPending}
              className="w-full gap-1.5"
            >
              {trackApplication.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Application Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
