import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Upload,
  AlertCircle,
} from "lucide-react";

interface QuickApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  onApplied: () => void;
}

export function QuickApplyDialog({
  open,
  onOpenChange,
  job,
  onApplied,
}: QuickApplyDialogProps) {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [pitch, setPitch] = useState("");
  const [valuesNote, setValuesNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState(false);

  const { data: latestDoc } = useQuery({
    queryKey: ["latest-resume", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_documents")
        .select("id, file_path, original_filename, created_at")
        .eq("user_id", user!.id)
        .eq("document_type", "resume")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open && !generated && job?.company_id && user) {
      generateCoverLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.company_id]);

  const generateCoverLetter = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-application-payload",
        { body: { company_id: job.company_id } }
      );

      if (error) throw error;

      const payload = data?.payload;
      if (payload) {
        setCoverLetter(payload.matchingStatement || "");
        setPitch(payload.targetedIntro || "");
        setValuesNote(payload.valuesCheck || "");
        setGenerated(true);
      }
    } catch (e: any) {
      console.error("Cover letter generation error:", e);
      toast.error("Couldn't generate cover letter", {
        description: "You can still write your own below.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!user || !job) return;
    setSubmitting(true);

    try {
      const company = job.companies;

      await supabase.from("applications_tracker").upsert(
        {
          user_id: user.id,
          company_id: job.company_id,
          job_id: job.id,
          job_title: job.title,
          company_name: company?.name || "Unknown",
          application_link: job.url,
          status: "Applied",
          applied_at: new Date().toISOString(),
          cover_letter_text: coverLetter || null,
        } as any,
        { onConflict: "user_id,job_id" }
      );

      if (job.url) {
        await supabase.from("job_click_events").insert({
          job_id: job.id,
          company_id: job.company_id,
          click_type: "quick_apply",
          destination_url: job.url,
        });
      }

      onApplied();
      toast.success("Application tracked!", {
        description: `Applied for ${job.title} at ${company?.name}. Cover letter saved.`,
      });

      if (job.url) {
        window.open(job.url, "_blank", "noopener,noreferrer");
      }

      onOpenChange(false);
    } catch (e: any) {
      console.error("Quick apply error:", e);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCoverLetter("");
    setPitch("");
    setValuesNote("");
    setGenerated(false);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const company = job?.companies;
  const uploadDate = latestDoc?.created_at
    ? new Date(latestDoc.created_at).toLocaleDateString()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Apply — {job?.title}
          </DialogTitle>
          <DialogDescription>
            {company?.name} • Review your resume &amp; AI-generated cover letter
            before applying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resume Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              Resume
            </p>
            {latestDoc ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    {latestDoc.original_filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {uploadDate}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive">
                  No resume uploaded.{" "}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="underline text-primary hover:text-primary/80"
                  >
                    Go to Profile tab
                  </button>{" "}
                  to upload one.
                </p>
              </div>
            )}
          </div>

          {/* Values Alignment */}
          {(pitch || valuesNote) && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
              {pitch && (
                <p className="text-sm font-medium text-foreground">{pitch}</p>
              )}
              {valuesNote && (
                <p className="text-xs text-muted-foreground italic">
                  {valuesNote}
                </p>
              )}
            </div>
          )}

          {/* Cover Letter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Cover Letter
              </label>
              {generated && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Generated
                </Badge>
              )}
            </div>
            {generating ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  Crafting your cover letter...
                </span>
              </div>
            ) : (
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Your cover letter will appear here, or write your own..."
                className="min-h-[180px] resize-y text-sm"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Edit freely — this is saved with your application for reference.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApply}
            disabled={submitting || generating}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {submitting ? "Submitting..." : "Confirm & Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
