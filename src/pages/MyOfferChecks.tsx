import { Link, useNavigate } from "react-router-dom";
import { ClipboardCheck, Building2, ArrowRight, Loader2, Trash2, GitCompareArrows, Crown, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/use-premium";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MyOfferChecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const premium = usePremium();

  const { data: checks, isLoading } = useQuery({
    queryKey: ["my-offer-checks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_checks" as any)
        .select("*, companies!offer_checks_company_id_fkey(name, slug, industry, state)")
        .eq("user_id", user!.id)
        .eq("is_saved", true)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    await supabase.from("offer_checks" as any).delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["my-offer-checks"] });
    queryClient.invalidateQueries({ queryKey: ["saved-offer-check-count"] });
    toast({ title: "Report removed" });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">Sign in to view your saved Offer Checks.</p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const savedCount = checks?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">My Offer Checks</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/compare-offer-checks")}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Compare
            {!premium.isPremium && <Crown className="w-3 h-3 text-muted-foreground" />}
          </Button>
        </div>

        {/* Save limit indicator */}
        {!premium.isPremium && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 mb-4">
            <span className="text-xs text-muted-foreground">
              {savedCount} / {premium.maxSavedReports} saved reports used
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (savedCount / premium.maxSavedReports) * 100)}%` }}
                />
              </div>
              {savedCount >= premium.maxSavedReports && (
                <Badge variant="outline" className="text-[9px] gap-1">
                  <Crown className="w-2.5 h-2.5" /> Upgrade
                </Badge>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : savedCount === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                You haven't saved any Offer Checks yet. Search for a company and run an Offer Check to get started.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Search Companies
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {checks!.map((check: any) => {
              const company = check.companies;
              const hasStale = check.stale_sections_count > 0;
              return (
                <Card key={check.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate(`/offer-check/${check.company_id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{company?.name || "Unknown"}</h3>
                      <p className="text-xs text-muted-foreground">{company?.industry} · {company?.state}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {check.signals_count} signals · Saved {new Date(check.updated_at).toLocaleDateString()}
                        </span>
                        {hasStale && (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground gap-0.5">
                            <AlertTriangle className="w-2 h-2" />
                            {check.stale_sections_count} stale
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(check.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
