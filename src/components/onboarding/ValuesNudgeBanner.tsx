import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function ValuesNudgeBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const { data: hasProfile } = useQuery({
    queryKey: ["values-profile-exists", user?.id],
    queryFn: async () => {
      if (!user) return true; // hide if no user
      const { data, error } = await (supabase as any)
        .from("user_values_profile")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Don't show if: no user, already has profile, or dismissed
  if (!user || hasProfile || dismissed) return null;

  return (
    <div className="relative bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">
            Set your Career DNA for personalized intelligence
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Tell us what matters to you — pay equity, AI ethics, political spending — and every report will show how this company aligns with your values.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/dashboard?tab=values")}
            className="gap-1.5 text-xs"
          >
            Set My Values
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
