import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Search, Shield, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ExploreCompaniesTab() {
  const [search, setSearch] = useState("");

  const { data: companies, isLoading } = useQuery({
    queryKey: ["explore-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, industry, vetted_status, employer_clarity_score, description, employee_count, jackye_insight")
        .in("record_status", ["published", "approved"])
        .order("employer_clarity_score", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (companies || []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies by name or industry..."
          className="pl-9 h-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} companies with transparency data
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((company) => {
            const clarity = company.employer_clarity_score || 0;
            const isCertified = company.vetted_status === "certified";
            const isVerified = company.vetted_status === "verified";
            return (
              <Link
                key={company.id}
                to={`/dossier/${company.slug}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-muted/30 transition-all group",
                  isCertified && "border-[hsl(var(--civic-yellow))]/15"
                )}
              >
                <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {company.name}
                    </span>
                    {isVerified && (
                      <Badge variant="outline" className="text-xs gap-0.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                        <Shield className="w-2.5 h-2.5" /> Verified
                      </Badge>
                    )}
                    {isCertified && (
                      <Badge variant="outline" className="text-xs gap-0.5 bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20 shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5" /> Certified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {company.industry}{company.employee_count ? ` · ${company.employee_count} employees` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {clarity > 0 && (
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        clarity >= 70 ? "text-[hsl(var(--civic-green))]" :
                        clarity >= 40 ? "text-[hsl(var(--civic-yellow))]" :
                        "text-muted-foreground"
                      )}>
                        {clarity}
                      </p>
                      <p className="text-xs text-muted-foreground">Clarity</p>
                    </div>
                  )}
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
