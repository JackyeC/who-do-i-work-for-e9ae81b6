import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Loader2, Edit, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_reports" as any)
        .select("id, title, slug, status, report_type, author_name, publication_date, primary_issue_category, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Sign in required</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Intelligence Reports</h1>
          <Button onClick={() => navigate("/admin/reports/new")} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Report
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (reports || []).length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reports yet. Create your first intelligence report.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(reports || []).map((r: any) => (
              <Card key={r.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm truncate">{r.title || "Untitled"}</span>
                      <Badge variant={r.status === "published" ? "default" : "secondary"} className="text-[10px] capitalize shrink-0">{r.status}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{r.report_type?.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.author_name} · {new Date(r.created_at).toLocaleDateString()}
                      {r.primary_issue_category && ` · ${r.primary_issue_category.replace(/_/g, " ")}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {r.status === "published" && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/intelligence/${r.slug}`, "_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/reports/${r.id}`)}><Edit className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
