import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfferLetterUpload } from "@/components/offer-review/OfferLetterUpload";
import { OfferReviewResults } from "@/components/offer-review/OfferReviewResults";
import { PremiumGate } from "@/components/PremiumGate";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/use-premium";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function OfferReview() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const premium = usePremium();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["offer-review-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, slug, industry, state").eq("id", companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ["offer-reviews", companyId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_letter_reviews" as any)
        .select("*")
        .eq("company_id", companyId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!companyId && !!user,
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined;
      const pending = data?.some((r: any) => r.processing_status === "pending" || r.processing_status === "processing");
      return pending ? 3000 : false;
    },
  });

  const activeReview = activeReviewId
    ? reviews?.find((r: any) => r.id === activeReviewId)
    : reviews?.[0];

  const handleDelete = async (reviewId: string) => {
    try {
      const review = reviews?.find((r: any) => r.id === reviewId);
      if (review?.file_path && !review.file_deleted) {
        await supabase.storage.from("offer-letters").remove([review.file_path]);
      }
      await supabase.from("offer_letter_reviews" as any).delete().eq("id", reviewId);
      queryClient.invalidateQueries({ queryKey: ["offer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-offer-reviews"] });
      toast({ title: "Review deleted", description: "Your offer review and document have been permanently removed." });
      if (activeReviewId === reviewId) setActiveReviewId(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRerun = async (reviewId: string) => {
    try {
      await supabase.from("offer_letter_reviews" as any).update({ processing_status: "pending" } as any).eq("id", reviewId);
      await supabase.functions.invoke("extract-offer-terms", { body: { reviewId } });
      refetchReviews();
      toast({ title: "Reprocessing", description: "Your document is being re-analyzed." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <ShieldCheck className="w-10 h-10 text-primary" />
          <p className="text-muted-foreground">Sign in to use Private Offer Review.</p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (companyLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Company not found.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to={`/offer-check/${company.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Offer Check
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Private Offer Review</h1>
          <Badge variant="outline" className="text-[10px]">Private</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your offer letter from {company.name} for a private, structured review.
        </p>

        <PremiumGate feature="Private Offer Review" description="Upload and analyze employment offer letters privately. Compare detected terms against public company signals.">
          <div className="space-y-6">
            {/* Upload section - always show for new uploads */}
            <OfferLetterUpload
              companyId={company.id}
              companyName={company.name}
              onReviewCreated={(id) => {
                setActiveReviewId(id);
                refetchReviews();
              }}
            />

            {/* Existing reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                {reviews.length > 1 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {reviews.map((r: any, i: number) => (
                      <Button
                        key={r.id}
                        variant={activeReview?.id === r.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveReviewId(r.id)}
                      >
                        Review {reviews.length - i} · {new Date(r.created_at).toLocaleDateString()}
                      </Button>
                    ))}
                  </div>
                )}

                {activeReview && (
                  <ErrorBoundary>
                    <OfferReviewResults
                      review={activeReview}
                      onDelete={() => handleDelete(activeReview.id)}
                      onRerun={() => handleRerun(activeReview.id)}
                    />
                  </ErrorBoundary>
                )}
              </div>
            )}
          </div>
        </PremiumGate>
      </div>
      <Footer />
    </div>
  );
}
