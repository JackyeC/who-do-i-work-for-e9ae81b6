import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UserAlertsList } from "@/components/UserAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Bell, Building2, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function SignalAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ["my-watchlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_company_watchlist")
        .select("id, company_id, watch_timestamp, notification_preferences")
        .eq("user_id", user!.id)
        .order("watch_timestamp", { ascending: false });

      if (!data || data.length === 0) return [];

      // Fetch company names
      const companyIds = data.map((w: any) => w.company_id);
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, slug, industry")
        .in("id", companyIds);

      const companyMap = new Map((companies || []).map((c: any) => [c.id, c]));

      return data.map((w: any) => ({
        ...w,
        company: companyMap.get(w.company_id),
      }));
    },
    enabled: !!user,
  });

  const handleUnwatch = async (watchId: string, companyName: string) => {
    await supabase.from("user_company_watchlist").delete().eq("id", watchId);
    queryClient.invalidateQueries({ queryKey: ["my-watchlist"] });
    toast({ title: "Unwatched", description: `Removed ${companyName} from your watchlist.` });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Signal Alerts</h1>
          <p className="text-muted-foreground mb-6">Sign in to watch companies and receive signal alerts.</p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Signal Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor companies for new signals detected from publicly available sources.
          </p>
        </div>

        {/* Alerts */}
        <div className="mb-8">
          <UserAlertsList />
        </div>

        {/* Watched Companies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Watched Companies
              {watchlist && watchlist.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-auto">{watchlist.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !watchlist || watchlist.length === 0 ? (
              <div className="text-center py-8">
                <EyeOff className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">You're not watching any companies yet.</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Visit a company profile and click "Watch" to start receiving signal alerts.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/browse">Browse Companies</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        {item.company ? (
                          <Link
                            to={`/company/${item.company.slug}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {item.company.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unknown company</span>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.company?.industry && (
                            <Badge variant="outline" className="text-[10px]">{item.company.industry}</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Since {new Date(item.watch_timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleUnwatch(item.id, item.company?.name || "company")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center mt-6 italic">
          Alerts reflect signals detected from publicly available sources. No conclusions are drawn.
        </p>
      </div>
      <Footer />
    </div>
  );
}
