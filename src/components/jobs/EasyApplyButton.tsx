import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Zap, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickApplyDialog } from "./QuickApplyDialog";

interface EasyApplyButtonProps {
  job: any;
  className?: string;
}

export function EasyApplyButton({ job, className }: EasyApplyButtonProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applied, setApplied] = useState(false);

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

  const handleClick = () => {
    if (!hasResume) {
      toast.error("Upload your resume first", {
        description:
          "Go to Profile tab to upload your resume before using Quick Apply.",
      });
      return;
    }
    setDialogOpen(true);
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
    <>
      <Button
        onClick={handleClick}
        className={cn("gap-1.5", className)}
      >
        <Zap className="w-3.5 h-3.5" />
        Quick Apply
        {!hasResume && (
          <Badge variant="outline" className="text-[9px] ml-1 py-0">
            <Upload className="w-2.5 h-2.5 mr-0.5" /> Resume needed
          </Badge>
        )}
      </Button>
      <QuickApplyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={job}
        onApplied={() => setApplied(true)}
      />
    </>
  );
}
