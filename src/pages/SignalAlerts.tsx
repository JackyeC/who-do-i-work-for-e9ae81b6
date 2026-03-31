import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UserAlertsList } from "@/components/UserAlerts";
import { AlertPreferencesPanel } from "@/components/AlertPreferencesPanel";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Bell, Building2, Trash2, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SignalAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedWatch, setExpandedWatch] = useState<string | null>(null);

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ["my-watchlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_company_watchlist")
        .select("id, company_id, watch_timestamp, notification_preferences")
        .eq("user_id", user!.id)
        .order("watch_timestamp", { ascending: false });

      if (!data || data.length === 0) return [];

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            icon={Bell}
            title="Signal Alerts"
            description="Sign in to watch companies and receive signal alerts when new data is detected."
            action={{ label: "Sign In", onClick: () => navigate("/login"), variant: "default" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl flex-1">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Signal Alerts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Monitor companies for new signals detected from publicly available sources. Hover over alerts for quick actions.
          </p>
        </div>

        {/* Alert Timeline */}
        <div className="mb-6 sm:mb-8">
          <UserAlertsList />
        </div>

        {/* Watched Companies with Preferences */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Watched Companies
              {watchlist && watchlist.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-auto">{watchlist.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <LoadingState message="Loading watchlist..." className="py-8" />
            ) : !watchlist || watchlist.length === 0 ? (
              <EmptyState
                icon={EyeOff}
                title="No companies watched"
                description="Visit a company profile and click 'Watch' to start receiving signal alerts."
                action={{ label: "Browse Companies", onClick: () => navigate("/browse") }}
                compact
              />
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {watchlist.map((item: any) => (
                  <Collapsible
                    key={item.id}
                    open={expandedWatch === item.id}
                    onOpenChange={(open) => setExpandedWatch(open ? item.id : null)}
                  >
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            {item.company ? (
                              <Link to={`/dossier/${item.company.slug}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                                {item.company.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unknown company</span>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.company?.industry && (
                                <Badge variant="outline" className="text-xs">{item.company.industry}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                Since {new Date(item.watch_timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Alert preferences">
                              <Settings2 className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => handleUnwatch(item.id, item.company?.name || "company")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="px-3 pb-3">
                          <AlertPreferencesPanel
                            watchId={item.id}
                            companyName={item.company?.name || "Company"}
                            currentPreferences={item.notification_preferences}
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6 italic">
          Alerts reflect signals detected from publicly available sources. No conclusions are drawn.
        </p>
      </div>
      <Footer />
    </div>
  );
}
