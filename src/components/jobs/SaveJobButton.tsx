import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveJobButtonProps {
  job: {
    id: string;
    title: string;
    company_id: string;
    companies?: { name: string } | null;
  };
  size?: "sm" | "icon";
  className?: string;
}

export function SaveJobButton({ job, size = "icon", className }: SaveJobButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: saved } = useQuery({
    queryKey: ["saved-job", user?.id, job.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications_tracker")
        .select("id")
        .eq("user_id", user!.id)
        .eq("job_id", job.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const { mutate: saveJob, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications_tracker").insert({
        user_id: user!.id,
        job_id: job.id,
        company_id: job.company_id,
        company_name: (job.companies as any)?.name || "Unknown",
        job_title: job.title,
        status: "saved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-job", user?.id, job.id] });
      toast.success("Job saved to your tracker");
    },
    onError: () => toast.error("Couldn't save job"),
  });

  if (!user) return null;

  const isSaved = !!saved;

  return (
    <Button
      size={size}
      variant={isSaved ? "secondary" : "outline"}
      className={cn(
        "shrink-0",
        size === "icon" && "h-9 w-9",
        className,
      )}
      disabled={isSaved || isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        saveJob();
      }}
      title={isSaved ? "Saved" : "Save job"}
    >
      <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
      {size === "sm" && <span className="ml-1">{isSaved ? "Saved" : "Save"}</span>}
    </Button>
  );
}
