import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export function DataWipeButton() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleWipe = async () => {
    if (!user) return;
    setWiping(true);

    try {
      // List and delete all files in the user's folder
      const { data: files } = await supabase.storage
        .from("career_docs")
        .list(user.id);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("career_docs").remove(paths);
      }

      // Delete all career documents
      await supabase.from("user_documents").delete().eq("user_id", user.id);

      // Delete offer analysis data
      await supabase.from("offer_scores").delete().eq("user_id", user.id);
      await supabase.from("offer_records").delete().eq("user_id", user.id);

      // Delete offer letter reviews + files
      const { data: offerFiles } = await supabase.storage.from("offer-letters").list(user.id);
      if (offerFiles && offerFiles.length > 0) {
        await supabase.storage.from("offer-letters").remove(offerFiles.map(f => `${user.id}/${f.name}`));
      }
      await supabase.from("offer_letter_reviews" as any).delete().eq("user_id", user.id);

      // Delete career profile
      await supabase.from("user_career_profile").delete().eq("user_id", user.id);

      // Delete job alerts
      await supabase.from("job_alerts").delete().eq("user_id", user.id);

      // Delete offer preferences
      await supabase.from("user_offer_preferences").delete().eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["user-documents"] });
      queryClient.invalidateQueries({ queryKey: ["career-profile"] });
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["my-offer-reviews"] });

      toast.success("All career data has been permanently deleted.");
      setConfirming(false);
    } catch (err: any) {
      console.error("Wipe error:", err);
      toast.error("Failed to wipe data. Please try again.");
    } finally {
      setWiping(false);
    }
  };

  if (!confirming) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Wipe My Career Data</p>
              <p className="text-xs text-muted-foreground">Permanently delete all uploaded documents, career profile, and job alerts.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 shrink-0" onClick={() => setConfirming(true)}>
            Delete All
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Are you sure?</p>
            <p className="text-xs text-muted-foreground">This will permanently delete all your uploaded documents, parsed data, career profile, and job alerts. This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={wiping}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleWipe} disabled={wiping}>
            {wiping ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {wiping ? "Deleting..." : "Yes, Delete Everything"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
