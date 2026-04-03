import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, Trash2, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MyOfferReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["my-offer-reviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_letter_reviews" as any)
        .select("*, companies(name, slug, industry)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (review: any) => {
    try {
      if (review.file_path && !review.file_deleted) {
        await supabase.storage.from("offer-letters").remove([review.file_path]);
      }
      await supabase.from("offer_letter_reviews" as any).delete().eq("id", review.id);
      queryClient.invalidateQueries({ queryKey: ["my-offer-reviews"] });
      toast({ title: "Review deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
<div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Offer Reviews</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No offer reviews yet.</p>
              <p className="text-xs text-muted-foreground">Run an Offer Check on a company, then upload your offer letter for a private review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => {
              const company = review.companies;
              const snapshot = review.offer_snapshot || {};
              const termCount = (review.extracted_terms || []).length;
              const clauseCount = (review.detected_clauses || []).length;

              return (
                <Card key={review.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/offer-review/${review.company_id}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {company?.name || "Unknown Company"}
                          </span>
                          <Badge
                            variant={review.processing_status === "completed" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {review.processing_status}
                          </Badge>
                        </div>
                        {snapshot.role_title && (
                          <p className="text-xs text-muted-foreground">{snapshot.role_title}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{termCount} terms</span>
                          <span>{clauseCount} clauses</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(review)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
</div>
  );
}
