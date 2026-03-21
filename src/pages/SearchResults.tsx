import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Search, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { AuditRequestForm } from "@/components/AuditRequestForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyCard } from "@/components/CompanyCard";
import { searchCompanies } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const intent = searchParams.get("intent") || "";

  usePageSEO({
    title: initialQuery ? `Search: ${initialQuery} — Company Results` : "Search Companies",
    description: `Search employer intelligence database for "${initialQuery}". View civic footprint scores, PAC spending, and career signals.`,
    path: "/search",
  });

  const [query, setQuery] = useState(initialQuery);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sampleResults = useMemo(() => searchCompanies(initialQuery), [initialQuery]);

  // Search database for matching companies
  const { data: dbResults, isLoading: dbLoading } = useQuery({
    queryKey: ["search-db", initialQuery],
    queryFn: async () => {
      if (!initialQuery.trim()) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state, civic_footprint_score, record_status, total_pac_spending")
        .ilike("name", `%${initialQuery.trim()}%`)
        .limit(20);
      return data || [];
    },
    enabled: !!initialQuery.trim(),
  });

  const hasAnyResults = sampleResults.length > 0 || (dbResults?.length || 0) > 0;

  // Auto-discover when no results found
  useEffect(() => {
    if (!initialQuery.trim() || dbLoading) return;
    if (hasAnyResults || isDiscovering) return;

    const autoDiscover = async () => {
      setIsDiscovering(true);
      console.log(`[Auto-discover] Starting for "${initialQuery}"`);
      try {
        const { data, error } = await supabase.functions.invoke("company-discover", {
          body: { searchQuery: initialQuery, companyName: initialQuery.trim() },
        });
        console.log("[Auto-discover] Response:", data, error);
        if (error) throw error;

        if (data?.success) {
          const dest = intent === 'offer' ? `/offer-check/${data.companyId || data.slug}` : `/company/${data.slug}`;
          if (data.action === 'existing') {
            navigate(dest);
          } else if (data.action === 'created') {
            toast({
              title: "Company discovered",
              description: `Building intelligence profile for ${data.identity?.name || initialQuery}...`,
            });
            navigate(dest);
          }
        } else {
          console.error("[Auto-discover] No success:", data);
        }
      } catch (e: any) {
        console.error("[Auto-discover] Failed:", e);
        toast({
          title: "Discovery failed",
          description: e.message || "Could not create company profile. Try again.",
          variant: "destructive",
        });
      } finally {
        setIsDiscovering(false);
      }
    };

    const timer = setTimeout(autoDiscover, 300);
    return () => clearTimeout(timer);
  }, [initialQuery, dbLoading, hasAnyResults, isDiscovering, navigate, toast, intent]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleManualDiscover = async () => {
    if (!initialQuery.trim()) return;
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-discover", {
        body: { searchQuery: initialQuery, companyName: initialQuery.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        const dest = intent === 'offer' ? `/offer-check/${data.companyId || data.slug}` : `/company/${data.slug}`;
        toast({
          title: data.action === 'existing' ? "Company found" : "Company discovered",
          description: data.action === 'created'
            ? `Building transparency profile for ${data.identity?.name || initialQuery}...`
            : "Opening existing profile...",
        });
        navigate(dest);
      }
    } catch (e: any) {
      toast({ title: "Discovery failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any company. If it's not here yet, we'll add and research it automatically."
              className="pl-10 h-11"
            />
          </div>
          <Button type="submit" className="h-11">Search</Button>
        </form>

        {initialQuery && !isDiscovering && (
          <p className="text-sm text-muted-foreground mb-6">
            {(sampleResults.length + (dbResults?.length || 0))} result{(sampleResults.length + (dbResults?.length || 0)) !== 1 ? "s" : ""} for "{initialQuery}"
          </p>
        )}

        {/* DB results */}
        {(dbResults?.length || 0) > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Database Results</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbResults!.map((c: any) => (
                <a
                  key={c.id}
                  href={intent === 'offer' ? `/offer-check/${c.id}` : `/company/${c.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">{c.industry} · {c.state}</p>
                    </div>
                    {c.record_status && c.record_status !== 'verified' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-civic-yellow/10 text-civic-yellow border border-civic-yellow/30">
                        {c.record_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sample results */}
        {sampleResults.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleResults.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* No results — discovering */}
        {!hasAnyResults && initialQuery && (
          <div className="text-center py-20">
            {isDiscovering || dbLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Discovering "{initialQuery}"</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We're creating a transparency profile and starting public-source research automatically. You'll be redirected shortly.
                </p>
              </>
            ) : (
              <div className="max-w-md mx-auto">
                <AuditRequestForm
                  companyName={initialQuery}
                  onClose={() => setSearchParams({})}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
