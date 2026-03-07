import { Link, useNavigate } from "react-router-dom";
import { ClipboardCheck, Building2, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MyOfferChecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Offer Checks</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (checks?.length || 0) === 0 ? (
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
              return (
                <Card key={check.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate(`/offer-check/${check.company_id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{company?.name || "Unknown"}</h3>
                      <p className="text-xs text-muted-foreground">{company?.industry} · {company?.state}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {check.signals_count} signals · Saved {new Date(check.updated_at).toLocaleDateString()}
                      </p>
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
