import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, Building2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AddCompany() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Search existing companies as user types
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["company-search", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state")
        .or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm.toLowerCase().replace(/\s+/g, '-')}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2 && !isResearching,
  });

  const handleResearch = async () => {
    if (searchTerm.trim().length < 2) {
      toast({ title: "Too short", description: "Enter at least 2 characters.", variant: "destructive" });
      return;
    }

    setIsResearching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("company-research", {
        body: { companyName: searchTerm.trim() },
      });

      if (error) throw error;

      if (data?.success) {
        setResult(data);
        if (data.alreadyExists) {
          toast({ title: "Company already exists", description: `${data.company.name} is already in the database.` });
        } else {
          toast({ title: "Company added!", description: `${data.company.name} has been researched and added to CivicLens.` });
        }
      } else {
        throw new Error(data?.error || "Research failed");
      }
    } catch (e: any) {
      toast({ title: "Research failed", description: e.message, variant: "destructive" });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add a Company</h1>
          <p className="text-muted-foreground">Search our database or add a new company. We'll use AI to research its political spending, lobbying, and civic footprint.</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-primary" />
              Search or Add
            </CardTitle>
            <CardDescription>Enter a company name to search existing records or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Halliburton, Tesla, Walmart..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                className="flex-1"
                maxLength={200}
              />
              <Button onClick={handleResearch} disabled={isResearching || searchTerm.trim().length < 2} className="gap-2">
                {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isResearching ? "Researching..." : "Add Company"}
              </Button>
            </div>

            {/* Existing matches */}
            {searchResults && searchResults.length > 0 && !result && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Existing companies</p>
                {searchResults.map((co) => (
                  <button
                    key={co.id}
                    onClick={() => navigate(`/company/${co.slug}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{co.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{co.industry} · {co.state}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
                <p className="text-xs text-muted-foreground">Don't see it? Click "Add Company" to research and add it.</p>
              </div>
            )}

            {/* Searching indicator */}
            {isSearching && searchTerm.length >= 2 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching existing companies...
              </p>
            )}

            {/* Research in progress */}
            {isResearching && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Researching <strong>{searchTerm}</strong>...</p>
                <p className="text-xs text-muted-foreground">AI is gathering political spending, lobbying data, executives, and more. This may take 15-30 seconds.</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                {result.alreadyExists ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-border">
                    <AlertTriangle className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{result.company.name} already exists</p>
                      <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate(`/company/${result.company.slug}`)}>
                        View company profile →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{result.company.name} added successfully!</p>
                        <p className="text-sm text-muted-foreground mt-1">AI populated the following data:</p>
                      </div>
                    </div>

                    {result.tablesPopulated && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.tablesPopulated).map(([key, count]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}: {String(count)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {result.warnings?.length > 0 && (
                      <p className="text-xs text-destructive">Some data couldn't be saved: {result.warnings.join(', ')}</p>
                    )}

                    <Button onClick={() => navigate(`/company/${result.company.slug}`)} className="w-full gap-2">
                      <ArrowRight className="w-4 h-4" />
                      View {result.company.name} Profile
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
