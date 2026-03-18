import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  companyId: string;
  companyName: string;
}

type FamilyModel = "traditional" | "progressive";

interface FamilyTag {
  id: string;
  company_id: string;
  user_id: string;
  family_model: FamilyModel;
}

export function FamilyFirstTag({ companyId, companyName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags, isLoading } = useQuery({
    queryKey: ["family-tags", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_family_tags")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return (data || []) as FamilyTag[];
    },
    enabled: !!companyId,
  });

  const userTag = tags?.find((t) => t.user_id === user?.id);
  const traditionalCount = tags?.filter((t) => t.family_model === "traditional").length || 0;
  const progressiveCount = tags?.filter((t) => t.family_model === "progressive").length || 0;
  const totalCount = traditionalCount + progressiveCount;

  const upsertMutation = useMutation({
    mutationFn: async (model: FamilyModel) => {
      if (!user) throw new Error("Must be signed in");
      if (userTag) {
        if (userTag.family_model === model) {
          // Remove tag
          const { error } = await (supabase as any)
            .from("company_family_tags")
            .delete()
            .eq("id", userTag.id);
          if (error) throw error;
          return "removed";
        }
        // Update tag
        const { error } = await (supabase as any)
          .from("company_family_tags")
          .update({ family_model: model })
          .eq("id", userTag.id);
        if (error) throw error;
        return "updated";
      }
      // Insert tag
      const { error } = await (supabase as any)
        .from("company_family_tags")
        .insert({ company_id: companyId, user_id: user.id, family_model: model });
      if (error) throw error;
      return "added";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["family-tags", companyId] });
      const msg = action === "removed" ? "Tag removed" : "Family-First tag updated";
      toast({ title: msg });
    },
    onError: () => {
      toast({ title: "Failed to update tag", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Community Family-First Tag</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Tag this company's "Family" model based on their institutional funding receipts.
                Traditional aligns with Heritage Foundation / Project 2025 blueprints.
                Progressive aligns with CAP / progress-oriented blueprints.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Community consensus */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <Badge variant="outline" className="text-xs bg-destructive/5 text-destructive border-destructive/20">
              {traditionalCount} Traditional
            </Badge>
            <Badge variant="outline" className="text-xs bg-[hsl(var(--civic-blue))]/5 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20">
              {progressiveCount} Progressive
            </Badge>
            <span className="ml-auto">{totalCount} community tag{totalCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* User action */}
        {user ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate("traditional")}
              className={cn(
                "text-xs",
                userTag?.family_model === "traditional" && "bg-destructive/10 border-destructive/30 text-destructive"
              )}
            >
              {userTag?.family_model === "traditional" ? "✓ " : ""}Traditional
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate("progressive")}
              className={cn(
                "text-xs",
                userTag?.family_model === "progressive" && "bg-[hsl(var(--civic-blue))]/10 border-[hsl(var(--civic-blue))]/30 text-[hsl(var(--civic-blue))]"
              )}
            >
              {userTag?.family_model === "progressive" ? "✓ " : ""}Progressive
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sign in to tag this company as Family-First.</p>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          This company's "Family" model aligns with {traditionalCount > progressiveCount ? "Traditional" : progressiveCount > traditionalCount ? "Progressive" : "no consensus on"} receipts
          based on community intelligence and institutional funding data.
        </p>
      </CardContent>
    </Card>
  );
}
