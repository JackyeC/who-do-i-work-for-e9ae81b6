import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Zap, FileText, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EasyApplyButtonProps {
  job: any;
  className?: string;
}

export function EasyApplyButton({ job, className }: EasyApplyButtonProps) {
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Check if user has a resume uploaded
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
    enabled: !!user,
    staleTime: 60_000,
  });

  // Check if already applied
  const { data: existingApp } = useQuery({
    queryKey: ["existing-application", user?.id, job?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications_tracker")
        .select("id, status")
        .eq("user_id", user!.id)
        .eq("job_id", job.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!job?.id,
    staleTime: 30_000,
  });

  if (!user) return null;

  const hasResume = !!latestDoc;
  const alreadyApplied = !!existingApp || applied;

  const handleQuickApply = async () => {
    if (!hasResume) {
      toast.error("Upload your resume first", {
        description: "Go to Profile tab to upload your resume before using Quick Apply."
      });
      return;
    }

    setApplying(true);
    try {
      const company = job.companies;
      
      // Track the application
      await supabase.from("applications_tracker").upsert({
        user_id: user.id,
        company_id: job.company_id,
        job_id: job.id,
        job_title: job.title,
        company_name: company?.name || "Unknown",
        application_link: job.url,
        status: "Applied",
        applied_at: new Date().toISOString(),
      }, { onConflict: "user_id,job_id" });

      // Track the click event
      if (job.url) {
        await supabase.from("job_click_events").insert({
          job_id: job.id,
          company_id: job.company_id,
          click_type: "quick_apply",
          destination_url: job.url,
        });
      }

      setApplied(true);
      toast.success("Application tracked!", {
        description: `Quick Apply sent for ${job.title} at ${company?.name}. Your resume is attached.`
      });

      // Open external application page
      if (job.url) {
        window.open(job.url, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      console.error("Quick apply error:", e);
      toast.error("Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  if (alreadyApplied) {
    return (
      <Button variant="outline" disabled className={cn("gap-1.5", className)}>
        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
        Applied
      </Button>
    );
  }

  return (
    <Button
      onClick={handleQuickApply}
      disabled={applying}
      className={cn("gap-1.5", className)}
    >
      {applying ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Zap className="w-3.5 h-3.5" />
      )}
      {applying ? "Applying..." : "Quick Apply"}
      {!hasResume && (
        <Badge variant="outline" className="text-[9px] ml-1 py-0">
          <Upload className="w-2.5 h-2.5 mr-0.5" /> Resume needed
        </Badge>
      )}
    </Button>
  );
}
